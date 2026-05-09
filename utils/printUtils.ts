
/**
 * Utility to print any HTML content as a formatted report.
 * Opens a printable window with professional styling.
 */

const PRINT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
  .print-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px; }
  .print-header h1 { font-size: 20px; font-weight: 900; color: #1d4ed8; }
  .print-header .meta { text-align: right; color: #64748b; font-size: 10px; }
  .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin: 16px 0 10px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .kpi-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }
  .kpi-value { font-size: 18px; font-weight: 900; color: #1e293b; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 10px; color: #334155; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 900; text-transform: uppercase; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-blue { background: #dbeafe; color: #2563eb; }
  .badge-orange { background: #fed7aa; color: #ea580c; }
  .badge-gray { background: #f1f5f9; color: #64748b; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8; }
  @media print { @page { size: A4; margin: 15mm; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
`;

export function printReport(title: string, bodyHtml: string, companyName = 'Venda Fácil') {
  const now = new Date().toLocaleString('pt-BR');
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Permita pop-ups para imprimir relatórios.'); return; }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>${PRINT_STYLE}</style>
    </head>
    <body>
      <div class="print-header">
        <div>
          <h1>${companyName}</h1>
          <div style="font-size:13px;font-weight:700;color:#334155;margin-top:4px">${title}</div>
        </div>
        <div class="meta">
          <div>Emitido em: <strong>${now}</strong></div>
          <div style="margin-top:4px;">Sistema Venda Fácil</div>
        </div>
      </div>
      ${bodyHtml}
      <div class="footer">Relatório gerado automaticamente pelo Sistema Venda Fácil &mdash; ${now}</div>
    </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
}

export function fmtCurPrint(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
