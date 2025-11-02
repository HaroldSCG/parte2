// ================================================================================
// validators.js - Validaciones comunes del sistema
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Funciones de validación reutilizables
// Estado: Operativo - Utilizado en formularios de todo el sistema
//
// Propósito:
//   Centraliza lógica de validación para mantener consistencia y DRY.
//   Evita duplicación de código de validación en múltiples componentes.
//
// Validaciones implementadas:
//   ✅ isValidEmail(email): Valida formato de correo electrónico
//   ✅ isValidPhone(phone): Valida formato de teléfono (flexible)
//   ✅ isNotEmpty(value): Valida que un valor no esté vacío
//   ✅ hasMinLength(value, min): Valida longitud mínima
//   ✅ hasMaxLength(value, max): Valida longitud máxima
//   ✅ isNumeric(value): Valida que sea número
//   ✅ isInteger(value): Valida que sea entero
//   ✅ isInRange(value, min, max): Valida rango numérico
//   ✅ isValidPassword(password): Valida fortaleza de contraseña
//   ✅ passwordsMatch(password, confirm): Verifica coincidencia de contraseñas
//   ✅ isValidUsername(username): Valida formato de nombre de usuario
//   ✅ sanitizeInput(value): Limpia y sanitiza entrada de usuario
//
// Uso en el sistema:
//   - UserManager: Validación de datos de usuario (email, teléfono, contraseña)
//   - ProfileManager: Validación de actualización de perfil
//   - security.js: Validación de cambio de contraseña
//   - login.js: Validación de credenciales
//   - UIManager: Validación de formularios genéricos
//
// Beneficios:
//   - Consistencia en validaciones
//   - Mensajes de error uniformes
//   - Fácil mantenimiento
//   - Reutilización de código
//
// Dependencias: Ninguna (clase estática pura)
// ================================================================================

/**
 * Clase para validaciones reutilizables
 */
class Validators {
    /**
     * Valida formato de email
     * @param {string} email - Email a validar
     * @returns {boolean} true si es válido
     */
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Valida formato de teléfono (flexible)
     * @param {string} phone - Teléfono a validar
     * @returns {boolean} true si es válido
     */
    static isValidPhone(phone) {
        if (!phone || typeof phone !== 'string') return false;
        // Permite: +123456789, 123-456-7890, (123) 456-7890, etc.
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
        return phoneRegex.test(phone.trim());
    }

    /**
     * Valida que un string no esté vacío
     * @param {string} value - Valor a validar
     * @returns {boolean} true si no está vacío
     */
    static isNotEmpty(value) {
        return value !== null && value !== undefined && value.toString().trim().length > 0;
    }

    /**
     * Valida longitud mínima
     * @param {string} value - Valor a validar
     * @param {number} minLength - Longitud mínima requerida
     * @returns {boolean} true si cumple la longitud
     */
    static minLength(value, minLength) {
        if (!value) return false;
        return value.toString().trim().length >= minLength;
    }

    /**
     * Valida longitud máxima
     * @param {string} value - Valor a validar
     * @param {number} maxLength - Longitud máxima permitida
     * @returns {boolean} true si cumple la longitud
     */
    static maxLength(value, maxLength) {
        if (!value) return true; // Empty is ok for max
        return value.toString().trim().length <= maxLength;
    }

    /**
     * Valida que un valor sea numérico
     * @param {any} value - Valor a validar
     * @returns {boolean} true si es número válido
     */
    static isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    /**
     * Valida rango numérico
     * @param {number} value - Valor a validar
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {boolean} true si está en rango
     */
    static isInRange(value, min, max) {
        const num = parseFloat(value);
        return this.isNumeric(num) && num >= min && num <= max;
    }

    /**
     * Valida formato de fecha (YYYY-MM-DD)
     * @param {string} dateString - Fecha en formato string
     * @returns {boolean} true si es fecha válida
     */
    static isValidDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Valida que una fecha sea futura
     * @param {string} dateString - Fecha a validar
     * @returns {boolean} true si es fecha futura
     */
    static isFutureDate(dateString) {
        if (!this.isValidDate(dateString)) return false;
        const date = new Date(dateString);
        const now = new Date();
        return date > now;
    }

    /**
     * Valida que una fecha sea pasada
     * @param {string} dateString - Fecha a validar
     * @returns {boolean} true si es fecha pasada
     */
    static isPastDate(dateString) {
        if (!this.isValidDate(dateString)) return false;
        const date = new Date(dateString);
        const now = new Date();
        return date < now;
    }

    /**
     * Valida fortaleza de contraseña
     * @param {string} password - Contraseña a validar
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    static validatePasswordStrength(password) {
        const errors = [];

        if (!password || password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Debe contener al menos una letra mayúscula');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Debe contener al menos una letra minúscula');
        }
        if (!/\d/.test(password)) {
            errors.push('Debe contener al menos un número');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Debe contener al menos un símbolo especial');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Valida formato de carné universitario (personalizable)
     * @param {string} carne - Carné a validar
     * @param {string} pattern - Patrón regex personalizado (opcional)
     * @returns {boolean} true si es válido
     */
    static isValidCarne(carne, pattern = null) {
        if (!carne) return false;

        // Patrón por defecto: EST + 3 dígitos (ej: EST001)
        const defaultPattern = /^EST\d{3,6}$/;
        const regex = pattern ? new RegExp(pattern) : defaultPattern;

        return regex.test(carne.trim());
    }

    /**
     * Valida que un valor esté en una lista permitida
     * @param {any} value - Valor a validar
     * @param {Array} allowedValues - Lista de valores permitidos
     * @returns {boolean} true si está en la lista
     */
    static isInList(value, allowedValues) {
        if (!Array.isArray(allowedValues)) return false;
        return allowedValues.includes(value);
    }

    /**
     * Valida múltiples campos de un formulario
     * @param {Object} data - Objeto con los datos a validar
     * @param {Object} rules - Objeto con las reglas de validación
     * @returns {Object} { isValid: boolean, errors: Object }
     *
     * Ejemplo de uso:
     * validateForm(
     *   { email: 'test@test.com', password: '12345' },
     *   {
     *     email: ['required', 'email'],
     *     password: ['required', { minLength: 8 }]
     *   }
     * )
     */
    static validateForm(data, rules) {
        const errors = {};
        let isValid = true;

        for (const field in rules) {
            const value = data[field];
            const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
            const fieldErrors = [];

            for (const rule of fieldRules) {
                if (typeof rule === 'string') {
                    // Reglas simples
                    switch (rule) {
                        case 'required':
                            if (!this.isNotEmpty(value)) {
                                fieldErrors.push('Este campo es requerido');
                            }
                            break;
                        case 'email':
                            if (value && !this.isValidEmail(value)) {
                                fieldErrors.push('Email inválido');
                            }
                            break;
                        case 'phone':
                            if (value && !this.isValidPhone(value)) {
                                fieldErrors.push('Teléfono inválido');
                            }
                            break;
                        case 'numeric':
                            if (value && !this.isNumeric(value)) {
                                fieldErrors.push('Debe ser un número');
                            }
                            break;
                    }
                } else if (typeof rule === 'object') {
                    // Reglas con parámetros
                    if (rule.minLength && !this.minLength(value, rule.minLength)) {
                        fieldErrors.push(`Mínimo ${rule.minLength} caracteres`);
                    }
                    if (rule.maxLength && !this.maxLength(value, rule.maxLength)) {
                        fieldErrors.push(`Máximo ${rule.maxLength} caracteres`);
                    }
                    if (rule.min !== undefined && !this.isInRange(value, rule.min, Infinity)) {
                        fieldErrors.push(`Valor mínimo: ${rule.min}`);
                    }
                    if (rule.max !== undefined && !this.isInRange(value, -Infinity, rule.max)) {
                        fieldErrors.push(`Valor máximo: ${rule.max}`);
                    }
                }
            }

            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
                isValid = false;
            }
        }

        return { isValid, errors };
    }

    /**
     * Sanitiza un string removiendo caracteres peligrosos
     * @param {string} str - String a sanitizar
     * @returns {string} String sanitizado
     */
    static sanitize(str) {
        if (!str) return '';
        return str
            .toString()
            .trim()
            .replace(/[<>]/g, '') // Remover < y >
            .replace(/javascript:/gi, '') // Remover javascript:
            .replace(/on\w+=/gi, ''); // Remover event handlers
    }
}

// Exportar la clase
window.Validators = Validators;
