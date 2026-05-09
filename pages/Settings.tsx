
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building2, Store, FileText, Smartphone, ShieldCheck, Mail, Phone, MapPin, Globe, CreditCard, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { db } from '../utils/databaseService';
import { CompanySettings, Permission } from '../types';
import { formatCNPJ, formatCEP, formatPhone } from '../utils/validation';

interface SettingsProps {
    onNotify: (msg: string, type: 'success' | 'error') => void;
    currentUser: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

const Settings: React.FC<SettingsProps> = ({ onNotify, currentUser }) => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<CompanySettings>({
        cnpj: '',
        inscricao_estadual: '',
        razao_social: '',
        nome_fantasia: '',
        crt: '1',
        endereco: {
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            uf: '',
            cep: '',
            ibge_cidade: ''
        },
        contato: {
            email: '',
            telefone: ''
        },
        fiscal: {
            csc: '',
            csc_id: '',
            ambiente: 'homologacao',
            nfe_serie: 1,
            nfe_numero: 1,
            nfce_serie: 1,
            nfce_numero: 1
        }
    });

    const isSuperAdmin = currentUser?.cargo === 'Administrador';

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await db.settings.get();
            if (data) {
                setSettings({
                    ...settings,
                    ...data,
                    cnpj: formatCNPJ(data.cnpj || ''),
                    endereco: {
                        logradouro: data.logradouro || '',
                        numero: data.numero || '',
                        bairro: data.bairro || '',
                        cidade: data.cidade || '',
                        uf: data.uf || '',
                        cep: formatCEP(data.cep || ''),
                        ibge_cidade: data.ibge_cidade || ''
                    },
                    contato: {
                        email: data.email_contato || '',
                        telefone: formatPhone(data.telefone_contato || '')
                    },
                    fiscal: {
                        csc: data.fiscal_csc || '',
                        csc_id: data.fiscal_csc_id || '',
                        ambiente: data.fiscal_ambiente || 'homologacao',
                        nfe_serie: data.nfe_serie || 1,
                        nfe_numero: data.nfe_numero || 1,
                        nfce_serie: data.nfce_serie || 1,
                        nfce_numero: data.nfce_numero || 1
                    }
                });
            }
        } catch (err) {
            onNotify('❌ Erro ao carregar configurações matriz.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSuperAdmin) {
            onNotify('❌ Apenas o Administrador Master pode alterar dados da empresa.', 'error');
            return;
        }

        const rawCnpj = settings.cnpj.replace(/\D/g, '');
        if (rawCnpj.length !== 14) {
             onNotify('⚠️ CNPJ Inválido!', 'error');
             return;
        }

        setLoading(true);

        const dbData = {
            cnpj: rawCnpj,
            inscricao_estadual: settings.inscricao_estadual,
            razao_social: settings.razao_social,
            nome_fantasia: settings.nome_fantasia,
            crt: settings.crt,
            logradouro: settings.endereco.logradouro,
            numero: settings.endereco.numero,
            bairro: settings.endereco.bairro,
            cidade: settings.endereco.cidade,
            uf: settings.endereco.uf,
            cep: settings.endereco.cep.replace(/\D/g, ''),
            ibge_cidade: settings.endereco.ibge_cidade,
            email_contato: settings.contato.email,
            telefone_contato: settings.contato.telefone.replace(/\D/g, ''),
            fiscal_csc: settings.fiscal.csc,
            fiscal_csc_id: settings.fiscal.csc_id,
            fiscal_ambiente: settings.fiscal.ambiente,
            nfe_serie: Number(settings.fiscal.nfe_serie),
            nfe_numero: Number(settings.fiscal.nfe_numero),
            nfce_serie: Number(settings.fiscal.nfce_serie),
            nfce_numero: Number(settings.fiscal.nfce_numero),
            serial_chave: settings.serial_chave,
            senha_master: settings.senha_master,
            email_master: settings.email_master,
            status_licenca: settings.status_licenca,
            validade_uso: settings.validade_uso
        };

        try {
            await db.settings.save(dbData);
            onNotify('✅ Configurações da matriz atualizadas!', 'success');
            loadSettings();
        } catch (err) {
            onNotify('❌ Erro crítico ao salvar configurações.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl space-y-10 pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card text-card-foreground p-6 rounded-3xl border border-border shadow-sm mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                       <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg shadow-slate-200">
                          <SettingsIcon size={18} />
                       </div>
                       <h1 className="text-2xl font-black text-foreground tracking-tight">Configurações Base</h1>
                    </div>
                    <p className="text-muted-foreground font-bold text-sm italic">Configurações Gerais - <span className="text-primary">v2.0.3 Stable</span></p>
                </div>
                {isSuperAdmin && (
                    <Button onClick={handleSave} disabled={loading} className="h-12 px-10 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                        {loading ? 'Sincronizando...' : 'Salvar Alterações'}
                    </Button>
                )}
            </header>

            {!isSuperAdmin && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-center gap-4 text-amber-800">
                    <div className="p-3 bg-amber-100 rounded-2xl"><Lock size={24} /></div>
                    <p className="font-black text-xs uppercase tracking-widest leading-relaxed">
                        Acesso Restrito: Estas configurações impactam a emissão de notas fiscais e só podem ser alteradas por um <span className="text-amber-600 underline">Administrador Total</span>.
                    </p>
                </div>
            )}


            <form onSubmit={handleSave} className={`space-y-10 ${!isSuperAdmin ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
                {/* Identidade Jurídica */}
                <section className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
                    <div className="p-5 border-b border-border bg-muted text-muted-foreground/50 flex items-center gap-3">
                        <Building2 className="text-indigo-600" size={20} />
                        <h2 className="font-black text-gray-700 uppercase tracking-widest text-[10px]">Identidade Jurídica e Fiscal</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <Input label="Razão Social (Completo)" placeholder="Nome jurídico da empresa" required value={settings.razao_social} onChange={e => setSettings({ ...settings, razao_social: e.target.value })} />
                            <Input label="Nome de Fachada / Fantasia" placeholder="Marca da sua loja" required value={settings.nome_fantasia} onChange={e => setSettings({ ...settings, nome_fantasia: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <Input label="CNPJ" placeholder="00.000.000/0000-00" required value={settings.cnpj} onChange={e => setSettings({ ...settings, cnpj: formatCNPJ(e.target.value) })} />
                            <Input label="Inscrição Estadual" placeholder="Apenas números ou ISENTO" required value={settings.inscricao_estadual} onChange={e => setSettings({ ...settings, inscricao_estadual: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Regime Tributário (CRT)</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: '1', label: 'Simples Nacional' },
                                    { id: '2', label: 'Simples (Excesso)' },
                                    { id: '3', label: 'Regime Normal' }
                                ].map(crt => (
                                    <button
                                        key={crt.id}
                                        type="button"
                                        onClick={() => setSettings({ ...settings, crt: crt.id as any })}
                                        className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${settings.crt === crt.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-inner' : 'bg-card text-card-foreground border-border text-muted-foreground hover:border-border'}`}
                                    >
                                        {crt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Localização e Logística */}
                <section className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
                    <div className="p-5 border-b border-border bg-muted text-muted-foreground/50 flex items-center gap-3">
                        <MapPin className="text-orange-600" size={20} />
                        <h2 className="font-black text-gray-700 uppercase tracking-widest text-[10px]">Endereço Fiscal e Contatos</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-4 gap-6">
                            <div className="col-span-1">
                                <Input label="CEP" placeholder="00000-000" value={settings.endereco.cep} onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, cep: formatCEP(e.target.value) } })} />
                            </div>
                            <div className="col-span-2">
                                <Input label="Logradouro" placeholder="Av / Rua / Alameda" value={settings.endereco.logradouro} onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, logradouro: e.target.value } })} />
                            </div>
                            <div className="col-span-1">
                                <Input label="Número" placeholder="S/N" value={settings.endereco.numero} onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, numero: e.target.value } })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <Input label="Bairro" placeholder="Vila Nova" value={settings.endereco.bairro} onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, bairro: e.target.value } })} />
                            <Input label="Cidade" placeholder="Cidade" value={settings.endereco.cidade} onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, cidade: e.target.value } })} />
                            <Input label="Código IBGE (7 dígitos)" placeholder="3550308" value={settings.endereco.ibge_cidade} onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, ibge_cidade: e.target.value.replace(/\D/g, '').substring(0, 7) } })} />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">UF / Estado</label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-muted text-muted-foreground border border-border rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={settings.endereco.uf} 
                                    onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, uf: e.target.value } })}
                                >
                                    <option value="">Selecione</option>
                                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                            </div>
                            <Input label="E-mail Matriz" type="email" placeholder="financeiro@empresa.com" value={settings.contato.email} onChange={e => setSettings({ ...settings, contato: { ...settings.contato, email: e.target.value } })} />
                            <Input label="Telefone Comercial" placeholder="(00) 0000-0000" value={settings.contato.telefone} onChange={e => setSettings({ ...settings, contato: { ...settings.contato, telefone: formatPhone(e.target.value) } })} />
                        </div>
                    </div>
                </section>

                {/* Parâmetros Fiscais SEFAZ */}
                <section className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
                    <div className="p-5 border-b border-border bg-muted text-muted-foreground/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-emerald-600" size={20} />
                            <h2 className="font-black text-gray-700 uppercase tracking-widest text-[10px]">Configuração NFC-e / NF-e</h2>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
                                {(['homologacao', 'producao'] as const).map(env => (
                                    <button
                                        key={env}
                                        type="button"
                                        onClick={() => setSettings({ ...settings, fiscal: { ...settings.fiscal, ambiente: env } })}
                                        className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${settings.fiscal.ambiente === env ? (env === 'producao' ? 'bg-red-600 text-white shadow-lg' : 'bg-card text-card-foreground text-emerald-600 shadow-md') : 'text-muted-foreground hover:text-gray-600'}`}
                                    >
                                        {env}
                                    </button>
                                ))}
                        </div>
                    </div>
                    <div className="p-8">
                         <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl flex items-start gap-4 mb-8">
                                <div className="p-2 bg-amber-100 rounded-xl text-amber-700"><Globe size={20} /></div>
                                <div className="space-y-1">
                                    <p className="font-black text-[10px] text-amber-800 uppercase tracking-widest">Código de Segurança do Contribuinte (CSC)</p>
                                    <p className="text-xs text-amber-700 leading-tight">Estes dados são gerados no portal do contribuinte do seu estado e são essenciais para a validade do QR-Code da NFC-e.</p>
                                </div>
                         </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <Input label="Identificador CSC (Número)" placeholder="Ex: 000001" value={settings.fiscal.csc_id} onChange={e => setSettings({ ...settings, fiscal: { ...settings.fiscal, csc_id: e.target.value } })} />
                                <Input label="Token/Chave CSC" placeholder="Ex: A5S8-D7F4-..." value={settings.fiscal.csc} onChange={e => setSettings({ ...settings, fiscal: { ...settings.fiscal, csc: e.target.value } })} />
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="NFe Atual Nº" type="number" value={settings.fiscal.nfe_numero} onChange={e => setSettings({ ...settings, fiscal: { ...settings.fiscal, nfe_numero: Number(e.target.value) } })} />
                                    <Input label="NFe Série" type="number" value={settings.fiscal.nfe_serie} onChange={e => setSettings({ ...settings, fiscal: { ...settings.fiscal, nfe_serie: Number(e.target.value) } })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="NFCe Atual Nº" type="number" value={settings.fiscal.nfce_numero} onChange={e => setSettings({ ...settings, fiscal: { ...settings.fiscal, nfce_numero: Number(e.target.value) } })} />
                                    <Input label="NFCe Série" type="number" value={settings.fiscal.nfce_serie} onChange={e => setSettings({ ...settings, fiscal: { ...settings.fiscal, nfce_serie: Number(e.target.value) } })} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 bg-muted text-muted-foreground p-6 rounded-3xl border border-border flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-card text-card-foreground rounded-2xl shadow-sm flex items-center justify-center text-gray-300">
                                    <CreditCard size={32} />
                                </div>
                                <div>
                                    <p className="font-black text-[10px] text-gray-600 uppercase tracking-widest">Certificado Digital</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">A integração com certificado A1 é configurada via módulo servidor.</p>
                                </div>
                            </div>
                            <Button variant="ghost" type="button" className="border border-border text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Fazer Upload .PFX</Button>
                        </div>
                    </div>
                </section>
                {/* Controle de Segurança e Licenciamento */}
                <section className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
                    <div className="p-5 border-b border-border bg-muted text-muted-foreground/50 flex items-center gap-3">
                        <Lock className="text-red-600" size={20} />
                        <h2 className="font-black text-gray-700 uppercase tracking-widest text-[10px]">Segurança e Licenciamento Master</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <Input label="E-mail Master (Recuperação/Bloqueio)" type="email" placeholder="admin@sistema.com" value={settings.email_master} onChange={e => setSettings({ ...settings, email_master: e.target.value })} />
                                <Input label="Senha Master (Controle de Validade)" type="password" placeholder="••••••••" value={settings.senha_master} onChange={e => setSettings({ ...settings, senha_master: e.target.value })} />
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Serial / Chave do Sistema</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input 
                                                placeholder="XXXX-XXXX-XXXX-XXXX" 
                                                className="pr-16"
                                                value={settings.serial_chave} 
                                                onChange={e => setSettings({ ...settings, serial_chave: e.target.value })} 
                                            />
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            className="h-10 px-4 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-primary border-none"
                                            onClick={async () => {
                                                try {
                                                    const text = await navigator.clipboard.readText();
                                                    setSettings({ ...settings, serial_chave: text });
                                                    onNotify('📋 Serial colado!', 'success');
                                                } catch (err) {
                                                    onNotify('❌ Falha ao acessar área de transferência.', 'error');
                                                }
                                            }}
                                        >
                                            Colar
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Status da Licença</label>
                                        <select 
                                            className="w-full px-4 py-2.5 bg-muted text-muted-foreground border border-border rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-ring"
                                            value={settings.status_licenca}
                                            onChange={e => setSettings({ ...settings, status_licenca: e.target.value as any })}
                                        >
                                            <option value="ativo">ATIVO</option>
                                            <option value="bloqueado">BLOQUEADO</option>
                                        </select>
                                    </div>
                                    <Input label="Validade de Uso" type="date" value={settings.validade_uso?.split('T')[0] || ''} onChange={e => setSettings({ ...settings, validade_uso: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                             <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed">
                                ⚠️ ATENÇÃO: A Senha Master e o E-mail Master são as únicas chaves para desbloquear o sistema caso ele seja bloqueado por validade ou manualmente. Guarde-os com segurança.
                             </p>
                        </div>
                    </div>
                </section>
            </form>
            

            <style>{`
                .grayscale-50 { filter: grayscale(0.5); }
            `}</style>
        </div>
    );
};

export default Settings;
