package main

import (
	"fmt"
	"io"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var LogFile *os.File

func SetupAPI() *gin.Engine {
	// Configurar Modo Gin
	gin.SetMode(gin.ReleaseMode)

	// Inicializar Gin
	app := gin.New()

	// Middleware
	app.Use(cors.Default())
	
	// Configurar Log
	multiWriter := io.MultiWriter(os.Stdout)
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

		// Fiscal
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
		sistema := api.Group("/sistema")
		{
			sistema.POST("/sair", func(c *gin.Context) {
				c.JSON(200, gin.H{"status": "ok"})
				go func() {
					time.Sleep(200 * time.Millisecond)
					os.Exit(0)
				}()
			})
		}
	}

	return app
}

// -- HANDLERS --

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
		for i := range venda.Items {
			venda.Items[i].VendaID = venda.ID
		}
		if err := tx.Create(&venda).Error; err != nil {
			return err
		}
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
	if err := DB.Model(&venda).Updates(map[string]interface{}{
		"status": "cancelada",
		"fiscal_status": "cancelada",
	}).Error; err != nil {
		c.JSON(500, gin.H{"erro": "Erro ao atualizar status"})
		return
	}
	for _, item := range venda.Items {
		DB.Model(&Produto{}).Where("id = ?", item.ProdutoID).Update("estoque_atual", gorm.Expr("estoque_atual + ?", item.Quantidade))
	}
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
	c.Status(204)
}

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
	protocolo := fmt.Sprintf("1%014d", time.Now().UnixNano())[:15]
	inut.Protocolo = &protocolo
	inut.Status = "homologado"
	if err := DB.Create(&inut).Error; err != nil {
		c.JSON(500, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(200, inut)
}

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

func atualizarEstoque(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Estoque float64 `json:"estoque"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}
	DB.Model(&Produto{}).Where("id = ?", id).Update("estoque_atual", body.Estoque)
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
	DB.Model(&Cliente{}).Where("id = ?", id).Update("saldo_devedor", body.Debito)
	c.Status(204)
}

func atualizarSessao(c *gin.Context) {
	id := c.Param("id")
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(400, gin.H{"erro": err.Error()})
		return
	}
	DB.Model(&SessaoCaixa{}).Where("id = ?", id).Updates(updates)
	c.Status(204)
}
