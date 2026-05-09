
const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('====================================');
console.log('   GERADOR DE LICENÇAS - VENDA FÁCIL');
console.log('====================================\n');

rl.question('Nome da Empresa ou CNPJ do Cliente: ', (cliente) => {
  if (!cliente) {
    console.log('Erro: Nome do cliente é obrigatório.');
    rl.close();
    return;
  }

  // Geração de Serial Aleatório Formatado
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Evita 0, O, 1, I para legibilidade
  const generateSegment = (len) => {
    let segment = '';
    for (let i = 0; i < len; i++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return segment;
  };

  const ano = new Date().getFullYear().toString().slice(-2);
  const serial = `VF${ano}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;

  console.log('\n------------------------------------');
  console.log(`CLIENTE: ${cliente.toUpperCase()}`);
  console.log(`SERIAL:  ${serial}`);
  console.log('------------------------------------\n');

  // Salva no log para controle do desenvolvedor
  const logEntry = `Data: ${new Date().toLocaleString()} | Cliente: ${cliente} | Serial: ${serial}\n`;
  fs.appendFileSync('licencas_geradas.log', logEntry);

  console.log('✅ Licença salva com sucesso em: licencas_geradas.log');
  console.log('Pressione qualquer tecla para sair...');
  
  rl.close();
});
