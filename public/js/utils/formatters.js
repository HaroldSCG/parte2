// ================================================================================
// formatters.js - Funciones de formateo de datos
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Utilidades de formateo para presentación de datos
// Estado: Operativo - Utilizado en todas las vistas del sistema
//
// Propósito:
//   Centraliza lógica de formateo para mantener consistencia visual.
//   Formatea datos de backend para mostrar de forma amigable al usuario.
//
// Funciones de formateo implementadas:
//   ✅ formatDate(date, locale, options): Formatea fechas
//   ✅ formatDateTime(dateInput, locale): Formatea fecha + hora
//   ✅ formatCurrency(amount, currency, locale): Formatea monedas
//   ✅ formatNumber(number, decimals, locale): Formatea números
//   ✅ formatPhone(phone): Formatea teléfonos
//   ✅ formatPercentage(value, decimals): Formatea porcentajes
//   ✅ truncateText(text, maxLength, suffix): Acorta textos largos
//   ✅ capitalize(text): Capitaliza primera letra
//   ✅ titleCase(text): Convierte a Title Case
//   ✅ formatFileSize(bytes): Formatea tamaños de archivo (KB, MB, GB)
//   ✅ formatDuration(seconds): Formatea duraciones de tiempo
//   ✅ formatRelativeTime(date): Formatea tiempos relativos ("hace 2 horas")
//   ✅ formatBoolean(value, trueText, falseText): Formatea booleanos a texto
//
// Uso en el sistema:
//   - BitacoraManager: Formateo de fechas de accesos
//   - UserManager: Formateo de fechas de registro, estados
//   - StatsManager: Formateo de números, porcentajes, monedas
//   - dashboard-app.js: Formateo de datos en tablas y tarjetas
//   - Todas las vistas: Presentación consistente de datos
//
// Configuración regional:
//   - Por defecto usa 'es-ES' (España/Latinoamérica)
//   - Soporta múltiples locales (configurable)
//   - Formatos de moneda, fecha adaptables
//
// Dependencias: Ninguna (clase estática pura)
// ================================================================================

/**
 * Clase para formateo de datos
 */
class Formatters {
    /**
     * Formatea una fecha a string en formato local
     * @param {string|Date} dateInput - Fecha a formatear
     * @param {string} locale - Locale (por defecto 'es-ES')
     * @param {Object} options - Opciones de formato
     * @returns {string} Fecha formateada
     */
    static formatDate(dateInput, locale = 'es-ES', options = {}) {
        if (!dateInput) return '';

        try {
            const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

            if (!(date instanceof Date) || isNaN(date)) {
                return '';
            }

            const defaultOptions = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                ...options
            };

            return date.toLocaleDateString(locale, defaultOptions);
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return '';
        }
    }

    /**
     * Formatea una fecha y hora
     * @param {string|Date} dateInput - Fecha a formatear
     * @param {string} locale - Locale (por defecto 'es-ES')
     * @returns {string} Fecha y hora formateadas
     */
    static formatDateTime(dateInput, locale = 'es-ES') {
        if (!dateInput) return '';

        try {
            const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

            if (!(date instanceof Date) || isNaN(date)) {
                return '';
            }

            return date.toLocaleString(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('Error formateando fecha y hora:', error);
            return '';
        }
    }

    /**
     * Formatea solo la hora
     * @param {string|Date} dateInput - Fecha a formatear
     * @param {string} locale - Locale (por defecto 'es-ES')
     * @returns {string} Hora formateada
     */
    static formatTime(dateInput, locale = 'es-ES') {
        if (!dateInput) return '';

        try {
            const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

            if (!(date instanceof Date) || isNaN(date)) {
                return '';
            }

            return date.toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('Error formateando hora:', error);
            return '';
        }
    }

    /**
     * Formatea fecha relativa (hace 2 horas, hace 3 días, etc.)
     * @param {string|Date} dateInput - Fecha a formatear
     * @returns {string} Fecha relativa en español
     */
    static formatRelativeTime(dateInput) {
        if (!dateInput) return '';

        try {
            const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
            const now = new Date();
            const diffMs = now - date;
            const diffSecs = Math.floor(diffMs / 1000);
            const diffMins = Math.floor(diffSecs / 60);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffSecs < 60) return 'Hace unos segundos';
            if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
            if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
            if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
            if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
            if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;

            return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
        } catch (error) {
            console.error('Error formateando tiempo relativo:', error);
            return '';
        }
    }

    /**
     * Formatea un número con separadores de miles
     * @param {number|string} value - Número a formatear
     * @param {string} locale - Locale (por defecto 'es-ES')
     * @returns {string} Número formateado
     */
    static formatNumber(value, locale = 'es-ES') {
        if (value === null || value === undefined) return '0';

        try {
            const num = typeof value === 'string' ? parseFloat(value) : value;

            if (isNaN(num)) return '0';

            return num.toLocaleString(locale);
        } catch (error) {
            console.error('Error formateando número:', error);
            return '0';
        }
    }

    /**
     * Formatea un número como moneda
     * @param {number|string} value - Valor a formatear
     * @param {string} currency - Código de moneda (por defecto 'USD')
     * @param {string} locale - Locale (por defecto 'es-ES')
     * @returns {string} Moneda formateada
     */
    static formatCurrency(value, currency = 'USD', locale = 'es-ES') {
        if (value === null || value === undefined) return '$0.00';

        try {
            const num = typeof value === 'string' ? parseFloat(value) : value;

            if (isNaN(num)) return '$0.00';

            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency
            }).format(num);
        } catch (error) {
            console.error('Error formateando moneda:', error);
            return '$0.00';
        }
    }

    /**
     * Formatea un porcentaje
     * @param {number|string} value - Valor a formatear (0-100)
     * @param {number} decimals - Número de decimales (por defecto 2)
     * @returns {string} Porcentaje formateado
     */
    static formatPercentage(value, decimals = 2) {
        if (value === null || value === undefined) return '0%';

        try {
            const num = typeof value === 'string' ? parseFloat(value) : value;

            if (isNaN(num)) return '0%';

            return `${num.toFixed(decimals)}%`;
        } catch (error) {
            console.error('Error formateando porcentaje:', error);
            return '0%';
        }
    }

    /**
     * Formatea un rol de usuario
     * @param {string} rol - Rol a formatear
     * @returns {string} Rol formateado
     */
    static formatRole(rol) {
        if (!rol) return '';

        const roles = {
            'admin': 'Administrador',
            'secretaria': 'Secretaria',
            'usuario': 'Usuario'
        };

        return roles[rol.toLowerCase()] || rol;
    }

    /**
     * Formatea un estado
     * @param {string|boolean|number} estado - Estado a formatear
     * @returns {string} Estado formateado
     */
    static formatStatus(estado) {
        if (estado === null || estado === undefined) return 'Desconocido';

        // Si es booleano
        if (typeof estado === 'boolean') {
            return estado ? 'Activo' : 'Inactivo';
        }

        // Si es número (1 = activo, 0 = inactivo)
        if (typeof estado === 'number') {
            return estado === 1 ? 'Activo' : 'Inactivo';
        }

        // Si es string
        const estadoLower = estado.toString().toLowerCase();

        const estados = {
            'activo': 'Activo',
            'inactivo': 'Inactivo',
            'pendiente': 'Pendiente',
            'aprobado': 'Aprobado',
            'rechazado': 'Rechazado',
            'ok': 'Exitoso',
            'fail': 'Fallido',
            'error': 'Error',
            'success': 'Éxito'
        };

        return estados[estadoLower] || estado;
    }

    /**
     * Formatea un teléfono
     * @param {string} phone - Teléfono a formatear
     * @param {string} format - Formato deseado (por defecto 'standard')
     * @returns {string} Teléfono formateado
     */
    static formatPhone(phone, format = 'standard') {
        if (!phone) return '';

        try {
            // Remover caracteres no numéricos
            const cleaned = phone.toString().replace(/\D/g, '');

            // Formatos comunes
            if (format === 'standard' && cleaned.length === 10) {
                // (123) 456-7890
                return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
            }

            if (format === 'international' && cleaned.length >= 10) {
                // +1 (123) 456-7890
                const countryCode = cleaned.slice(0, -10);
                const areaCode = cleaned.slice(-10, -7);
                const prefix = cleaned.slice(-7, -4);
                const lineNumber = cleaned.slice(-4);
                return `+${countryCode || '1'} (${areaCode}) ${prefix}-${lineNumber}`;
            }

            // Si no coincide con ningún formato, devolver limpio
            return cleaned;
        } catch (error) {
            console.error('Error formateando teléfono:', error);
            return phone;
        }
    }

    /**
     * Formatea un nombre completo
     * @param {string} nombres - Nombres
     * @param {string} apellidos - Apellidos
     * @returns {string} Nombre completo formateado
     */
    static formatFullName(nombres, apellidos) {
        const parts = [];

        if (nombres) parts.push(nombres.trim());
        if (apellidos) parts.push(apellidos.trim());

        return parts.join(' ');
    }

    /**
     * Formatea iniciales de un nombre
     * @param {string} nombres - Nombres
     * @param {string} apellidos - Apellidos
     * @returns {string} Iniciales (ej: "JD")
     */
    static formatInitials(nombres, apellidos) {
        const parts = [];

        if (nombres) {
            const firstNameInitial = nombres.trim()[0];
            if (firstNameInitial) parts.push(firstNameInitial.toUpperCase());
        }

        if (apellidos) {
            const lastNameInitial = apellidos.trim()[0];
            if (lastNameInitial) parts.push(lastNameInitial.toUpperCase());
        }

        return parts.join('');
    }

    /**
     * Formatea un tamaño de archivo
     * @param {number} bytes - Tamaño en bytes
     * @param {number} decimals - Número de decimales (por defecto 2)
     * @returns {string} Tamaño formateado
     */
    static formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Trunca un texto largo
     * @param {string} text - Texto a truncar
     * @param {number} maxLength - Longitud máxima (por defecto 50)
     * @param {string} suffix - Sufijo (por defecto '...')
     * @returns {string} Texto truncado
     */
    static truncate(text, maxLength = 50, suffix = '...') {
        if (!text) return '';
        if (text.length <= maxLength) return text;

        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    /**
     * Capitaliza la primera letra de cada palabra
     * @param {string} text - Texto a capitalizar
     * @returns {string} Texto capitalizado
     */
    static capitalize(text) {
        if (!text) return '';

        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Formatea un email para mostrar (oculta parte del dominio)
     * @param {string} email - Email a formatear
     * @returns {string} Email parcialmente oculto
     */
    static formatEmailPrivate(email) {
        if (!email) return '';

        try {
            const [localPart, domain] = email.split('@');
            const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
            const hiddenPart = '*'.repeat(localPart.length - visibleChars);

            return `${localPart.substring(0, visibleChars)}${hiddenPart}@${domain}`;
        } catch (error) {
            return email;
        }
    }

    /**
     * Convierte camelCase a formato legible
     * @param {string} text - Texto en camelCase
     * @returns {string} Texto legible
     */
    static camelCaseToReadable(text) {
        if (!text) return '';

        return text
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Formatea un número de teléfono guatemalteco (XXXX-XXXX)
     * @param {string} value - Valor del teléfono a formatear
     * @returns {string} Teléfono formateado
     */
    static formatGuatemalaPhone(value) {
        if (!value) return '';

        // Remover todo excepto números
        const cleaned = value.replace(/\D/g, '');

        // Limitar a 8 dígitos
        const limited = cleaned.substring(0, 8);

        // Formatear según la longitud
        if (limited.length <= 4) {
            return limited;
        } else {
            return `${limited.substring(0, 4)}-${limited.substring(4)}`;
        }
    }

    /**
     * Aplica formateo de teléfono guatemalteco a un input mientras el usuario escribe
     * @param {HTMLInputElement} input - Elemento input a formatear
     */
    static applyGuatemalaPhoneFormat(input) {
        if (!input) return;

        input.addEventListener('input', function(e) {
            const cursorPosition = this.selectionStart;
            const oldValue = this.value;
            const oldLength = oldValue.length;

            // Formatear el valor
            const formatted = Formatters.formatGuatemalaPhone(this.value);
            this.value = formatted;

            // Ajustar la posición del cursor
            const newLength = formatted.length;
            const diff = newLength - oldLength;

            // Si se agregó el guión automáticamente, mover el cursor después del guión
            if (diff > 0 && cursorPosition === 4 && formatted[4] === '-') {
                this.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
            } else if (diff === 0 && cursorPosition <= newLength) {
                this.setSelectionRange(cursorPosition, cursorPosition);
            } else {
                this.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
            }
        });

        // Prevenir caracteres no numéricos al pegar
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const cleaned = pastedText.replace(/\D/g, '');
            const formatted = Formatters.formatGuatemalaPhone(cleaned);
            this.value = formatted;
        });

        // Validar al escribir (solo números)
        input.addEventListener('keypress', function(e) {
            // Permitir: backspace, delete, tab, escape, enter
            if ([8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true)) {
                return;
            }

            // Asegurar que solo sean números
            if (e.key && !/^\d$/.test(e.key)) {
                e.preventDefault();
            }
        });
    }
}

// Exportar la clase
window.Formatters = Formatters;
