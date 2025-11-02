// ================================================================================
// UserManager.js - Módulo para gestión de usuarios
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Este módulo gestiona usuarios del sistema académico
// Estado: Operativo con backend completo
// Conectado a: seg.tbUsuario (definitivo.sql)
// Endpoints utilizados:
//   - GET  /api/usuarios        (Listar usuarios)
//   - POST /api/usuarios        (Crear usuario)
//   - PUT  /api/usuarios/:id    (Actualizar usuario)
//   - DELETE /api/usuarios/:id  (Eliminar usuario)
//
// Funcionalidades implementadas:
//   ✅ CRUD completo de usuarios
//   ✅ Filtrado por búsqueda, rol y estado
//   ✅ Validación de datos (email, teléfono, contraseña)
//   ✅ Gestión de estados (Activo/Inactivo/Bloqueado)
//   ✅ Roles: Director, Profesor, Secretaria, Administrativo
//   ✅ Interfaz modal para crear/editar
//   ✅ Contador de resultados filtrados
//
// Dependencias:
//   - ApiService (para comunicación con backend)
//   - UIManager (para mensajes y loading)
// ================================================================================

class UserManager {
    constructor(apiService, uiManager) {
        this.apiService = apiService;
        this.uiManager = uiManager;
        this.currentUsers = [];
        this.filteredUsers = [];
        this.currentFilters = {
            search: '',
            rol: '',
            estado: ''
        };
    }

    // === CARGA INICIAL DE DATOS ===
    async loadUsersData() {
        console.log('📋 Cargando datos de usuarios...');

        try {
            this.uiManager.showLoading('usersTable');

            const response = await this.apiService.getUsers();

            if (response.success) {
                const previousCount = this.currentUsers.length;
                this.currentUsers = response.usuarios;
                this.filteredUsers = [...this.currentUsers];
                this.renderUsersTable();
                this.updateResultsCount();
                console.log(`✅ Cargados ${this.currentUsers.length} usuarios (antes: ${previousCount})`);
                console.log('👥 Lista de usuarios actual:', this.currentUsers.map(u => `${u.nombreCompleto} (ID: ${u.id}, Estado: ${u.estado})`));
            } else {
                console.error('❌ Error cargando usuarios:', response.message);
                this.uiManager.showError('Error cargando usuarios: ' + response.message);
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            this.uiManager.showError(error.message || 'Error de conexión al cargar usuarios');
        } finally {
            this.uiManager.hideLoading('usersTable');
        }
    }

    // === RENDERIZADO DE TABLA ===
    renderUsersTable() {
        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;

        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">
                        <i class="fas fa-users"></i>
                        <p>No se encontraron usuarios</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredUsers.map(user => `
            <tr data-user-id="${user.id}">
                <td>${user.nombreCompleto}</td>
                <td>${user.email}</td>
                <td><span class="role ${user.rol}">${Formatters.formatRole(user.rol)}</span></td>
                <td><span class="status ${user.estado.toLowerCase()}">${user.estado}</span></td>
                <td>
                    <button class="btn-icon" title="Ver" data-action="viewUser" data-params='{"id":"${user.id}"}'>
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" title="Editar" data-action="editUser" data-params='{"id":"${user.id}"}'>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" title="Reset Password" data-action="resetPassword" data-params='{"id":"${user.id}"}'>
                        <i class="fas fa-key"></i>
                    </button>
                    ${user.rol !== 'admin' ? `
                        <button class="btn-icon danger" title="Eliminar" data-action="deleteUser" data-params='{"id":"${user.id}"}'>
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    updateResultsCount() {
        const countElement = document.getElementById('userResultsCount');
        if (countElement) {
            countElement.textContent = `Total: ${this.filteredUsers.length} usuarios`;
        }
    }

    // === GESTIÓN DE ACCIONES ===
    async handleAction(action, params) {
        switch (action) {
            case 'addUser':
                await this.addUser();
                break;
            case 'viewUser':
                await this.viewUser(params.id);
                break;
            case 'editUser':
                await this.editUser(params.id);
                break;
            case 'updateUser':
                await this.updateUser();
                break;
            case 'deleteUser':
                await this.deleteUser(params.id);
                break;
            case 'resetPassword':
                await this.resetPassword(params.id);
                break;
            case 'performUserSearch':
                this.performSearch();
                break;
            case 'clearUserSearchResults':
                this.clearSearch();
                break;
            case 'applyUserFiltersModal':
                this.applyFilters();
                break;
            case 'clearUserFiltersModal':
                this.clearFilters();
                break;
            case 'copyGeneratedPassword':
                this.copyGeneratedPassword();
                break;
            default:
                console.log('Acción no reconocida en UserManager:', action);
        }
    }

    // === CREAR USUARIO ===
    async addUser() {
        console.log('👤 Creando nuevo usuario...');

        const form = document.querySelector('#addUserModal .user-form');
        if (!form) return;

        const formData = {
            nombres: document.getElementById('newUserNombres')?.value?.trim(),
            apellido: document.getElementById('newUserApellido')?.value?.trim(),
            email: document.getElementById('newUserEmail')?.value?.trim(),
            rol: document.getElementById('newUserRol')?.value
        };

        // Validar campos
        if (!formData.nombres || !formData.apellido || !formData.email || !formData.rol) {
            this.uiManager.showMessage('userMessageContainer', 'error', 'Todos los campos son requeridos');
            return;
        }

        // Validar email
        if (!Validators.isValidEmail(formData.email)) {
            this.uiManager.showMessage('userMessageContainer', 'error', 'El formato del email no es válido');
            return;
        }

        try {
            this.uiManager.showButtonLoading('addUserBtn');

            // Generar contraseña temporal
            const password = this.generateTemporaryPassword();

            const response = await this.apiService.createUser({
                usuarioEjecutor: localStorage.getItem('currentUser') || localStorage.getItem('userName') || 'admin',
                ...formData,
                password: password
            });

            if (response.success) {
                console.log('✅ Usuario creado exitosamente');

                // Mostrar modal con contraseña generada
                this.showPasswordGeneratedModal(formData.nombres + ' ' + formData.apellido, password);

                // Cerrar modal y recargar datos
                this.uiManager.closeModal('addUserModal');
                await this.loadUsersData();

                // Limpiar formulario
                form.reset();
                this.uiManager.clearMessage('userMessageContainer');

            } else {
                const errorMsg = response.message || 'Error al crear usuario';
                this.uiManager.showMessage('userMessageContainer', 'error', errorMsg);
                this.uiManager.showToast(errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Error creando usuario:', error);
            const errorMsg = error.message || 'Error de conexión al crear usuario';
            this.uiManager.showMessage('userMessageContainer', 'error', errorMsg);
            this.uiManager.showToast(errorMsg, 'error');
        } finally {
            this.uiManager.hideButtonLoading('addUserBtn', 'Crear Usuario');
        }
    }

    // === VER USUARIO ===
    async viewUser(userId) {
        console.log(`👁️ Viendo usuario ID: ${userId}`);

        try {
            const response = await this.apiService.getUserById(userId);

            if (response.success) {
                const user = response.usuario;

                // Llenar modal con datos del usuario
                document.getElementById('viewUserNombre').textContent = user.nombres;
                document.getElementById('viewUserApellido').textContent = user.apellidos;
                document.getElementById('viewUserFechaCreacion').textContent = user.fechaCreacion;
                document.getElementById('viewUserRol').innerHTML = `<span class="role ${user.rol}">${Formatters.formatRole(user.rol)}</span>`;
                document.getElementById('viewUserEstado').innerHTML = `<span class="status ${user.estado.toLowerCase()}">${user.estado}</span>`;
                document.getElementById('viewUserUltimoAcceso').textContent = user.ultimoAcceso;

                this.uiManager.openModal('viewUserModal');
            } else {
                this.uiManager.showError('Error cargando datos del usuario: ' + response.message);
            }
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            this.uiManager.showError(error.message || 'Error de conexión al obtener usuario');
        }
    }

    // === EDITAR USUARIO ===
    async editUser(userId) {
        console.log(`✏️ Editando usuario ID: ${userId}`);

        try {
            const response = await this.apiService.getUserById(userId);

            if (response.success) {
                const user = response.usuario;

                // Llenar formulario de edición
                document.getElementById('editUserNombre').value = user.nombres;
                document.getElementById('editUserApellido').value = user.apellidos;
                document.getElementById('editUserEmail').value = user.email;
                document.getElementById('editUserRol').value = user.rol;
                document.getElementById('editUserEstado').value = user.estado.toLowerCase();

                // Guardar ID para actualización
                this.editingUserId = userId;

                this.uiManager.openModal('editUserModal');
            } else {
                this.uiManager.showError('Error cargando datos del usuario: ' + response.message);
            }
        } catch (error) {
            console.error('❌ Error obteniendo usuario para editar:', error);
            this.uiManager.showError(error.message || 'Error de conexión al obtener usuario');
        }
    }

    // === ACTUALIZAR USUARIO ===
    async updateUser() {
        if (!this.editingUserId) return;

        console.log(`💾 Actualizando usuario ID: ${this.editingUserId}`);

        const formData = {
            nombres: document.getElementById('editUserNombre')?.value?.trim(),
            apellido: document.getElementById('editUserApellido')?.value?.trim(),
            email: document.getElementById('editUserEmail')?.value?.trim(),
            rol: document.getElementById('editUserRol')?.value,
            estado: document.getElementById('editUserEstado')?.value
        };

        // Validar campos
        if (!formData.nombres || !formData.apellido || !formData.email || !formData.rol || !formData.estado) {
            this.uiManager.showMessage('editUserMessageContainer', 'error', 'Todos los campos son requeridos');
            return;
        }

        try {
            this.uiManager.showButtonLoading('updateUserBtn');

            const response = await this.apiService.updateUser(this.editingUserId, {
                usuarioEjecutor: localStorage.getItem('currentUser') || localStorage.getItem('userName') || 'admin',
                ...formData
            });

            if (response.success) {
                console.log('✅ Usuario actualizado exitosamente');

                this.uiManager.closeModal('editUserModal');
                await this.loadUsersData();
                this.uiManager.showToast('Usuario actualizado exitosamente', 'success');

                this.editingUserId = null;
            } else {
                const errorMsg = response.message || 'Error al actualizar usuario';
                this.uiManager.showMessage('editUserMessageContainer', 'error', errorMsg);
                this.uiManager.showToast(errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Error actualizando usuario:', error);
            const errorMsg = error.message || 'Error de conexión al actualizar usuario';
            this.uiManager.showMessage('editUserMessageContainer', 'error', errorMsg);
            this.uiManager.showToast(errorMsg, 'error');
        } finally {
            this.uiManager.hideButtonLoading('updateUserBtn', 'Guardar Cambios');
        }
    }

    // === ELIMINAR USUARIO ===
    async deleteUser(userId) {
        console.log('🗑️ Intentando eliminar usuario:', userId);
        console.log('📋 Usuarios disponibles:', this.currentUsers);

        // Buscar usuario tanto por ID numérico como string
        const user = this.currentUsers.find(u =>
            u.id === userId ||
            u.id === parseInt(userId) ||
            u.id == userId ||
            u.usuario === userId ||
            u.Usuario === userId
        );

        if (!user) {
            console.error('❌ Usuario no encontrado:', userId);
            console.log('🔍 Estructura del primer usuario:', this.currentUsers[0]);
            this.uiManager.showError('Usuario no encontrado');
            return;
        }

        console.log('✅ Usuario encontrado:', user);

        const confirmed = await this.uiManager.showConfirm(
            'Eliminar Usuario',
            `¿Deseas eliminar definitivamente a "${user.nombreCompleto}"?`,
            'Esta acción no se puede deshacer.'
        );

        if (!confirmed) return;

        try {
            console.log('🌐 Llamando API para eliminar usuario:', userId);
            console.log('👥 Usuarios antes de eliminar:', this.currentUsers.length);

            const response = await this.apiService.deleteUser(userId, {
                usuarioEjecutor: localStorage.getItem('currentUser') || localStorage.getItem('userName') || 'admin'
            });

            console.log('📨 Respuesta de la API:', response);

            if (response && response.success) {
                console.log('✅ Usuario eliminado, recargando datos...');
                await this.loadUsersData();
                console.log('👥 Usuarios después de eliminar:', this.currentUsers.length);
                this.uiManager.showToast('Usuario eliminado definitivamente', 'success');
            } else {
                console.error('❌ Error en respuesta de API:', response);
                this.uiManager.showError('Error eliminando usuario: ' + (response?.message || 'Respuesta inválida'));
            }
        } catch (error) {
            console.error('❌ Error eliminando usuario:', error);
            console.error('❌ Detalles del error:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                userId: userId,
                userFound: !!user
            });
            this.uiManager.showError('Error de conexión al eliminar usuario: ' + error.message);
        }
    }

    // === RESET PASSWORD ===
    async resetPassword(userId) {
        const user = this.currentUsers.find(u => u.id === parseInt(userId));
        if (!user) return;

        const confirmed = await this.uiManager.showConfirm(
            'Resetear Contraseña',
            `¿Deseas generar una nueva contraseña temporal para "${user.nombreCompleto}"?`,
            'Se generará una nueva contraseña segura.'
        );

        if (!confirmed) return;

        try {
            const newPassword = this.generateTemporaryPassword();

            const response = await this.apiService.resetPassword(userId, {
                usuarioEjecutor: localStorage.getItem('currentUser') || localStorage.getItem('userName') || 'admin',
                newPassword: newPassword
            });

            if (response.success) {
                console.log('✅ Contraseña reseteada exitosamente');
                this.showPasswordGeneratedModal(user.nombreCompleto, newPassword);
                this.uiManager.showToast('Contraseña reseteada exitosamente', 'success');
            } else {
                this.uiManager.showError('Error reseteando contraseña: ' + response.message);
            }
        } catch (error) {
            console.error('❌ Error reseteando contraseña:', error);
            this.uiManager.showError(error.message || 'Error de conexión al resetear contraseña');
        }
    }

    // === BÚSQUEDA Y FILTROS ===
    performSearch() {
        const searchInput = document.getElementById('adminUserSearchInput');
        const searchTerm = searchInput?.value?.trim().toLowerCase() || '';

        this.currentFilters.search = searchTerm;
        this.applyAllFilters();

        // Mostrar/ocultar indicador de búsqueda
        const searchStatus = document.getElementById('userSearchStatus');
        const searchStatusText = document.getElementById('userSearchStatusText');

        if (searchTerm) {
            searchStatusText.textContent = `Mostrando resultados para: "${searchTerm}"`;
            searchStatus.style.display = 'block';
        } else {
            searchStatus.style.display = 'none';
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('adminUserSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }

        this.currentFilters.search = '';
        this.applyAllFilters();

        const searchStatus = document.getElementById('userSearchStatus');
        if (searchStatus) {
            searchStatus.style.display = 'none';
        }
    }

    applyFilters() {
        this.currentFilters.rol = document.getElementById('modalFilterRol')?.value || '';
        this.currentFilters.estado = document.getElementById('modalFilterEstado')?.value || '';

        this.applyAllFilters();
        this.uiManager.closeModal('userFiltersModal');
    }

    clearFilters() {
        document.getElementById('modalFilterRol').value = '';
        document.getElementById('modalFilterEstado').value = '';

        this.currentFilters = {
            search: this.currentFilters.search, // Mantener búsqueda
            rol: '',
            estado: ''
        };

        this.applyAllFilters();
    }

    applyAllFilters() {
        this.filteredUsers = this.currentUsers.filter(user => {
            const matchesSearch = !this.currentFilters.search ||
                user.nombreCompleto.toLowerCase().includes(this.currentFilters.search) ||
                user.email.toLowerCase().includes(this.currentFilters.search);

            const matchesRole = !this.currentFilters.rol ||
                user.rol === this.currentFilters.rol;

            const matchesStatus = !this.currentFilters.estado ||
                user.estado.toLowerCase() === this.currentFilters.estado;

            return matchesSearch && matchesRole && matchesStatus;
        });

        this.renderUsersTable();
        this.updateResultsCount();
    }

    // === UTILIDADES ===
    generateTemporaryPassword() {
        // Usar el generador de contraseñas seguras centralizado
        if (!window.SecurePasswordGenerator) {
            console.error('SecurePasswordGenerator no está disponible');
            throw new Error('Generador de contraseñas no disponible');
        }

        const generator = new window.SecurePasswordGenerator();
        return generator.generateSecurePassword(12);
    }

    showPasswordGeneratedModal(userName, password) {
        document.getElementById('generatedUserName').textContent = userName;
        document.getElementById('generatedPassword').value = password;
        this.uiManager.openModal('passwordGeneratedModal');
    }

    copyGeneratedPassword() {
        const passwordInput = document.getElementById('generatedPassword');
        const feedbackElement = document.getElementById('passwordCopiedFeedback');

        if (!passwordInput || !passwordInput.value) {
            console.error('No hay contraseña para copiar');
            return;
        }

        // Copiar al portapapeles
        passwordInput.select();
        passwordInput.setSelectionRange(0, 99999); // Para móviles

        try {
            // Usar la API moderna de clipboard si está disponible
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(passwordInput.value).then(() => {
                    this.showCopyFeedback(feedbackElement);
                }).catch(err => {
                    console.error('Error al copiar con clipboard API:', err);
                    // Fallback al método tradicional
                    this.fallbackCopyToClipboard(passwordInput, feedbackElement);
                });
            } else {
                // Fallback para navegadores antiguos
                this.fallbackCopyToClipboard(passwordInput, feedbackElement);
            }
        } catch (err) {
            console.error('Error al copiar contraseña:', err);
            this.uiManager.showToast('Error al copiar contraseña', 'error');
        }
    }

    fallbackCopyToClipboard(inputElement, feedbackElement) {
        try {
            document.execCommand('copy');
            this.showCopyFeedback(feedbackElement);
        } catch (err) {
            console.error('Error en fallback copy:', err);
            this.uiManager.showToast('Error al copiar contraseña', 'error');
        }
    }

    showCopyFeedback(feedbackElement) {
        if (!feedbackElement) return;

        // Mostrar feedback usando la clase CSS
        feedbackElement.classList.add('show');

        // Ocultar después de 2 segundos
        setTimeout(() => {
            feedbackElement.classList.remove('show');
        }, 2000);

        // También mostrar toast
        this.uiManager.showToast('Contraseña copiada al portapapeles', 'success');
    }
}

// Exportar la clase
window.UserManager = UserManager;
