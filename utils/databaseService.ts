import { supabase } from './supabaseClient';
import { Product, Client, Employee, Sale, CashSession, CashTransaction, FinancialAccount, Supplier } from '../types';

export const db = {
    // PRODUCTS
    products: {
        async list() {
            const { data, error } = await supabase.from('produtos').select('*').order('nome');
            if (error) throw error;
            return data as Product[];
        },
        async upsert(product: Product) {
            const { error } = await supabase.from('produtos').upsert(product);
            if (error) throw error;
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

    // CLIENTS
    clients: {
        async list() {
            const { data, error } = await supabase.from('clientes').select('*').order('nome');
            if (error) throw error;
            return data as Client[];
        },
        async upsert(client: Client) {
            const { error } = await supabase.from('clientes').upsert(client);
            if (error) throw error;
        },
        async updateDebt(id: string, newDebt: number) {
            const { error } = await supabase.from('clientes').update({ saldo_devedor: newDebt }).eq('id', id);
            if (error) throw error;
        }
    },

    // EMPLOYEES
    employees: {
        async list() {
            const { data, error } = await supabase.from('funcionarios').select('*').order('nome');
            if (error) throw error;
            return data as Employee[];
        },
        async upsert(employee: Employee) {
            const { error } = await supabase.from('funcionarios').upsert(employee);
            if (error) throw error;
        }
    },

    // SALES
    sales: {
        async list() {
            const { data, error } = await supabase.from('vendas').select('*, items:venda_itens(*)').order('data_venda', { ascending: false });
            if (error) throw error;
            return data as Sale[];
        },
        async create(sale: Sale) {
            const { data, error: saleError } = await supabase.from('vendas').insert({
                id: sale.id,
                data_venda: sale.data_venda,
                valor_total: sale.valor_total,
                desconto_total: sale.desconto_total,
                tipo_pagamento: sale.tipo_pagamento,
                cliente_id: sale.cliente_id,
                vendedor_id: sale.vendedor_id,
                status: sale.status,
                fiscal_status: sale.fiscal_status,
                nfe_numero: sale.nfe_numero,
                chave_acesso: sale.chave_acesso,
                xml: sale.xml,
                tipo_operacao: sale.tipo_operacao
            }).select().single();

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

    // CASHIER
    cashier: {
        async getActiveSession() {
            const { data, error } = await supabase.from('caixa_sessoes').select('*').eq('status', 'aberto').single();
            if (error && error.code !== 'PGRST116') throw error;
            return data as CashSession;
        },
        async openSession(session: CashSession) {
            const { error } = await supabase.from('caixa_sessoes').insert(session);
            if (error) throw error;
        },
        async updateSession(id: string, data: Partial<CashSession>) {
            const { error } = await supabase.from('caixa_sessoes').update(data).eq('id', id);
            if (error) throw error;
        },
        async addTransaction(transaction: CashTransaction) {
            const { error } = await supabase.from('caixa_movimentacoes').insert(transaction);
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
    // FINANCE
    finance: {
        async list() {
            const { data, error } = await supabase.from('financeiro_contas').select('*').order('vencimento');
            if (error) throw error;
            return data as FinancialAccount[];
        },
        async upsert(account: FinancialAccount) {
            const { error } = await supabase.from('financeiro_contas').upsert(account);
            if (error) throw error;
        }
    },
    supabase
};
