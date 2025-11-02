// ================================================================================
// Auth.js - Módulo de autenticación y gestión de sesión
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Manejo de sesión y autenticación
// Estado: Operativo - Gestiona todo el ciclo de autenticación
//
// Responsabilidades:
//   ✅ Verificación de autenticación (checkAuthentication)
//   ✅ Carga de datos de usuario desde localStorage
//   ✅ Gestión de roles (Director, Profesor, Secretaria, Admin)
//   ✅ Auto-logout por inactividad (30 minutos configurable)
//   ✅ Limpieza de URL (query params)
//   ✅ Redirección a login si no autenticado
//   ✅ Cierre de sesión (logout)
//   ✅ Sincronización de datos con localStorage
//
// Datos de sesión gestionados:
//   - userData: {username, email, role, nombreCompleto}
//   - userRole: Rol del usuario (usado para permisos)
//   - userName: Nombre completo del usuario
//   - userEmail: Correo electrónico
//
// Seguridad:
//   ✅ Validación de sesión en cada página
//   ✅ Auto-logout por inactividad
//   ✅ Limpieza de datos sensibles en logout
//   ✅ Redirección automática a login si sesión inválida
//
// Flujo de autenticación:
//   1. Usuario inicia sesión en index.html (login.js)
//   2. Backend valida credenciales y retorna datos
//   3. Frontend guarda datos en localStorage
//   4. Auth.js verifica sesión en cada carga de dashboard
//   5. Si sesión válida, permite acceso
//   6. Si sesión inválida, redirige a login
//
// Dependencias:
//   - Constants (para claves de storage y configuraciones)
//   - localStorage (para persistencia de sesión)
// ================================================================================

/**
 * Gestiona la autenticación y sesión del usuario
 */
class Auth {
    constructor() {
        this.userRole = null;
        this.userName = null;
        this.userEmail = null;
        this.currentUser = null;
    }

    /**
     * Inicializa el módulo de autenticación
     */
    init() {
        this.loadUserData();
        this.setupAutoLogout();
        this.cleanURL();
    }

    /**
     * Limpia los parámetros de la URL sin recargar la página
     */
    cleanURL() {
        // Si hay parámetros en la URL (como ?role=admin), eliminarlos
        if (window.location.search) {
            const cleanURL = window.location.pathname;
            window.history.replaceState({}, document.title, cleanURL);
            console.log('✨ URL limpiada');
        }
    }

    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} true si está autenticado
     */
    checkAuthentication() {
        const userData = this.getStorageItem(Constants.STORAGE_KEYS.USER_DATA);
        const userRole = this.getStorageItem(Constants.STORAGE_KEYS.USER_ROLE);

        if (!userData || !userRole) {
            console.log('Usuario no autenticado, redirigiendo al login...');
            alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    /**
     * Carga los datos del usuario desde localStorage
     */
    loadUserData() {
        this.userRole = this.getUserRole();
        this.userName = this.getUserName();
        this.userEmail = this.getUserEmail();
        this.currentUser = this.getCurrentUser();
    }

    /**
     * Obtiene el rol del usuario
     * @returns {string} Rol del usuario
     */
    getUserRole() {
        return this.getStorageItem(Constants.STORAGE_KEYS.USER_ROLE) ||
               Constants.ROLES.SECRETARIA;
    }

    /**
     * Obtiene el nombre del usuario
     * @returns {string} Nombre del usuario
     */
    getUserName() {
        return this.getStorageItem(Constants.STORAGE_KEYS.USER_NAME) || 'Usuario';
    }

    /**
     * Obtiene el email del usuario
     * @returns {string} Email del usuario
     */
    getUserEmail() {
        return this.getStorageItem(Constants.STORAGE_KEYS.USER_EMAIL) ||
               'usuario@universidad.edu';
    }

    /**
     * Obtiene el usuario actual
     * @returns {string} Usuario actual
     */
    getCurrentUser() {
        return this.getStorageItem(Constants.STORAGE_KEYS.CURRENT_USER) || '';
    }

    /**
     * Verifica si el usuario tiene un rol específico
     * @param {string} role - Rol a verificar
     * @returns {boolean} true si tiene el rol
     */
    hasRole(role) {
        return this.userRole === role;
    }

    /**
     * Verifica si el usuario es administrador
     * @returns {boolean} true si es admin
     */
    isAdmin() {
        return this.hasRole(Constants.ROLES.ADMIN);
    }

    /**
     * Verifica si el usuario es secretaria
     * @returns {boolean} true si es secretaria
     */
    isSecretaria() {
        return this.hasRole(Constants.ROLES.SECRETARIA);
    }

    /**
     * Verifica si el usuario tiene un permiso específico
     * @param {string} permission - Permiso a verificar
     * @returns {boolean} true si tiene el permiso
     */
    hasPermission(permission) {
        return AppConfig.hasPermission(this.userRole, permission);
    }

    /**
     * Cierra la sesión del usuario
     */
    logout() {
        console.log('Cerrando sesión...');

        // Limpiar localStorage
        this.clearStorage();

        // Redirigir al login
        window.location.href = 'index.html';
    }

    /**
     * Actualiza los datos del usuario en localStorage
     * @param {Object} userData - Datos del usuario
     */
    updateUserData(userData) {
        if (userData.userName) {
            this.setStorageItem(Constants.STORAGE_KEYS.USER_NAME, userData.userName);
            this.userName = userData.userName;
        }

        if (userData.userEmail) {
            this.setStorageItem(Constants.STORAGE_KEYS.USER_EMAIL, userData.userEmail);
            this.userEmail = userData.userEmail;
        }

        if (userData.userRole) {
            this.setStorageItem(Constants.STORAGE_KEYS.USER_ROLE, userData.userRole);
            this.userRole = userData.userRole;
        }
    }

    /**
     * Configura el auto-logout por inactividad
     */
    setupAutoLogout() {
        if (!AppConfig.security.sessionTimeout) return;

        let inactivityTimer;

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                console.log('Sesión expirada por inactividad');
                alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
                this.logout();
            }, AppConfig.security.sessionTimeout);
        };

        // Eventos que resetean el timer
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // Iniciar el timer
        resetTimer();
    }

    /**
     * Actualiza el timestamp del último acceso
     */
    updateLastAccess() {
        const now = new Date().toISOString();
        this.setStorageItem(Constants.STORAGE_KEYS.LAST_LOGIN, now);
    }

    /**
     * Obtiene el último acceso del usuario
     * @returns {string|null} Fecha del último acceso
     */
    getLastAccess() {
        return this.getStorageItem(Constants.STORAGE_KEYS.LAST_LOGIN);
    }

    // === HELPERS DE STORAGE ===

    /**
     * Obtiene un item de localStorage
     * @param {string} key - Clave del item
     * @returns {string|null} Valor del item
     */
    getStorageItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error('Error al leer de localStorage:', error);
            return null;
        }
    }

    /**
     * Guarda un item en localStorage
     * @param {string} key - Clave del item
     * @param {string} value - Valor del item
     */
    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    }

    /**
     * Elimina un item de localStorage
     * @param {string} key - Clave del item
     */
    removeStorageItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error al eliminar de localStorage:', error);
        }
    }

    /**
     * Limpia todo el localStorage
     */
    clearStorage() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error al limpiar localStorage:', error);
        }
    }

    /**
     * Mapea el rol de la base de datos a formato legible
     * @param {string} dbRol - Rol desde la base de datos
     * @returns {string} Rol formateado
     */
    mapRol(dbRol) {
        return Formatters.formatRole(dbRol);
    }
}

// Exportar la clase
window.Auth = Auth;
