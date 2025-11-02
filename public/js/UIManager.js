// ================================================================================
// UIManager.js - Módulo para manejo de interfaz y modales
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Gestión de elementos de UI
// Estado: Operativo - Utilizado por todos los módulos
//
// Responsabilidades:
//   ✅ Gestión de modales (abrir, cerrar, múltiples modales)
//   ✅ Sistema de mensajes toast (success, error, info, warning)
//   ✅ Estados de carga (loading spinners)
//   ✅ Mensajes de confirmación
//   ✅ Validación de formularios
//   ✅ Limpieza de formularios
//
// Funcionalidades principales:
//   - openModal(modalId): Abre modal por ID
//   - closeModal(modalId): Cierra modal específico
//   - showSuccess(message): Muestra mensaje de éxito (toast)
//   - showError(message): Muestra mensaje de error (toast)
//   - showInfo(message): Muestra mensaje informativo
//   - showLoading(containerId): Muestra spinner de carga
//   - hideLoading(containerId): Oculta spinner de carga
//   - validateForm(formData): Valida datos de formulario
//   - clearForm(formId): Limpia campos de formulario
//
// Utilizado por:
//   - UserManager (modales de usuario, mensajes)
//   - BitacoraManager (estados de carga)
//   - ProfileManager (mensajes de perfil)
//   - DashboardCore (confirmaciones)
// ================================================================================

class UIManager {
    constructor() {
        this.activeModals = [];
        this.loadingElements = new Set();
        this.toastContainer = null;
        this.init();
    }

    init() {
        this.createToastContainer();
        this.initializeModalEvents();
    }

    // === GESTIÓN DE MODALES ===
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} no encontrado`);
            return;
        }

        // Agregar a la lista de modales activos
        if (!this.activeModals.includes(modalId)) {
            this.activeModals.push(modalId);
        }

        modal.classList.add('show');
        document.body.classList.add('modal-open');

        // Enfocar primer input si existe
        const firstInput = modal.querySelector('input:not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }

        console.log(`Modal ${modalId} abierto`);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} no encontrado`);
            return;
        }

        modal.classList.remove('show');

        // Remover de la lista de modales activos
        const index = this.activeModals.indexOf(modalId);
        if (index > -1) {
            this.activeModals.splice(index, 1);
        }

        // Si no hay más modales activos, remover clase del body
        if (this.activeModals.length === 0) {
            document.body.classList.remove('modal-open');
        }

        // Limpiar formularios y mensajes
        this.clearModalForm(modal);

        console.log(`Modal ${modalId} cerrado`);
    }

    closeAllModals() {
        this.activeModals.forEach(modalId => {
            this.closeModal(modalId);
        });
        this.activeModals = [];
        document.body.classList.remove('modal-open');
    }

    clearModalForm(modal) {
        // Limpiar formularios
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => form.reset());

        // Limpiar mensajes de error/éxito
        const messageContainers = modal.querySelectorAll('.message-container');
        messageContainers.forEach(container => {
            container.innerHTML = '';
            container.className = 'message-container';
        });

        // Resetear botones de loading
        const buttons = modal.querySelectorAll('button[data-loading]');
        buttons.forEach(btn => {
            this.hideButtonLoading(btn.id, btn.getAttribute('data-original-text') || 'Botón');
        });
    }

    initializeModalEvents() {
        // Cerrar modal al hacer clic en el overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const modalId = e.target.id;
                if (modalId) {
                    this.closeModal(modalId);
                }
            }
        });

        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.length > 0) {
                const lastModal = this.activeModals[this.activeModals.length - 1];
                this.closeModal(lastModal);
            }
        });
    }

    // === GESTIÓN DE MENSAJES ===
    showMessage(containerId, type, message) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Contenedor ${containerId} no encontrado`);
            return;
        }

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        container.innerHTML = `
            <div class="message ${type}">
                <i class="fas ${icons[type] || icons.info}"></i>
                <span>${message}</span>
            </div>
        `;

        container.className = `message-container ${type}`;

        // Auto-ocultar mensajes de éxito después de 5 segundos
        if (type === 'success') {
            setTimeout(() => {
                this.clearMessage(containerId);
            }, 5000);
        }
    }

    clearMessage(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
            container.className = 'message-container';
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    // === SISTEMA DE NOTIFICACIONES TOAST ===
    createToastContainer() {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.className = 'toast-container';
            this.toastContainer.id = 'toastContainer';
            document.body.appendChild(this.toastContainer);
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Agregar al contenedor
        this.toastContainer.appendChild(toast);

        // Mostrar con animación
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto-remover después del tiempo especificado
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);

        return toast;
    }

    // === MODAL DE CONFIRMACIÓN ===
    showConfirm(title, message, details = '') {
        return new Promise((resolve) => {
            const confirmModal = document.getElementById('confirmModal');
            if (!confirmModal) {
                console.error('Modal de confirmación no encontrado');
                resolve(false);
                return;
            }

            // Configurar contenido
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;

            // Mostrar detalles si se proporcionan
            if (details) {
                const detailsElement = document.createElement('p');
                detailsElement.className = 'confirm-details';
                detailsElement.textContent = details;
                const messageElement = document.getElementById('confirmMessage');
                messageElement.parentNode.insertBefore(detailsElement, messageElement.nextSibling);
            }

            // Configurar botones
            const confirmBtn = document.getElementById('confirmBtn');
            const cancelBtn = confirmModal.querySelector('.btn-secondary');

            const handleConfirm = () => {
                this.closeModal('confirmModal');
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                this.closeModal('confirmModal');
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);

                // Limpiar detalles adicionales
                const detailsElement = confirmModal.querySelector('.confirm-details');
                if (detailsElement) {
                    detailsElement.remove();
                }
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);

            this.openModal('confirmModal');
        });
    }

    // === GESTIÓN DE LOADING ===
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        this.loadingElements.add(elementId);

        // Si es una tabla, agregar overlay de loading
        if (element.tagName === 'TABLE' || element.classList.contains('table-container')) {
            const container = element.tagName === 'TABLE' ? element.parentElement : element;

            if (!container.querySelector('.loading-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Cargando...</span>
                    </div>
                `;
                container.style.position = 'relative';
                container.appendChild(overlay);
            }
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        this.loadingElements.delete(elementId);

        // Remover overlay de loading
        const container = element.tagName === 'TABLE' ? element.parentElement : element;
        const overlay = container.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // === GESTIÓN DE BOTONES DE LOADING ===
    showButtonLoading(buttonId, loadingText = 'Cargando...') {
        const button = document.getElementById(buttonId);
        if (!button) return;

        // Guardar texto original
        if (!button.hasAttribute('data-original-text')) {
            button.setAttribute('data-original-text', button.innerHTML);
        }

        button.disabled = true;
        button.setAttribute('data-loading', 'true');
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    }

    hideButtonLoading(buttonId, originalText = null) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        button.disabled = false;
        button.removeAttribute('data-loading');

        const savedText = button.getAttribute('data-original-text');
        button.innerHTML = originalText || savedText || 'Botón';
    }

    // === UTILIDADES DE INTERFAZ ===
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    updateProgress(progressId, percentage) {
        const progressBar = document.getElementById(progressId);
        if (progressBar) {
            const fill = progressBar.querySelector('.progress-fill');
            const text = progressBar.querySelector('.progress-text');

            if (fill) {
                fill.style.width = `${percentage}%`;
            }
            if (text) {
                text.textContent = `${percentage}%`;
            }
        }
    }

    // === MANEJO DE FORMULARIOS ===
    validateForm(formElement) {
        const requiredFields = formElement.querySelectorAll('[required]');
        let isValid = true;
        let firstInvalidField = null;

        requiredFields.forEach(field => {
            const value = field.value.trim();
            const fieldContainer = field.closest('.form-group');

            // Remover clases de error previas
            field.classList.remove('error');
            if (fieldContainer) {
                const errorMsg = fieldContainer.querySelector('.field-error');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }

            // Validar campo
            if (!value) {
                isValid = false;
                field.classList.add('error');

                if (!firstInvalidField) {
                    firstInvalidField = field;
                }

                // Agregar mensaje de error
                if (fieldContainer) {
                    const errorMsg = document.createElement('span');
                    errorMsg.className = 'field-error';
                    errorMsg.textContent = 'Este campo es requerido';
                    fieldContainer.appendChild(errorMsg);
                }
            }
        });

        // Enfocar primer campo inválido
        if (firstInvalidField) {
            firstInvalidField.focus();
        }

        return isValid;
    }

    clearFormErrors(formElement) {
        const fields = formElement.querySelectorAll('.error');
        const errorMessages = formElement.querySelectorAll('.field-error');

        fields.forEach(field => field.classList.remove('error'));
        errorMessages.forEach(msg => msg.remove());
    }

    // === GESTIÓN DE ESTADOS VISUALES ===
    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = '';
            element.classList.remove('hidden');
        }
    }

    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    }

    toggleElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            if (element.style.display === 'none' || element.classList.contains('hidden')) {
                this.showElement(elementId);
            } else {
                this.hideElement(elementId);
            }
        }
    }

    // === ANIMACIONES ===
    fadeIn(elementId, duration = 300) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.style.opacity = '0';
        element.style.display = '';

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            element.style.opacity = progress.toString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    fadeOut(elementId, duration = 300) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startTime = performance.now();
        const startOpacity = parseFloat(element.style.opacity) || 1;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            element.style.opacity = (startOpacity * (1 - progress)).toString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };

        requestAnimationFrame(animate);
    }
}

// Exportar la clase
window.UIManager = UIManager;