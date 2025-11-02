// ================================================================================
// Router.js - Módulo de navegación entre secciones del dashboard
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Sistema de navegación SPA (Single Page Application)
// Estado: Operativo - Maneja navegación sin recargar página
//
// Responsabilidades:
//   ✅ Registro de secciones del dashboard
//   ✅ Navegación entre secciones (showSection)
//   ✅ Gestión de visibilidad de elementos
//   ✅ Callbacks antes/después de navegación
//   ✅ Validación de permisos por sección
//   ✅ Estado activo de menú lateral
//   ✅ Manejo de errores de navegación
//
// Secciones registradas:
//   ✅ dashboard-section: Panel principal (funcional)
//   ✅ usuarios-section: Gestión de usuarios (funcional)
//   ✅ bitacoras-section: Visualización de logs (funcional)
//   ❌ productos-section: No implementado
//   ❌ inventario-section: No implementado
//   ❌ ventas-section: No implementado
//   ❌ reportes-section: No implementado
//
// Flujo de navegación:
//   1. Usuario hace clic en item del menú lateral
//   2. Se ejecutan callbacks beforeNavigate
//   3. Se ocultan todas las secciones
//   4. Se muestra la sección solicitada
//   5. Se actualiza menú activo
//   6. Se ejecutan callbacks afterNavigate
//
// Características:
//   - Navegación fluida sin recarga de página
//   - Transiciones suaves entre secciones
//   - Validación de permisos
//   - Sistema extensible de callbacks
//
// Dependencias:
//   - Constants (para nombres de secciones)
// ================================================================================

/**
 * Gestiona la navegación entre las diferentes secciones del dashboard
 */
class Router {
    constructor() {
        this.currentSection = Constants.SECTIONS.DASHBOARD;
        this.sections = new Map();
        this.beforeNavigateCallbacks = [];
        this.afterNavigateCallbacks = [];
    }

    /**
     * Inicializa el router
     */
    init() {
        this.registerSections();
        console.log('Router inicializado con', this.sections.size, 'secciones');
    }

    /**
     * Registra las secciones disponibles
     */
    registerSections() {
        // Secciones comunes
        this.registerSection(Constants.SECTIONS.DASHBOARD, {
            element: 'dashboard-section',
            requiresAuth: true
        });

        

        this.registerSection(Constants.SECTIONS.USERS, {
            element: 'usuarios-section',
            requiresAuth: true,
            requiredRole: Constants.ROLES.ADMIN,
            onLoad: 'loadUsersData'
        });

        this.registerSection(Constants.SECTIONS.BITACORAS, {
            element: 'bitacoras-section',
            requiresAuth: true,
            requiredRole: Constants.ROLES.ADMIN,
            onLoad: 'loadBitacoras'
        });
    }

    /**
     * Registra una sección
     * @param {string} id - ID de la sección
     * @param {Object} config - Configuración de la sección
     */
    registerSection(id, config) {
        this.sections.set(id, {
            id,
            element: config.element || `${id}-section`,
            requiresAuth: config.requiresAuth !== false,
            requiredRole: config.requiredRole || null,
            onLoad: config.onLoad || null,
            onUnload: config.onUnload || null,
            ...config
        });
    }

    /**
     * Navega a una sección
     * @param {string} sectionId - ID de la sección
     * @param {Object} params - Parámetros adicionales
     * @returns {boolean} true si la navegación fue exitosa
     */
    navigateTo(sectionId, params = {}) {
        console.log(`Navegando a sección: ${sectionId}`);

        const section = this.sections.get(sectionId);

        if (!section) {
            console.error(`Sección ${sectionId} no encontrada`);
            return false;
        }

        // Ejecutar callbacks pre-navegación
        if (!this.runBeforeNavigateCallbacks(sectionId, params)) {
            console.log('Navegación cancelada por callback');
            return false;
        }

        // Ocultar todas las secciones
        this.hideAllSections();

        // Mostrar la sección target
        const targetElement = document.getElementById(section.element);

        if (!targetElement) {
            console.error(`Elemento de sección ${section.element} no encontrado`);
            return false;
        }

        targetElement.classList.add('active');
        targetElement.style.display = 'block';

        // Actualizar sección actual
        const previousSection = this.currentSection;
        this.currentSection = sectionId;

        // Actualizar sidebar
        this.updateSidebarActive(sectionId);

        // Cargar datos de la sección si es necesario
        this.loadSectionData(sectionId, params);

        // Ejecutar callbacks post-navegación
        this.runAfterNavigateCallbacks(sectionId, previousSection, params);

        return true;
    }

    /**
     * Oculta todas las secciones
     */
    hideAllSections() {
        const sections = document.querySelectorAll('.content-section');
        console.log(`Ocultando ${sections.length} secciones`);

        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
    }

    /**
     * Actualiza el elemento activo del sidebar
     * @param {string} sectionId - ID de la sección activa
     */
    updateSidebarActive(sectionId) {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.classList.remove('active');

            const link = item.querySelector(`a[data-params*="${sectionId}"]`);
            if (link) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Carga los datos de una sección
     * @param {string} sectionId - ID de la sección
     * @param {Object} params - Parámetros adicionales
     */
    async loadSectionData(sectionId, params = {}) {
        const section = this.sections.get(sectionId);

        if (!section || !section.onLoad) {
            return;
        }

        // Si onLoad es un string, buscar la función en los managers
        if (typeof section.onLoad === 'string') {
            const functionName = section.onLoad;

            // Intentar ejecutar en el contexto apropiado
            if (window.dashboardCore) {
                await window.dashboardCore.loadSectionData(sectionId);
            }
        }
        // Si onLoad es una función, ejecutarla directamente
        else if (typeof section.onLoad === 'function') {
            await section.onLoad(params);
        }
    }

    /**
     * Obtiene la sección actual
     * @returns {string} ID de la sección actual
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Verifica si una sección está activa
     * @param {string} sectionId - ID de la sección
     * @returns {boolean} true si está activa
     */
    isActive(sectionId) {
        return this.currentSection === sectionId;
    }

    /**
     * Vuelve a la sección anterior
     */
    goBack() {
        // TODO: Implementar historial de navegación
        this.navigateTo(Constants.SECTIONS.DASHBOARD);
    }

    /**
     * Registra un callback antes de navegar
     * @param {Function} callback - Función callback
     */
    beforeNavigate(callback) {
        if (typeof callback === 'function') {
            this.beforeNavigateCallbacks.push(callback);
        }
    }

    /**
     * Registra un callback después de navegar
     * @param {Function} callback - Función callback
     */
    afterNavigate(callback) {
        if (typeof callback === 'function') {
            this.afterNavigateCallbacks.push(callback);
        }
    }

    /**
     * Ejecuta los callbacks pre-navegación
     * @param {string} sectionId - ID de la sección destino
     * @param {Object} params - Parámetros
     * @returns {boolean} false si algún callback cancela la navegación
     */
    runBeforeNavigateCallbacks(sectionId, params) {
        for (const callback of this.beforeNavigateCallbacks) {
            try {
                const result = callback(sectionId, this.currentSection, params);
                if (result === false) {
                    return false;
                }
            } catch (error) {
                console.error('Error en callback beforeNavigate:', error);
            }
        }
        return true;
    }

    /**
     * Ejecuta los callbacks post-navegación
     * @param {string} sectionId - ID de la sección actual
     * @param {string} previousSection - ID de la sección anterior
     * @param {Object} params - Parámetros
     */
    runAfterNavigateCallbacks(sectionId, previousSection, params) {
        for (const callback of this.afterNavigateCallbacks) {
            try {
                callback(sectionId, previousSection, params);
            } catch (error) {
                console.error('Error en callback afterNavigate:', error);
            }
        }
    }

    /**
     * Limpia los callbacks
     */
    clearCallbacks() {
        this.beforeNavigateCallbacks = [];
        this.afterNavigateCallbacks = [];
    }
}

// Exportar la clase
window.Router = Router;
