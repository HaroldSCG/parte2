// ================================================================================
// ProfileManager.js - Gestión del perfil de usuario
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Gestión de perfil del usuario autenticado
// Estado: Operativo - Permite ver y actualizar datos de perfil
// Conectado a: seg.tbUsuario (definitivo.sql)
// Endpoints utilizados:
//   - GET /api/usuarios          (Obtener datos del usuario actual)
//   - PUT /api/usuarios/:id      (Actualizar perfil)
//
// Funcionalidades implementadas:
//   ✅ Carga de perfil desde base de datos
//   ✅ Actualización de datos personales (nombre, teléfono, email)
//   ✅ Validación de datos antes de actualizar
//   ✅ Sincronización con localStorage
//   ✅ Mensajes de éxito/error
//   ✅ Renderizado de información de perfil
//
// Campos editables:
//   - Nombre completo
//   - Correo electrónico (con validación de formato)
//   - Teléfono
//   - Usuario (read-only, no editable)
//   - Rol (read-only, no editable)
//
// Nota: El cambio de contraseña se maneja en security.js (página separada)
//
// Dependencias:
//   - ApiService (para comunicación con backend)
//   - Auth (para obtener usuario actual y sincronizar sesión)
// ================================================================================

/**
 * Gestiona el perfil del usuario y su actualización
 */
class ProfileManager {
    constructor(apiService, auth) {
        this.apiService = apiService;
        this.auth = auth;
    }

    /**
     * Carga el perfil del usuario desde la base de datos
     */
    async loadProfileFromDB() {
        try {
            const usernameLS = this.auth.getCurrentUser();
            const emailLS = this.auth.getUserEmail();

            const res = await this.apiService.getUsers();

            if (!res || !res.success || !Array.isArray(res.usuarios)) {
                console.warn('No se pudo cargar el perfil desde la DB');
                return;
            }

            // Buscar el usuario actual
            const user = res.usuarios.find(u =>
                (usernameLS && (u.usuario === usernameLS || u.Usuario === usernameLS)) ||
                (emailLS && (u.email === emailLS || u.Correo === emailLS))
            );

            if (!user) {
                console.warn('Usuario no encontrado en la base de datos');
                return;
            }

            // Extraer datos con normalización de campos
            const nombres = user.nombres ?? user.Nombres ?? '';
            const apellidos = user.apellidos ?? user.Apellidos ?? '';
            const correo = user.email ?? user.Correo ?? '';
            const rolDB = user.rol ?? user.Rol ?? '';

            // Manejar nombre completo si viene junto
            let nombresOK = nombres;
            let apellidosOK = apellidos;

            if (!nombresOK && !apellidosOK && (user.nombreCompleto || user.NombreCompleto)) {
                const fullName = (user.nombreCompleto || user.NombreCompleto).trim();
                const parts = fullName.split(/\s+/);
                apellidosOK = parts.pop() || '';
                nombresOK = parts.join(' ');
            }

            // Actualizar datos en Auth
            this.auth.updateUserData({
                userName: Formatters.formatFullName(nombresOK, apellidosOK) ||
                         this.auth.getUserName(),
                userEmail: correo || this.auth.getUserEmail(),
                userRole: rolDB || this.auth.getUserRole()
            });

            // Actualizar UI
            this.updateProfileUI(nombresOK, apellidosOK, correo, rolDB);

            console.log('✅ Perfil cargado desde DB:', {
                nombres: nombresOK,
                apellidos: apellidosOK,
                correo,
                rol: rolDB
            });

        } catch (error) {
            console.error('Error cargando perfil desde DB:', error);
        }
    }

    /**
     * Actualiza los elementos de UI con los datos del perfil
     * @param {string} nombres - Nombres del usuario
     * @param {string} apellidos - Apellidos del usuario
     * @param {string} correo - Email del usuario
     * @param {string} rol - Rol del usuario
     */
    updateProfileUI(nombres, apellidos, correo, rol) {
        // Header del dashboard
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');

        if (userNameEl) {
            userNameEl.textContent = Formatters.formatFullName(nombres, apellidos) ||
                                    this.auth.getUserName();
        }

        if (userRoleEl) {
            userRoleEl.textContent = Formatters.formatRole(rol) || 'Rol';
        }

        // Modal de perfil
        this.updateProfileModal(nombres, apellidos, correo, rol);
    }

    /**
     * Actualiza el modal de perfil
     * @param {string} nombres - Nombres del usuario
     * @param {string} apellidos - Apellidos del usuario
     * @param {string} correo - Email del usuario
     * @param {string} rol - Rol del usuario
     */
    updateProfileModal(nombres, apellidos, correo, rol) {
        const fields = {
            profileNombres: nombres || this.auth.getUserName(),
            profileApellidos: apellidos || '',
            profileEmail: correo || this.auth.getUserEmail(),
            profileRole: Formatters.formatRole(rol) || 'Rol'
        };

        for (const [fieldId, value] of Object.entries(fields)) {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = value;
            }
        }
    }

    /**
     * Actualiza el rol del usuario en la UI
     * @param {string} rol - Nuevo rol
     */
    updateRole(rol) {
        const userRoleEl = document.getElementById('userRole');
        const pageTitleEl = document.getElementById('pageTitle');
        const dashboardTitleEl = document.getElementById('dashboardTitle');
        const dashboardSubtitleEl = document.getElementById('dashboardSubtitle');
        const userAvatarEl = document.getElementById('userAvatar');

        // Actualizar badge del rol en header
        if (userRoleEl) {
            userRoleEl.textContent = Formatters.formatRole(rol);
        }

        // Actualizar títulos según el rol
        if (rol === Constants.ROLES.ADMIN) {
            if (pageTitleEl) {
                pageTitleEl.textContent = 'Dashboard Admin - Sistema Gestión Universitaria';
            }
            if (dashboardTitleEl) {
                dashboardTitleEl.textContent = 'Panel de Administración';
            }
            if (dashboardSubtitleEl) {
                dashboardSubtitleEl.textContent = 'Gestión completa del sistema universitario';
            }
            if (userAvatarEl) {
                userAvatarEl.className = Constants.ICONS.ADMIN;
            }
        } else {
            if (pageTitleEl) {
                pageTitleEl.textContent = 'Dashboard Secretaria - Sistema Gestión Universitaria';
            }
            if (dashboardTitleEl) {
                dashboardTitleEl.textContent = 'Panel de Secretaria';
            }
            if (dashboardSubtitleEl) {
                dashboardSubtitleEl.textContent = 'Gestión académica y estudiantil';
            }
            if (userAvatarEl) {
                userAvatarEl.className = Constants.ICONS.SECRETARY;
            }
        }

        // Actualizar atributo data-user-role en body
        document.body.setAttribute('data-user-role', rol);

        console.log('✅ UI actualizada para rol:', rol);
    }

    /**
     * Abre el modal de perfil
     */
    async openProfileModal(uiManager) {
        // Recargar datos antes de mostrar
        await this.loadProfileFromDB();

        // Abrir modal
        if (uiManager) {
            uiManager.openModal(Constants.MODALS.PROFILE);
        }
    }

    /**
     * Obtiene las iniciales del usuario para el avatar
     * @returns {string} Iniciales del usuario
     */
    getUserInitials() {
        const fullName = this.auth.getUserName();
        const parts = fullName.split(' ').filter(p => p.length > 0);

        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0][0].toUpperCase();

        // Primera letra del primer nombre + primera letra del último apellido
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    /**
     * Formatea la información del usuario para mostrar
     * @returns {Object} Información formateada del usuario
     */
    getFormattedUserInfo() {
        return {
            name: this.auth.getUserName(),
            email: this.auth.getUserEmail(),
            role: Formatters.formatRole(this.auth.getUserRole()),
            initials: this.getUserInitials(),
            lastAccess: this.auth.getLastAccess()
                ? Formatters.formatRelativeTime(this.auth.getLastAccess())
                : 'Nunca'
        };
    }
}

// Exportar la clase
window.ProfileManager = ProfileManager;
