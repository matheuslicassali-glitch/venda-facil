package main

import (
	"embed"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"time"

	"github.com/gin-gonic/gin"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:dist
var assets embed.FS

func getDataPath(filename string) string {
	if runtime.GOOS == "windows" {
		appData := os.Getenv("APPDATA")
		if appData != "" {
			dir := filepath.Join(appData, "VendaFacil")
			_ = os.MkdirAll(dir, 0777)
			return filepath.Join(dir, filename)
		}
	}
	return filename
}

func main() {
	// Inicializar Banco de Dados
	ConectarBanco()

	// ─── Verificação de Licença Online ─────────────────────────────────
	// Busca o serial da configuração da empresa
	var config ConfiguracaoEmpresa
	DB.First(&config)
	var err error
	var licStatus *LicencaStatus
	licStatus, err = VerificarLicencaOnline(config.SerialChave)
	if err != nil {
		log.Println("[LICENÇA] Erro ao verificar:", err)
	} else if licStatus != nil {
		switch licStatus.Status {
		case "bloqueado":
			log.Fatal("[LICENÇA] SISTEMA BLOQUEADO. Motivo: " + licStatus.MotivoBloqueio + ". Contate o suporte.")
		case "expirado":
			log.Fatal("[LICENÇA] LICENÇA EXPIRADA. Entre em contato para renovar.")
		default:
			log.Printf("[LICENÇA] ✅ Licença ATIVA - %s\n", licStatus.NomeEmpresa)
		}
	}
	// ────────────────────────────────────────────────────────────────────

	// Iniciar API em segundo plano
	apiEngine := SetupAPI()
	
	// Adicionar rota de saúde rápida
	apiEngine.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "time": time.Now()})
	})

	go func() {
		log.Println("Iniciando API na porta :3001...")
		if err := http.ListenAndServe(":3001", apiEngine); err != nil {
			log.Println("ALERTA: Falha ao iniciar API (Porta pode estar em uso):", err)
		}
	}()

	// Iniciar Sincronização em Background (Desktop -> Supabase)
	IniciarSyncBackground(DB)

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err = wails.Run(&options.App{
		Title:            "Venda Fácil Professional",
		Width:            1280,
		Height:           800,
		Frameless:        true,
		WindowStartState: options.Maximised,
		AssetServer: &assetserver.Options{
			Assets:  assets,
			Handler: apiEngine,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnDomReady:       app.domReady,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
