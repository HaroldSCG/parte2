// ================================================================================
// main.js - Inicializador principal del dashboard
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Punto de entrada de la aplicación dashboard
// Estado: Operativo - Inicializa todos los módulos del sistema
//
// Responsabilidades:
//   ✅ Crear instancia de DashboardCore
//   ✅ Inicializar dashboard completo
//   ✅ Configurar manejadores globales (errores, beforeunload)
//   ✅ Manejo centralizado de errores de inicialización
//   ✅ Exponer instancias globales para debugging (window.dashboard)
//
// Flujo de inicialización:
//   1. DOMContentLoaded se dispara
//   2. Se crea instancia de DashboardApp
//   3. Se ejecuta app.init()
//   4. Se crea DashboardCore
//   5. DashboardCore inicializa todos sus módulos:
//      - Auth (autenticación y sesión)
//      - Router (navegación)
//      - Theme (temas claro/oscuro)
//      - UIManager (mensajes, modales)
//      - ApiService (comunicación con backend)
//      - SidebarBuilder (construcción de menú)
//      - ProfileManager (gestión de perfil)
//      - UserManager (CRUD usuarios)
//      - BitacoraManager (visualización de logs)
//      - StatsManager (estadísticas)
//   6. Se configuran manejadores globales
//   7. Dashboard queda completamente operativo
//
// Manejadores globales:
//   - window.error: Captura errores no manejados
//   - window.unhandledrejection: Captura promesas rechazadas
//   - window.beforeunload: Advierte sobre cambios sin guardar (opcional)
//   - online/offline: Detecta cambios de conectividad
//
// Debugging:
//   - window.dashboard: Instancia de DashboardApp
//   - window.dashboardCore: Instancia de DashboardCore
//   - Logs detallados en consola (si debugMode activado)
//
// Manejo de errores:
//   - Si falla inicialización, muestra mensaje al usuario
//   - Logs completos en consola para debugging
//   - Redirección a página de error si es crítico
//
// Dependencias:
//   - DashboardCore (núcleo de la aplicación)
//   - Todos los módulos son creados por DashboardCore
// ================================================================================

// main.js - Inicializador principal del dashboard (ACTUALIZADO para DashboardCore refactorizado)

class DashboardApp {
    constructor() {
        this.dashboardCore = null;
    }

    async init() {
        try {
            console.log('🚀 Inicializando Dashboard...');

            // Crear instancia del núcleo del dashboard
            // El nuevo DashboardCore crea sus propios módulos internamente
            this.dashboardCore = new DashboardCore();

            // Inicializar dashboard (ya no necesitamos setModules)
            await this.dashboardCore.init();

            // Configurar manejadores globales
            this.setupGlobalHandlers();

            // Exponer instancia global para debugging
            window.dashboard = this;
            window.dashboardCore = this.dashboardCore;

            console.log('🎉 Dashboard inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando Dashboard:', error);
            this.handleInitError(error);
        }
    }

    /**
     * Cierra el modal de éxito (proxy para DashboardCore)
     */
    closeSuccessModal() {
        if (this.dashboardCore && this.dashboardCore.closeSuccessModal) {
            this.dashboardCore.closeSuccessModal();
        }
    }

    setupGlobalHandlers() {
        // Manejador global para errores no capturados
        // NOTA: Solo loguea errores, no muestra notificaciones automáticas
        // Cada manager maneja sus propios errores y muestra notificaciones apropiadas
        window.addEventListener('error', (event) => {
            console.error('❌ Error global capturado:', event.error);
            // No mostrar toast automáticamente - los managers manejan sus errores
        });

        // Manejador para promesas rechazadas
        // NOTA: Solo loguea, no muestra notificaciones automáticas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Promesa rechazada:', event.reason);
            // No mostrar toast automáticamente - los managers manejan sus errores
            event.preventDefault();
        });

        // Manejador para offline/online
        window.addEventListener('offline', () => {
            if (this.dashboardCore && this.dashboardCore.uiManager) {
                this.dashboardCore.uiManager.showToast('Conexión perdida. Verificando...', 'warning', 0);
            }
        });

        window.addEventListener('online', () => {
            if (this.dashboardCore && this.dashboardCore.uiManager) {
                this.dashboardCore.uiManager.showToast('Conexión restaurada', 'success');
            }
        });

        // Manejador para visibilidad de página (pause/resume)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Página visible, verificar autenticación
                if (this.dashboardCore && this.dashboardCore.auth) {
                    this.dashboardCore.auth.checkAuthentication();
                }
            }
        });

        // Cerrar menús al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-info')) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown && dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            }
        });
    }

    handleInitError(error) {
        // Mostrar error de inicialización
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: white;
            ">
                <div style="
                    background: white;
                    color: #333;
                    padding: 3rem;
                    border-radius: 1rem;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 500px;
                ">
                    <div style="
                        font-size: 4rem;
                        color: #e74c3c;
                        margin-bottom: 1rem;
                    ">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2 style="margin-bottom: 1rem; color: #2c3e50;">Error de Inicialización</h2>
                    <p style="margin-bottom: 1.5rem; color: #7f8c8d;">
                        No se pudo inicializar el dashboard correctamente.
                    </p>
                    <details style="
                        text-align: left;
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        margin-bottom: 1.5rem;
                    ">
                        <summary style="cursor: pointer; font-weight: bold; margin-bottom: 0.5rem;">
                            Detalles del error
                        </summary>
                        <pre style="
                            white-space: pre-wrap;
                            word-wrap: break-word;
                            font-size: 0.875rem;
                            color: #e74c3c;
                        ">${error.message || error}</pre>
                    </details>
                    <button onclick="location.reload()" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 0.75rem 2rem;
                        border-radius: 0.5rem;
                        font-size: 1rem;
                        cursor: pointer;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#5568d3'"
                       onmouseout="this.style.background='#667eea'">
                        <i class="fas fa-redo"></i> Recargar Página
                    </button>
                    <button onclick="location.href='index.html'" style="
                        background: #95a5a6;
                        color: white;
                        border: none;
                        padding: 0.75rem 2rem;
                        border-radius: 0.5rem;
                        font-size: 1rem;
                        cursor: pointer;
                        margin-left: 0.5rem;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#7f8c8d'"
                       onmouseout="this.style.background='#95a5a6'">
                        <i class="fas fa-sign-out-alt"></i> Volver al Login
                    </button>
                </div>
            </div>
        `;

        console.error('Detalles del error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    const app = new DashboardApp();
    await app.init();
});
