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
		dbPath := getDataPath("teste_local.db")
		log.Println("Usando Banco de Dados em:", dbPath)
		DB, err = gorm.Open(sqlite.Open(dbPath+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)"), &gorm.Config{
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

	// Sincronizar tabelas (AutoMigrate) com tratamento de erro explícito
	if dsn == "" {
		err = DB.AutoMigrate(
			&Produto{}, 
			&Cliente{}, 
			&Funcionario{}, 
			&Venda{}, 
			&ItemVenda{}, 
			&SessaoCaixa{}, 
			&MovimentacaoCaixa{}, 
			&ContaFinanceira{}, 
			&Fornecedor{},
			&Inutilizacao{},
			&ConfiguracaoEmpresa{},
		)
		if err != nil {
			log.Fatal("Erro na migração automática das tabelas Go: ", err)
		}
		
		fmt.Println("Migração de tabelas local concluída com sucesso!")
		
		// Criar dados iniciais para o teste local se estiver vazio
		var count int64
		DB.Model(&Produto{}).Count(&count)
		if count == 0 {
			seedInitialData()
		}

		var countFunc int64
		DB.Model(&Funcionario{}).Count(&countFunc)
		if countFunc == 0 {
			seedMasterOnly()
		}

		var countConf int64
		DB.Model(&ConfiguracaoEmpresa{}).Count(&countConf)
		if countConf == 0 {
			seedSettings()
		}
	}

	fmt.Println("Conectado ao banco de Dados com sucesso!")
}

func sPtr(s string) *string { return &s }

func seedInitialData() {
	fmt.Println("Semeando dados de exemplo no banco local...")
	
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
	if err := DB.Create(&produtoExemplo).Error; err != nil {
		fmt.Println("Erro ao semear produto:", err)
	}
	
	clienteExemplo := Cliente{
		Nome: "Lukas Teste Local",
		Documento: "000.000.000-00",
		Telefone: sPtr("(11) 99999-9999"),
		Cidade: sPtr("São Paulo"),
		UF: sPtr("SP"),
	}
	if err := DB.Create(&clienteExemplo).Error; err != nil {
		fmt.Println("Erro ao semear cliente:", err)
	}
	
	fmt.Println("--- Dados de exemplo semeados no banco local para o seu teste! ---")
}

func seedMasterOnly() {
	fmt.Println("Semeando funcionário MASTER padrão...")
	masterEmp := Funcionario{
		Nome:  "Usuário Master",
		Cargo: "Administrador",
		CPF:   "000.000.000-00",
		Email: "matheuslicassali@gmail.com",
		PIN:   sPtr("1234"),
	}
	if err := DB.Create(&masterEmp).Error; err != nil {
		fmt.Println("Erro ao semear funcionário master:", err)
	}
}

func seedSettings() {
	fmt.Println("Semeando configurações iniciais da empresa...")
	config := ConfiguracaoEmpresa{
		NomeFantasia: "Minha Empresa",
		RazaoSocial:  "Minha Empresa LTDA",
		CNPJ:         "00.000.000/0001-00",
		UF:           "SP",
		Cidade:       "São Paulo",
		FiscalAmbiente: "homologacao",
		CRT:          "1",
	}
	if err := DB.Create(&config).Error; err != nil {
		fmt.Println("Erro ao semear configurações:", err)
	}
}
