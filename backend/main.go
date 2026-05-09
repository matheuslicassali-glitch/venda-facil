package main

import (
	"embed"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jchv/go-webview2"
	"gorm.io/gorm"
)

var LogFile *os.File

func getDataPath(filename string) string {
	if runtime.GOOS == "windows" {
		appData := os.Getenv("APPDATA")
		if appData != "" {
			dir := filepath.Join(appData, "VendaFacil")
			_ = os.MkdirAll(dir, 0777)
			return filepath.Join(dir, filename)
		}
	}
	// Fallback para diretório local se não encontrar APPDATA ou não for Windows
	return filename
}

//go:embed all:dist
var distFolder embed.FS

func main() {
	// Garantir diretório de dados
	logPath := getDataPath("venda_facil.log")

	// Redirecionar logs para arquivo
	f, err := os.OpenFile(logPath, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err == nil {
		LogFile = f
		defer f.Close()
		log.SetOutput(f)
	}

	log.Println("--- Iniciando Venda Fácil ---")
	log.Println("Log path:", logPath)

	// Inicializar Banco de Dados
	ConectarBanco()

	// Configurar Modo Gin
	gin.SetMode(gin.ReleaseMode)

	// Inicializar Gin
	app := gin.New()

	// Middleware
	app.Use(cors.Default())
	
	// Configurar Log Detalhado (Arquivo + Console)
	logFile, _ := os.OpenFile(LogFile.Name(), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	multiWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(multiWriter)

	// Gin Logger (Custom Format)
	app.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		Formatter: func(param gin.LogFormatterParams) string {
			return fmt.Sprintf("[%s] %d - %s %s\n",
				param.TimeStamp.Format(time.RFC3339),
				param.StatusCode,
				param.Method,
				param.Path,
			)
		},
		Output: multiWriter,
	}))
	app.Use(gin.Recovery())

	// Middleware para logar corpos de requisições de escrita
	app.Use(func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			body, _ := io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(strings.NewReader(string(body)))
			log.Printf("TRACE BODY [%s %s]: %s\n", c.Request.Method, c.Request.URL.Path, string(body))
		}
		c.Next()
	})

	// -- ROTAS API --
	api := app.Group("/api")
	{
		// Produtos
		produtos := api.Group("/produtos")
		{
			produtos.GET("/", listarProdutos)
			produtos.POST("/", salvarProduto)
			produtos.DELETE("/:id", deletarProduto)
			produtos.PATCH("/:id/estoque", atualizarEstoque)
		}

		// Vendas
		vendas := api.Group("/vendas")
		{
			vendas.GET("/", listarVendas)
			vendas.POST("/", criarVenda)
			vendas.PATCH("/:id/cancelar", cancelarVenda)
			vendas.DELETE("/:id", deletarVenda)
		}

		// Clientes
		clientes := api.Group("/clientes")
		{
			clientes.GET("/", listarClientes)
			clientes.POST("/", salvarCliente)
			clientes.DELETE("/:id", deletarCliente)
			clientes.PATCH("/:id/debito", atualizarDebito)
		}

		// Funcionários
		funcionarios := api.Group("/funcionarios")
		{
			funcionarios.GET("/", listarFuncionarios)
			funcionarios.POST("/", salvarFuncionario)
			funcionarios.DELETE("/:id", deletarFuncionario)
		}

		// Caixa
		caixa := api.Group("/caixa")
		{
			caixa.GET("/ativo", obterSessaoAtiva)
			caixa.POST("/sessao", abrirSessao)
			caixa.POST("/movimentacao", adicionarMovimentacao)
			caixa.GET("/historico", listarHistoricoCaixa)
			caixa.GET("/movimentacoes/:caixaId", listarMovimentacoes)
			caixa.PATCH("/sessao/:id", atualizarSessao)
		}

		// Financeiro
		financeiro := api.Group("/financeiro")
		{
			financeiro.GET("/", listarContas)
			financeiro.POST("/", salvarConta)
		}

		// Fiscal (NFe/NFCe)
		fiscal := api.Group("/fiscal")
		{
			fiscal.GET("/inutilizacoes", listarInutilizacoes)
			fiscal.POST("/inutilizar", inutilizarFaixa)
		}

		// Fornecedores
		fornecedores := api.Group("/fornecedores")
		{
			fornecedores.GET("/", listarFornecedores)
			fornecedores.POST("/", salvarFornecedor)
			fornecedores.DELETE("/:id", deletarFornecedor)
		}

		// Configurações
		config := api.Group("/configuracoes")
		{
			config.GET("/", obterConfiguracoes)
			config.POST("/", salvarConfiguracoes)
		}

		// Sistema
		api.POST("/sistema/sair", func(c *gin.Context) {
			log.Println("Encerrando aplicativo a pedido do usuário...")
			os.Exit(0)
		})
	}

	// Servir arquivos estáticos do frontend (React)
	subDistFolder, _ := fs.Sub(distFolder, "dist")
	staticServer := http.FileServer(http.FS(subDistFolder))

	app.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		
		// Se começar com /api/, retornar 404 JSON
		if strings.HasPrefix(path, "/api/") {
			c.JSON(404, gin.H{"erro": "Rota de API não localizada: " + path})
			return
		}

		// Tentar servir arquivo estático
		if path == "/" {
			path = "index.html"
		} else {
			path = strings.TrimPrefix(path, "/")
		}

		_, err := subDistFolder.Open(path)
		if err == nil {
			staticServer.ServeHTTP(c.Writer, c.Request)
			return
		}

		// Fallback para SPA (index.html)
		content, err := fs.ReadFile(subDistFolder, "index.html")
		if err != nil {
			log.Println("Erro ao ler index.html embutido:", err)
			c.String(404, "Frontend não encontrado no binário")
			return
		}
		c.Data(200, "text/html", content)
	})

	// Iniciar servidor
	porta := os.Getenv("PORT")
	if porta == "" {
		porta = "3001"
	}

	// Iniciar servidor Gin em segundo plano (goroutine)
	srv := &http.Server{
		Addr:    ":" + porta,
		Handler: app,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	// Iniciar Interface Nativa (WebView2)
	debug := false
	w := webview2.New(debug)
	if w == nil {
		log.Println("ALERTA: WebView2 não disponível ou falhou ao abrir. Usando modo navegador...")
		openBrowser("http://localhost:" + porta)
		select {}
	}
	defer w.Destroy()

	handle := w.Window()
	user32 := syscall.NewLazyDLL("user32.dll")
	showWindow := user32.NewProc("ShowWindow")
	setWindowPos := user32.NewProc("SetWindowPos")
	
	// Esconder e jogar para fora da tela instantaneamente
	if runtime.GOOS == "windows" {
		negPos := int32(-5000)
		showWindow.Call(uintptr(handle), 0) // SW_HIDE
		setWindowPos.Call(uintptr(handle), 0, uintptr(negPos), uintptr(negPos), 0, 0, 0x0080) // SWP_HIDEWINDOW
	}

	w.SetTitle("Venda Fácil - Sistema de Gestão")
	w.SetSize(1, 1, webview2.HintFixed) // Iniciar minúsculo

	// Iniciar em Tela Cheia (Apenas Windows)
	if runtime.GOOS == "windows" {
		setWindowLong := user32.NewProc("SetWindowLongW")
		getSystemMetrics := user32.NewProc("GetSystemMetrics")

		const (
			WS_POPUP         uint32 = 0x80000000
			HWND_TOP         uintptr = 0
			SWP_FRAMECHANGED uint32 = 0x0020
			SM_CXSCREEN      int    = 0
			SM_CYSCREEN      int    = 1
		)

		width, _, _ := getSystemMetrics.Call(uintptr(SM_CXSCREEN))
		height, _, _ := getSystemMetrics.Call(uintptr(SM_CYSCREEN))

		// Remove bordas e título
		setWindowLong.Call(uintptr(handle), ^uintptr(15), uintptr(WS_POPUP))
		
		// Posiciona na tela e garante tamanho total
		setWindowPos.Call(
			uintptr(handle), 
			HWND_TOP, 
			0, 0, width, height, 
			uintptr(SWP_FRAMECHANGED),
		)
	}

	w.Navigate("http://localhost:" + porta)
	
	// Mostrar a janela somente agora que está tudo pronto
	if runtime.GOOS == "windows" {
		time.Sleep(800 * time.Millisecond) // Pequeno fôlego extra para renderização
		showWindow.Call(uintptr(handle), 3) // SW_SHOWMAXIMIZED (3) em vez de SW_SHOW (5)
	}

	log.Println("Interface Desktop iniciada!")
	w.Run()
}

func openBrowser(url string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("cmd", "/c", "start", "msedge", "--app="+url).Start()
		if err != nil {
			err = exec.Command("cmd", "/c", "start", "chrome", "--app="+url).Start()
		}
		if err != nil {
			err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
		}
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}
	if err != nil {
		log.Println("Erro ao abrir navegador:", err)
	}
}

// -- HANDLERS (CONTROLADORES) --

// Produtos
func listarProdutos(c *gin.Context) {
	var produtos []Produto
	if err := DB.Order("nome").Find(&produtos).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, produtos)
}

func salvarProduto(c *gin.Context) {
	var produto Produto
	if err := c.ShouldBindJSON(&produto); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}

	if produto.ID == uuid.Nil {
		if err := DB.Create(&produto).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	} else {
		if err := DB.Save(&produto).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	}
	c.JSON(200, produto)
}

func deletarProduto(c *gin.Context) {
	id := c.Param("id")
	if err := DB.Delete(&Produto{}, "id = ?", id).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.Status(204)
}

// Vendas
func listarVendas(c *gin.Context) {
	var vendas []Venda
	if err := DB.Preload("Items").Order("data_venda desc").Find(&vendas).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, vendas)
}

func criarVenda(c *gin.Context) {
	var venda Venda
	if err := c.ShouldBindJSON(&venda); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}

	erro := DB.Transaction(func(tx *gorm.DB) error {
		// Vincular itens à venda antes de criar para garantir integridade
		for i := range venda.Items {
			venda.Items[i].VendaID = venda.ID
		}

		if err := tx.Create(&venda).Error; err != nil {
			return err
		}

		// Atualizar estoque
		for _, item := range venda.Items {
			if err := tx.Model(&Produto{}).Where("id = ?", item.ProdutoID).
				UpdateColumn("estoque_atual", gorm.Expr("estoque_atual - ?", item.Quantidade)).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if erro != nil {
		c.JSON(500, gin.H{"erro": erro.Error()})
		return
	}

	c.JSON(200, venda)
}

func cancelarVenda(c *gin.Context) {
	id := c.Param("id")
	var venda Venda
	if err := DB.Preload("Items").First(&venda, "id = ?", id).Error; err != nil {
		c.JSON(404, gin.H{"erro": "Venda não encontrada"})
		return
	}

	if venda.Status == "cancelada" {
		c.JSON(400, gin.H{"erro": "Venda já está cancelada"})
		return
	}

	// 1. Marcar como cancelada
	if err := DB.Model(&venda).Updates(map[string]interface{}{
		"status":        "cancelada",
		"fiscal_status": "cancelada",
	}).Error; err != nil {
		c.JSON(500, gin.H{"erro": "Erro ao atualizar status"})
		return
	}

	// 2. Devolver Produtos ao Estoque
	for _, item := range venda.Items {
		DB.Model(&Produto{}).Where("id = ?", item.ProdutoID).Update("estoque_atual", gorm.Expr("estoque_atual + ?", item.Quantidade))
	}

	// 3. Estornar Débito do Cliente (se for fiado)
	if venda.TipoPagamento == "fiado" && venda.ClienteID != nil {
		DB.Model(&Cliente{}).Where("id = ?", venda.ClienteID).Update("saldo_devedor", gorm.Expr("saldo_devedor - ?", venda.ValorTotal))
	}

	c.JSON(200, venda)
}

func deletarVenda(c *gin.Context) {
	id := c.Param("id")
	if err := DB.Delete(&Venda{}, "id = ?", id).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.Status(24) // Should be 204
	c.Status(204)
}

// Clientes
func listarClientes(c *gin.Context) {
	var clientes []Cliente
	if err := DB.Order("nome").Find(&clientes).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, clientes)
}

func salvarCliente(c *gin.Context) {
	var cliente Cliente
	if err := c.ShouldBindJSON(&cliente); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}

	if cliente.ID == uuid.Nil {
		if err := DB.Create(&cliente).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	} else {
		if err := DB.Save(&cliente).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	}
	c.JSON(200, cliente)
}

func deletarCliente(c *gin.Context) {
	id := c.Param("id")
	if err := DB.Delete(&Cliente{}, "id = ?", id).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.Status(204)
}

// Funcionários
func listarFuncionarios(c *gin.Context) {
	var funcionarios []Funcionario
	if err := DB.Order("nome").Find(&funcionarios).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, funcionarios)
}

func salvarFuncionario(c *gin.Context) {
	var f Funcionario
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}

	if f.ID == uuid.Nil {
		if err := DB.Create(&f).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	} else {
		if err := DB.Save(&f).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	}
	c.JSON(200, f)
}

func deletarFuncionario(c *gin.Context) {
	id := c.Param("id")
	if err := DB.Delete(&Funcionario{}, "id = ?", id).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.Status(204)
}

// Caixa
func obterSessaoAtiva(c *gin.Context) {
	var sessao SessaoCaixa
	if err := DB.Where("status = ?", "aberto").First(&sessao).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(200, nil)
			return
		}
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, sessao)
}

func abrirSessao(c *gin.Context) {
	var sessao SessaoCaixa
	if err := c.ShouldBindJSON(&sessao); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}
	if err := DB.Create(&sessao).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, sessao)
}

func adicionarMovimentacao(c *gin.Context) {
	var mov MovimentacaoCaixa
	if err := c.ShouldBindJSON(&mov); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}
	if err := DB.Create(&mov).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, mov)
}

func listarHistoricoCaixa(c *gin.Context) {
	var results []SessaoCaixa
	if err := DB.Order("aberto_em desc").Find(&results).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, results)
}

func listarMovimentacoes(c *gin.Context) {
	caixaID := c.Param("caixaId")
	var results []MovimentacaoCaixa
	if err := DB.Where("caixa_id = ?", caixaID).Order("data desc").Find(&results).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, results)
}

// Financeiro
func listarContas(c *gin.Context) {
	var contas []ContaFinanceira
	if err := DB.Order("vencimento").Find(&contas).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, contas)
}

func salvarConta(c *gin.Context) {
	var conta ContaFinanceira
	if err := c.ShouldBindJSON(&conta); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}
	if conta.ID == uuid.Nil {
		if err := DB.Create(&conta).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	} else {
		if err := DB.Save(&conta).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	}
	c.JSON(200, conta)
}

// Fiscal handlers
func listarInutilizacoes(c *gin.Context) {
	var inut []Inutilizacao
	if err := DB.Order("created_at desc").Find(&inut).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, inut)
}

func inutilizarFaixa(c *gin.Context) {
	var inut Inutilizacao
	if err := c.ShouldBindJSON(&inut); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}
	
	// Simulação de Protocolo NFe
	protocolo := fmt.Sprintf("1%014d", time.Now().UnixNano())[:15]
	inut.Protocolo = &protocolo
	inut.Status = "homologado"

	if err := DB.Create(&inut).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, inut)
}

// Fornecedores
func listarFornecedores(c *gin.Context) {
	var results []Fornecedor
	if err := DB.Order("nome").Find(&results).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, results)
}

func salvarFornecedor(c *gin.Context) {
	var f Fornecedor
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}

	if f.ID == uuid.Nil {
		if err := DB.Create(&f).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	} else {
		if err := DB.Save(&f).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	}
	c.JSON(200, f)
}

func deletarFornecedor(c *gin.Context) {
	id := c.Param("id")
	if err := DB.Delete(&Fornecedor{}, "id = ?", id).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.Status(204)
}

// Configurações
func obterConfiguracoes(c *gin.Context) {
	var config ConfiguracaoEmpresa
	if err := DB.First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(200, gin.H{})
			return
		}
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, config)
}

func salvarConfiguracoes(c *gin.Context) {
	var conf ConfiguracaoEmpresa
	if err := c.ShouldBindJSON(&conf); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}

	var existing ConfiguracaoEmpresa
	err := DB.First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		if err := DB.Create(&conf).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	} else {
		conf.ID = existing.ID
		if err := DB.Save(&conf).Error; err != nil {
			c.JSON(500, gin.H{"erro": err.Error()})
			return
		}
	}
	c.JSON(200, conf)
}

// PATCH Update Handlers
func atualizarEstoque(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Estoque float64 `json:"estoque"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}
	if err := DB.Model(&Produto{}).Where("id = ?", id).Update("estoque_atual", body.Estoque).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.Status(204)
}

func atualizarDebito(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Debito float64 `json:"debito"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}
	if err := DB.Model(&Cliente{}).Where("id = ?", id).Update("saldo_devedor", body.Debito).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.Status(204)
}

func atualizarSessao(c *gin.Context) {
	id := c.Param("id")
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}
	if err := DB.Model(&SessaoCaixa{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.Status(204)
}
