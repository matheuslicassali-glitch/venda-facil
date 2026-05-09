
import React from 'react';
import { Sale, CompanySettings, Product } from '../types';

interface ReceiptPrintProps {
  sale: Sale;
  company: CompanySettings;
  products: Product[];
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({ sale, company, products }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getProductName = (id: string) => {
    return products.find(p => p.id === id)?.nome || 'Produto não localizado';
  };

  return (
    <div id="receipt-print-area" className="receipt-container" style={{ 
      display: 'none', 
      width: '80mm', 
      padding: '5mm', 
      fontFamily: 'monospace', 
      fontSize: '12px',
      lineHeight: '1.2',
      color: '#000',
      backgroundColor: '#fff'
    }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print-area, #receipt-print-area * { visibility: visible; }
          #receipt-print-area { 
            display: block !important;
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm; 
          }
          @page { size: 80mm auto; margin: 0; }
        }
        .receipt-container hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        .receipt-container table { width: 100%; border-collapse: collapse; }
        .receipt-container th { text-align: left; font-weight: bold; }
        .receipt-container .total { font-weight: bold; font-size: 14px; margin-top: 10px; }
      `}</style>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: '0', fontSize: '18px' }}>{company.nome_fantasia || 'VENDA FÁCIL'}</h2>
        <p style={{ margin: '2px 0' }}>{company.razao_social}</p>
        <p style={{ margin: '2px 0' }}>CNPJ: {company.cnpj}</p>
        <p style={{ margin: '2px 0' }}>{company.endereco?.logradouro}, {company.endereco?.numero}</p>
        <p style={{ margin: '2px 0' }}>{company.endereco?.cidade}-{company.endereco?.uf}</p>
      </div>

      <hr />
      
      <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
        {sale.fiscal_status === 'emitida' ? (
          <>DANFE NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</>
        ) : (
          <div style={{ fontSize: '20px', margin: '5px 0' }}>CUPOM NÃO FISCAL</div>
        )}
      </div>

      <hr />

      <table>
        <thead>
          <tr>
            <th>ITEM  DESCRIÇÃO</th>
            <th style={{ textAlign: 'right' }}>QTD  UN</th>
            <th style={{ textAlign: 'right' }}>VALOR</th>
          </tr>
        </thead>
        <tbody>
          {sale.itens.map((item, index) => (
            <React.Fragment key={index}>
              <tr>
                <td colSpan={3} style={{ paddingTop: '5px' }}>
                  {String(index + 1).padStart(3, '0')} {item.nome || getProductName(item.produto_id)}
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: '10px' }}>
                  {item.quantidade} x {formatCurrency(item.preco_unitario)}
                </td>
                <td colSpan={2} style={{ textAlign: 'right' }}>
                  {formatCurrency(item.subtotal)}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <hr />

      <div className="total">
        <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
          <span>QTD. TOTAL DE ITENS</span>
          <span>{sale.itens.reduce((acc, i) => acc + i.quantidade, 0)}</span>
        </div>
        <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
          <span>VALOR TOTAL R$</span>
          <span>{formatCurrency(sale.valor_total + (sale.desconto_total || 0))}</span>
        </div>
        {sale.desconto_total > 0 && (
          <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
            <span>DESCONTO R$</span>
            <span>- {formatCurrency(sale.desconto_total)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', fontSize: '16px', marginTop: '5px' }}>
          <span>VALOR A PAGAR R$</span>
          <span>{formatCurrency(sale.valor_total)}</span>
        </div>
      </div>

      <hr />

      <div style={{ marginTop: '5px' }}>
        <strong>FORMA PAGAMENTO:</strong> {sale.tipo_pagamento?.replace('_', ' ').toUpperCase()}
        {sale.tipo_pagamento?.includes('cartao') && sale.bandeira_cartao && (
          <span> - {sale.bandeira_cartao.toUpperCase()}</span>
        )}
      </div>
      {sale.tipo_pagamento === 'cartao_credito' && (sale.parcelas || 1) > 0 && (
        <div style={{ marginTop: '3px' }}>
          <strong>PARCELAMENTO:</strong> {sale.parcelas || 1}x
        </div>
      )}
      {sale.tipo_pagamento === 'cartao_credito' && sale.acrescimo_cartao && sale.acrescimo_cartao > 0 && (
        <div style={{ marginTop: '3px' }}>
          <strong>ACRÉSCIMO CARTÃO:</strong> {formatCurrency(sale.acrescimo_cartao)}
        </div>
      )}

      <hr />

      <div style={{ textAlign: 'center', fontSize: '10px' }}>
        {sale.fiscal_status === 'emitida' ? (
          <>
            <p style={{ margin: '5px 0' }}>
              NFC-e nº {sale.nfe_numero || company.fiscal?.nfce_numero || '000.001'} Série {company.fiscal?.nfce_serie || '001'}
            </p>
            <p style={{ margin: '5px 0' }}>Data de Emissão: {new Date(sale.data_venda).toLocaleString()}</p>
            <p style={{ margin: '5px 0', wordBreak: 'break-all' }}>CHAVE DE ACESSO: <br /> {sale.chave_acesso || 'NÃO GERADA'}</p>
          </>
        ) : (
          <>
            <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
              VENDA Nº {sale.id.slice(-10).toUpperCase()}
            </p>
            <p style={{ margin: '5px 0' }}>Data da Venda: {new Date(sale.data_venda).toLocaleString()}</p>
            <p style={{ margin: '5px 0', color: '#666' }}>Documento Interno - Sem Valor Fiscal</p>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <p style={{ fontSize: '9px' }}>{sale.fiscal_status === 'emitida' ? 'Consulta via leitor de QR Code' : 'Informações da Venda'}</p>
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${
            sale.fiscal_status === 'emitida' 
            ? encodeURIComponent(`https://www.nfe.fazenda.gov.br/portal/consultaRecibo.aspx?chave=${sale.chave_acesso}`)
            : encodeURIComponent(`VENDA:${sale.id}|TOTAL:${sale.valor_total}|DATA:${sale.data_venda}`)
          }`} 
          alt="QR Code"
          style={{ width: '40mm', height: '40mm', marginTop: '5px' }}
        />
      </div>

      <hr />
      
      <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '10px' }}>
         OBRIGADO PELA PREFERÊNCIA! <br />
         <strong style={{ fontSize: '10px' }}>VENDA FÁCIL - SISTEMA PRO</strong> <br />
         <em style={{ color: '#666' }}>Vendas ágeis e eficientes</em>
      </div>
    </div>
  );
};
