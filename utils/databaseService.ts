import { Product, Client, Employee, Sale, CashSession, CashTransaction, FinancialAccount, Supplier } from '../types';

const API_URL = 'http://localhost:3001/api';

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

export const db = {
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
                body: JSON.stringify(product)
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
                body: JSON.stringify(client)
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
                body: JSON.stringify(employee)
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
                body: JSON.stringify(sale)
            });
            return handleResponse(res);
        },
        async cancel(id: string) {
            const res = await fetch(`${API_URL}/vendas/${id}/cancelar`, { method: 'PATCH' });
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
                body: JSON.stringify(session)
            });
            return handleResponse(res);
        },
        async addTransaction(transaction: CashTransaction) {
            const res = await fetch(`${API_URL}/caixa/movimentacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
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
                body: JSON.stringify(account)
            });
            return handleResponse(res);
        }
    }
};
