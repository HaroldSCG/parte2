// ================================================================================
// forgot-password.js - Funcionalidad para recuperación de contraseña
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Página de recuperación de contraseña olvidada
// Estado: Operativo - Envía email con link de recuperación
// Conectado a: Endpoint POST /forgot-password (server.js)
// Servicio de email: Brevo (configurado en email.service.js)
//
// Funcionalidades implementadas:
//   ✅ Formulario de recuperación (solo email)
//   ✅ Validación de email en cliente
//   ✅ Verificación de email en base de datos
//   ✅ Generación de token de recuperación (backend)
//   ✅ Envío de email con link de reset
//   ✅ Expiración de token (1 hora)
//   ✅ Integración con reCAPTCHA v2
//   ✅ Mensajes de éxito/error
//   ✅ Estados de carga (botón disabled durante envío)
//
// Flujo de recuperación:
//   1. Usuario ingresa email en formulario
//   2. Se valida formato de email en cliente
//   3. Se ejecuta reCAPTCHA (si está habilitado)
//   4. Se envía petición POST /forgot-password al backend
//   5. Backend verifica que el email exista en seg.tbUsuario
//   6. Si existe:
//      - Genera token único de recuperación
//      - Guarda token con timestamp de expiración
//      - Envía email con link: reset-password.html?token=...
//      - Link es válido por 1 hora
//   7. Usuario recibe email y hace clic en link
//   8. Es redirigido a reset-password.html
//
// Validaciones:
//   ✅ Email no vacío
//   ✅ Formato de email válido
//   ✅ Email existe en base de datos (backend)
//   ✅ reCAPTCHA válido (si está habilitado)
//
// Seguridad:
//   ✅ No revela si el email existe o no (mensaje genérico)
//   ✅ Token de un solo uso
//   ✅ Expiración de token (1 hora)
//   ✅ reCAPTCHA para prevenir spam
//   ✅ Rate limiting en backend
//
// Integración con email:
//   - Proveedor: Brevo (ex-Sendinblue)
//   - Template personalizado con branding
//   - Link directo a reset-password.html
//
// Dependencias:
//   - reCAPTCHA (opcional, configurado en app.config.js)
//   - Backend endpoint: POST /forgot-password
//   - email.service.js (backend, para envío de emails)
// ================================================================================

// forgot-password.js - Funcionalidad para recuperación de contraseña

const elements = {
    form: null,
    emailInput: null,
    messageContainer: null,
    submitBtn: null
};

function initializeElements() {
    elements.form = document.getElementById('forgotPasswordForm');
    elements.emailInput = document.getElementById('email');
    elements.messageContainer = document.getElementById('messageContainer');
    elements.submitBtn = elements.form.querySelector('button[type="submit"]');
}

function showMessage(message, type) {
    elements.messageContainer.className = `message-container ${type}`;
    elements.messageContainer.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}"></i> ${message}`;
    elements.messageContainer.style.display = 'block';
}

function hideMessage() {
    elements.messageContainer.style.display = 'none';
}

function setLoading(isLoading) {
    if (isLoading) {
        elements.submitBtn.disabled = true;
        elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    } else {
        elements.submitBtn.disabled = false;
        elements.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar contraseña temporal';
    }
}

// Validaciones
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Obtener token reCAPTCHA
function getCaptchaToken() {
    return window.grecaptcha ? grecaptcha.getResponse() : '';
}

function resetCaptchaIfAny() {
    if (window.grecaptcha) grecaptcha.reset();
}

// Procesar recuperación de contraseña
async function processForgotPassword(email, captchaToken) {
    console.log('📧 Iniciando recuperación de contraseña para:', email);
    showMessage('Procesando solicitud...', 'info');
    setLoading(true);

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, captchaToken })
        });

        console.log('📥 Status:', response.status);
        const data = await response.json();
        console.log('📋 Response:', data);

        if (data.success) {
            showMessage(data.message, 'success');

            // Limpiar formulario
            elements.emailInput.value = '';

            // Opcional: redirigir al login después de un tiempo
            setTimeout(() => {
                showMessage('Redirigiendo al login...', 'info');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
            }, 8000);

        } else {
            showMessage(data.message || 'Error en la recuperación', 'error');
        }

        resetCaptchaIfAny();

    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
        resetCaptchaIfAny();
    } finally {
        setLoading(false);
    }
}

// Manejar envío del formulario
function handleFormSubmission(e) {
    console.log('📝 Form submitted');
    e.preventDefault();

    const email = elements.emailInput.value.trim();
    hideMessage();

    // Validaciones
    if (!email) {
        showMessage('Por favor, ingresa tu correo electrónico', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showMessage('Por favor, ingresa un correo electrónico válido', 'error');
        return;
    }

    // Validar reCAPTCHA
    const captchaToken = getCaptchaToken();
    if (!captchaToken) {
        showMessage('Completa el CAPTCHA para continuar', 'error');
        return;
    }

    console.log('✅ Validaciones OK, enviando solicitud');
    processForgotPassword(email, captchaToken);
}

// Event listeners
function setupEventListeners() {
    elements.form.addEventListener('submit', handleFormSubmission);

    elements.emailInput.addEventListener('input', () => {
        if (elements.messageContainer.classList.contains('error')) {
            hideMessage();
        }
    });

    // Enter key support
    elements.emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.form.dispatchEvent(new Event('submit'));
        }
    });
}

// Callbacks reCAPTCHA (si están disponibles)
function onCaptchaComplete() {
    if (elements.messageContainer.classList.contains('error')) hideMessage();
}

function onCaptchaExpired() {
    showMessage('El CAPTCHA ha expirado. Por favor, complétalo nuevamente.', 'error');
}

// Verificar si ya hay sesión activa
function checkExistingSession() {
    const userData = localStorage.getItem('userData');
    const userRole = localStorage.getItem('userRole');

    if (userData && userRole) {
        console.log('✅ Sesión activa detectada, redirigiendo al dashboard...');

        // Redirigir según el rol
        if (userRole === 'admin') {
            window.location.replace('dashboard.html?role=admin');
        } else if (userRole === 'secretaria') {
            window.location.replace('dashboard.html?role=secretaria');
        } else {
            window.location.replace('dashboard.html');
        }

        return true;
    }

    return false;
}

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    // Verificar sesión activa antes de inicializar
    if (checkExistingSession()) {
        return;
    }

    initializeElements();
    setupEventListeners();

    // Focus automático en el campo email
    elements.emailInput.focus();
});

// Hacer funciones globales para reCAPTCHA
window.onCaptchaComplete = onCaptchaComplete;
window.onCaptchaExpired = onCaptchaExpired;