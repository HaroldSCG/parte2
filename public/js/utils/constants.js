// ================================================================================
// constants.js - Constantes del sistema
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Definiciones centralizadas de constantes
// Estado: Operativo - Utilizado por todos los módulos
//
// Propósito:
//   Define constantes globales para evitar hardcoding de valores mágicos.
//   Facilita mantenimiento y cambios centralizados.
//
// Categorías de constantes:
//   ✅ ROLES: Roles del sistema (admin, secretaria, usuario)
//   ✅ STATUS: Estados de registros (activo, inactivo, pendiente, etc.)
//   ✅ OPERATION_STATUS: Estados de operaciones (OK, FAIL, ERROR, SUCCESS)
//   ✅ NOTIFICATION_TYPES: Tipos de notificaciones UI (success, error, warning, info)
//   ✅ PAGINATION: Configuración de paginación (tamaños, opciones)
//   ✅ VALIDATION: Límites de validación (longitud contraseña, username, etc.)
//   ✅ FORMATS: Formatos de fecha, moneda, etc.
//   ✅ API_ENDPOINTS: Rutas de endpoints del backend
//   ✅ STORAGE_KEYS: Claves para localStorage
//   ✅ ICONS: Iconos FontAwesome usados en la UI
//   ✅ SECTIONS: IDs de secciones del dashboard
//   ✅ BITACORA: Tipos de bitácoras y operaciones
//
// Uso:
//   import { Constants } from './constants.js';
//   if (user.role === Constants.ROLES.ADMIN) { ... }
//
// Nota: Este archivo es de solo lectura, no modifica estado.
//       Es una fuente de verdad para valores compartidos.
//
// Dependencias: Ninguna (archivo base)
// ================================================================================

/**
 * Constantes globales de la aplicación
 */
const AppConstants = {
    // === ROLES DEL SISTEMA ===
    ROLES: {
        ADMIN: 'admin',
        SECRETARIA: 'secretaria',
        USUARIO: 'usuario'
    },

    // === ESTADOS ===
    STATUS: {
        ACTIVE: 'activo',
        INACTIVE: 'inactivo',
        PENDING: 'pendiente',
        APPROVED: 'aprobado',
        REJECTED: 'rechazado'
    },

    // === ESTADOS DE OPERACIÓN ===
    OPERATION_STATUS: {
        OK: 'OK',
        FAIL: 'FAIL',
        ERROR: 'ERROR',
        SUCCESS: 'SUCCESS'
    },

    // === TIPOS DE NOTIFICACIÓN ===
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },

    // === PAGINACIÓN ===
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        MAX_PAGE_SIZE: 100,
        MIN_PAGE_SIZE: 5,
        PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100]
    },

    // === LÍMITES DE VALIDACIÓN ===
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 8,
        MAX_PASSWORD_LENGTH: 128,
        MIN_USERNAME_LENGTH: 3,
        MAX_USERNAME_LENGTH: 50,
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 100,
        MIN_PHONE_LENGTH: 7,
        MAX_PHONE_LENGTH: 15,
        MAX_EMAIL_LENGTH: 120
    },

    // === TIMEOUTS Y DELAYS ===
    TIMING: {
        TOAST_DURATION: 5000,           // 5 segundos
        SUCCESS_TOAST_DURATION: 3000,   // 3 segundos
        ERROR_TOAST_DURATION: 7000,     // 7 segundos
        AUTO_LOGOUT_TIMEOUT: 1800000,   // 30 minutos
        DEBOUNCE_DELAY: 300,            // 300ms para búsquedas
        ANIMATION_DURATION: 300         // 300ms para animaciones
    },

    // === KEYS DE LOCALSTORAGE ===
    STORAGE_KEYS: {
        USER_DATA: 'userData',
        USER_ROLE: 'userRole',
        USER_NAME: 'userName',
        USER_EMAIL: 'userEmail',
        CURRENT_USER: 'currentUser',
        THEME: 'theme',
        LANGUAGE: 'language',
        LAST_LOGIN: 'lastLogin',
        SESSION_TOKEN: 'sessionToken'
    },

    // === TEMAS ===
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },

    // === IDIOMAS ===
    LANGUAGES: {
        ES: 'es',
        EN: 'en'
    },

    // === TIPOS DE OPERACIÓN (BITÁCORA) ===
    OPERATION_TYPES: {
        INSERT: 'INSERT',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
        SELECT: 'SELECT',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        RESET_PASSWORD: 'RESET_PASSWORD',
        CHANGE_PASSWORD: 'CHANGE_PASSWORD'
    },

    // === ENTIDADES DEL SISTEMA ===
    ENTITIES: {
        USUARIO: 'tbUsuario',
        BITACORA_ACCESO: 'tbBitacoraAcceso',
        BITACORA_TRANSACCIONES: 'tbBitacoraTransacciones'
    },

    // === CARRERAS DISPONIBLES ===
    // CARRERAS: removido (no aplica)

    // === PATRONES REGEX ===
    REGEX: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
        CARNE: /^EST\d{3,6}$/,
        PASSWORD_UPPERCASE: /[A-Z]/,
        PASSWORD_LOWERCASE: /[a-z]/,
        PASSWORD_NUMBER: /\d/,
        PASSWORD_SYMBOL: /[!@#$%^&*(),.?":{}|<>]/,
        ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
        LETTERS_ONLY: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
    },

    // === MENSAJES DE ERROR COMUNES ===
    ERROR_MESSAGES: {
        REQUIRED_FIELD: 'Este campo es requerido',
        INVALID_EMAIL: 'El formato del email no es válido',
        INVALID_PHONE: 'El formato del teléfono no es válido',
        PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
        PASSWORD_TOO_WEAK: 'La contraseña no cumple con los requisitos de seguridad',
        PASSWORDS_DO_NOT_MATCH: 'Las contraseñas no coinciden',
        NETWORK_ERROR: 'Error de conexión. Por favor, intenta nuevamente',
        SESSION_EXPIRED: 'Sesión expirada. Por favor, inicia sesión nuevamente',
        UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
        NOT_FOUND: 'El recurso solicitado no fue encontrado',
        SERVER_ERROR: 'Error interno del servidor. Por favor, intenta más tarde'
    },

    // === MENSAJES DE ÉXITO COMUNES ===
    SUCCESS_MESSAGES: {
        SAVED: 'Guardado exitosamente',
        UPDATED: 'Actualizado exitosamente',
        DELETED: 'Eliminado exitosamente',
        CREATED: 'Creado exitosamente',
        LOGIN_SUCCESS: 'Inicio de sesión exitoso',
        PASSWORD_CHANGED: 'Contraseña cambiada exitosamente',
        PASSWORD_RESET: 'Contraseña reseteada exitosamente'
    },

    // === ICONOS FONT AWESOME COMUNES ===
    ICONS: {
        SUCCESS: 'fa-check-circle',
        ERROR: 'fa-exclamation-circle',
        WARNING: 'fa-exclamation-triangle',
        INFO: 'fa-info-circle',
        EDIT: 'fa-edit',
        DELETE: 'fa-trash',
        VIEW: 'fa-eye',
        ADD: 'fa-plus',
        SEARCH: 'fa-search',
        FILTER: 'fa-filter',
        SAVE: 'fa-save',
        CANCEL: 'fa-times',
        LOADING: 'fa-spinner fa-spin',
        USER: 'fa-user',
        STUDENT: 'fa-user-graduate',
        ADMIN: 'fa-user-shield',
        SECRETARY: 'fa-user-tie',
        LOGOUT: 'fa-sign-out-alt',
        SETTINGS: 'fa-cog',
        DASHBOARD: 'fa-tachometer-alt',
        BITACORA: 'fa-clipboard-list',
        THEME: 'fa-moon',
        THEME_DARK: 'fa-sun'
    },

    // === CÓDIGOS DE ESTADO HTTP ===
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503
    },

    // === MÉTODOS HTTP ===
    HTTP_METHODS: {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        DELETE: 'DELETE',
        PATCH: 'PATCH'
    },

    // === CONFIGURACIÓN DE BÚSQUEDA ===
    SEARCH: {
        MIN_SEARCH_LENGTH: 2,
        DEBOUNCE_DELAY: 300,
        MAX_RESULTS: 100
    },

    // === CONFIGURACIÓN DE BITÁCORA ===
    BITACORA: {
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
        TYPES: {
            ACCESOS: 'accesos',
            TRANSACCIONES: 'transacciones'
        }
    },

    // === FORMATO DE FECHAS ===
    DATE_FORMATS: {
        SHORT: 'DD/MM/YYYY',
        LONG: 'dddd, DD de MMMM de YYYY',
        WITH_TIME: 'DD/MM/YYYY HH:mm:ss',
        ISO: 'YYYY-MM-DD'
    },

    // === SECCIONES DEL DASHBOARD ===
    SECTIONS: {
        DASHBOARD: 'dashboard',
        USERS: 'usuarios',
        BITACORAS: 'bitacoras',
        PROFILE: 'perfil',
        SETTINGS: 'configuracion'
    },

    // === MODALES DEL SISTEMA ===
    MODALS: {
        ADD_USER: 'addUserModal',
        EDIT_USER: 'editUserModal',
        VIEW_USER: 'viewUserModal',
        CHANGE_PASSWORD: 'changePasswordModal',
        PROFILE: 'profileModal',
        CONFIRM: 'confirmModal',
        SUCCESS: 'successModal',
        PASSWORD_GENERATED: 'passwordGeneratedModal',
        USER_FILTERS: 'userFiltersModal'
    },

    // === PERMISOS POR ROL ===
    PERMISSIONS: {
        admin: [
            'view_dashboard',
            'view_users',
            'create_users',
            'edit_users',
            'delete_users',
            'view_bitacoras',
            'reset_passwords',
            'manage_settings'
        ],
        secretaria: [
            'view_dashboard',
            'view_own_profile'
        ]
    },

    // === CONFIGURACIÓN DE RECAPTCHA ===
    RECAPTCHA: {
        SITE_KEY_TEST: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
        ACTION_LOGIN: 'login',
        ACTION_REGISTER: 'register',
        ACTION_FORGOT_PASSWORD: 'forgot_password'
    },

    // === VERSIÓN DEL SISTEMA ===
    VERSION: '1.0.0',
    BUILD_DATE: '2025-10-01',
    APP_NAME: 'Sistema Gestión Universitaria'
};

// Congelar el objeto para evitar modificaciones
Object.freeze(AppConstants);
Object.freeze(AppConstants.ROLES);
Object.freeze(AppConstants.STATUS);
Object.freeze(AppConstants.OPERATION_STATUS);
Object.freeze(AppConstants.NOTIFICATION_TYPES);
Object.freeze(AppConstants.PAGINATION);
Object.freeze(AppConstants.VALIDATION);
Object.freeze(AppConstants.TIMING);
Object.freeze(AppConstants.STORAGE_KEYS);
Object.freeze(AppConstants.THEMES);
Object.freeze(AppConstants.LANGUAGES);
Object.freeze(AppConstants.OPERATION_TYPES);
Object.freeze(AppConstants.ENTITIES);
Object.freeze(AppConstants.REGEX);
Object.freeze(AppConstants.ERROR_MESSAGES);
Object.freeze(AppConstants.SUCCESS_MESSAGES);
Object.freeze(AppConstants.ICONS);
Object.freeze(AppConstants.HTTP_STATUS);
Object.freeze(AppConstants.HTTP_METHODS);
Object.freeze(AppConstants.SEARCH);
Object.freeze(AppConstants.BITACORA);
Object.freeze(AppConstants.DATE_FORMATS);
Object.freeze(AppConstants.SECTIONS);
Object.freeze(AppConstants.MODALS);
Object.freeze(AppConstants.PERMISSIONS);
Object.freeze(AppConstants.RECAPTCHA);

// Exportar
window.AppConstants = AppConstants;

// Alias para facilitar el uso
window.Constants = AppConstants;
