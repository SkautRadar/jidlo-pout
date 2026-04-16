/**
 * Validation utilities for user data
 * Provides consistent validation across registration, checkout, and profile editing
 */

export interface ValidationResult {
    valid: boolean;
    message: string;
    color?: string;
}

/**
 * Validate first name or last name
 */
export const validateName = (name: string, fieldName: string = 'Jméno'): ValidationResult => {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return { valid: false, message: `${fieldName} je povinné`, color: 'text-red-600' };
    }

    if (trimmed.length < 2) {
        return { valid: false, message: `${fieldName} musí mít alespoň 2 znaky`, color: 'text-red-600' };
    }

    if (trimmed.length > 50) {
        return { valid: false, message: `${fieldName} může mít maximálně 50 znaků`, color: 'text-red-600' };
    }

    // Only letters, spaces, hyphens, apostrophes
    if (!/^[\p{L}\s'-]+$/u.test(trimmed)) {
        return { valid: false, message: `${fieldName} může obsahovat pouze písmena`, color: 'text-orange-600' };
    }

    return { valid: true, message: '✓ OK', color: 'text-emerald-600' };
};

/**
 * Validate nickname (optional)
 */
export const validateNickname = (nickname: string): ValidationResult => {
    if (!nickname || nickname.trim().length === 0) {
        return { valid: true, message: 'Volitelné', color: 'text-slate-400' };
    }

    if (nickname.trim().length > 30) {
        return { valid: false, message: 'Maximálně 30 znaků', color: 'text-red-600' };
    }

    return { valid: true, message: '✓ OK', color: 'text-emerald-600' };
};

/**
 * Validate street name
 */
export const validateStreet = (street: string): ValidationResult => {
    const trimmed = street.trim();

    if (trimmed.length === 0) {
        return { valid: false, message: 'Ulice je povinná', color: 'text-red-600' };
    }

    if (trimmed.length < 3) {
        return { valid: false, message: 'Minimálně 3 znaky', color: 'text-red-600' };
    }

    if (trimmed.length > 100) {
        return { valid: false, message: 'Maximálně 100 znaků', color: 'text-red-600' };
    }

    return { valid: true, message: '✓ OK', color: 'text-emerald-600' };
};

/**
 * Validate house number
 * Format: number or number+letter (e.g., 123 or 123a)
 */
export const validateHouseNumber = (houseNumber: string): ValidationResult => {
    const trimmed = houseNumber.trim();

    if (trimmed.length === 0) {
        return { valid: false, message: 'Číslo popisné je povinné', color: 'text-red-600' };
    }

    // Format: 123 or 123a
    if (!/^[0-9]+[a-zA-Z]?$/.test(trimmed)) {
        return { valid: false, message: 'Formát: číslo nebo číslo+písmeno (např. 123a)', color: 'text-orange-600' };
    }

    return { valid: true, message: '✓ OK', color: 'text-emerald-600' };
};

/**
 * Validate and format postal code
 * Accepts: 12345 or 123 45
 * Returns normalized: 12345
 */
export const validatePostalCode = (postalCode: string): ValidationResult & { normalized?: string } => {
    // Remove spaces
    const normalized = postalCode.replace(/\s+/g, '');

    if (normalized.length === 0) {
        return { valid: false, message: 'PSČ je povinné', color: 'text-red-600' };
    }

    // Must be exactly 5 digits
    if (!/^[0-9]{5}$/.test(normalized)) {
        return { valid: false, message: 'PSČ musí být 5 číslic (např. 12345)', color: 'text-red-600' };
    }

    return { valid: true, message: '✓ OK', color: 'text-emerald-600', normalized };
};

/**
 * Format postal code for display
 * 12345 -> "123 45"
 */
export const formatPostalCode = (postalCode: string): string => {
    const normalized = postalCode.replace(/\s+/g, '');
    if (normalized.length === 5) {
        return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
    }
    return postalCode;
};

/**
 * Validate birth date
 */
export const validateBirthDate = (birthDate: string): ValidationResult => {
    if (!birthDate) {
        return { valid: false, message: 'Datum narození je povinné', color: 'text-red-600' };
    }

    const date = new Date(birthDate);
    const now = new Date();

    if (isNaN(date.getTime())) {
        return { valid: false, message: 'Neplatné datum', color: 'text-red-600' };
    }

    // Must be in the past
    if (date > now) {
        return { valid: false, message: 'Datum nemůže být v budoucnosti', color: 'text-red-600' };
    }

    // Age check (must be between 0 and 120 years old)
    const age = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (age < 0 || age > 120) {
        return { valid: false, message: 'Neplatný věk', color: 'text-red-600' };
    }

    return { valid: true, message: '✓ OK', color: 'text-emerald-600' };
};

/**
 * Validate ID card number
 */
export const validateIdCardNumber = (idCardNumber: string): ValidationResult => {
    const trimmed = idCardNumber.trim();

    if (trimmed.length === 0) {
        return { valid: false, message: 'Číslo OP je povinné', color: 'text-red-600' };
    }

    if (trimmed.length < 6) {
        return { valid: false, message: 'Minimálně 6 znaků', color: 'text-red-600' };
    }

    if (trimmed.length > 15) {
        return { valid: false, message: 'Maximálně 15 znaků', color: 'text-red-600' };
    }

    return { valid: true, message: '✓ OK', color: 'text-emerald-600' };
};

/**
 * Validate section number
 */
export const validateSectionNumber = (sectionNumber: string): ValidationResult => {
    const trimmed = sectionNumber.trim();

    if (trimmed.length === 0) {
        return { valid: false, message: 'Číslo oddílu je povinné', color: 'text-red-600' };
    }

    // Must be a number
    if (!/^[0-9]+$/.test(trimmed)) {
        return { valid: false, message: 'Pouze čísla', color: 'text-orange-600' };
    }

    return { valid: true, message: '✓ OK', color: 'text-emerald-600' };
};

/**
 * Validate phone number (optional)
 * Accepts: 123456789, +420123456789, +420 123 456 789, 123 456 789
 */
export const validatePhone = (phone: string): ValidationResult & { normalized?: string } => {
    if (!phone || phone.trim().length === 0) {
        return { valid: true, message: 'Volitelné', color: 'text-slate-400' };
    }

    // Remove spaces and +420 prefix
    let normalized = phone.replace(/\s+/g, '');
    normalized = normalized.replace(/^\+420/, '');

    // Must be exactly 9 digits
    if (!/^[0-9]{9}$/.test(normalized)) {
        return { valid: false, message: 'Formát: 123 456 789 nebo +420 123 456 789', color: 'text-red-600' };
    }

    return { valid: true, message: '✓ OK', color: 'text-emerald-600', normalized };
};

/**
 * Format phone number for display
 * 123456789 -> "+420 123 456 789"
 */
export const formatPhone = (phone: string): string => {
    const normalized = phone.replace(/\s+/g, '').replace(/^\+420/, '');
    if (normalized.length === 9) {
        return `+420 ${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
    }
    return phone;
};

/**
 * Get display name (use nickname if available, otherwise firstName lastName)
 */
export const getDisplayName = (user: { firstName: string; lastName: string; nickname?: string }): string => {
    if (user.nickname && user.nickname.trim().length > 0) {
        return user.nickname.trim();
    }
    return `${user.firstName} ${user.lastName}`.trim();
};

/**
 * Get full address string
 */
export const getFullAddress = (address: { street: string; houseNumber: string; postalCode: string }): string => {
    return `${address.street} ${address.houseNumber}, ${formatPostalCode(address.postalCode)}`;
};
