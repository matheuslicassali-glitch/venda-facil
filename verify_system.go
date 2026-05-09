package main

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

func getDataPathVerify(filename string) string {
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

func mainVerify() {
	fmt.Println("======================================")
	fmt.Println("   VERIFICADOR DE SISTEMA - VENDA FACIL")
	fmt.Println("======================================")
	fmt.Println("Data/Hora:", time.Now().Format("02/01/2006 15:04:05"))
	fmt.Println("")

	errorCount := 0

	// 1. Verificar Node.js/NPM
	fmt.Print("[1] Verificando NPM... ")
	npmCheck := exec.Command("npm", "-v")
	if err := npmCheck.Run(); err != nil {
		fmt.Println("FALHA (NPM não encontrado)")
		errorCount++
	} else {
		fmt.Println("OK")
	}

	// 2. Verificar Go
	fmt.Print("[2] Verificando Go... ")
	goCheck := exec.Command("go", "version")
	if err := goCheck.Run(); err != nil {
		fmt.Println("FALHA (Go não encontrado)")
		errorCount++
	} else {
		fmt.Println("OK")
	}

	// 3. Verificar Pastas Cruciais
	fmt.Print("[3] Verificando pastas do projeto... ")
	criticalPaths := []string{"backend", "pages", "components", "public"}
	pathsOk := true
	for _, p := range criticalPaths {
		if _, err := os.Stat(p); os.IsNotExist(err) {
			fmt.Printf("\n    FALHA: Pasta '%s' não encontrada", p)
			pathsOk = false
			errorCount++
		}
	}
	if pathsOk {
		fmt.Println("OK")
	} else {
		fmt.Println("")
	}

	// 4. Verificar node_modules
	fmt.Print("[4] Verificando node_modules... ")
	if _, err := os.Stat("node_modules"); os.IsNotExist(err) {
		fmt.Println("FALHA (Execute 'npm install')")
		errorCount++
	} else {
		fmt.Println("OK")
	}

	// 5. Verificar Compilação do Frontend (dist)
	fmt.Print("[5] Verificando build do frontend (dist)... ")
	if _, err := os.Stat("dist"); os.IsNotExist(err) {
		fmt.Println("AVISO (Pasta 'dist' não encontrada. É necessário 'npm run build')")
	} else {
		fmt.Println("OK")
	}

	// 6. Verificar Banco de Dados SQLite
	dbPath := getDataPathVerify("teste_local.db")
	fmt.Printf("[6] Verificando Banco de Dados (%s)... ", dbPath)
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		fmt.Println("AVISO (Banco de dados ainda não criado. Será criado ao iniciar o app)")
	} else {
		fmt.Println("OK")
	}

	// 7. Verificar Porta 3001
	fmt.Print("[7] Verificando porta 3001... ")
	ln, err := net.Listen("tcp", ":3001")
	if err != nil {
		fmt.Println("FALHA (Porta 3001 já está em uso ou inacessível)")
		errorCount++
	} else {
		ln.Close()
		fmt.Println("OK (Livre)")
	}

	fmt.Println("\n======================================")
	if errorCount == 0 {
		fmt.Println("   SISTEMA PRONTO PARA USO!")
	} else {
		fmt.Printf("   ENCONTRADOS %d PROBLEMA(S).\n", errorCount)
	}
	fmt.Println("======================================")
	fmt.Println("Pressione Enter para sair...")
	fmt.Scanln()
}
