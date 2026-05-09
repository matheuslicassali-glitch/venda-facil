import { Product, Client, Employee, Sale, CashSession, CashTransaction, FinancialAccount, Supplier } from '../types';
import { supabase } from './supabaseClient';

const API_URL = '/api';


export const isUUID = (id: any) => {
    if (typeof id !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

async function handleResponse(res: Response) {
    if (!res.ok) {
        const text = await res.text();
        let mensagemErro = 'Falha na requisição';
        try {
            const erro = JSON.parse(text);
            mensagemErro = erro.erro || mensagemErro;
        } catch (e) {
            mensagemErro = text || mensagemErro;
        }
        throw new Error(mensagemErro);
    }
    if (res.status === 204) return null;
    return res.json();
}

function prepareData(data: any) {
    const clone = { ...data };
    if (clone.id === '') delete clone.id;
    if (clone.vendedor_id === '') delete clone.vendedor_id;
    if (clone.cliente_id === '') delete clone.cliente_id;
    return clone;
}

export interface DatabaseService {
    supabase: any;
    products: {
        list(): Promise<Product[]>;
        save(product: Product): Promise<Product>;
        delete(id: string): Promise<void>;
    };
    clients: {
        list(): Promise<Client[]>;
        save(client: Client): Promise<Client>;
        delete(id: string): Promise<void>;
    };
    employees: {
        list(): Promise<Employee[]>;
        save(employee: Employee): Promise<Employee>;
        delete(id: string): Promise<void>;
    };
    sales: {
        list(): Promise<Sale[]>;
        create(sale: Sale): Promise<Sale>;
        cancel(id: string, justificativa?: string): Promise<void>;
    };
    fiscal: {
        listInutilizacoes(): Promise<any[]>;
        inutilizar(data: any): Promise<any>;
    };
    cashier: {
        getActiveSession(): Promise<CashSession | null>;
        openSession(session: CashSession): Promise<CashSession>;
        addTransaction(transaction: CashTransaction): Promise<void>;
        listHistory(): Promise<CashSession[]>;
        getTransactions(caixaId: string): Promise<CashTransaction[]>;
        updateSession(id: string, updates: any): Promise<void>;
    };
    finance: {
        list(): Promise<FinancialAccount[]>;
        save(account: FinancialAccount): Promise<FinancialAccount>;
    };
    suppliers: {
        list(): Promise<Supplier[]>;
        save(supplier: Supplier): Promise<Supplier>;
        delete(id: string): Promise<void>;
    };
    settings: {
        get(): Promise<any>;
        save(settings: any): Promise<void>;
    };
}

export const db: DatabaseService = {
    supabase,
    // PRODUTOS
    products: {
        async list() {
            const res = await fetch(`${API_URL}/produtos`);
            return handleResponse(res);
        },
        async save(product: Product) {
            const res = await fetch(`${API_URL}/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prepareData(product))
            });
            return handleResponse(res);
        },
        async delete(id: string) {
            const res = await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
            return handleResponse(res);
        }
    },

    // CLIENTES
    clients: {
        async list() {
            const res = await fetch(`${API_URL}/clientes`);
            return handleResponse(res);
        },
        async save(client: Client) {
            const res = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prepareData(client))
            });
            return handleResponse(res);
        },
        async delete(id: string) {
            const res = await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
            return handleResponse(res);
        }
    },

    // FUNCIONÁRIOS
    employees: {
        async list() {
            const res = await fetch(`${API_URL}/funcionarios`);
            return handleResponse(res);
        },
        async save(employee: Employee) {
            const res = await fetch(`${API_URL}/funcionarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prepareData(employee))
            });
            return handleResponse(res);
        },
        async delete(id: string) {
            const res = await fetch(`${API_URL}/funcionarios/${id}`, { method: 'DELETE' });
            return handleResponse(res);
        }
    },

    // VENDAS
    sales: {
        async list() {
            const res = await fetch(`${API_URL}/vendas`);
            return handleResponse(res);
        },
        async create(sale: Sale) {
            const res = await fetch(`${API_URL}/vendas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prepareData(sale))
            });
            return handleResponse(res);
        },
        async cancel(id: string, justificativa?: string) {
            const res = await fetch(`${API_URL}/vendas/${id}/cancelar`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ justificativa })
            });
            return handleResponse(res);
        }
    },

    // FISCAL
    fiscal: {
        async listInutilizacoes() {
            const res = await fetch(`${API_URL}/fiscal/inutilizacoes`);
            return handleResponse(res);
        },
        async inutilizar(data: any) {
            const res = await fetch(`${API_URL}/fiscal/inutilizar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        }
    },

    // CAIXA
    cashier: {
        async getActiveSession() {
            const res = await fetch(`${API_URL}/caixa/ativo`);
            return handleResponse(res);
        },
        async openSession(session: CashSession) {
            const res = await fetch(`${API_URL}/caixa/sessao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prepareData(session))
            });
            return handleResponse(res);
        },
        async addTransaction(transaction: CashTransaction) {
            const res = await fetch(`${API_URL}/caixa/movimentacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prepareData(transaction))
            });
            return handleResponse(res);
        },
        async listHistory() {
            const res = await fetch(`${API_URL}/caixa/historico`);
            return handleResponse(res);
        },
        async getTransactions(caixaId: string) {
            const res = await fetch(`${API_URL}/caixa/movimentacoes/${caixaId}`);
            return handleResponse(res);
        },
        async updateSession(id: string, updates: any) {
            const res = await fetch(`${API_URL}/caixa/sessao/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            return handleResponse(res);
        }
    },

    // FINANCEIRO
    finance: {
        async list() {
            const res = await fetch(`${API_URL}/financeiro`);
            return handleResponse(res);
        },
        async save(account: FinancialAccount) {
            const res = await fetch(`${API_URL}/financeiro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prepareData(account))
            });
            return handleResponse(res);
        }
    },
    // FORNECEDORES
    suppliers: {
        async list() {
            const res = await fetch(`${API_URL}/fornecedores`);
            return handleResponse(res);
        },
        async save(supplier: Supplier) {
            const res = await fetch(`${API_URL}/fornecedores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prepareData(supplier))
            });
            return handleResponse(res);
        },
        async delete(id: string) {
            const res = await fetch(`${API_URL}/fornecedores/${id}`, { method: 'DELETE' });
            return handleResponse(res);
        }
    },

    // CONFIGURAÇÕES
    settings: {
        async get() {
            const res = await fetch(`${API_URL}/configuracoes`);
            return handleResponse(res);
        },
        async save(settings: any) {
            const res = await fetch(`${API_URL}/configuracoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            return handleResponse(res);
        }
    }
};


// Extensões para métodos de PATCH específicos usados no PDV
(db.products as any).updateStock = async (id: string, estoque: number) => {
    const res = await fetch(`${API_URL}/produtos/${id}/estoque`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estoque })
    });
    return handleResponse(res);
};

(db.clients as any).updateDebt = async (id: string, debito: number) => {
    const res = await fetch(`${API_URL}/clientes/${id}/debito`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debito })
    });
    return handleResponse(res);
};


