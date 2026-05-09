@echo off
setlocal
echo --- Iniciando processo de geracao do instalador ---

echo [1/5] Gerando build do Frontend (React)...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo Erro ao gerar build do frontend.
    exit /b %errorlevel%
)

echo [2/5] Copiando arquivos do frontend para o backend...
xcopy /E /I /Y dist backend\dist
if %errorlevel% neq 0 (
    echo Erro ao copiar arquivos para o backend.
    exit /b %errorlevel%
)

echo [3/5] Compilando Backend (Go)...
pushd backend
go build -o VendaFacil.exe -ldflags "-H windowsgui" .
if %errorlevel% neq 0 (
    echo Erro ao compilar o backend.
    popd
    exit /b %errorlevel%
)
popd

echo [4/5] Preparando arquivos para o instalador...
copy /Y build\bin\VendaFacil.exe installer\VendaFacil.exe
copy /Y icon.ico installer\icon.ico

echo [5/5] Tentando gerar o instalador com Inno Setup...
set "ISCC_PATH=C:\Program Files\Inno Setup 7\ISCC.exe"

if exist "%ISCC_PATH%" (
    "%ISCC_PATH%" installer\setup.iss
    if %errorlevel% equ 0 (
        echo Instalador gerado com sucesso na pasta installer\build!
    ) else (
        echo Erro ao gerar o instalador com Inno Setup.
    )
) else (
    echo AVISO: Inno Setup 6 nao encontrado em "%ISCC_PATH%".
    echo O arquivo executavel "VendaFacil.exe" foi gerado com sucesso em "installer\".
    echo Voce pode abrir o arquivo "installer\setup.iss" no Inno Setup manualmente para gerar o instalador.
)

echo --- Processo concluido ---
pause
