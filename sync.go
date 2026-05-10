package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"gorm.io/gorm"
)

// SyncManager gerencia a sincronização com o Supabase
type SyncManager struct {
	DB             *gorm.DB
	SupabaseURL    string
	SupabaseAPIKey string
}

// SyncPayload estrutura para o pacote JSON de sincronização
type SyncPayload struct {
	Produtos     []Produto     `json:"produtos"`
	Clientes     []Cliente     `json:"clientes"`
	Funcionarios []Funcionario `json:"funcionarios"`
	Vendas       []Venda       `json:"vendas"`
	ItensVenda   []ItemVenda   `json:"itens_venda"`
}

// Credenciais do Supabase (hardcoded para garantir funcionamento)
const (
	supabaseURLConst = "https://axupinryubgmokupryne.supabase.co"
	supabaseKeyConst = "sb_publishable_Yy8ThifMyJXOLAoXEpGlVQ_wr1UpWu8"
)

// NewSyncManager inicializa o gerenciador de sincronização
func NewSyncManager(db *gorm.DB) *SyncManager {
	// Usa variável de ambiente se disponível, senão usa as constantes hardcoded
	url := os.Getenv("SUPABASE_URL")
	key := os.Getenv("SUPABASE_KEY")
	if url == "" {
		url = supabaseURLConst
	}
	if key == "" {
		key = supabaseKeyConst
	}

	return &SyncManager{
		DB:             db,
		SupabaseURL:    url,
		SupabaseAPIKey: key,
	}
}

// ExecutarSincronizacao roda o fluxo completo de sincronização
func (sm *SyncManager) ExecutarSincronizacao() error {
	if sm.SupabaseURL == "" || sm.SupabaseAPIKey == "" {
		log.Println("[SYNC] Credenciais do Supabase não configuradas no .env. Ignorando sincronização.")
		return fmt.Errorf("credenciais do supabase ausentes")
	}

	log.Println("[SYNC] Iniciando sincronização bidirecional...")

	// 1. Puxar alterações da nuvem (Online -> Local)
	err := sm.ReceberDoSupabase()
	if err != nil {
		log.Printf("[SYNC] Aviso: Falha ao receber dados da nuvem: %v\n", err)
	}

	// 2. Extrair dados não sincronizados do banco local (Local -> Online)
	payload, err := sm.ExtrairDadosNaoSincronizados()
	if err != nil {
		return fmt.Errorf("erro ao extrair dados: %v", err)
	}

	// Se não houver nada para sincronizar, encerra
	total := len(payload.Produtos) + len(payload.Clientes) + len(payload.Funcionarios) + len(payload.Vendas) + len(payload.ItensVenda)
	if total == 0 {
		log.Println("[SYNC] Nenhum dado novo para sincronizar.")
		return nil
	}

	// 3. Enviar dados para o Supabase via REST API
	err = sm.EnviarParaSupabase(payload)
	if err != nil {
		return fmt.Errorf("erro ao enviar para o supabase: %v", err)
	}

	// 4. Marcar dados como sincronizados localmente
	err = sm.MarcarComoSincronizado(payload)
	if err != nil {
		return fmt.Errorf("erro ao marcar como sincronizado: %v", err)
	}

	log.Println("[SYNC] Sincronização concluída com sucesso!")
	return nil
}

// ExtrairDadosNaoSincronizados pega todos os registros onde sincronizado = false
func (sm *SyncManager) ExtrairDadosNaoSincronizados() (*SyncPayload, error) {
	var payload SyncPayload

	// ATENÇÃO: É necessário que os models tenham a coluna "sincronizado" (boolean) 
	// Para este MVP vamos buscar os que não possuem a flag sincronizado true
	// Ou, se a coluna não existe no GORM, você pode precisar adicioná-la.

	sm.DB.Where("sincronizado = ? OR sincronizado IS NULL", false).Find(&payload.Produtos)
	sm.DB.Where("sincronizado = ? OR sincronizado IS NULL", false).Find(&payload.Clientes)
	sm.DB.Where("sincronizado = ? OR sincronizado IS NULL", false).Find(&payload.Funcionarios)
	sm.DB.Where("sincronizado = ? OR sincronizado IS NULL", false).Preload("Items").Find(&payload.Vendas)
	// Os itens de venda geralmente são enviados junto com a venda (via RPC) ou separadamente.
	// Por simplicidade, extraímos os itens não sincronizados também.
	sm.DB.Where("sincronizado = ? OR sincronizado IS NULL", false).Find(&payload.ItensVenda)

	return &payload, nil
}

// EnviarParaSupabase envia as entidades para a API REST do Supabase em "upsert" (Update or Insert)
func (sm *SyncManager) EnviarParaSupabase(payload *SyncPayload) error {
	// Helper interno para enviar por tabela
	enviarTabela := func(tabela string, dados interface{}) error {
		b, err := json.Marshal(dados)
		if err != nil {
			return err
		}

		if string(b) == "null" || string(b) == "[]" {
			return nil // Nada para enviar nesta tabela
		}

		endpoint := fmt.Sprintf("%s/rest/v1/%s", sm.SupabaseURL, tabela)
		req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(b))
		if err != nil {
			return err
		}

		req.Header.Set("apikey", sm.SupabaseAPIKey)
		req.Header.Set("Authorization", "Bearer "+sm.SupabaseAPIKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Prefer", "resolution=merge-duplicates") // Faz o Upsert

		client := &http.Client{Timeout: 15 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 400 {
			bodyBytes, _ := io.ReadAll(resp.Body)
			return fmt.Errorf("erro do supabase (HTTP %d): %s", resp.StatusCode, string(bodyBytes))
		}

		return nil
	}

	// Executa para cada tabela que tiver dados
	if len(payload.Produtos) > 0 {
		if err := enviarTabela("produtos", payload.Produtos); err != nil {
			log.Printf("[SYNC ERROR] Produtos: %v\n", err)
		}
	}
	if len(payload.Clientes) > 0 {
		if err := enviarTabela("clientes", payload.Clientes); err != nil {
			log.Printf("[SYNC ERROR] Clientes: %v\n", err)
		}
	}
	if len(payload.Funcionarios) > 0 {
		if err := enviarTabela("funcionarios", payload.Funcionarios); err != nil {
			log.Printf("[SYNC ERROR] Funcionarios: %v\n", err)
		}
	}
	if len(payload.Vendas) > 0 {
		// Vendas precisa enviar sem os itens primeiro (por causa de foreign keys) ou tratar de forma diferente
		// Mas como o Prefer=merge-duplicates aceita a estrutura, vamos limpar o array Items para não quebrar a REST do Supabase
		vendasLimpo := make([]Venda, len(payload.Vendas))
		copy(vendasLimpo, payload.Vendas)
		for i := range vendasLimpo {
			vendasLimpo[i].Items = nil
		}
		if err := enviarTabela("vendas", vendasLimpo); err != nil {
			log.Printf("[SYNC ERROR] Vendas: %v\n", err)
		}
	}
	if len(payload.ItensVenda) > 0 {
		if err := enviarTabela("venda_itens", payload.ItensVenda); err != nil {
			log.Printf("[SYNC ERROR] Itens de Venda: %v\n", err)
		}
	}

	return nil
}

// MarcarComoSincronizado atualiza a flag sincronizado = true no banco local
func (sm *SyncManager) MarcarComoSincronizado(payload *SyncPayload) error {
	now := time.Now()
	
	for _, p := range payload.Produtos {
		sm.DB.Model(&Produto{}).Where("id = ?", p.ID).Updates(map[string]interface{}{"sincronizado": true, "ultima_sincronizacao": now})
	}
	for _, c := range payload.Clientes {
		sm.DB.Model(&Cliente{}).Where("id = ?", c.ID).Updates(map[string]interface{}{"sincronizado": true, "ultima_sincronizacao": now})
	}
	for _, f := range payload.Funcionarios {
		sm.DB.Model(&Funcionario{}).Where("id = ?", f.ID).Updates(map[string]interface{}{"sincronizado": true, "ultima_sincronizacao": now})
	}
	for _, v := range payload.Vendas {
		sm.DB.Model(&Venda{}).Where("id = ?", v.ID).Updates(map[string]interface{}{"sincronizado": true, "ultima_sincronizacao": now})
	}
	for _, i := range payload.ItensVenda {
		sm.DB.Model(&ItemVenda{}).Where("id = ?", i.ID).Updates(map[string]interface{}{"sincronizado": true, "ultima_sincronizacao": now})
	}

	return nil
}

// ReceberDoSupabase puxa os dados alterados na nuvem e atualiza o banco local
func (sm *SyncManager) ReceberDoSupabase() error {
	buscarTabela := func(tabela string, ultimaData time.Time, destino interface{}) error {
		// Pega registros com updated_at maior que a última data conhecida localmente
		dataStr := ultimaData.UTC().Format("2006-01-02T15:04:05.999999Z")
		endpoint := fmt.Sprintf("%s/rest/v1/%s?updated_at=gt.%s", sm.SupabaseURL, tabela, dataStr)

		req, err := http.NewRequest("GET", endpoint, nil)
		if err != nil { return err }

		req.Header.Set("apikey", sm.SupabaseAPIKey)
		req.Header.Set("Authorization", "Bearer "+sm.SupabaseAPIKey)

		client := &http.Client{Timeout: 15 * time.Second}
		resp, err := client.Do(req)
		if err != nil { return err }
		defer resp.Body.Close()

		if resp.StatusCode >= 400 {
			bodyBytes, _ := io.ReadAll(resp.Body)
			return fmt.Errorf("erro %s (HTTP %d): %s", tabela, resp.StatusCode, string(bodyBytes))
		}

		return json.NewDecoder(resp.Body).Decode(destino)
	}

	// Atualizar Produtos
	var maxDataProd time.Time
	sm.DB.Model(&Produto{}).Select("COALESCE(MAX(updated_at), '1970-01-01')").Scan(&maxDataProd)
	var produtosNuvem []Produto
	if err := buscarTabela("produtos", maxDataProd, &produtosNuvem); err == nil && len(produtosNuvem) > 0 {
		for _, p := range produtosNuvem {
			p.Sincronizado = true
			sm.DB.Save(&p)
		}
		log.Printf("[SYNC-PULL] %d produtos atualizados da nuvem.\n", len(produtosNuvem))
	}

	// Atualizar Clientes
	var maxDataCli time.Time
	sm.DB.Model(&Cliente{}).Select("COALESCE(MAX(updated_at), '1970-01-01')").Scan(&maxDataCli)
	var clientesNuvem []Cliente
	if err := buscarTabela("clientes", maxDataCli, &clientesNuvem); err == nil && len(clientesNuvem) > 0 {
		for _, c := range clientesNuvem {
			c.Sincronizado = true
			sm.DB.Save(&c)
		}
		log.Printf("[SYNC-PULL] %d clientes atualizados da nuvem.\n", len(clientesNuvem))
	}

	// Atualizar Funcionarios
	var maxDataFunc time.Time
	sm.DB.Model(&Funcionario{}).Select("COALESCE(MAX(updated_at), '1970-01-01')").Scan(&maxDataFunc)
	var funcNuvem []Funcionario
	if err := buscarTabela("funcionarios", maxDataFunc, &funcNuvem); err == nil && len(funcNuvem) > 0 {
		for _, f := range funcNuvem {
			f.Sincronizado = true
			sm.DB.Save(&f)
		}
		log.Printf("[SYNC-PULL] %d funcionarios atualizados da nuvem.\n", len(funcNuvem))
	}

	return nil
}

// IniciarSyncBackground inicia uma rotina que tenta sincronizar de tempos em tempos
func IniciarSyncBackground(db *gorm.DB) {
	go func() {
		sm := NewSyncManager(db)
		// Sync imediato ao iniciar
		go func() {
			time.Sleep(10 * time.Second) // Aguarda 10s para o banco local carregar
			sm.ExecutarSincronizacao()
		}()
		for {
			// Aguarda 30 segundos entre tentativas
			time.Sleep(30 * time.Second)
			sm.ExecutarSincronizacao()
		}
	}()
}
