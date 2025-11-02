// ================================================================================
// StatsManager.js - Gestión de estadísticas y acciones rápidas del dashboard
// ================================================================================
// ⚠️ PARCIALMENTE FUNCIONAL: Muestra estadísticas básicas del sistema
// Estado: Operativo con limitaciones
// Endpoint utilizado:
//   - GET /api/stats/overview  (Estadísticas generales del dashboard)
//
// Funcionalidades implementadas:
//   ✅ Carga de estadísticas desde backend
//   ✅ Renderizado de tarjetas estadísticas
//   ✅ Estados de carga (loading)
//   ✅ Manejo de errores
//   ✅ Renderizado de acciones rápidas según rol
//
// Estadísticas actuales (limitadas a módulos funcionales):
//   ✅ Total de usuarios (desde seg.tbUsuario)
//   ⚠️ Usuarios activos (calculado del estado)
//   ✅ Total de accesos (desde seg.tbBitacoraAcceso)
//   ✅ Transacciones realizadas (desde seg.tbBitacoraTransacciones)
//
// Estadísticas no disponibles (módulos no implementados):
//   ❌ Total de productos
//   ❌ Inventario actual
//   ❌ Ventas del mes
//   ❌ Reportes generados
//   ❌ Categorías registradas
//
// Acciones rápidas por rol:
//   - Director: Crear usuario, Ver reportes, Gestionar inventario
//   - Profesor: Ver reportes, Consultar inventario
//   - Secretaria: Registrar venta, Gestionar inventario
//   - Administrativo: Ver usuarios, Ver bitácoras
//
// Nota: Muchas acciones rápidas no funcionan porque dependen de módulos
//       comerciales no implementados (productos, ventas, inventario)
//
// Dependencias:
//   - ApiService (para obtener estadísticas)
// ================================================================================

/**
 * Gestiona las estadísticas del dashboard y las acciones rápidas
 */
class StatsManager {
    constructor(apiService, userRole) {
        this.apiService = apiService;
        this.userRole = userRole;
        this.currentStats = null;
    }

    /**
     * Genera y carga las tarjetas de estadísticas
     */
    async loadStatsCards() {
        console.log('📊 Cargando estadísticas del dashboard...');

        // Mostrar estado de carga
        this.renderLoadingStats();

        try {
            const stats = await this.apiService.getDashboardStats();

            if (stats.success) {
                console.log('✅ Estadísticas obtenidas:', stats.stats);
                this.currentStats = stats.stats;
                this.renderStatsCards();
            } else {
                console.error('❌ Error obteniendo estadísticas:', stats.message);
                this.renderErrorStats();
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            this.renderErrorStats();
        }
    }

    /**
     * Renderiza las tarjetas de estadísticas
     */
    renderStatsCards() {
        const statsConfig = this.getStatsConfig();
        const container = document.getElementById('statsContainer');

        if (!container) {
            console.error('Contenedor #statsContainer no encontrado');
            return;
        }

        container.innerHTML = '';

        statsConfig.forEach(stat => {
            const statCard = this.createStatCard(stat);
            container.appendChild(statCard);
        });

        console.log('✅ Renderizadas', statsConfig.length, 'tarjetas de estadísticas');
    }

    /**
     * Obtiene la configuración de estadísticas según el rol
     * @returns {Array} Configuración de estadísticas
     */
    getStatsConfig() {
        if (!this.currentStats) {
            return this.getDefaultStatsConfig();
        }

        const configs = {
            [Constants.ROLES.ADMIN]: [
                {
                    icon: 'fa-users',
                    value: Formatters.formatNumber(this.currentStats.admin?.usuariosTotal || 0),
                    label: 'Usuarios Totales',
                    color: 'primary'
                },
                {
                    icon: 'fa-user-shield',
                    value: Formatters.formatNumber(this.currentStats.admin?.usuariosActivos || 0),
                    label: 'Usuarios Activos',
                    color: 'success'
                },
                {
                    icon: 'fa-shield-alt',
                    value: Formatters.formatNumber(this.currentStats.admin?.accesosHoy || 0),
                    label: 'Accesos Hoy',
                    color: 'info'
                },
                {
                    icon: 'fa-ban',
                    value: Formatters.formatNumber(this.currentStats.admin?.accesosFallidosHoy || 0),
                    label: 'Fallos Hoy',
                    color: 'warning'
                }
            ],

            [Constants.ROLES.SECRETARIA]: [
                {
                    icon: 'fa-user-shield',
                    value: Formatters.formatNumber(this.currentStats.secretaria?.usuariosActivos || 0),
                    label: 'Usuarios Activos',
                    color: 'primary'
                },
                {
                    icon: 'fa-shield-alt',
                    value: Formatters.formatNumber(this.currentStats.secretaria?.accesosHoy || 0),
                    label: 'Accesos Hoy',
                    color: 'success'
                }
            ]
        };

        return configs[this.userRole] || configs[Constants.ROLES.SECRETARIA];
    }

    /**
     * Obtiene la configuración por defecto (con valores en 0)
     * @returns {Array} Configuración por defecto
     */
    getDefaultStatsConfig() {
        const configs = {
            [Constants.ROLES.ADMIN]: [
                { icon: 'fa-users', value: '0', label: 'Usuarios Totales', color: 'primary' },
                { icon: 'fa-user-shield', value: '0', label: 'Usuarios Activos', color: 'success' },
                { icon: 'fa-shield-alt', value: '0', label: 'Accesos Hoy', color: 'info' },
                { icon: 'fa-ban', value: '0', label: 'Fallos Hoy', color: 'warning' }
            ],
            [Constants.ROLES.SECRETARIA]: [
                { icon: 'fa-user-shield', value: '0', label: 'Usuarios Activos', color: 'primary' },
                { icon: 'fa-shield-alt', value: '0', label: 'Accesos Hoy', color: 'success' }
            ]
        };

        return configs[this.userRole] || configs[Constants.ROLES.SECRETARIA];
    }

    /**
     * Crea una tarjeta de estadística
     * @param {Object} stat - Configuración de la estadística
     * @returns {HTMLElement} Elemento de la tarjeta
     */
    createStatCard(stat) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        if (stat.color) {
            card.setAttribute('data-color', stat.color);
        }

        card.innerHTML = `
            <div class="stat-icon">
                <i class="fas ${stat.icon}"></i>
            </div>
            <div class="stat-info">
                <h3>${stat.value}</h3>
                <p>${stat.label}</p>
            </div>
        `;

        return card;
    }

    /**
     * Renderiza el estado de carga de las estadísticas
     */
    renderLoadingStats() {
        const statsConfig = this.getDefaultStatsConfig().map(stat => ({
            ...stat,
            value: '...'
        }));

        const container = document.getElementById('statsContainer');
        if (!container) return;

        container.innerHTML = '';

        statsConfig.forEach(stat => {
            const statCard = this.createStatCard(stat);
            statCard.classList.add('loading');
            container.appendChild(statCard);
        });
    }

    /**
     * Renderiza el estado de error de las estadísticas
     */
    renderErrorStats() {
        const statsConfig = this.getDefaultStatsConfig().map(stat => ({
            ...stat,
            value: 'Error'
        }));

        const container = document.getElementById('statsContainer');
        if (!container) return;

        container.innerHTML = '';

        statsConfig.forEach(stat => {
            const statCard = this.createStatCard(stat);
            statCard.classList.add('error');
            container.appendChild(statCard);
        });
    }

    /**
     * Genera las acciones rápidas según el rol
     */
    generateQuickActions() {
        const actionsConfig = this.getQuickActionsConfig();
        this.renderQuickActions(actionsConfig);
    }

    /**
     * Obtiene la configuración de acciones rápidas según el rol
     * @returns {Array} Configuración de acciones rápidas
     */
    getQuickActionsConfig() {
        const configs = {
            [Constants.ROLES.ADMIN]: [
                {
                    icon: 'fa-user-shield',
                    title: 'Crear Usuario',
                    description: 'Agregar administrador/secretaria',
                    action: 'showSection',
                    params: { section: Constants.SECTIONS.USERS }
                },
                {
                    icon: 'fa-history',
                    title: 'Ver Bitácoras',
                    description: 'Revisar actividad del sistema',
                    action: 'showSection',
                    params: { section: Constants.SECTIONS.BITACORAS }
                }
            ],

            [Constants.ROLES.SECRETARIA]: [
                {
                    icon: 'fa-user',
                    title: 'Ver Usuarios',
                    description: 'Consultar usuarios del sistema',
                    action: 'showSection',
                    params: { section: Constants.SECTIONS.USERS }
                }
            ]
        };

        return configs[this.userRole] || configs[Constants.ROLES.SECRETARIA];
    }

    /**
     * Renderiza las acciones rápidas
     * @param {Array} actions - Configuración de acciones
     */
    renderQuickActions(actions) {
        const container = document.getElementById('quickActionsContainer');

        if (!container) {
            console.error('Contenedor #quickActionsContainer no encontrado');
            return;
        }

        container.innerHTML = '';

        actions.forEach(action => {
            const actionCard = this.createActionCard(action);
            container.appendChild(actionCard);
        });

        console.log('✅ Renderizadas', actions.length, 'acciones rápidas');
    }

    /**
     * Crea una tarjeta de acción rápida
     * @param {Object} action - Configuración de la acción
     * @returns {HTMLElement} Elemento de la tarjeta
     */
    createActionCard(action) {
        const card = document.createElement('div');
        card.className = 'action-card';

        card.innerHTML = `
            <div class="action-icon">
                <i class="fas ${action.icon}"></i>
            </div>
            <div class="action-info">
                <h4>${action.title}</h4>
                <p>${action.description}</p>
            </div>
            <button class="action-btn"
                    data-action="${action.action}"
                    data-params='${JSON.stringify(action.params)}'>
                <i class="fas fa-arrow-right"></i>
            </button>
        `;

        return card;
    }

    /**
     * Actualiza el rol y regenera las estadísticas y acciones
     * @param {string} newRole - Nuevo rol del usuario
     */
    updateRole(newRole) {
        this.userRole = newRole;
        this.renderStatsCards();
        this.generateQuickActions();
    }

    /**
     * Recarga las estadísticas
     */
    async refresh() {
        await this.loadStatsCards();
    }
}

// Exportar la clase
window.StatsManager = StatsManager;
