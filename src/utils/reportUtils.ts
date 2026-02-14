export const formatDate = (dateString?: string | Date | null): string => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '-';
    }
};

export const formatCurrency = (amount?: number | string | null, currency: string = 'LKR'): string => {
    if (amount === undefined || amount === null || amount === '') return '-';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '-';
    return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatText = (text?: string | null): string => {
    return text || '-';
};

import QRCode from 'qrcode';

export const generateQRCode = async (text: string): Promise<string> => {
    try {
        return await QRCode.toDataURL(text);
    } catch (err) {
        console.error(err);
        return '';
    }
};
