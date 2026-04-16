import { User, UserInfo } from '../types';
import { getDisplayName, getFullAddress } from './validation';

interface GuestUser {
    id: string;
    userInfo: UserInfo;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: Date;
}

/**
 * Export registered users to CSV
 */
export const exportUsersToCSV = (users: User[]): void => {
    const headers = [
        'ID',
        'Jméno',
        'Příjmení',
        'Přezdívka',
        'Email',
        'Telefon',
        'Ulice',
        'Číslo popisné',
        'PSČ',
        'Datum narození',
        'Číslo OP',
        'Číslo oddílu',
        'Sleva',
        'Typ slevy'
    ];

    const rows = users.map(user => [
        user.id,
        user.firstName || '',
        user.lastName || '',
        user.nickname || '',
        user.email || '',
        user.phone || '',
        user.street || '',
        user.houseNumber || '',
        user.postalCode || '',
        user.birthDate || '',
        user.idCardNumber || '',
        user.sectionNumber || '',
        user.discount || '',
        user.discountType || ''
    ]);

    downloadCSV('registrovani_uzivatele.csv', headers, rows);
};

/**
 * Export guest users to CSV
 */
export const exportGuestsToCSV = (guests: GuestUser[]): void => {
    const headers = [
        'Email',
        'Jméno',
        'Příjmení',
        'Přezdívka',
        'Telefon',
        'Ulice',
        'Číslo popisné',
        'PSČ',
        'Datum narození',
        'Číslo OP',
        'Číslo oddílu',
        'Počet objednávek',
        'Celková částka',
        'Poslední objednávka'
    ];

    const rows = guests.map(guest => [
        guest.userInfo.email || '',
        guest.userInfo.firstName || '',
        guest.userInfo.lastName || '',
        guest.userInfo.nickname || '',
        guest.userInfo.phone || '',
        guest.userInfo.street || '',
        guest.userInfo.houseNumber || '',
        guest.userInfo.postalCode || '',
        guest.userInfo.birthDate || '',
        guest.userInfo.idCardNumber || '',
        guest.userInfo.sectionNumber || '',
        guest.orderCount.toString(),
        guest.totalSpent.toFixed(2) + ' Kč',
        formatDate(guest.lastOrderDate)
    ]);

    downloadCSV('hostuji_uzivatele.csv', headers, rows);
};

/**
 * Helper function to download CSV file
 */
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
    // Escape values and wrap in quotes if needed
    const escapeCSV = (value: string | number): string => {
        const str = String(value);
        // If contains semicolon, newline, or quote, wrap in quotes and escape quotes
        if (str.includes(';') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    // Build CSV content (using semicolon for Czech Excel)
    const headerRow = headers.map(escapeCSV).join(';');
    const dataRows = rows.map(row => row.map(escapeCSV).join(';')).join('\n');
    const csvContent = `${headerRow}\n${dataRows}`;

    // Add BOM for proper Czech character encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

/**
 * Format date for CSV
 */
function formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}
