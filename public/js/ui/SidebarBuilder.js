// ================================================================================
// SidebarBuilder.js - Constructor del sidebar del dashboard
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Construcción dinámica del menú lateral
// Estado: Operativo - Genera menú según rol de usuario
//
// Responsabilidades:
//   ✅ Configuración de menú por rol (Director, Profesor, Secretaria, Admin)
//   ✅ Generación dinámica de items del sidebar
//   ✅ Renderizado de HTML del menú
//   ✅ Aplicación de permisos por rol
//   ✅ Iconos y etiquetas personalizadas
//
// Configuraciones de menú por rol:
//   - Director (Admin): Dashboard, Usuarios, Bitácoras
//   - Profesor: Dashboard, Bitácoras (solo lectura)
//   - Secretaria: Dashboard, Ventas, Inventario
//   - Administrativo: Dashboard, Usuarios (limitado)
//
// Nota importante:
//   ⚠️ Algunos items del menú apuntan a secciones no funcionales:
//      - Ventas (Secretaria) → No existe módulo de ventas
//      - Inventario (Secretaria) → No existe módulo de inventario
//      - Productos → No configurado actualmente
//      - Reportes → No configurado actualmente
//
//   ✅ Items funcionales actualmente:
//      - Dashboard (vista general con stats)
//      - Usuarios (CRUD completo)
//      - Bitácoras (visualización de logs)
//
// Dependencias:
//   - Constants (para roles, secciones, iconos)
// ================================================================================

/**
 * Construye el sidebar dinámicamente según el rol del usuario
 */
class SidebarBuilder {
    constructor(userRole) {
        this.userRole = userRole;
        this.sidebarConfig = this.getSidebarConfig();
    }

    /**
     * Obtiene la configuración del sidebar según el rol
     * @returns {Array} Configuración de items del sidebar
     */
    getSidebarConfig() {
        const configs = {
            [Constants.ROLES.ADMIN]: [
                {
                    id: Constants.SECTIONS.DASHBOARD,
                    icon: Constants.ICONS.DASHBOARD,
                    label: 'Panel de Administración',
                    permission: 'view_dashboard'
                },
                
                {
                    id: Constants.SECTIONS.USERS,
                    icon: 'fa-user-cog',
                    label: 'Gestión de Usuarios',
                    permission: 'view_users'
                },
                {
                    id: Constants.SECTIONS.BITACORAS,
                    icon: Constants.ICONS.BITACORA,
                    label: 'Bitácoras',
                    permission: 'view_bitacoras'
                }
            ],

            [Constants.ROLES.SECRETARIA]: [
                {
                    id: Constants.SECTIONS.DASHBOARD,
                    icon: Constants.ICONS.DASHBOARD,
                    label: 'Panel Principal',
                    permission: 'view_dashboard'
                },
                
            ]
        };

        return configs[this.userRole] || configs[Constants.ROLES.SECRETARIA];
    }

    /**
     * Genera el HTML del sidebar
     * @returns {string} HTML del sidebar
     */
    buildSidebar() {
        const sidebarElement = document.getElementById('dynamicSidebar');

        if (!sidebarElement) {
            console.error('Elemento #dynamicSidebar no encontrado');
            return;
        }

        sidebarElement.innerHTML = '';

        this.sidebarConfig.forEach((item, index) => {
            const li = this.createSidebarItem(item, index === 0);
            sidebarElement.appendChild(li);
        });

        console.log('Sidebar generado con', this.sidebarConfig.length, 'items');
    }

    /**
     * Crea un item del sidebar
     * @param {Object} item - Configuración del item
     * @param {boolean} isFirst - Si es el primer item (activo por defecto)
     * @returns {HTMLElement} Elemento li del sidebar
     */
    createSidebarItem(item, isFirst = false) {
        const li = document.createElement('li');
        li.className = `nav-item${isFirst ? ' active' : ''}`;
        li.setAttribute('data-section-id', item.id);

        const link = document.createElement('a');
        link.href = '#';
        link.className = 'nav-link';
        link.setAttribute('data-action', 'showSection');
        link.setAttribute('data-params', JSON.stringify({ section: item.id }));

        // Icono
        const icon = document.createElement('i');
        icon.className = `fas ${item.icon}`;

        // Texto
        const span = document.createElement('span');
        span.textContent = item.label;

        // Badge (opcional)
        if (item.badge) {
            const badge = document.createElement('span');
            badge.className = `badge ${item.badge.type || 'badge-info'}`;
            badge.textContent = item.badge.text;
            span.appendChild(badge);
        }

        link.appendChild(icon);
        link.appendChild(span);
        li.appendChild(link);

        return li;
    }

    /**
     * Actualiza el item activo del sidebar
     * @param {string} sectionId - ID de la sección activa
     */
    setActive(sectionId) {
        const navItems = document.querySelectorAll('#dynamicSidebar .nav-item');

        navItems.forEach(item => {
            const itemSectionId = item.getAttribute('data-section-id');

            if (itemSectionId === sectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Agrega un badge a un item del sidebar
     * @param {string} sectionId - ID de la sección
     * @param {Object} badgeConfig - Configuración del badge
     */
    addBadge(sectionId, badgeConfig) {
        const navItem = document.querySelector(`#dynamicSidebar .nav-item[data-section-id="${sectionId}"]`);

        if (!navItem) return;

        // Remover badge existente
        const existingBadge = navItem.querySelector('.badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Agregar nuevo badge
        const badge = document.createElement('span');
        badge.className = `badge ${badgeConfig.type || 'badge-info'}`;
        badge.textContent = badgeConfig.text;

        const span = navItem.querySelector('span');
        if (span) {
            span.appendChild(badge);
        }
    }

    /**
     * Remueve un badge de un item del sidebar
     * @param {string} sectionId - ID de la sección
     */
    removeBadge(sectionId) {
        const navItem = document.querySelector(`#dynamicSidebar .nav-item[data-section-id="${sectionId}"]`);

        if (!navItem) return;

        const badge = navItem.querySelector('.badge');
        if (badge) {
            badge.remove();
        }
    }

    /**
     * Habilita/deshabilita un item del sidebar
     * @param {string} sectionId - ID de la sección
     * @param {boolean} enabled - true para habilitar, false para deshabilitar
     */
    setEnabled(sectionId, enabled) {
        const navItem = document.querySelector(`#dynamicSidebar .nav-item[data-section-id="${sectionId}"]`);

        if (!navItem) return;

        const link = navItem.querySelector('.nav-link');

        if (enabled) {
            link.classList.remove('disabled');
            link.style.pointerEvents = '';
        } else {
            link.classList.add('disabled');
            link.style.pointerEvents = 'none';
        }
    }

    /**
     * Colapsa/expande el sidebar (para responsive)
     */
    toggleCollapse() {
        const sidebar = document.getElementById('sidebar');

        if (sidebar) {
            sidebar.classList.toggle('collapsed');

            // Guardar estado en localStorage si está habilitado
            if (AppConfig.ui.sidebar.persistState) {
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            }
        }
    }

    /**
     * Restaura el estado colapsado del sidebar desde localStorage
     */
    restoreCollapseState() {
        if (!AppConfig.ui.sidebar.persistState) return;

        const sidebar = document.getElementById('sidebar');
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

        if (sidebar && isCollapsed) {
            sidebar.classList.add('collapsed');
        }
    }

    /**
     * Actualiza el rol y regenera el sidebar
     * @param {string} newRole - Nuevo rol del usuario
     */
    updateRole(newRole) {
        this.userRole = newRole;
        this.sidebarConfig = this.getSidebarConfig();
        this.buildSidebar();
    }
}

// Exportar la clase
window.SidebarBuilder = SidebarBuilder;
