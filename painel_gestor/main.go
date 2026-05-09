
package main

import (
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// Modelo da Licença
type Licenca struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Cliente   string         `gorm:"not null" json:"cliente"`
	Serial    string         `gorm:"unique;not null" json:"serial"`
	Validade  time.Time      `json:"validade"`
	CreatedAt time.Time      `json:"created_at"`
	Status    string         `gorm:"default:'ativo'" json:"status"`
}

var db *gorm.DB

func initDB() {
	var err error
	db, err = gorm.Open(sqlite.Open("gestor_licencas.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Falha ao conectar no banco do gestor:", err)
	}
	db.AutoMigrate(&Licenca{})
}

func generateSerial() string {
	chars := "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	segment := func(n int) string {
		b := make([]byte, n)
		rand.Read(b)
		for i := range b {
			b[i] = chars[int(b[i])%len(chars)]
		}
		return string(b)
	}
	ano := time.Now().Format("06")
	return fmt.Sprintf("VF%s-%s-%s-%s", ano, segment(4), segment(4), segment(4))
}

func main() {
	initDB()
	r := gin.Default()

	// Servir a interface (HTML inline para ser sistema único)
	r.GET("/", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(htmlInterface))
	})

	// API: Listar Licenças
	r.GET("/api/licencas", func(c *gin.Context) {
		var licencas []Licenca
		db.Order("created_at desc").Find(&licencas)
		c.JSON(http.StatusOK, licencas)
	})

	// API: Gerar Nova Licença
	r.POST("/api/licencas", func(c *gin.Context) {
		var input struct {
			Cliente string `json:"cliente"`
			Meses   int    `json:"meses"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
			return
		}

		novaLicenca := Licenca{
			Cliente:  input.Cliente,
			Serial:   generateSerial(),
			Validade: time.Now().AddDate(0, input.Meses, 0),
		}
		db.Create(&novaLicenca)
		c.JSON(http.StatusCreated, novaLicenca)
	})

	// API: Deletar Licença
	r.DELETE("/api/licencas/:id", func(c *gin.Context) {
		id := c.Param("id")
		db.Delete(&Licenca{}, id)
		c.Status(http.StatusNoContent)
	})

	fmt.Println("-------------------------------------------")
	fmt.Println("🚀 PAINEL GESTOR INICIADO EM: http://localhost:8080")
	fmt.Println("-------------------------------------------")
	r.Run(":8080")
}

const htmlInterface = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestor de Licenças - Venda Fácil</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f8fafc; }
        .card { background: white; border-radius: 1.5rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    </style>
</head>
<body class="p-4 md:p-10">
    <div class="max-w-4xl mx-auto">
        <header class="flex justify-between items-center mb-10">
            <div>
                <h1 class="text-3xl font-black text-slate-800 tracking-tight">Painel Gestor</h1>
                <p class="text-slate-500 font-medium">Controle de clientes e chaves de acesso</p>
            </div>
            <div class="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
        </header>

        <div class="card p-8 mb-8">
            <h2 class="font-black text-xs uppercase tracking-widest text-slate-400 mb-6">Gerar Nova Licença</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input id="cliente" type="text" placeholder="Nome do Cliente / Empresa" class="md:col-span-1 p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                <select id="meses" class="p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold">
                    <option value="12">12 Meses (1 Ano)</option>
                    <option value="6">6 Meses</option>
                    <option value="1">1 Mês (Teste)</option>
                </select>
                <button onclick="gerar()" class="bg-slate-800 text-white p-4 rounded-xl font-black hover:bg-black transition-all">GERAR SERIAL</button>
            </div>
        </div>

        <div class="card overflow-hidden">
            <div class="p-6 border-b border-slate-50 bg-slate-50/50">
                <h2 class="font-black text-xs uppercase tracking-widest text-slate-400">Histórico de Ativações</h2>
            </div>
            <table class="w-full text-left">
                <thead class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <tr>
                        <th class="p-6">Cliente</th>
                        <th class="p-6">Serial</th>
                        <th class="p-6">Validade</th>
                        <th class="p-6 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody id="lista" class="divide-y divide-slate-50 text-sm font-medium text-slate-700">
                    <!-- Dinâmico -->
                </tbody>
            </table>
        </div>
    </div>

    <script>
        async function carregar() {
            const res = await fetch('/api/licencas');
            const dados = await res.json();
            const lista = document.getElementById('lista');
            lista.innerHTML = dados.map(l => {
                return '<tr class="hover:bg-slate-50/50">' +
                    '<td class="p-6 font-bold text-slate-800 uppercase text-xs">' + l.cliente + '</td>' +
                    '<td class="p-6"><code class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-xs">' + l.serial + '</code></td>' +
                    '<td class="p-6 text-xs">' + new Date(l.validade).toLocaleDateString() + '</td>' +
                    '<td class="p-6 text-right">' +
                        '<button onclick="copiar(\'' + l.serial + '\')" class="text-blue-500 hover:underline mr-4 uppercase text-[10px] font-black">Copiar</button>' +
                        '<button onclick="deletar(' + l.id + ')" class="text-red-400 hover:text-red-600 uppercase text-[10px] font-black">Remover</button>' +
                    '</td>' +
                '</tr>';
            }).join('');
        }

        async function gerar() {
            const cliente = document.getElementById('cliente').value;
            const meses = parseInt(document.getElementById('meses').value);
            if(!cliente) return alert('Digite o nome do cliente!');
            
            await fetch('/api/licencas', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({cliente, meses})
            });
            document.getElementById('cliente').value = '';
            carregar();
        }

        async function deletar(id) {
            if(!confirm('Deseja remover esta licença?')) return;
            await fetch('/api/licencas/'+id, { method: 'DELETE' });
            carregar();
        }

        function copiar(texto) {
            navigator.clipboard.writeText(texto);
            alert('Serial copiado!');
        }

        carregar();
    </script>
</body>
</html>
`
