// ================================================================================
// ApiService.js - Módulo para manejo de llamadas a la API
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Capa de comunicación con el backend
// Estado: Operativo - Maneja todas las peticiones HTTP
//
// Endpoints implementados actualmente:
//   ✅ Usuarios:
//      GET    /api/usuarios              (Listar usuarios)
//      GET    /api/usuarios/:id          (Obtener usuario por ID)
//      POST   /api/usuarios              (Crear usuario)
//      PUT    /api/usuarios/:id          (Actualizar usuario)
//      DELETE /api/usuarios/:id          (Eliminar usuario)
//
//   ✅ Bitácoras:
//      GET    /api/bitacoras/acceso      (Bitácora de accesos)
//      GET    /api/bitacoras/transacciones (Bitácora de transacciones)
//
//   ✅ Estadísticas:
//      GET    /api/stats/overview        (Estadísticas generales)
//
//   ⚠️ Autenticación (manejada en server.js):
//      POST   /login                     (Iniciar sesión)
//      POST   /logout                    (Cerrar sesión)
//      POST   /forgot-password           (Recuperar contraseña)
//      POST   /reset-password            (Resetear contraseña)
//
//   ❌ Endpoints no implementados (módulos comerciales):
//      - /api/categorias, /api/productos, /api/inventario, /api/ventas, /api/reportes
//
// Funcionalidades:
//   ✅ Peticiones HTTP (GET, POST, PUT, DELETE)
//   ✅ Manejo de errores centralizado
//   ✅ Logging de peticiones/respuestas
//   ✅ Construcción de query strings
//   ✅ Headers personalizados
// ================================================================================

class ApiService {
    constructor() {
        this.baseUrl = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    // === MÉTODOS AUXILIARES ===
    async makeRequest(url, options = {}) {
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                console.error(`❌ API Error: ${response.status} - ${data.message || 'Error desconocido'}`);
                throw new Error(data.message || `Error HTTP ${response.status}`);
            }

            console.log(`✅ API Response: ${url}`, data);
            return data;

        } catch (error) {
            console.error(`❌ Network Error:`, error);
            throw error;
        }
    }

    async get(url, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const full = qs ? `${this.baseUrl}${url}?${qs}` : `${this.baseUrl}${url}`;
        return this.makeRequest(full, { method: 'GET' });
    }

    getBitacoraAccesos(params) { return this.get('/api/bitacora/accesos', params); }
    getBitacoraTransacciones(params) { return this.get('/api/bitacora/transacciones', params); }


    async post(url, data = {}) {
        return this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(url, data = {}) {
        return this.makeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(url, data = {}) {
        return this.makeRequest(url, {
            method: 'DELETE',
            body: JSON.stringify(data)
        });
    }

    // === AUTENTICACIÓN ===
    async login(credentials) {
        try {
            return await this.post('/api/login', credentials);
        } catch (error) {
            throw new Error('Error de conexión al servidor de autenticación');
        }
    }

    // === DASHBOARD STATS ===
    async getDashboardStats() {
        try {
            return await this.get('/api/dashboard-stats');
        } catch (error) {
            throw new Error('Error obteniendo estadísticas del dashboard');
        }
    }

    //

    // === GESTIÓN DE USUARIOS ===
    async getUsers() {
        try {
            return await this.get('/api/usuarios');
        } catch (error) {
            throw new Error('Error obteniendo lista de usuarios');
        }
    }

    async createUser(userData) {
        try {
            return await this.post('/api/usuarios', userData);
        } catch (error) {
            throw new Error('Error creando usuario: ' + error.message);
        }
    }

    async getUserById(userId) {
        try {
            return await this.get(`/api/usuarios/${userId}`);
        } catch (error) {
            throw new Error('Error obteniendo datos del usuario');
        }
    }

    async updateUser(userId, userData) {
        try {
            return await this.put(`/api/usuarios/${userId}`, userData);
        } catch (error) {
            throw new Error('Error actualizando usuario: ' + error.message);
        }
    }

  async deleteUser(userId, data) {
    try {
      return await this.delete(`/api/usuarios/${userId}`, data);
    } catch (error) {
      throw new Error('Error eliminando usuario: ' + error.message);
    }
  }

  // Deshabilitar/Habilitar usuario (eliminación lógica)
  async disableUser(userId, data) {
    try {
      return await this.post(`/api/usuarios/${userId}/disable`, data);
    } catch (error) {
      throw new Error('Error deshabilitando usuario: ' + error.message);
    }
  }

  async enableUser(userId, data) {
    try {
      return await this.post(`/api/usuarios/${userId}/enable`, data);
    } catch (error) {
      throw new Error('Error habilitando usuario: ' + error.message);
    }
  }

    async resetPassword(userId, data) {
        try {
            return await this.post(`/api/usuarios/${userId}/reset-password`, data);
        } catch (error) {
            throw new Error('Error reseteando contraseña: ' + error.message);
        }
    }

    // === CAMBIO DE CONTRASEÑA ===
    async changePassword(passwordData) {
        try {
            return await this.post('/api/usuarios/cambiar-password', passwordData);
        } catch (error) {
            throw new Error('Error cambiando contraseña: ' + error.message);
        }
    }

    // === GESTIÓN DE PERFIL ===
    async updateProfile(profileData) {
        try {
            return await this.put('/api/perfil', profileData);
        } catch (error) {
            throw new Error('Error actualizando perfil: ' + error.message);
        }
    }

    // === BITÁCORAS ===
    async getBitacoraAccesos(params = {}) {
        try {
            const queryParams = {
                rol: params.rol || '',
                usuario: params.usuario || '',
                estado: params.estado || '',
                fechaInicio: params.fechaInicio || '',
                fechaFin: params.fechaFin || '',
                page: params.page || 1,
                limit: params.limit || 10
            };

            return await this.get('/api/bitacora/accesos', queryParams);
        } catch (error) {
            throw new Error('Error obteniendo bitácora de accesos');
        }
    }

    async getBitacoraTransacciones(params = {}) {
        try {
            const queryParams = {
                usuario: params.usuario || '',
                accion: params.accion || '',
                tabla: params.tabla || '',
                fechaInicio: params.fechaInicio || '',
                fechaFin: params.fechaFin || '',
                page: params.page || 1,
                limit: params.limit || 10
            };

            return await this.get('/api/bitacora/transacciones', queryParams);
        } catch (error) {
            throw new Error('Error obteniendo bitácora de transacciones');
        }
    }

    // === REPORTES ===
    async generateReport(reportType, params = {}) {
        try {
            return await this.post(`/api/reportes/${reportType}`, params);
        } catch (error) {
            throw new Error('Error generando reporte: ' + error.message);
        }
    }

    async downloadReport(reportId) {
        try {
            const response = await fetch(`/api/reportes/${reportId}/download`);

            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}`);
            }

            return response.blob();
        } catch (error) {
            throw new Error('Error descargando reporte: ' + error.message);
        }
    }

    // === CONFIGURACIÓN DEL SISTEMA ===
    async getSystemConfig() {
        try {
            return await this.get('/api/config');
        } catch (error) {
            throw new Error('Error obteniendo configuración del sistema');
        }
    }

    async updateSystemConfig(configData) {
        try {
            return await this.put('/api/config', configData);
        } catch (error) {
            throw new Error('Error actualizando configuración: ' + error.message);
        }
    }

    // === BÚSQUEDA GLOBAL ===
    async globalSearch(query, filters = {}) {
        try {
            const params = {
                q: query,
                ...filters
            };

            return await this.get('/api/search', params);
        } catch (error) {
            throw new Error('Error en búsqueda global: ' + error.message);
        }
    }

    // === NOTIFICACIONES ===
    async getNotifications(userId) {
        try {
            return await this.get(`/api/notificaciones/${userId}`);
        } catch (error) {
            throw new Error('Error obteniendo notificaciones');
        }
    }

    async markNotificationRead(notificationId) {
        try {
            return await this.put(`/api/notificaciones/${notificationId}/read`);
        } catch (error) {
            throw new Error('Error marcando notificación como leída');
        }
    }

    async markAllNotificationsRead(userId) {
        try {
            return await this.put(`/api/notificaciones/${userId}/read-all`);
        } catch (error) {
            throw new Error('Error marcando todas las notificaciones como leídas');
        }
    }

    // === BACKUP Y RESTAURACIÓN ===
    async createBackup() {
        try {
            return await this.post('/api/backup');
        } catch (error) {
            throw new Error('Error creando backup: ' + error.message);
        }
    }

    async getBackupList() {
        try {
            return await this.get('/api/backup/list');
        } catch (error) {
            throw new Error('Error obteniendo lista de backups');
        }
    }

    async restoreBackup(backupId) {
        try {
            return await this.post(`/api/backup/${backupId}/restore`);
        } catch (error) {
            throw new Error('Error restaurando backup: ' + error.message);
        }
    }

    // === ESTADÍSTICAS AVANZADAS ===
    async getAdvancedStats(params = {}) {
        try {
            return await this.get('/api/stats/advanced', params);
        } catch (error) {
            throw new Error('Error obteniendo estadísticas avanzadas');
        }
    }

    async getUserStats(userId) {
        try {
            return await this.get(`/api/stats/usuarios/${userId}`);
        } catch (error) {
            throw new Error('Error obteniendo estadísticas del usuario');
        }
    }

    // === VALIDACIONES ===
    async validateEmail(email) {
        try {
            return await this.post('/api/validate/email', { email });
        } catch (error) {
            throw new Error('Error validando email');
        }
    }

    async validateUser(username) {
        try {
            return await this.post('/api/validate/usuario', { username });
        } catch (error) {
            throw new Error('Error validando usuario');
        }
    }

    //

    // === HEALTH CHECK ===
    async healthCheck() {
        try {
            return await this.get('/api/health');
        } catch (error) {
            throw new Error('Error verificando estado del servidor');
        }
    }

    // === LOGS DEL SISTEMA ===
    async getSystemLogs(params = {}) {
        try {
            return await this.get('/api/logs', params);
        } catch (error) {
            throw new Error('Error obteniendo logs del sistema');
        }
    }

    // === UTILIDADES ===
    setAuthToken(token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    removeAuthToken() {
        delete this.defaultHeaders['Authorization'];
    }

    setRequestTimeout(timeout) {
        this.timeout = timeout;
    }

    // Método para interceptar respuestas y manejar errores globales
    addResponseInterceptor(interceptor) {
        this.responseInterceptor = interceptor;
    }

    // Método para agregar headers personalizados
    addHeader(key, value) {
        this.defaultHeaders[key] = value;
    }

    removeHeader(key) {
        delete this.defaultHeaders[key];
    }

    // === MANEJO DE ERRORES ESPECÍFICOS ===
    handleApiError(error) {
        if (error.message.includes('401')) {
            // Token expirado, redirigir al login
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }

        if (error.message.includes('403')) {
            return 'No tienes permisos para realizar esta acción';
        }

        if (error.message.includes('404')) {
            return 'El recurso solicitado no fue encontrado';
        }

        if (error.message.includes('500')) {
            return 'Error interno del servidor. Por favor, intenta nuevamente.';
        }

        return error.message || 'Error desconocido';
    }
}

// Exportar la clase
window.ApiService = ApiService;
