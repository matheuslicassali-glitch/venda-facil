package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"strings"
	"time"
)

const (
	SUPABASE_URL = "https://axupinryubgmokupryne.supabase.co"
	SUPABASE_KEY = "sb_publishable_Yy8ThifMyJXOLAoXEpGlVQ_wr1UpWu8"
	TABLE        = "licencas"
)

// App struct
type App struct {
	ctx context.Context
}

// Licenca representa uma licença no Supabase
type Licenca struct {
	ID             string `json:"id,omitempty"`
	CreatedAt      string `json:"created_at,omitempty"`
	NomeEmpresa    string `json:"nome_empresa"`
	CNPJ           string `json:"cnpj"`
	EmailContato   string `json:"email_contato"`
	Responsavel    string `json:"responsavel"`
	ChaveSerial    string `json:"chave_serial"`
	Status         string `json:"status"`
	MotivoBloqueio string `json:"motivo_bloqueio,omitempty"`
	DataExpiracao  string `json:"data_expiracao,omitempty"`
	Trial          bool   `json:"trial"`
	UltimoAcesso   string `json:"ultimo_acesso,omitempty"`
}

type ApiResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────
func supabaseReq(method, endpoint string, body interface{}) ([]byte, int, error) {
	var reqBody io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		reqBody = bytes.NewBuffer(b)
	}

	url := fmt.Sprintf("%s/rest/v1/%s", SUPABASE_URL, endpoint)
	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, 0, err
	}

	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return data, resp.StatusCode, nil
}

// ─── Serial Generator ─────────────────────────────────────────────────────────
func (a *App) GerarSerial() string {
	chars := "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	grupos := make([]string, 4)
	for i := range grupos {
		seg := make([]byte, 4)
		for j := range seg {
			seg[j] = chars[rng.Intn(len(chars))]
		}
		grupos[i] = string(seg)
	}
	return "VF-" + strings.Join(grupos, "-")
}

// ─── Listar Licenças ─────────────────────────────────────────────────────────
func (a *App) ListarLicencas() ApiResponse {
	data, status, err := supabaseReq("GET", TABLE+"?order=created_at.desc", nil)
	if err != nil || status >= 400 {
		return ApiResponse{Success: false, Message: fmt.Sprintf("Erro ao conectar: %v", err)}
	}

	var licencas []Licenca
	json.Unmarshal(data, &licencas)
	return ApiResponse{Success: true, Data: licencas}
}

// ─── Criar Licença ───────────────────────────────────────────────────────────
func (a *App) CriarLicenca(nome, cnpj, email, responsavel, serial string, dias int) ApiResponse {
	if nome == "" || cnpj == "" || serial == "" {
		return ApiResponse{Success: false, Message: "Nome, CNPJ e Serial são obrigatórios"}
	}

	payload := map[string]interface{}{
		"nome_empresa":  nome,
		"cnpj":          cnpj,
		"email_contato": email,
		"responsavel":   responsavel,
		"chave_serial":  serial,
		"status":        "ativo",
		"trial":         false,
	}

	if dias > 0 {
		payload["data_expiracao"] = time.Now().AddDate(0, 0, dias).Format(time.RFC3339)
	}

	data, status, err := supabaseReq("POST", TABLE, payload)
	if err != nil || status >= 400 {
		return ApiResponse{Success: false, Message: fmt.Sprintf("Erro ao criar licença: %s", string(data))}
	}

	return ApiResponse{Success: true, Message: "Licença criada com sucesso!"}
}

// ─── Bloquear Licença ─────────────────────────────────────────────────────────
func (a *App) BloquearLicenca(chave, motivo string) ApiResponse {
	payload := map[string]interface{}{
		"status":          "bloqueado",
		"motivo_bloqueio": motivo,
	}
	endpoint := fmt.Sprintf("%s?chave_serial=eq.%s", TABLE, chave)
	data, status, err := supabaseReq("PATCH", endpoint, payload)
	if err != nil || status >= 400 {
		return ApiResponse{Success: false, Message: fmt.Sprintf("Erro: %s", string(data))}
	}
	return ApiResponse{Success: true, Message: "Licença bloqueada com sucesso!"}
}

// ─── Desbloquear Licença ─────────────────────────────────────────────────────
func (a *App) DesbloquearLicenca(chave string) ApiResponse {
	payload := map[string]interface{}{
		"status":          "ativo",
		"motivo_bloqueio": "",
	}
	endpoint := fmt.Sprintf("%s?chave_serial=eq.%s", TABLE, chave)
	data, status, err := supabaseReq("PATCH", endpoint, payload)
	if err != nil || status >= 400 {
		return ApiResponse{Success: false, Message: fmt.Sprintf("Erro: %s", string(data))}
	}
	return ApiResponse{Success: true, Message: "Licença desbloqueada com sucesso!"}
}

// ─── Excluir Licença ─────────────────────────────────────────────────────────
func (a *App) ExcluirLicenca(chave string) ApiResponse {
	endpoint := fmt.Sprintf("%s?chave_serial=eq.%s", TABLE, chave)
	data, status, err := supabaseReq("DELETE", endpoint, nil)
	if err != nil || status >= 400 {
		return ApiResponse{Success: false, Message: fmt.Sprintf("Erro: %s", string(data))}
	}
	return ApiResponse{Success: true, Message: "Licença excluída!"}
}
