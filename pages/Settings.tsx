
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building2, Store, FileText, Smartphone, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { db } from '../utils/databaseService';
import { CompanySettings } from '../types';

const Settings: React.FC<{ onNotify: (msg: string, type: 'success' | 'error') => void }> = ({ onNotify }) => {
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
            ambiente: 'homologacao'
        }
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await db.settings.get();
            if (data) {
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    // Map database fields to the nested structure if necessary, 
                    // or ensure types match the database schema.
                    // The schema has flat fields like logradouro, numero, etc.
                    endereco: {
                        logradouro: data.logradouro || '',
                        numero: data.numero || '',
                        bairro: data.bairro || '',
                        cidade: data.cidade || '',
                        uf: data.uf || '',
                        cep: data.cep || '',
                        ibge_cidade: data.ibge_cidade || ''
                    },
                    contato: {
                        email: data.email_contato || '',
                        telefone: data.telefone_contato || ''
                    },
                    fiscal: {
                        csc: data.fiscal_csc || '',
                        csc_id: data.fiscal_csc_id || '',
                        ambiente: data.fiscal_ambiente || 'homologacao',
                        certificado_vencimento: data.certificado_vencimento
                    }
                }));
            }
        } catch (err) {
            onNotify('❌ Erro ao carregar configurações.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const dbData = {
            cnpj: settings.cnpj,
            inscricao_estadual: settings.inscricao_estadual,
            razao_social: settings.razao_social,
            nome_fantasia: settings.nome_fantasia,
            crt: settings.crt,
            logradouro: settings.endereco.logradouro,
            numero: settings.endereco.numero,
            bairro: settings.endereco.bairro,
            cidade: settings.endereco.cidade,
            uf: settings.endereco.uf,
            cep: settings.endereco.cep,
            ibge_cidade: settings.endereco.ibge_cidade,
            email_contato: settings.contato.email,
            telefone_contato: settings.contato.telefone,
            fiscal_csc: settings.fiscal.csc,
            fiscal_csc_id: settings.fiscal.csc_id,
            fiscal_ambiente: settings.fiscal.ambiente,
            certificado_vencimento: settings.fiscal.certificado_vencimento
        };

        try {
            await db.settings.update(dbData);
            onNotify('✅ Configurações salvas com sucesso!', 'success');
            loadSettings();
        } catch (err) {
            onNotify('❌ Erro ao salvar configurações.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Configurações do Sistema</h1>
                    <p className="text-gray-600">Dados da empresa e parâmetros fiscais (SEFAZ)</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </header>

            <form onSubmit={handleSave} className="space-y-8 pb-20">
                {/* Dados da Empresa */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Building2 className="text-blue-600" size={20} />
                        <h2 className="font-black text-gray-700 uppercase tracking-widest text-sm">Dados do Emitente</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Razão Social"
                                placeholder="Nome empresarial completo"
                                required
                                value={settings.razao_social}
                                onChange={e => setSettings({ ...settings, razao_social: e.target.value })}
                            />
                            <Input
                                label="Nome Fantasia"
                                placeholder="Nome da loja"
                                required
                                value={settings.nome_fantasia}
                                onChange={e => setSettings({ ...settings, nome_fantasia: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="CNPJ"
                                placeholder="00.000.000/0000-00"
                                required
                                value={settings.cnpj}
                                onChange={e => setSettings({ ...settings, cnpj: e.target.value })}
                            />
                            <Input
                                label="Inscrição Estadual"
                                placeholder="Número ou ISENTO"
                                required
                                value={settings.inscricao_estadual}
                                onChange={e => setSettings({ ...settings, inscricao_estadual: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Regime Tributário (CRT)</label>
                            <select
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                                value={settings.crt}
                                onChange={e => setSettings({ ...settings, crt: e.target.value as any })}
                            >
                                <option value="1">1 - Simples Nacional</option>
                                <option value="2">2 - Simples Nacional (Excesso de Sublimite)</option>
                                <option value="3">3 - Regime Normal (Lucro Presumido/Real)</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Endereço */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <MapPin className="text-orange-600" size={20} />
                        <h2 className="font-black text-gray-700 uppercase tracking-widest text-sm">Endereço Fiscal</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3">
                                <Input
                                    label="Logradouro"
                                    placeholder="Rua, Av, etc"
                                    value={settings.endereco.logradouro}
                                    onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, logradouro: e.target.value } })}
                                />
                            </div>
                            <Input
                                label="Nº"
                                placeholder="123"
                                value={settings.endereco.numero}
                                onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, numero: e.target.value } })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Bairro"
                                placeholder="Centro"
                                value={settings.endereco.bairro}
                                onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, bairro: e.target.value } })}
                            />
                            <Input
                                label="CEP"
                                placeholder="00000-000"
                                value={settings.endereco.cep}
                                onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, cep: e.target.value } })}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Input
                                    label="Cidade"
                                    placeholder="Nome da Cidade"
                                    value={settings.endereco.cidade}
                                    onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, cidade: e.target.value } })}
                                />
                            </div>
                            <Input
                                label="UF"
                                placeholder="SP"
                                value={settings.endereco.uf}
                                onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, uf: e.target.value } })}
                            />
                        </div>
                        <Input
                            label="Código IBGE Município"
                            placeholder="Ex: 3550308"
                            value={settings.endereco.ibge_cidade}
                            onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, ibge_cidade: e.target.value } })}
                        />
                    </div>
                </section>

                {/* Parâmetros Fiscais / CSC */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <ShieldCheck className="text-green-600" size={20} />
                        <h2 className="font-black text-gray-700 uppercase tracking-widest text-sm">Parâmetros NFC-e / NF-e</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-4">
                            <p className="text-sm text-blue-700 leading-relaxed">
                                <strong>Nota:</strong> O CSC (Código de Segurança do Contribuinte) e o CSC ID são obrigatórios para a geração do QR Code em notas de consumidor (NFC-e).
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="ID do CSC"
                                placeholder="000001"
                                value={settings.fiscal.csc_id}
                                onChange={e => setSettings({ ...settings, fiscal: { ...settings.fiscal, csc_id: e.target.value } })}
                            />
                            <Input
                                label="Token CSC"
                                placeholder="Código fornecido pela SEFAZ"
                                value={settings.fiscal.csc}
                                onChange={e => setSettings({ ...settings, fiscal: { ...settings.fiscal, csc: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ambiente de Emissão</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="ambiente"
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        checked={settings.fiscal.ambiente === 'homologacao'}
                                        onChange={() => setSettings({ ...settings, fiscal: { ...settings.fiscal, ambiente: 'homologacao' } })}
                                    />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Homologação (Testes)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="ambiente"
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        checked={settings.fiscal.ambiente === 'producao'}
                                        onChange={() => setSettings({ ...settings, fiscal: { ...settings.fiscal, ambiente: 'producao' } })}
                                    />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Produção (Valor Fiscal)</span>
                                </label>
                            </div>
                        </div>

                        {/* Certificado Digital */}
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4">Certificado Digital (A1)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Arquivo .pfx / .p12</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pfx,.p12"
                                            className="hidden"
                                            id="cert-upload"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setSettings({
                                                        ...settings,
                                                        fiscal: {
                                                            ...settings.fiscal,
                                                            certificado_nome: file.name,
                                                            certificado_pfx: 'BASE64_MOCK_DATA'
                                                        }
                                                    });
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="cert-upload"
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <FileText size={18} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-600">
                                                {settings.fiscal.certificado_nome || 'Selecionar certificado A1'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <Input
                                    label="Senha do Certificado"
                                    type="password"
                                    placeholder="Senha de exportação"
                                    value={settings.fiscal.certificado_senha || ''}
                                    onChange={e => setSettings({ ...settings, fiscal: { ...settings.fiscal, certificado_senha: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-3 mt-8">
                    <Button variant="ghost" type="button">Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
