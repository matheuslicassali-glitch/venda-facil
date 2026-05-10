import { useState, useEffect, useCallback } from 'react'
import { Key, Shield, Users, LayoutDashboard, Plus, Lock, Unlock, Trash2, RefreshCw, Copy, ShieldCheck } from 'lucide-react'
import { GerarSerial, ListarLicencas, CriarLicenca, BloquearLicenca, DesbloquearLicenca, ExcluirLicenca } from '../wailsjs/go/main/App'
import './index.css'

interface Licenca {
  id: string
  created_at: string
  nome_empresa: string
  cnpj: string
  email_contato: string
  responsavel: string
  chave_serial: string
  status: string
  motivo_bloqueio: string
  data_expiracao: string
  trial: boolean
  ultimo_acesso: string
}

type Tab = 'dashboard' | 'licencas' | 'nova'

function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [licencas, setLicencas] = useState<Licenca[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<{ type: 'block' | 'delete'; chave: string } | null>(null)
  const [motivoBloqueio, setMotivoBloqueio] = useState('')

  // Form para nova licença
  const [form, setForm] = useState({
    nome: '', cnpj: '', email: '', responsavel: '', dias: '365', serial: ''
  })

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const carregarLicencas = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await ListarLicencas()
      if (res.success) {
        setLicencas((res.data as Licenca[]) || [])
      } else {
        showToast(res.message, 'error')
      }
    } catch (e) {
      showToast('Erro ao conectar com o servidor', 'error')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    carregarLicencas()
  }, [carregarLicencas])

  const gerarSerial = async () => {
    const serial: string = await GerarSerial()
    setForm(f => ({ ...f, serial }))
  }

  const handleCriar = async () => {
    if (!form.nome || !form.cnpj || !form.serial) {
      showToast('Preencha Nome, CNPJ e Serial!', 'error')
      return
    }
    setLoading(true)
    const res: any = await CriarLicenca(form.nome, form.cnpj, form.email, form.responsavel, form.serial, parseInt(form.dias) || 0)
    if (res.success) {
      showToast('✅ Licença criada com sucesso!', 'success')
      setForm({ nome: '', cnpj: '', email: '', responsavel: '', dias: '365', serial: '' })
      setTab('licencas')
      carregarLicencas()
    } else {
      showToast(res.message, 'error')
    }
    setLoading(false)
  }

  const handleBloquear = async () => {
    if (!modalAction) return
    const res: any = await BloquearLicenca(modalAction.chave, motivoBloqueio)
    if (res.success) { showToast('🔒 Licença bloqueada!', 'success'); carregarLicencas() }
    else showToast(res.message, 'error')
    setShowModal(false)
    setMotivoBloqueio('')
  }

  const handleDesbloquear = async (chave: string) => {
    const res: any = await DesbloquearLicenca(chave)
    if (res.success) { showToast('✅ Licença desbloqueada!', 'success'); carregarLicencas() }
    else showToast(res.message, 'error')
  }

  const handleExcluir = async () => {
    if (!modalAction) return
    const res: any = await ExcluirLicenca(modalAction.chave)
    if (res.success) { showToast('Licença excluída!', 'success'); carregarLicencas() }
    else showToast(res.message, 'error')
    setShowModal(false)
  }

  const stats = {
    total: licencas.length,
    ativas: licencas.filter(l => l.status === 'ativo').length,
    bloqueadas: licencas.filter(l => l.status === 'bloqueado').length,
    expiradas: licencas.filter(l => l.status === 'expirado').length,
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <ShieldCheck size={22} color="white" />
          <div>
            <h1>Venda Fácil</h1>
            <span>Gerenc. de Licenças</span>
          </div>
        </div>

        <nav>
          <button className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className={`nav-item ${tab === 'licencas' ? 'active' : ''}`} onClick={() => { setTab('licencas'); carregarLicencas() }}>
            <Key size={18} /> Licenças
          </button>
          <button className={`nav-item ${tab === 'nova' ? 'active' : ''}`} onClick={() => { setTab('nova'); if (!form.serial) gerarSerial() }}>
            <Plus size={18} /> Nova Licença
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Dashboard */}
        {tab === 'dashboard' && (
          <>
            <div className="header">
              <div>
                <h2>Dashboard</h2>
                <p>Visão geral das licenças do sistema</p>
              </div>
              <button className="btn btn-ghost" onClick={carregarLicencas}><RefreshCw size={15} /> Atualizar</button>
            </div>
            <div className="content">
              <div className="stats-grid">
                <div className="stat-card accent">
                  <div className="stat-label">Total de Licenças</div>
                  <div className="stat-value">{stats.total}</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-label">Licenças Ativas</div>
                  <div className="stat-value">{stats.ativas}</div>
                </div>
                <div className="stat-card danger">
                  <div className="stat-label">Bloqueadas</div>
                  <div className="stat-value">{stats.bloqueadas}</div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-label">Expiradas</div>
                  <div className="stat-value">{stats.expiradas}</div>
                </div>
              </div>

              <div className="table-wrapper">
                <div className="table-header">
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>Últimas licenças cadastradas</h3>
                </div>
                <table>
                  <thead><tr>
                    <th>Empresa</th><th>CNPJ</th><th>Chave Serial</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {licencas.slice(0, 5).map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 500 }}>{l.nome_empresa}</td>
                        <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{l.cnpj}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{l.chave_serial}</td>
                        <td><span className={`badge ${l.status}`}>{l.status.toUpperCase()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {licencas.length === 0 && !loading && (
                  <div className="empty-state"><Shield size={40} /><p>Nenhuma licença cadastrada ainda.</p></div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Licenças */}
        {tab === 'licencas' && (
          <>
            <div className="header">
              <div>
                <h2>Gerenciar Licenças</h2>
                <p>Bloquear, desbloquear e excluir licenças de clientes</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={carregarLicencas}><RefreshCw size={15} /> Atualizar</button>
                <button className="btn btn-primary" onClick={() => { setTab('nova'); if (!form.serial) gerarSerial() }}><Plus size={15} /> Nova</button>
              </div>
            </div>
            <div className="content">
              {loading ? <div className="loading"><div className="spinner" /></div> : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr>
                      <th>Empresa</th><th>CNPJ</th><th>Responsável</th><th>Chave Serial</th><th>Expira</th><th>Status</th><th>Ações</th>
                    </tr></thead>
                    <tbody>
                      {licencas.map(l => (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 600 }}>{l.nome_empresa}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'monospace' }}>{l.cnpj}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{l.responsavel || '-'}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 12 }}>
                            {l.chave_serial}
                            <button onClick={() => { navigator.clipboard.writeText(l.chave_serial); showToast('Copiado!', 'success') }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginLeft: 6 }}>
                              <Copy size={12} />
                            </button>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                            {l.data_expiracao ? l.data_expiracao.substring(0, 10) : 'Sem validade'}
                          </td>
                          <td><span className={`badge ${l.status}`}>{l.status.toUpperCase()}</span></td>
                          <td>
                            <div className="actions">
                              {l.status !== 'bloqueado' ? (
                                <button className="btn btn-sm btn-danger" onClick={() => { setModalAction({ type: 'block', chave: l.chave_serial }); setShowModal(true) }}><Lock size={12} /></button>
                              ) : (
                                <button className="btn btn-sm btn-success" onClick={() => handleDesbloquear(l.chave_serial)}><Unlock size={12} /></button>
                              )}
                              <button className="btn btn-sm btn-ghost" onClick={() => { setModalAction({ type: 'delete', chave: l.chave_serial }); setShowModal(true) }}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {licencas.length === 0 && (
                    <div className="empty-state"><Users size={40} /><p>Nenhuma licença encontrada.</p></div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Nova Licença */}
        {tab === 'nova' && (
          <>
            <div className="header">
              <div>
                <h2>Cadastrar Nova Licença</h2>
                <p>Registre um novo cliente e gere a chave serial</p>
              </div>
            </div>
            <div className="content">
              <div style={{ maxWidth: 580, margin: '0 auto' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                  
                  {/* Gerador de Serial */}
                  <div style={{ marginBottom: 24 }}>
                    <label>CHAVE SERIAL GERADA</label>
                    <div className="serial-box">{form.serial || 'Clique em Gerar'}</div>
                    <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={gerarSerial}>
                      <RefreshCw size={14} /> Gerar Nova Chave
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>NOME DA EMPRESA *</label>
                      <input placeholder="Ex: Padaria Central LTDA" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>CNPJ *</label>
                      <input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>RESPONSÁVEL</label>
                      <input placeholder="Nome do responsável" value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>E-MAIL DE CONTATO</label>
                      <input type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>VALIDADE (DIAS) — Use 0 para sem expiração</label>
                    <select value={form.dias} onChange={e => setForm(f => ({ ...f, dias: e.target.value }))}>
                      <option value="30">30 dias (1 mês)</option>
                      <option value="90">90 dias (3 meses)</option>
                      <option value="180">180 dias (6 meses)</option>
                      <option value="365">365 dias (1 ano)</option>
                      <option value="730">730 dias (2 anos)</option>
                      <option value="0">Sem expiração</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTab('licencas')}>Cancelar</button>
                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleCriar} disabled={loading}>
                      <Shield size={15} /> {loading ? 'Salvando...' : 'Criar Licença'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal Block/Delete */}
      {showModal && modalAction && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{modalAction.type === 'block' ? '🔒 Bloquear Licença' : '🗑️ Excluir Licença'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
                Chave: <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{modalAction.chave}</strong>
              </p>
              {modalAction.type === 'block' ? (
                <div className="form-group">
                  <label>MOTIVO DO BLOQUEIO</label>
                  <input placeholder="Ex: Inadimplência, Contrato Encerrado..." value={motivoBloqueio} onChange={e => setMotivoBloqueio(e.target.value)} />
                </div>
              ) : (
                <p style={{ color: 'var(--danger)', fontSize: 14 }}>⚠️ Esta ação é irreversível! A licença será permanentemente excluída.</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={`btn ${modalAction.type === 'block' ? 'btn-danger' : 'btn-danger'}`}
                onClick={modalAction.type === 'block' ? handleBloquear : handleExcluir}>
                {modalAction.type === 'block' ? 'Confirmar Bloqueio' : 'Excluir Definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

export default App
