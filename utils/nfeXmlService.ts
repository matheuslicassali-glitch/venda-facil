
import { Sale, Client, CompanySettings, Product } from '../types';

export const generateNFeXML = (
    sale: Sale,
    client: Client | null,
    company: CompanySettings,
    products: Product[]
): string => {
    const now = new Date();
    const dhEmi = now.toISOString().replace(/\.\d{3}Z$/, '-03:00'); // Simulated timezone
    const cNF = Math.floor(10000000 + Math.random() * 90000000).toString();
    const nNF = sale.nfe_numero || '1';
    const serie = '1';
    const tpAmb = company.fiscal.ambiente === 'producao' ? '1' : '2';

    // Chave de Acesso simulated (44 digits)
    // [cUF][AAMM][CNPJ][mod][serie][nNF][tpEmis][cNF][cDV]
    const cUF = '35'; // SP
    const mod = sale.tipo_pagamento === 'dinheiro' ? '65' : '55'; // NFCe vs NFe simple logic
    const chNFe = `${cUF}${now.toISOString().substring(2, 4)}${now.toISOString().substring(5, 7)}${company.cnpj.replace(/\D/g, '')}${mod}${serie.padStart(3, '0')}${nNF.padStart(9, '0')}1${cNF}${Math.floor(Math.random() * 9)}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${chNFe}" versao="4.00">
      <ide>
        <cUF>${cUF}</cUF>
        <cNF>${cNF}</cNF>
        <natOp>VENDA DE MERCADORIA</natOp>
        <mod>${mod}</mod>
        <serie>${serie}</serie>
        <nNF>${nNF}</nNF>
        <dhEmi>${dhEmi}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>${company.endereco.ibge_cidade}</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${chNFe.slice(-1)}</cDV>
        <tpAmb>${tpAmb}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>VendaFacil_1.0</verProc>
      </ide>
      <emit>
        <CNPJ>${company.cnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${company.razao_social}</xNome>
        <xFant>${company.nome_fantasia}</xFant>
        <enderEmit>
          <xLgr>${company.endereco.logradouro}</xLgr>
          <nro>${company.endereco.numero}</nro>
          <xBairro>${company.endereco.bairro}</xBairro>
          <cMun>${company.endereco.ibge_cidade}</cMun>
          <xMun>${company.endereco.cidade}</xMun>
          <UF>${company.endereco.uf}</UF>
          <CEP>${company.endereco.cep.replace(/\D/g, '')}</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderEmit>
        <IE>${company.inscricao_estadual.replace(/\D/g, '')}</IE>
        <CRT>${company.crt}</CRT>
      </emit>
      <dest>
        ${client ? `
        <${client.documento.length > 11 ? 'CNPJ' : 'CPF'}>${client.documento.replace(/\D/g, '')}</${client.documento.length > 11 ? 'CNPJ' : 'CPF'}>
        <xNome>${client.nome}</xNome>
        <enderDest>
          <xLgr>${client.logradouro || ''}</xLgr>
          <nro>${client.numero || ''}</nro>
          <xBairro>${client.bairro || ''}</xBairro>
          <cMun>${client.ibge_cidade || ''}</cMun>
          <xMun>${client.cidade || ''}</xMun>
          <UF>${client.uf || ''}</UF>
          <CEP>${(client.cep || '').replace(/\D/g, '')}</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderDest>
        <indIEDest>${client.inscricao_estadual === 'Isento' ? '2' : '1'}</indIEDest>
        ${client.inscricao_estadual && client.inscricao_estadual !== 'Isento' ? `<IE>${client.inscricao_estadual.replace(/\D/g, '')}</IE>` : ''}
        ` : '<CPF></CPF><xNome>CONSUMIDOR FINAL</xNome><indIEDest>9</indIEDest>'}
      </dest>`;

    // Items
    sale.itens.forEach((item, index) => {
        const prod = products.find(p => p.id === item.produto_id);
        xml += `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${prod?.sku || item.produto_id}</cProd>
          <cEAN>${prod?.codigo_barras || 'SEM GTIN'}</cEAN>
          <xProd>${item.nome}</xProd>
          <NCM>${prod?.ncm || '00000000'}</NCM>
          <CFOP>${prod?.cfop || '5102'}</CFOP>
          <uCom>${prod?.unidade.toUpperCase() || 'UN'}</uCom>
          <qCom>${item.quantidade.toFixed(4)}</qCom>
          <vUnCom>${item.preco_unitario.toFixed(10)}</vUnCom>
          <vProd>${item.subtotal.toFixed(2)}</vProd>
          <cEANTrib>${prod?.codigo_barras || 'SEM GTIN'}</cEANTrib>
          <uTrib>${prod?.unidade.toUpperCase() || 'UN'}</uTrib>
          <qTrib>${item.quantidade.toFixed(4)}</qTrib>
          <vUnTrib>${item.preco_unitario.toFixed(10)}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            ${company.crt === '1' ? `
            <ICMSSN102>
              <orig>${prod?.origem || '0'}</orig>
              <CSOSN>${prod?.cst_csosn || '102'}</CSOSN>
            </ICMSSN102>
            ` : `
            <ICMS00>
              <orig>${prod?.origem || '0'}</orig>
              <CST>${prod?.cst_csosn || '00'}</CST>
              <modBC>3</modBC>
              <vBC>${item.subtotal.toFixed(2)}</vBC>
              <pICMS>${(prod?.icms_aliquota || 0).toFixed(2)}</pICMS>
              <vICMS>${(item.subtotal * (prod?.icms_aliquota || 0) / 100).toFixed(2)}</vICMS>
            </ICMS00>
            `}
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>${prod?.pis_cst || '01'}</CST>
              <vBC>${item.subtotal.toFixed(2)}</vBC>
              <pPIS>${(prod?.pis_aliquota || 0).toFixed(2)}</pPIS>
              <vPIS>${(item.subtotal * (prod?.pis_aliquota || 0) / 100).toFixed(2)}</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>${prod?.cofins_cst || '01'}</CST>
              <vBC>${item.subtotal.toFixed(2)}</vBC>
              <pCOFINS>${(prod?.cofins_aliquota || 0).toFixed(2)}</pCOFINS>
              <vCOFINS>${(item.subtotal * (prod?.cofins_aliquota || 0) / 100).toFixed(2)}</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>`;
    });

    xml += `
      <total>
        <ICMSTot>
          <vBC>${sale.valor_total.toFixed(2)}</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${sale.valor_total.toFixed(2)}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>${(sale.desconto_total || 0).toFixed(2)}</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${sale.valor_total.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>${sale.tipo_pagamento === 'dinheiro' ? '01' : '03'}</tPag>
          <vPag>${sale.valor_total.toFixed(2)}</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>Venda realizada via VendaFacil. Agradecemos a preferencia!</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</nfeProc>`;

    return xml;
};
