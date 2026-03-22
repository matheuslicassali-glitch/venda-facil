package main

import (
	"fmt"
	"log"
	"os"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConectarBanco() {
	dsn := os.Getenv("DATABASE_URL")
	var err error

	if dsn == "" {
		fmt.Println("DATABASE_URL não configurada. Usando SQLite local (teste_local.db) para este teste...")
		DB, err = gorm.Open(sqlite.Open("teste_local.db"), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	} else {
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	}

	if err != nil {
		log.Fatal("Falha ao inicializar o banco de dados: ", err)
	}

	// Sincronizar tabelas (AutoMigrate) para o teste local se estiver usando SQLite
	if dsn == "" {
		DB.AutoMigrate(&Produto{}, &Cliente{}, &Funcionario{}, &Venda{}, &ItemVenda{}, &SessaoCaixa{}, &MovimentacaoCaixa{}, &ContaFinanceira{}, &Fornecedor{})
		
		// Criar dados iniciais para o teste local se estiver vazio
		var count int64
		DB.Model(&Produto{}).Count(&count)
		if count == 0 {
			seedInitialData()
		}
	}

	fmt.Println("Conectado ao banco de Dados com sucesso!")
}

func sPtr(s string) *string { return &s }

func seedInitialData() {
	// Exemplo de dados para o seu teste local agora mesmo
	produtoExemplo := Produto{
		Nome: "Arroz 5kg",
		SKU: "ARZ-001",
		PrecoVenda: 25.90,
		PrecoCusto: 18.00,
		EstoqueAtual: 100,
		Unidade: "un",
		Categoria: "Alimentos",
		NCM: "1006.30.21",
		CFOP: "5102",
		CST_CSOSN: "102",
	}
	DB.Create(&produtoExemplo)
	
	clienteExemplo := Cliente{
		Nome: "Lukas Teste Local",
		Documento: "000.000.000-00",
		Telefone: sPtr("(11) 99999-9999"),
		Cidade: sPtr("São Paulo"),
		UF: sPtr("SP"),
	}
	DB.Create(&clienteExemplo)
	
	fmt.Println("--- Dados de exemplo semeados no banco local para o seu teste! ---")
}
