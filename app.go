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

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Olá %s, Bem-vindo ao Venda Fácil via Wails!", name)
}
