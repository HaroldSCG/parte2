// ================================================================================
// passwordGenerator.js - Generador de Contraseñas Seguras
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Utilidad para generación de contraseñas aleatorias
// Estado: Operativo - Utilizado en creación de usuarios
//
// Propósito:
//   Genera contraseñas temporales seguras cuando admin crea nuevos usuarios.
//   Cumple con políticas de seguridad (mayúscula, minúscula, número, símbolo).
//
// Funcionalidades implementadas:
//   ✅ generateSecurePassword(length): Genera contraseña aleatoria segura
//   ✅ validatePassword(password): Valida si contraseña cumple requisitos
//   ✅ generateMultiplePasswords(count, length): Genera múltiples opciones
//   ✅ calculateStrength(password): Calcula fortaleza de contraseña
//   ✅ Exclusión de caracteres ambiguos (0O1lI|)
//   ✅ Algoritmo Fisher-Yates para mezcla aleatoria
//   ✅ Garantiza al menos 1 carácter de cada tipo requerido
//
// Requisitos de contraseña segura:
//   ✅ Longitud mínima: 8 caracteres (por defecto 12)
//   ✅ Al menos 1 mayúscula (A-Z)
//   ✅ Al menos 1 minúscula (a-z)
//   ✅ Al menos 1 número (0-9)
//   ✅ Al menos 1 símbolo (!@#$%^&*()_+-=[]{}|;:,.<>?)
//
// Uso en el sistema:
//   - UserManager: Al crear nuevo usuario, genera contraseña temporal
//   - Usuario recibe contraseña temporal (mostrada solo una vez)
//   - Usuario debe cambiar contraseña en primer login (security.js)
//   - Flag esPasswordTemporal se activa en seg.tbUsuario
//
// Seguridad:
//   ✅ Caracteres completamente aleatorios
//   ✅ No incluye caracteres ambiguos (mejora usabilidad)
//   ✅ Mezcla aleatoria para evitar patrones predecibles
//   ✅ Validación robusta de fortaleza
//   ✅ No guarda contraseñas generadas (solo en memoria temporal)
//
// Métodos auxiliares:
//   - getRandomChar(charset): Obtiene carácter aleatorio de conjunto
//   - removeAmbiguousChars(charset): Elimina caracteres confusos
//   - shuffleArray(array): Mezcla array aleatoriamente
//   - calculateStrength(password): Evalúa fortaleza (débil, moderada, fuerte)
//
// Niveles de fortaleza:
//   - Muy débil (rojo): Score < 2
//   - Débil (naranja): Score 2-3
//   - Moderada (amarillo): Score 4
//   - Fuerte (azul): Score 5
//   - Muy fuerte (verde): Score >= 6
//
// Dependencias: Ninguna (clase standalone)
// ================================================================================

/**
 * Generador de Contraseñas Seguras
 * Cumple con los requerimientos del proyecto:
 * - Mayúscula, minúscula, número y símbolo
 * - Contraseña segura y aleatoria
 */

class SecurePasswordGenerator {
    constructor() {
        // Conjuntos de caracteres según requerimientos
        this.uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.lowercase = 'abcdefghijklmnopqrstuvwxyz';
        this.numbers = '0123456789';
        this.symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        // Caracteres que pueden confundirse (eliminados para mayor claridad)
        this.excludeAmbiguous = true;
        this.ambiguousChars = '0O1lI|';
    }

    /**
     * Genera una contraseña segura aleatoria
     * @param {number} length - Longitud de la contraseña (mínimo 8, por defecto 12)
     * @returns {string} Contraseña segura generada
     */
    generateSecurePassword(length = 12) {
        // Asegurar longitud mínima
        if (length < 8) length = 8;

        // Preparar conjuntos de caracteres
        let upperSet = this.uppercase;
        let lowerSet = this.lowercase;
        let numberSet = this.numbers;
        let symbolSet = this.symbols;

        // Eliminar caracteres ambiguos si está habilitado
        if (this.excludeAmbiguous) {
            upperSet = this.removeAmbiguousChars(upperSet);
            lowerSet = this.removeAmbiguousChars(lowerSet);
            numberSet = this.removeAmbiguousChars(numberSet);
            symbolSet = this.removeAmbiguousChars(symbolSet);
        }

        // Asegurar al menos un carácter de cada tipo (requerimiento)
        let password = [];
        password.push(this.getRandomChar(upperSet));    // Mayúscula requerida
        password.push(this.getRandomChar(lowerSet));    // Minúscula requerida
        password.push(this.getRandomChar(numberSet));   // Número requerido
        password.push(this.getRandomChar(symbolSet));   // Símbolo requerido

        // Llenar el resto de la longitud con caracteres aleatorios
        const allChars = upperSet + lowerSet + numberSet + symbolSet;
        for (let i = 4; i < length; i++) {
            password.push(this.getRandomChar(allChars));
        }

        // Mezclar la contraseña para que los caracteres requeridos no estén al inicio
        password = this.shuffleArray(password);

        return password.join('');
    }

    /**
     * Valida si una contraseña cumple con los requerimientos
     * @param {string} password - Contraseña a validar
     * @returns {object} Resultado de validación
     */
    validatePassword(password) {
        const validation = {
            isValid: false,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSymbol: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
            hasMinLength: password.length >= 8,
            errors: []
        };

        if (!validation.hasUppercase) validation.errors.push('Debe contener al menos una mayúscula');
        if (!validation.hasLowercase) validation.errors.push('Debe contener al menos una minúscula');
        if (!validation.hasNumber) validation.errors.push('Debe contener al menos un número');
        if (!validation.hasSymbol) validation.errors.push('Debe contener al menos un símbolo');
        if (!validation.hasMinLength) validation.errors.push('Debe tener al menos 8 caracteres');

        validation.isValid = validation.hasUppercase &&
                           validation.hasLowercase &&
                           validation.hasNumber &&
                           validation.hasSymbol &&
                           validation.hasMinLength;

        return validation;
    }

    /**
     * Genera múltiples contraseñas para que el admin pueda elegir
     * @param {number} count - Número de contraseñas a generar
     * @param {number} length - Longitud de cada contraseña
     * @returns {string[]} Array de contraseñas seguras
     */
    generateMultiplePasswords(count = 3, length = 12) {
        const passwords = [];
        for (let i = 0; i < count; i++) {
            passwords.push(this.generateSecurePassword(length));
        }
        return passwords;
    }

    /**
     * Obtiene un carácter aleatorio de un conjunto
     * @param {string} charset - Conjunto de caracteres
     * @returns {string} Carácter aleatorio
     */
    getRandomChar(charset) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        return charset[randomIndex];
    }

    /**
     * Elimina caracteres ambiguos de un conjunto
     * @param {string} charset - Conjunto de caracteres
     * @returns {string} Conjunto sin caracteres ambiguos
     */
    removeAmbiguousChars(charset) {
        return charset.split('').filter(char =>
            !this.ambiguousChars.includes(char)
        ).join('');
    }

    /**
     * Mezcla un array aleatoriamente (algoritmo Fisher-Yates)
     * @param {any[]} array - Array a mezclar
     * @returns {any[]} Array mezclado
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Calcula la fortaleza de una contraseña
     * @param {string} password - Contraseña a evaluar
     * @returns {object} Información de fortaleza
     */
    calculateStrength(password) {
        let score = 0;
        const feedback = [];

        // Longitud
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;

        // Tipos de caracteres
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 1;

        // Variedad
        const uniqueChars = new Set(password).size;
        if (uniqueChars >= password.length * 0.7) score += 1;

        let strength = 'Muy débil';
        let color = '#dc2626';

        if (score >= 6) {
            strength = 'Muy fuerte';
            color = '#059669';
        } else if (score >= 5) {
            strength = 'Fuerte';
            color = '#0891b2';
        } else if (score >= 4) {
            strength = 'Moderada';
            color = '#ca8a04';
        } else if (score >= 2) {
            strength = 'Débil';
            color = '#ea580c';
        }

        return {
            score,
            strength,
            color,
            feedback
        };
    }
}

// Exportar para uso global
window.SecurePasswordGenerator = SecurePasswordGenerator;
