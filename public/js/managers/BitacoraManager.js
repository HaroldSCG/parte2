// ================================================================================
// BitacoraManager.js - Gestión de bitácoras de accesos y transacciones
// ================================================================================
// ⚠️ PARCIALMENTE FUNCIONAL: Visualización de logs del sistema
// Estado: Operativo con limitaciones
// Conectado a: seg.tbBitacoraAcceso, seg.tbBitacoraTransacciones (definitivo.sql)
// Endpoints utilizados:
//   - GET /api/bitacoras/acceso         (Bitácora de inicios de sesión)
//   - GET /api/bitacoras/transacciones  (Bitácora de operaciones CRUD)
//
// Funcionalidades implementadas:
//   ✅ Visualización de bitácora de accesos
//   ✅ Visualización de bitácora de transacciones
//   ✅ Paginación de registros
//   ✅ Tabs para cambiar entre tipos de bitácora
//   ✅ Formateo de fechas y estados
//
// Limitaciones actuales:
//   ❌ Sin filtros por fecha/rango
//   ❌ Sin filtros por usuario
//   ❌ Sin filtros por tipo de operación
//   ❌ Sin exportación de reportes
//   ❌ Sin búsqueda de registros específicos
//   ⚠️ Solo muestra datos, no permite gestión
//
// Notas:
//   - La tabla tbBitacoraTransacciones registra todas las operaciones CRUD
//   - Actualmente solo registra operaciones de usuarios (módulo funcional)
//   - Cuando se implementen módulos comerciales, registrará sus operaciones
//
// Dependencias:
//   - ApiService (para obtener datos)
//   - UIManager (para loading y mensajes)
//   - Constants (para tipos de bitácora)
// ================================================================================

/**
 * Gestiona las bitácoras del sistema (accesos y transacciones)
 */
class BitacoraManager {
    constructor(apiService, uiManager) {
        this.apiService = apiService;
        this.uiManager = uiManager;
        this.currentType = 'accesos'; // 'accesos' | 'transacciones'
        this.currentPage = 1;
        this.limit = AppConfig.tables.bitacoras.defaultLimit;
    }

    /**
     * Inicializa el manager de bitácoras
     */
    init() {
        console.log('BitacoraManager inicializado');
    }

    /**
     * Muestra una bitácora específica
     * @param {string} type - Tipo de bitácora ('accesos' | 'transacciones')
     */
    showBitacora(type) {
        const isTx = type === Constants.BITACORA.TYPES.TRANSACCIONES;
        this.currentType = type;

        // Actualizar tabs
        this.updateTabs(isTx);

        // Actualizar contenedores
        this.updateContainers(isTx);

        // Actualizar botones de filtro (si existen)
        this.updateFilterButtons(isTx);

        // Cargar datos
        if (isTx) {
            this.loadTransacciones();
        } else {
            this.loadAccesos();
        }
    }

    /**
     * Actualiza los tabs activos
     * @param {boolean} isTransacciones - true si es pestaña de transacciones
     */
    updateTabs(isTransacciones) {
        const tabAccesos = document.getElementById('tabAccesos');
        const tabTransacciones = document.getElementById('tabTransacciones');

        if (tabAccesos) {
            tabAccesos.classList.toggle('active', !isTransacciones);
        }

        if (tabTransacciones) {
            tabTransacciones.classList.toggle('active', isTransacciones);
        }
    }

    /**
     * Actualiza los contenedores visibles
     * @param {boolean} isTransacciones - true si es contenedor de transacciones
     */
    updateContainers(isTransacciones) {
        const containerAccesos = document.getElementById('accesos-bitacora');
        const containerTransacciones = document.getElementById('transacciones-bitacora');

        if (containerAccesos) {
            containerAccesos.classList.toggle('active', !isTransacciones);
            containerAccesos.style.display = isTransacciones ? 'none' : 'block';
        }

        if (containerTransacciones) {
            containerTransacciones.classList.toggle('active', isTransacciones);
            containerTransacciones.style.display = isTransacciones ? 'block' : 'none';
        }
    }

    /**
     * Actualiza los botones de filtro visibles
     * @param {boolean} isTransacciones - true si es pestaña de transacciones
     */
    updateFilterButtons(isTransacciones) {
        const btnAccesos = document.getElementById('accesosFiltersBtn');
        const btnTransacciones = document.getElementById('transaccionesFiltersBtn');

        if (btnAccesos && btnTransacciones) {
            btnAccesos.style.display = isTransacciones ? 'none' : 'block';
            btnTransacciones.style.display = isTransacciones ? 'block' : 'none';
        }
    }

    /**
     * Carga los accesos
     */
    async loadAccesos() {
        try {
            console.log('📋 Cargando bitácora de accesos...');

            if (this.uiManager) {
                this.uiManager.showLoading('accessLogsTable');
            }

            const response = await this.apiService.getBitacoraAccesos({
                page: this.currentPage,
                limit: this.limit
            });

            if (response && response.data) {
                this.renderAccessLogs(response.data);
            } else {
                console.error('Respuesta inválida de bitácora de accesos');
                this.renderAccessLogs([]);
            }
        } catch (error) {
            console.error('Error cargando accesos:', error);

            if (this.uiManager) {
                this.uiManager.showToast('Error cargando bitácora de accesos', 'error');
            }

            this.renderAccessLogs([]);
        } finally {
            if (this.uiManager) {
                this.uiManager.hideLoading('accessLogsTable');
            }
        }
    }

    /**
     * Carga las transacciones
     */
    async loadTransacciones() {
        try {
            console.log('📋 Cargando bitácora de transacciones...');

            if (this.uiManager) {
                this.uiManager.showLoading('txLogsTable');
            }

            const response = await this.apiService.getBitacoraTransacciones({
                page: this.currentPage,
                limit: this.limit
            });

            if (response && response.data) {
                this.renderTransactionLogs(response.data);
            } else {
                console.error('Respuesta inválida de bitácora de transacciones');
                this.renderTransactionLogs([]);
            }
        } catch (error) {
            console.error('Error cargando transacciones:', error);

            if (this.uiManager) {
                this.uiManager.showToast('Error cargando bitácora de transacciones', 'error');
            }

            this.renderTransactionLogs([]);
        } finally {
            if (this.uiManager) {
                this.uiManager.hideLoading('txLogsTable');
            }
        }
    }

    /**
     * Renderiza los logs de accesos
     * @param {Array} rows - Filas de accesos
     */
    renderAccessLogs(rows) {
        // Soportar varios selectores posibles en el HTML
        const tbody =
            document.querySelector('#accessLogsBody') ||
            document.querySelector('#accessLogTable tbody') ||
            document.querySelector('#accesos-bitacora table tbody');

        if (!tbody) {
            console.error('Tabla de accesos no encontrada');
            return;
        }

        if (!rows || rows.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-data">
                        <i class="fas fa-inbox"></i>
                        <p>No hay registros de accesos</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rows.map(row => `
            <tr>
                <td>${row.usuario || 'N/A'}</td>
                <td>${Formatters.formatDateTime(row.fechaHora)}</td>
                <td><span class="role ${row.rol?.toLowerCase() || 'default'}">${Formatters.formatRole(row.rol)}</span></td>
                <td>
                    <span class="badge ${row.estado === 'OK' ? 'badge-success' : 'badge-danger'}">
                        ${row.estado === 'OK' ? 'Exitoso' : 'Fallido'}
                    </span>
                </td>
            </tr>
        `).join('');

        console.log('✅ Renderizados', rows.length, 'accesos');
    }

    /**
     * Renderiza los logs de transacciones
     * @param {Array} rows - Filas de transacciones
     */
    renderTransactionLogs(rows) {
        // Soportar varios selectores posibles en el HTML
        const tbody =
            document.querySelector('#txLogsBody') ||
            document.querySelector('#txLogTable tbody') ||
            document.querySelector('#transacciones-bitacora table tbody');

        if (!tbody) {
            console.error('Tabla de transacciones no encontrada');
            return;
        }

        if (!rows || rows.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-inbox"></i>
                        <p>No hay registros de transacciones</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rows.map(row => `
            <tr>
                <td>${Formatters.formatDateTime(row.fechaHora)}</td>
                <td>${row.id ?? 'N/A'}</td>
                <td>${row.usuario ?? 'N/A'}</td>
                <td>
                    <span class="action ${this.getOperationActionClass(row.operacion)}">
                        ${row.operacion ?? 'N/A'}
                    </span>
                </td>
                <td>${row.entidad ?? 'N/A'}</td>
                <td>${Formatters.truncate(row.detalle ?? '', 50)}</td>
            </tr>
        `).join('');

        console.log('✅ Renderizadas', rows.length, 'transacciones');
    }

    /**
     * Obtiene la clase de acción según el tipo de operación
     * @param {string} operacion - Tipo de operación
     * @returns {string} Clase CSS de la acción
     */
    getOperationActionClass(operacion) {
        if (!operacion) return 'select';

        const op = operacion.toUpperCase();

        if (op.includes('INSERT') || op.includes('CREATE') || op.includes('GENERAR') || op.includes('REGISTR')) {
            return 'insert';
        }

        if (op.includes('UPDATE') || op.includes('EDIT') || op.includes('CAMBIO') || op.includes('ACTUALIZ')) {
            return 'update';
        }

        if (op.includes('DELETE') || op.includes('REMOVE') || op.includes('ELIMIN')) {
            return 'delete';
        }

        if (op.includes('SELECT') || op.includes('VIEW') || op.includes('CONSUL') || op.includes('RESET')) {
            return 'select';
        }

        return 'select';
    }

    /**
     * Carga ambas bitácoras (para inicialización)
     */
    async loadBitacoras() {
        try {
            console.log('📋 Cargando todas las bitácoras...');

            const [accesos, transacciones] = await Promise.all([
                this.apiService.getBitacoraAccesos({
                    page: 1,
                    limit: this.limit
                }),
                this.apiService.getBitacoraTransacciones({
                    page: 1,
                    limit: this.limit
                })
            ]);

            if (accesos && accesos.data) {
                this.renderAccessLogs(accesos.data);
            }

            if (transacciones && transacciones.data) {
                this.renderTransactionLogs(transacciones.data);
            }

            console.log('✅ Bitácoras cargadas');
        } catch (error) {
            console.error('Error cargando bitácoras:', error);

            if (this.uiManager) {
                this.uiManager.showToast('Error cargando bitácoras', 'error');
            }
        }
    }

    /**
     * Recarga la bitácora actual
     */
    async refresh() {
        if (this.currentType === Constants.BITACORA.TYPES.TRANSACCIONES) {
            await this.loadTransacciones();
        } else {
            await this.loadAccesos();
        }
    }

    /**
     * Cambia la página de la bitácora actual
     * @param {number} page - Número de página
     */
    async goToPage(page) {
        this.currentPage = page;
        await this.refresh();
    }

    /**
     * Aplica los filtros de accesos desde el modal
     */
    async applyAccesosFilters() {
        const rol = document.getElementById('accesosFilterRol')?.value || '';
        const usuario = document.getElementById('accesosFilterUsuario')?.value || '';
        const estado = document.getElementById('accesosFilterEstado')?.value || '';
        const fechaInicio = document.getElementById('accesosFilterFechaInicio')?.value || '';
        const fechaFin = document.getElementById('accesosFilterFechaFin')?.value || '';

        console.log('🔍 Aplicando filtros de accesos:', { rol, usuario, estado, fechaInicio, fechaFin });

        try {
            if (this.uiManager) {
                this.uiManager.showLoading('accessLogsTable');
            }

            const response = await this.apiService.getBitacoraAccesos({
                rol,
                usuario,
                estado,
                fechaInicio,
                fechaFin,
                page: 1,
                limit: this.limit
            });

            if (response && response.data) {
                this.renderAccessLogs(response.data);
            } else {
                this.renderAccessLogs([]);
            }

            // Cerrar modal
            if (this.uiManager) {
                this.uiManager.closeModal('accesosFiltersModal');
            }
        } catch (error) {
            console.error('Error aplicando filtros de accesos:', error);
            if (this.uiManager) {
                this.uiManager.showToast('Error aplicando filtros', 'error');
            }
        } finally {
            if (this.uiManager) {
                this.uiManager.hideLoading('accessLogsTable');
            }
        }
    }

    /**
     * Limpia los filtros de accesos
     */
    async clearAccesosFilters() {
        // Limpiar inputs
        const rolSelect = document.getElementById('accesosFilterRol');
        const usuarioInput = document.getElementById('accesosFilterUsuario');
        const estadoSelect = document.getElementById('accesosFilterEstado');
        const fechaInicioInput = document.getElementById('accesosFilterFechaInicio');
        const fechaFinInput = document.getElementById('accesosFilterFechaFin');

        if (rolSelect) rolSelect.value = '';
        if (usuarioInput) usuarioInput.value = '';
        if (estadoSelect) estadoSelect.value = '';
        if (fechaInicioInput) fechaInicioInput.value = '';
        if (fechaFinInput) fechaFinInput.value = '';

        // Recargar sin filtros
        await this.loadAccesos();
    }
}

// Exportar la clase
window.BitacoraManager = BitacoraManager;
