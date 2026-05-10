package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

type LicencaStatus struct {
	Status         string  `json:"status"`
	NomeEmpresa    string  `json:"nome_empresa"`
	DataExpiracao  string  `json:"data_expiracao"`
	MotivoBloqueio string  `json:"motivo_bloqueio"`
}

// VerificarLicencaOnline consulta o Supabase e retorna o status da licença
func VerificarLicencaOnline(chaveSerial string) (*LicencaStatus, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		log.Println("[LICENÇA] Credenciais do Supabase ausentes. Permitindo acesso offline.")
		return &LicencaStatus{Status: "ativo"}, nil
	}

	if chaveSerial == "" {
		log.Println("[LICENÇA] Nenhuma chave serial configurada. Permitindo acesso em modo demo.")
		return &LicencaStatus{Status: "ativo", NomeEmpresa: "Demo"}, nil
	}

	url := fmt.Sprintf("%s/rest/v1/licencas?chave_serial=eq.%s&select=status,nome_empresa,data_expiracao,motivo_bloqueio", supabaseURL, chaveSerial)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Authorization", "Bearer "+supabaseKey)

	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		// Sem internet -> permite acesso (modo offline)
		log.Println("[LICENÇA] Sem conexão com a internet. Permitindo acesso offline.")
		return &LicencaStatus{Status: "ativo"}, nil
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var licencas []LicencaStatus
	if err := json.Unmarshal(body, &licencas); err != nil || len(licencas) == 0 {
		log.Println("[LICENÇA] Chave serial não encontrada no servidor.")
		return &LicencaStatus{Status: "ativo"}, nil // Modo demo se não encontrar
	}

	lic := licencas[0]

	// Verificar expiração
	if lic.DataExpiracao != "" {
		exp, err := time.Parse(time.RFC3339, lic.DataExpiracao)
		if err == nil && time.Now().After(exp) {
			lic.Status = "expirado"
		}
	}

	return &lic, nil
}
