import { supabase } from './supabaseClient';
import { Product, Client, Employee, Sale, CashSession, CashTransaction, FinancialAccount, Supplier } from '../types';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const db = {
    // PRODUCTS - usando insert/update igual ao caixa/financeiro
    products: {
        async list() {
            const { data, error } = await supabase.from('produtos').select('*').order('nome');
            if (error) throw error;
            return data as Product[];
        },
        async save(product: Product, isEditing: boolean) {
            const payload: any = {
                nome: product.nome,
                sku: product.sku,
                codigo_barras: product.codigo_barras,
                preco_venda: product.preco_venda,
                preco_custo: product.preco_custo,
                estoque_atual: product.estoque_atual,
                estoque_minimo: product.estoque_minimo,
                unidade: product.unidade,
                categoria: product.categoria,
                foto: product.foto,
                ncm: product.ncm,
                cest: product.cest,
                origem: product.origem,
                cfop: product.cfop,
                cst_csosn: product.cst_csosn,
                pis_cst: product.pis_cst,
                pis_aliquota: product.pis_aliquota,
                cofins_cst: product.cofins_cst,
                cofins_aliquota: product.cofins_aliquota,
                icms_aliquota: product.icms_aliquota,
                validade: product.validade
            };

            if (isEditing && product.id && isUUID(product.id)) {
                // UPDATE - igual ao cashier.updateSession
                const { error } = await supabase.from('produtos').update(payload).eq('id', product.id);
                if (error) throw error;
            } else {
                // INSERT - igual ao cashier.openSession (sem enviar id)
                const { error } = await supabase.from('produtos').insert(payload);
                if (error) throw error;
            }
        },
        // Mantém compatibilidade com chamadas antigas
        async upsert(product: Product) {
            const hasValidId = product.id && isUUID(product.id);
            // Verifica se o registro já existe no banco
            if (hasValidId) {
                const { data } = await supabase.from('produtos').select('id').eq('id', product.id).single();
                await this.save(product, !!data);
            } else {
                await this.save(product, false);
            }
        },
        async delete(id: string) {
            const { error } = await supabase.from('produtos').delete().eq('id', id);
            if (error) throw error;
        },
        async updateStock(id: string, newStock: number) {
            const { error } = await supabase.from('produtos').update({ estoque_atual: newStock }).eq('id', id);
            if (error) throw error;
        }
    },

    // CLIENTS - usando insert/update igual ao caixa/financeiro
    clients: {
        async list() {
            const { data, error } = await supabase.from('clientes').select('*').order('nome');
            if (error) throw error;
            return data as Client[];
        },
        async save(client: Client, isEditing: boolean) {
            const payload: any = {
                nome: client.nome,
                razao_social: client.razao_social,
                documento: client.documento,
                inscricao_estadual: client.inscricao_estadual,
                email: client.email,
                telefone: client.telefone,
                limite_credito: client.limite_credito,
                saldo_devedor: client.saldo_devedor,
                endereco: client.endereco,
                logradouro: client.logradouro,
                numero: client.numero,
                bairro: client.bairro,
                cidade: client.cidade,
                uf: client.uf,
                cep: client.cep,
                ibge_cidade: client.ibge_cidade
            };

            if (isEditing && client.id && isUUID(client.id)) {
                const { error } = await supabase.from('clientes').update(payload).eq('id', client.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('clientes').insert(payload);
                if (error) throw error;
            }
        },
        async upsert(client: Client) {
            const hasValidId = client.id && isUUID(client.id);
            if (hasValidId) {
                const { data } = await supabase.from('clientes').select('id').eq('id', client.id).single();
                await this.save(client, !!data);
            } else {
                await this.save(client, false);
            }
        },
        async updateDebt(id: string, newDebt: number) {
            const { error } = await supabase.from('clientes').update({ saldo_devedor: newDebt }).eq('id', id);
            if (error) throw error;
        }
    },

    // EMPLOYEES - usando insert/update igual ao caixa/financeiro
    employees: {
        async list() {
            const { data, error } = await supabase.from('funcionarios').select('*').order('nome');
            if (error) throw error;
            return data as Employee[];
        },
        async save(employee: Employee, isEditing: boolean) {
            const payload: any = {
                nome: employee.nome,
                cargo: employee.cargo,
                cpf: employee.cpf,
                email: employee.email,
                status: employee.status,
                comissao: employee.comissao,
                pin: employee.pin,
                permissoes: employee.permissoes
            };

            if (isEditing && employee.id && isUUID(employee.id)) {
                const { error } = await supabase.from('funcionarios').update(payload).eq('id', employee.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('funcionarios').insert(payload);
                if (error) throw error;
            }
        },
        async upsert(employee: Employee) {
            const hasValidId = employee.id && isUUID(employee.id);
            if (hasValidId) {
                const { data } = await supabase.from('funcionarios').select('id').eq('id', employee.id).single();
                await this.save(employee, !!data);
            } else {
                await this.save(employee, false);
            }
        }
    },

    // SALES - já funciona corretamente com insert
    sales: {
        async list() {
            const { data, error } = await supabase.from('vendas').select('*, venda_itens(*)').order('data_venda', { ascending: false });
            if (error) throw error;
            return (data as any[]).map(s => ({ ...s, itens: s.venda_itens })) as Sale[];
        },
        async create(sale: Sale) {
            const payload: any = {
                data_venda: sale.data_venda,
                valor_total: sale.valor_total,
                desconto_total: sale.desconto_total,
                tipo_pagamento: sale.tipo_pagamento,
                cliente_id: sale.cliente_id && sale.cliente_id !== '' ? sale.cliente_id : null,
                vendedor_id: sale.vendedor_id && sale.vendedor_id !== '1' && sale.vendedor_id !== 'manual' ? sale.vendedor_id : null,
                status: sale.status,
                fiscal_status: sale.fiscal_status,
                nfe_numero: sale.nfe_numero,
                chave_acesso: sale.chave_acesso,
                xml: sale.xml,
                tipo_operacao: sale.tipo_operacao
            };

            const { data, error: saleError } = await supabase.from('vendas').insert(payload).select().single();

            if (saleError) throw saleError;

            const items = sale.itens.map(item => ({
                venda_id: data.id,
                produto_id: item.produto_id,
                nome: item.nome,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: item.subtotal,
                desconto: item.desconto
            }));

            const { error: itemsError } = await supabase.from('venda_itens').insert(items);
            if (itemsError) throw itemsError;
        }
    },

    // CASHIER - já funciona corretamente
    cashier: {
        async getActiveSession() {
            const { data, error } = await supabase.from('caixa_sessoes').select('*').eq('status', 'aberto').single();
            if (error && error.code !== 'PGRST116') throw error;
            return data as CashSession;
        },
        async openSession(session: CashSession) {
            const payload: any = {
                aberto_em: session.aberto_em,
                valor_abertura: session.valor_abertura,
                valor_fechamento_esperado: session.valor_fechamento_esperado,
                status: session.status,
                vendedor_id: session.vendedor_id && session.vendedor_id !== '1' ? session.vendedor_id : null
            };
            const { error } = await supabase.from('caixa_sessoes').insert(payload);
            if (error) throw error;
        },
        async updateSession(id: string, data: Partial<CashSession>) {
            const { error } = await supabase.from('caixa_sessoes').update(data).eq('id', id);
            if (error) throw error;
        },
        async addTransaction(transaction: CashTransaction) {
            const payload = {
                caixa_id: transaction.caixa_id,
                tipo: transaction.tipo,
                valor: transaction.valor,
                motivo: transaction.motivo,
                data: transaction.data
            };
            const { error } = await supabase.from('caixa_movimentacoes').insert(payload);
            if (error) throw error;
        },
        async listHistory() {
            const { data, error } = await supabase.from('caixa_sessoes').select('*').order('aberto_em', { ascending: false }).limit(20);
            if (error) throw error;
            return data as CashSession[];
        },
        async getTransactions(sessionId: string) {
            const { data, error } = await supabase.from('caixa_movimentacoes').select('*').eq('caixa_id', sessionId).order('data', { ascending: false });
            if (error) throw error;
            return data as CashTransaction[];
        }
    },
    // FINANCE - já funciona corretamente
    finance: {
        async list() {
            const { data, error } = await supabase.from('financeiro_contas').select('*').order('vencimento');
            if (error) throw error;
            return data as FinancialAccount[];
        },
        async save(account: FinancialAccount, isEditing: boolean) {
            const payload: any = {
                tipo: account.tipo,
                descricao: account.descricao,
                valor: account.valor,
                vencimento: account.vencimento,
                status: account.status,
                categoria: account.categoria
            };

            if (isEditing && account.id && isUUID(account.id)) {
                const { error } = await supabase.from('financeiro_contas').update(payload).eq('id', account.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('financeiro_contas').insert(payload);
                if (error) throw error;
            }
        },
        async upsert(account: FinancialAccount) {
            const hasValidId = account.id && isUUID(account.id);
            if (hasValidId) {
                const { data } = await supabase.from('financeiro_contas').select('id').eq('id', account.id).single();
                await this.save(account, !!data);
            } else {
                await this.save(account, false);
            }
        }
    },
    settings: {
        async get() {
            const { data, error } = await supabase.from('empresa_configuracoes').select('*').single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        async update(settings: any) {
            const { error } = await supabase.from('empresa_configuracoes').upsert({ id: 1, ...settings });
            if (error) throw error;
        }
    },
    // SUPPLIERS - usando insert/update igual ao caixa/financeiro
    suppliers: {
        async list() {
            const { data, error } = await supabase.from('fornecedores').select('*').order('nome');
            if (error) throw error;
            return data as Supplier[];
        },
        async save(supplier: Supplier, isEditing: boolean) {
            const payload: any = {
                nome: supplier.nome,
                cnpj: supplier.cnpj,
                email: supplier.email,
                telefone: supplier.telefone,
                endereco: supplier.endereco
            };

            if (isEditing && supplier.id && isUUID(supplier.id)) {
                const { error } = await supabase.from('fornecedores').update(payload).eq('id', supplier.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('fornecedores').insert(payload);
                if (error) throw error;
            }
        },
        async upsert(supplier: Supplier) {
            const hasValidId = supplier.id && isUUID(supplier.id);
            if (hasValidId) {
                const { data } = await supabase.from('fornecedores').select('id').eq('id', supplier.id).single();
                await this.save(supplier, !!data);
            } else {
                await this.save(supplier, false);
            }
        },
        async delete(id: string) {
            const { error } = await supabase.from('fornecedores').delete().eq('id', id);
            if (error) throw error;
        }
    },
    supabase
};
