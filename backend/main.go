package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func main() {
	// Inicializar Banco de Dados
	ConectarBanco()

	// Inicializar Fiber
	app := fiber.New()

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// -- ROTAS API --
	api := app.Group("/api")

	// Produtos
	produtos := api.Group("/produtos")
	produtos.Get("/", listarProdutos)
	produtos.Post("/", salvarProduto)
	produtos.Delete("/:id", deletarProduto)

	// Vendas
	vendas := api.Group("/vendas")
	vendas.Get("/", listarVendas)
	vendas.Post("/", criarVenda)
	vendas.Patch("/:id/cancelar", cancelarVenda)
	vendas.Delete("/:id", deletarVenda)

	// Clientes
	clientes := api.Group("/clientes")
	clientes.Get("/", listarClientes)
	clientes.Post("/", salvarCliente)
	clientes.Delete("/:id", deletarCliente)

	// Funcionários
	funcionarios := api.Group("/funcionarios")
	funcionarios.Get("/", listarFuncionarios)
	funcionarios.Post("/", salvarFuncionario)
	funcionarios.Delete("/:id", deletarFuncionario)

	// Caixa
	caixa := api.Group("/caixa")
	caixa.Get("/ativo", obterSessaoAtiva)
	caixa.Post("/sessao", abrirSessao)
	caixa.Post("/movimentacao", adicionarMovimentacao)

	// Financeiro
	financeiro := api.Group("/financeiro")
	financeiro.Get("/", listarContas)
	financeiro.Post("/", salvarConta)

	// Iniciar servidor
	porta := os.Getenv("PORT")
	if porta == "" {
		porta = "3001"
	}
	log.Fatal(app.Listen(":" + porta))
}

// -- HANDLERS (CONTROLADORES) --

// Produtos
func listarProdutos(c *fiber.Ctx) error {
	var produtos []Produto
	if err := DB.Order("nome").Find(&produtos).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.JSON(produtos)
}

func salvarProduto(c *fiber.Ctx) error {
	produto := new(Produto)
	if err := c.BodyParser(produto); err != nil {
		return c.Status(400).JSON(fiber.Map{"erro": err.Error()})
	}

	if produto.ID == uuid.Nil {
		if err := DB.Create(produto).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
		}
	} else {
		if err := DB.Save(produto).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
		}
	}
	return c.JSON(produto)
}

func deletarProduto(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := DB.Delete(&Produto{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.SendStatus(204)
}

// Vendas
func listarVendas(c *fiber.Ctx) error {
	var vendas []Venda
	if err := DB.Preload("Items").Order("data_venda desc").Find(&vendas).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.JSON(vendas)
}

func criarVenda(c *fiber.Ctx) error {
	venda := new(Venda)
	if err := c.BodyParser(venda); err != nil {
		return c.Status(400).JSON(fiber.Map{"erro": err.Error()})
	}

	erro := DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(venda).Error; err != nil {
			return err
		}

		for i := range venda.Items {
			venda.Items[i].VendaID = venda.ID
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
		return c.Status(500).JSON(fiber.Map{"erro": erro.Error()})
	}

	return c.JSON(venda)
}

func cancelarVenda(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := DB.Model(&Venda{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":        "cancelada",
		"fiscal_status": "erro",
	}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.SendStatus(204)
}

func deletarVenda(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := DB.Delete(&Venda{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.SendStatus(204)
}

// Clientes
func listarClientes(c *fiber.Ctx) error {
	var clientes []Cliente
	if err := DB.Order("nome").Find(&clientes).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.JSON(clientes)
}

func salvarCliente(c *fiber.Ctx) error {
	cliente := new(Cliente)
	if err := c.BodyParser(cliente); err != nil {
		return c.Status(400).JSON(fiber.Map{"erro": err.Error()})
	}

	if cliente.ID == uuid.Nil {
		if err := DB.Create(cliente).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
		}
	} else {
		if err := DB.Save(cliente).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
		}
	}
	return c.JSON(cliente)
}

func deletarCliente(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := DB.Delete(&Cliente{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.SendStatus(204)
}

// Funcionários
func listarFuncionarios(c *fiber.Ctx) error {
	var funcionarios []Funcionario
	if err := DB.Order("nome").Find(&funcionarios).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.JSON(funcionarios)
}

func salvarFuncionario(c *fiber.Ctx) error {
	f := new(Funcionario)
	if err := c.BodyParser(f); err != nil {
		return c.Status(400).JSON(fiber.Map{"erro": err.Error()})
	}

	if f.ID == uuid.Nil {
		if err := DB.Create(f).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
		}
	} else {
		if err := DB.Save(f).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
		}
	}
	return c.JSON(f)
}

func deletarFuncionario(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := DB.Delete(&Funcionario{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.SendStatus(204)
}

// Caixa
func obterSessaoAtiva(c *fiber.Ctx) error {
	var sessao SessaoCaixa
	if err := DB.Where("status = ?", "aberto").First(&sessao).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.JSON(nil)
		}
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.JSON(sessao)
}

func abrirSessao(c *fiber.Ctx) error {
	sessao := new(SessaoCaixa)
	if err := c.BodyParser(sessao); err != nil {
		return c.Status(400).JSON(fiber.Map{"erro": err.Error()})
	}
	if err := DB.Create(sessao).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.JSON(sessao)
}

func adicionarMovimentacao(c *fiber.Ctx) error {
	mov := new(MovimentacaoCaixa)
	if err := c.BodyParser(mov); err != nil {
		return c.Status(400).JSON(fiber.Map{"erro": err.Error()})
	}
	if err := DB.Create(mov).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.JSON(mov)
}

// Financeiro
func listarContas(c *fiber.Ctx) error {
	var contas []ContaFinanceira
	if err := DB.Order("vencimento").Find(&contas).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
	}
	return c.JSON(contas)
}

func salvarConta(c *fiber.Ctx) error {
	conta := new(ContaFinanceira)
	if err := c.BodyParser(conta); err != nil {
		return c.Status(400).JSON(fiber.Map{"erro": err.Error()})
	}
	if conta.ID == uuid.Nil {
		if err := DB.Create(conta).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
		}
	} else {
		if err := DB.Save(conta).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"erro": err.Error()})
		}
	}
	return c.JSON(conta)
}
