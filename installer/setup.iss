; Script do Inno Setup para o Venda Fácil
; Baixe o Inno Setup em: https://jrsoftware.org/isdl.php

[Setup]
AppName=Venda Fácil
AppVersion=2.0.3
DefaultDirName={autopf}\Venda Facil
DefaultGroupName=Venda Facil
OutputDir=build
OutputBaseFilename=VendaFacil_Setup_2.0.3
SetupIconFile=icon.ico
Compression=lzma
SolidCompression=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na Área de Trabalho"; GroupDescription: "Ícones Adicionais:"

[Files]
Source: "VendaFacil.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Venda Fácil"; Filename: "{app}\VendaFacil.exe"; IconFilename: "{app}\icon.ico"
Name: "{autodesktop}\Venda Fácil"; Filename: "{app}\VendaFacil.exe"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\VendaFacil.exe"; Description: "Lançar o Venda Fácil agora"; Flags: nowait postinstall skipifsilent
