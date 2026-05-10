export namespace main {
	
	export class SyncStats {
	    produtos_total: number;
	    produtos_sync: number;
	    clientes_total: number;
	    clientes_sync: number;
	    vendas_total: number;
	    vendas_sync: number;
	    fornecedores_total: number;
	    fornecedores_sync: number;
	    financeiro_total: number;
	    financeiro_sync: number;
	    funcionarios_total: number;
	    funcionarios_sync: number;
	    caixa_total: number;
	    caixa_sync: number;
	    ultima_vez: string;
	
	    static createFrom(source: any = {}) {
	        return new SyncStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.produtos_total = source["produtos_total"];
	        this.produtos_sync = source["produtos_sync"];
	        this.clientes_total = source["clientes_total"];
	        this.clientes_sync = source["clientes_sync"];
	        this.vendas_total = source["vendas_total"];
	        this.vendas_sync = source["vendas_sync"];
	        this.fornecedores_total = source["fornecedores_total"];
	        this.fornecedores_sync = source["fornecedores_sync"];
	        this.financeiro_total = source["financeiro_total"];
	        this.financeiro_sync = source["financeiro_sync"];
	        this.funcionarios_total = source["funcionarios_total"];
	        this.funcionarios_sync = source["funcionarios_sync"];
	        this.caixa_total = source["caixa_total"];
	        this.caixa_sync = source["caixa_sync"];
	        this.ultima_vez = source["ultima_vez"];
	    }
	}

}

