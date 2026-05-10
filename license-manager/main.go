package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"
)

// ===================== CONFIG =====================
const (
	SUPABASE_URL = "https://axupinryubgmokupryne.supabase.co"
	SUPABASE_KEY = "sb_publishable_Yy8ThifMyJXOLAoXEpGlVQ_wr1UpWu8"
	TABLE        = "licencas"
)

// ===================== MODELS =====================
type Licenca struct {
	ID              string  `json:"id,omitempty"`
	NomeEmpresa     string  `json:"nome_empresa"`
	CNPJ            string  `json:"cnpj"`
	EmailContato    string  `json:"email_contato"`
	Responsavel     string  `json:"responsavel"`
	ChaveSerial     string  `json:"chave_serial"`
	Status          string  `json:"status"`
	MotivoBloqueio  string  `json:"motivo_bloqueio,omitempty"`
	DataExpiracao   string  `json:"data_expiracao,omitempty"`
	Trial           bool    `json:"trial"`
	UltimoAcesso    *string `json:"ultimo_acesso,omitempty"`
	CreatedAt       string  `json:"created_at,omitempty"`
}

// ===================== HTTP HELPER =====================
func supabaseRequest(method, endpoint string, body interface{}) ([]byte, int, error) {
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

// ===================== LICENSE FUNCTIONS =====================
func gerarChaveSerial() string {
	chars := "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rand.Seed(time.Now().UnixNano())
	grupos := make([]string, 4)
	for i := range grupos {
		seg := make([]byte, 4)
		for j := range seg {
			seg[j] = chars[rand.Intn(len(chars))]
		}
		grupos[i] = string(seg)
	}
	return "VF-" + strings.Join(grupos, "-")
}

func listarLicencas() {
	data, status, err := supabaseRequest("GET", TABLE+"?order=created_at.desc", nil)
	if err != nil || status >= 400 {
		fmt.Printf("\n❌ Erro ao buscar licenças: %s\n", string(data))
		return
	}

	var licencas []Licenca
	json.Unmarshal(data, &licencas)

	if len(licencas) == 0 {
		fmt.Println("\n⚠️  Nenhuma licença cadastrada ainda.")
		return
	}

	fmt.Println("\n╔══════════════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                      LICENÇAS CADASTRADAS                               ║")
	fmt.Println("╠══════════════════════════════════════════════════════════════════════════╣")
	for _, l := range licencas {
		statusIcon := "✅"
		if l.Status == "bloqueado" { statusIcon = "🔒" }
		if l.Status == "expirado"  { statusIcon = "❌" }
		if l.Status == "trial"     { statusIcon = "⏳" }

		fmt.Printf("║ %s %-30s │ %-20s │ %s\n", statusIcon, l.NomeEmpresa, l.ChaveSerial, strings.ToUpper(l.Status))
	}
	fmt.Println("╚══════════════════════════════════════════════════════════════════════════╝")
}

func criarLicenca(scanner *bufio.Scanner) {
	fmt.Println("\n── CRIAR NOVA LICENÇA ──────────────────────────────────────")
	
	nome := readInput(scanner, "Nome da Empresa: ")
	cnpj := readInput(scanner, "CNPJ: ")
	email := readInput(scanner, "E-mail de Contato: ")
	responsavel := readInput(scanner, "Nome do Responsável: ")
	
	fmt.Print("Dias de validade (ex: 365 / 0 para sem expiração): ")
	scanner.Scan()
	dias := 365
	fmt.Sscanf(scanner.Text(), "%d", &dias)

	var dataExp *string
	if dias > 0 {
		exp := time.Now().AddDate(0, 0, dias).Format(time.RFC3339)
		dataExp = &exp
	}

	chave := gerarChaveSerial()

	licenca := map[string]interface{}{
		"nome_empresa":   nome,
		"cnpj":           cnpj,
		"email_contato":  email,
		"responsavel":    responsavel,
		"chave_serial":   chave,
		"status":         "ativo",
		"trial":          false,
	}
	if dataExp != nil {
		licenca["data_expiracao"] = *dataExp
	}

	data, status, err := supabaseRequest("POST", TABLE, licenca)
	if err != nil || status >= 400 {
		fmt.Printf("\n❌ Erro ao criar licença: %s\n", string(data))
		return
	}

	fmt.Printf("\n✅ LICENÇA CRIADA COM SUCESSO!\n")
	fmt.Printf("   Empresa: %s\n", nome)
	fmt.Printf("   Chave:   %s\n", chave)
	fmt.Printf("   Status:  ATIVO\n")
	if dataExp != nil {
		fmt.Printf("   Válido:  %d dias\n", dias)
	}
}

func alterarStatus(scanner *bufio.Scanner, novoStatus string) {
	chave := readInput(scanner, "Digite a Chave Serial (ex: VF-XXXX-XXXX-XXXX): ")
	
	var motivo string
	if novoStatus == "bloqueado" {
		motivo = readInput(scanner, "Motivo do Bloqueio: ")
	}

	payload := map[string]interface{}{
		"status":          novoStatus,
		"motivo_bloqueio": motivo,
	}

	endpoint := fmt.Sprintf("%s?chave_serial=eq.%s", TABLE, chave)
	data, status, err := supabaseRequest("PATCH", endpoint, payload)
	if err != nil || status >= 400 {
		fmt.Printf("\n❌ Erro ao alterar status: %s\n", string(data))
		return
	}

	icon := "✅"
	if novoStatus == "bloqueado" { icon = "🔒" }
	fmt.Printf("\n%s Licença %s → Status alterado para: %s\n", icon, chave, strings.ToUpper(novoStatus))
}

func buscarLicenca(scanner *bufio.Scanner) {
	chave := readInput(scanner, "Digite a Chave Serial para buscar: ")
	
	endpoint := fmt.Sprintf("%s?chave_serial=eq.%s", TABLE, chave)
	data, status, err := supabaseRequest("GET", endpoint, nil)
	if err != nil || status >= 400 {
		fmt.Printf("\n❌ Erro: %s\n", string(data))
		return
	}

	var licencas []Licenca
	json.Unmarshal(data, &licencas)

	if len(licencas) == 0 {
		fmt.Println("\n⚠️  Licença não encontrada.")
		return
	}

	l := licencas[0]
	statusIcon := "✅ ATIVO"
	if l.Status == "bloqueado" { statusIcon = "🔒 BLOQUEADO" }
	if l.Status == "expirado"  { statusIcon = "❌ EXPIRADO" }

	fmt.Println("\n╔══════════════════════════════════════════════════╗")
	fmt.Printf( "║  Status:      %s\n", statusIcon)
	fmt.Printf( "║  Empresa:     %s\n", l.NomeEmpresa)
	fmt.Printf( "║  CNPJ:        %s\n", l.CNPJ)
	fmt.Printf( "║  Responsável: %s\n", l.Responsavel)
	fmt.Printf( "║  E-mail:      %s\n", l.EmailContato)
	fmt.Printf( "║  Chave:       %s\n", l.ChaveSerial)
	if l.DataExpiracao != "" {
		fmt.Printf("║  Expira em:   %s\n", l.DataExpiracao[:10])
	}
	if l.MotivoBloqueio != "" {
		fmt.Printf("║  Motivo:      %s\n", l.MotivoBloqueio)
	}
	fmt.Println("╚══════════════════════════════════════════════════╝")
}

// ===================== HELPERS =====================
func readInput(scanner *bufio.Scanner, prompt string) string {
	fmt.Print(prompt)
	scanner.Scan()
	return strings.TrimSpace(scanner.Text())
}

func clearScreen() {
	fmt.Print("\033[H\033[2J")
}

// ===================== MAIN MENU =====================
func main() {
	scanner := bufio.NewScanner(os.Stdin)

	for {
		clearScreen()
		fmt.Println("╔══════════════════════════════════════════════════════════╗")
		fmt.Println("║          VENDA FÁCIL - GERENCIADOR DE LICENÇAS           ║")
		fmt.Println("║                  Powered by Supabase Cloud               ║")
		fmt.Println("╠══════════════════════════════════════════════════════════╣")
		fmt.Println("║  [1] Listar Todas as Licenças                            ║")
		fmt.Println("║  [2] Criar Nova Licença                                  ║")
		fmt.Println("║  [3] Bloquear Licença                                    ║")
		fmt.Println("║  [4] Desbloquear Licença                                 ║")
		fmt.Println("║  [5] Buscar Licença por Chave                            ║")
		fmt.Println("║  [0] Sair                                                ║")
		fmt.Println("╚══════════════════════════════════════════════════════════╝")
		fmt.Print("\n  Escolha uma opção: ")

		scanner.Scan()
		opcao := strings.TrimSpace(scanner.Text())

		switch opcao {
		case "1":
			listarLicencas()
		case "2":
			criarLicenca(scanner)
		case "3":
			alterarStatus(scanner, "bloqueado")
		case "4":
			alterarStatus(scanner, "ativo")
		case "5":
			buscarLicenca(scanner)
		case "0":
			fmt.Println("\n  Encerrando gerenciador de licenças...")
			os.Exit(0)
		default:
			fmt.Println("\n  ⚠️  Opção inválida.")
		}

		fmt.Print("\n  Pressione ENTER para continuar...")
		scanner.Scan()
	}
}
