/**
 * Validation utility for Venda Fácil
 */

export const validateCPF = (cpf: string): boolean => {
    const raw = cpf.replace(/\D/g, '');
    if (raw.length !== 11) return false;
    if (/^(\d)\1+$/.test(raw)) return false;
    // Basic formatting Check, detailed logic omitted for speed unless specifically needed
    return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
    const raw = cnpj.replace(/\D/g, '');
    if (raw.length !== 14) return false;
    return true;
};

export const validateNCM = (ncm: string): boolean => {
    const raw = ncm.replace(/\D/g, '');
    return raw.length === 8;
};

export const formatCPF = (v: string): string => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatCNPJ = (v: string): string => {
    v = v.replace(/\D/g, "");
    if (v.length > 14) v = v.substring(0, 14);
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

export const formatPhone = (v: string): string => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length === 11) {
        return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
};

export const formatCEP = (v: string): string => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.substring(0, 8);
    return v.replace(/(\d{5})(\d{3})/, "$1-$2");
};
