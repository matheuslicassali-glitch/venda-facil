package main

import (
	"context"
	"fmt"
	"syscall"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App struct
func NewApp() *App {
	return &App{}
}

// startup é chamado quando o app inicia
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// domReady é chamado quando o frontend termina de carregar
// Usa a API interna do Wails (HWND correto) para cobrir toda a tela
func (a *App) domReady(ctx context.Context) {
	// Pegar dimensões reais do monitor via Win32 (ignora work area / taskbar)
	user32 := syscall.NewLazyDLL("user32.dll")
	getSystemMetrics := user32.NewProc("GetSystemMetrics")
	screenW, _, _ := getSystemMetrics.Call(0) // SM_CXSCREEN
	screenH, _, _ := getSystemMetrics.Call(1) // SM_CYSCREEN

	// Wails usa o HWND interno correto - sem precisar de EnumWindows
	wailsRuntime.WindowSetAlwaysOnTop(ctx, true)    // HWND_TOPMOST (fica sobre a taskbar)
	wailsRuntime.WindowSetPosition(ctx, 0, 0)       // Posição 0,0 (canto superior esquerdo)
	wailsRuntime.WindowSetSize(ctx, int(screenW), int(screenH)) // Tamanho real da tela
}

// ForcarSincronizacao dispara o sync manualmente
func (a *App) ForcarSincronizacao() string {
	if GlobalSyncManager == nil {
		return "Erro: Gerenciador de sincronização não inicializado"
	}
	err := GlobalSyncManager.ExecutarSincronizacao()
	if err != nil {
		return fmt.Sprintf("Erro ao sincronizar: %v", err)
	}
	return "Sincronização concluída com sucesso!"
}

type SyncStats struct {
	ProdutosTotal      int64  `json:"produtos_total"`
	ProdutosSync       int64  `json:"produtos_sync"`
	ClientesTotal      int64  `json:"clientes_total"`
	ClientesSync       int64  `json:"clientes_sync"`
	VendasTotal        int64  `json:"vendas_total"`
	VendasSync         int64  `json:"vendas_sync"`
	FornecedoresTotal  int64  `json:"fornecedores_total"`
	FornecedoresSync   int64  `json:"fornecedores_sync"`
	FinanceiroTotal    int64  `json:"financeiro_total"`
	FinanceiroSync     int64  `json:"financeiro_sync"`
	FuncionariosTotal  int64  `json:"funcionarios_total"`
	FuncionariosSync   int64  `json:"funcionarios_sync"`
	CaixaTotal         int64  `json:"caixa_total"`
	CaixaSync          int64  `json:"caixa_sync"`
	UltimaVez          string `json:"ultima_vez"`
}

// ObterEstatisticasSync retorna o status atual da base local vs sincronizada
func (a *App) ObterEstatisticasSync() SyncStats {
	var stats SyncStats
	if DB == nil {
		return stats
	}

	DB.Model(&Produto{}).Count(&stats.ProdutosTotal)
	DB.Model(&Produto{}).Where("sincronizado = ?", true).Count(&stats.ProdutosSync)

	DB.Model(&Cliente{}).Count(&stats.ClientesTotal)
	DB.Model(&Cliente{}).Where("sincronizado = ?", true).Count(&stats.ClientesSync)

	DB.Model(&Venda{}).Count(&stats.VendasTotal)
	DB.Model(&Venda{}).Where("sincronizado = ?", true).Count(&stats.VendasSync)

	DB.Model(&Fornecedor{}).Count(&stats.FornecedoresTotal)
	DB.Model(&Fornecedor{}).Where("sincronizado = ?", true).Count(&stats.FornecedoresSync)

	DB.Model(&ContaFinanceira{}).Count(&stats.FinanceiroTotal)
	DB.Model(&ContaFinanceira{}).Where("sincronizado = ?", true).Count(&stats.FinanceiroSync)

	DB.Model(&Funcionario{}).Count(&stats.FuncionariosTotal)
	DB.Model(&Funcionario{}).Where("sincronizado = ?", true).Count(&stats.FuncionariosSync)

	DB.Model(&SessaoCaixa{}).Count(&stats.CaixaTotal)
	DB.Model(&SessaoCaixa{}).Where("sincronizado = ?", true).Count(&stats.CaixaSync)

	return stats
}
