package main

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// Produto mapeia para a tabela 'produtos'
type Produto struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Nome            string    `gorm:"not null" json:"nome"`
	SKU             string    `gorm:"unique;not null" json:"sku"`
	CodigoBarras    *string   `json:"codigo_barras"`
	PrecoVenda      float64   `gorm:"type:decimal(10,2);not null" json:"preco_venda"`
	PrecoCusto      float64   `gorm:"type:decimal(10,2);not null" json:"preco_custo"`
	EstoqueAtual    float64   `gorm:"type:decimal(10,2);default:0" json:"estoque_atual"`
	EstoqueMinimo   float64   `gorm:"type:decimal(10,2);default:0" json:"estoque_minimo"`
	Unidade         string    `json:"unidade"`
	Categoria       string    `json:"categoria"`
	Foto            *string   `json:"foto"`
	NCM             string    `json:"ncm"`
	CEST            *string   `json:"cest"`
	Origem          string    `json:"origem"`
	CFOP            string    `json:"cfop"`
	CST_CSOSN       string    `json:"cst_csosn"`
	PIS_CST         *string   `json:"pis_cst"`
	PIS_Aliquota    *float64  `gorm:"type:decimal(5,2)" json:"pis_aliquota"`
	COFINS_CST      *string   `json:"cofins_cst"`
	COFINS_Aliquota *float64  `gorm:"type:decimal(5,2)" json:"cofins_aliquota"`
	ICMS_Aliquota   *float64  `gorm:"type:decimal(5,2)" json:"icms_aliquota"`
	Validade        *string   `json:"validade"`
	CreatedAt       time.Time `gorm:"default:now()" json:"created_at"`
}

func (Produto) TableName() string {
	return "produtos"
}

// Cliente mapeia para a tabela 'clientes'
type Cliente struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Nome              string    `gorm:"not null" json:"nome"`
	RazaoSocial       *string   `json:"razao_social"`
	Documento         string    `gorm:"unique;not null" json:"documento"`
	InscricaoEstadual *string   `json:"inscricao_estadual"`
	Email             *string   `json:"email"`
	Telefone          *string   `json:"telefone"`
	LimiteCredito     float64   `gorm:"type:decimal(10,2);default:0" json:"limite_credito"`
	SaldoDevedor      float64   `gorm:"type:decimal(10,2);default:0" json:"saldo_devedor"`
	Endereco          string    `json:"endereco"`
	Logradouro        *string   `json:"logradouro"`
	Numero            *string   `json:"numero"`
	Bairro            *string   `json:"bairro"`
	Cidade            *string   `json:"cidade"`
	UF                *string   `json:"uf"`
	CEP               *string   `json:"cep"`
	IBGECidade        *string   `json:"ibge_cidade"`
	CreatedAt         time.Time `gorm:"default:now()" json:"created_at"`
}

func (Cliente) TableName() string {
	return "clientes"
}

// Funcionario mapeia para a tabela 'funcionarios'
type Funcionario struct {
	ID         uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Nome       string         `gorm:"not null" json:"nome"`
	Cargo      string         `gorm:"not null" json:"cargo"`
	CPF        string         `gorm:"unique;not null" json:"cpf"`
	Email      string         `gorm:"unique;not null" json:"email"`
	Status     string         `gorm:"default:'Ativo'" json:"status"`
	Comissao   float64        `gorm:"type:decimal(5,2);default:0" json:"comissao"`
	PIN        *string        `json:"pin"`
	Permissoes datatypes.JSON `json:"permissoes"`
	CreatedAt  time.Time      `gorm:"default:now()" json:"created_at"`
}

func (Funcionario) TableName() string {
	return "funcionarios"
}

// Venda mapeia para a tabela 'vendas'
type Venda struct {
	ID            uuid.UUID   `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DataVenda     time.Time   `gorm:"default:now()" json:"data_venda"`
	ValorTotal    float64     `gorm:"type:decimal(10,2);not null" json:"valor_total"`
	DescontoTotal float64     `gorm:"type:decimal(10,2);default:0" json:"desconto_total"`
	TipoPagamento string      `json:"tipo_pagamento"`
	ClienteID     *uuid.UUID  `gorm:"type:uuid" json:"cliente_id"`
	VendedorID    *uuid.UUID  `gorm:"type:uuid" json:"vendedor_id"`
	Status        string      `gorm:"default:'concluida'" json:"status"`
	FiscalStatus  string      `gorm:"default:'pendente'" json:"fiscal_status"`
	NFENumero     *string     `json:"nfe_numero"`
	ChaveAcesso   *string     `json:"chave_acesso"`
	XML           *string     `json:"xml"`
	TipoOperacao  string      `gorm:"default:'venda'" json:"tipo_operacao"`
	Items         []ItemVenda `gorm:"foreignKey:VendaID" json:"itens"`
}

func (Venda) TableName() string {
	return "vendas"
}

// ItemVenda mapeia para a tabela 'venda_itens'
type ItemVenda struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	VendaID       uuid.UUID `gorm:"type:uuid" json:"venda_id"`
	ProdutoID     uuid.UUID `gorm:"type:uuid" json:"produto_id"`
	Nome          string    `gorm:"not null" json:"nome"`
	Quantidade    float64   `gorm:"type:decimal(10,2);not null" json:"quantidade"`
	PrecoUnitario float64   `gorm:"type:decimal(10,2);not null" json:"preco_unitario"`
	Subtotal      float64   `gorm:"type:decimal(10,2);not null" json:"subtotal"`
	Desconto      float64   `gorm:"type:decimal(10,2);default:0" json:"desconto"`
}

func (ItemVenda) TableName() string {
	return "venda_itens"
}

// SessaoCaixa mapeia para 'caixa_sessoes'
type SessaoCaixa struct {
	ID                      uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	AbertoEm                time.Time  `gorm:"default:now()" json:"aberto_em"`
	FechadoEm               *time.Time `json:"fechado_em"`
	ValorAbertura           float64    `gorm:"type:decimal(10,2);not null" json:"valor_abertura"`
	ValorFechamentoEsperado float64    `gorm:"type:decimal(10,2);not null" json:"valor_fechamento_esperado"`
	ValorFechamentoInfo     *float64   `gorm:"column:valor_fechamento_informado;type:decimal(10,2)" json:"valor_fechamento_informado"`
	Status                  string     `gorm:"default:'aberto'" json:"status"`
	VendedorID              uuid.UUID  `gorm:"type:uuid" json:"vendedor_id"`
}

func (SessaoCaixa) TableName() string {
	return "caixa_sessoes"
}

// MovimentacaoCaixa mapeia para 'caixa_movimentacoes'
type MovimentacaoCaixa struct {
	ID      uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CaixaID uuid.UUID `gorm:"type:uuid" json:"caixa_id"`
	Tipo    string    `json:"tipo"` // sangria, suprimento
	Valor   float64   `gorm:"type:decimal(10,2);not null" json:"valor"`
	Motivo  string    `json:"motivo"`
	Data    time.Time `gorm:"default:now()" json:"data"`
}

func (MovimentacaoCaixa) TableName() string {
	return "caixa_movimentacoes"
}

// ContaFinanceira mapeia para 'financeiro_contas'
type ContaFinanceira struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Tipo        string    `json:"tipo"` // pagar, receber
	Descricao   string    `gorm:"not null" json:"descricao"`
	Valor       float64   `gorm:"type:decimal(10,2);not null" json:"valor"`
	Vencimento  time.Time `gorm:"not null" json:"vencimento"`
	Status      string    `gorm:"default:'pendente'" json:"status"`
	Categoria   string    `json:"categoria"`
	CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`
}

func (ContaFinanceira) TableName() string {
	return "financeiro_contas"
}

// Fornecedor mapeia para 'fornecedores'
type Fornecedor struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Nome      string    `gorm:"not null" json:"nome"`
	CNPJ      string    `gorm:"unique;not null" json:"cnpj"`
	Email     *string   `json:"email"`
	Telefone  *string   `json:"telefone"`
	Endereco  *string   `json:"endereco"`
	CreatedAt time.Time `gorm:"default:now()" json:"created_at"`
}

func (Fornecedor) TableName() string {
	return "fornecedores"
}
