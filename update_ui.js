const fs = require('fs');
const path = 'pages/POS.tsx';
let content = fs.readFileSync(path, 'utf8');

const newUI = `             <div className="space-y-4 max-h-[350px] overflow-y-auto px-1 custom-scrollbar">
                <div className="flex justify-between items-center ml-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formas de Recebimento</label>
                   <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{payments.length} Forma(s) selecionada(s)</span>
                </div>

                {payments.map((p, idx) => (
                   <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-in slide-in-from-right duration-300">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 font-black text-sm italic shrink-0">
                            #{idx+1}
                         </div>
                         
                         <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="relative">
                               <select 
                                 className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                 value={p.method}
                                 onChange={e => updatePaymentRow(idx, 'method', e.target.value)}
                               >
                                  <option value="dinheiro">💵 DINHEIRO</option>
                                  <option value="cartao_credito">💳 CARTÃO CRÉDITO</option>
                                  <option value="cartao_debito">💳 CARTÃO DÉBITO</option>
                                  <option value="pix">📱 PIX</option>
                                  <option value="fiado">👤 CREDIÁRIO (FIADO)</option>
                               </select>
                            </div>
                            
                            <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-black text-sm">R$</span>
                               <input 
                                  type="number" 
                                  step="0.01"
                                  className="w-full h-12 bg-white border border-blue-100 rounded-xl pl-10 pr-4 font-black text-blue-600 text-lg outline-none"
                                  value={p.amount}
                                  onChange={e => updatePaymentRow(idx, 'amount', parseFloat(e.target.value) || 0)}
                               />
                            </div>
                         </div>

                         <button 
                           className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                           onClick={() => removePaymentRow(idx)}
                         >
                            <Trash2 size={18} />
                         </button>
                      </div>
                   </div>
                ))}

                <button 
                  className="w-full h-14 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] uppercase hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 group"
                  onClick={addPayment}
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform" /> 
                  Pagar restante com outra forma
                </button>
             </div>`;

// Regex robusto que pega toda a div do Modal de Pagamentos
const regex = /<div className="space-y-3 max-h-\[300px\] overflow-y-auto px-1 custom-scrollbar">[\s\S]*?<\/div>/;
content = content.replace(regex, newUI);

fs.writeFileSync(path, content);
console.log('Update Successful');
