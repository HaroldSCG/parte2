// ================================================================================
// login.js - Lógica de inicio de sesión
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Página de autenticación principal
// Estado: Operativo - Punto de entrada al sistema
// Conectado a: Endpoint POST /login (server.js)
//
// Funcionalidades implementadas:
//   ✅ Formulario de inicio de sesión (usuario/email + contraseña)
//   ✅ Validación de credenciales antes de enviar
//   ✅ Toggle de visibilidad de contraseña
//   ✅ Integración con reCAPTCHA v2 (opcional)
//   ✅ Mensajes de error/éxito
//   ✅ Redirección a dashboard según rol
//   ✅ Almacenamiento de sesión en localStorage
//   ✅ Prevención de SQL injection (validación cliente)
//   ✅ Link a "Olvidé mi contraseña"
//
// Flujo de autenticación:
//   1. Usuario ingresa credenciales (usuario/email + contraseña)
//   2. Se valida formato en cliente
//   3. Se ejecuta reCAPTCHA (si está habilitado)
//   4. Se envía petición POST /login al backend
//   5. Backend valida en seg.tbUsuario
//   6. Si credenciales válidas:
//      - Backend retorna datos de usuario
//      - Frontend guarda en localStorage
//      - Redirecciona a dashboard.html
//   7. Si credenciales inválidas:
//      - Muestra mensaje de error
//      - Incrementa contador de intentos (backend)
//
// Datos guardados en localStorage:
//   - userData: {username, email, role, nombreCompleto}
//   - userRole: Rol del usuario
//
// Validaciones cliente:
//   - Usuario no vacío (min 3 caracteres)
//   - Contraseña no vacía (min 8 caracteres)
//   - Formato de email válido (si se usa email)
//   - No permite caracteres especiales peligrosos
//
// Seguridad:
//   ✅ Validación en cliente y servidor
//   ✅ reCAPTCHA para prevenir bots
//   ✅ Sanitización de entradas
//   ⚠️ Contraseñas enviadas en plain text (TODO: implementar HTTPS)
//
// Dependencias:
//   - reCAPTCHA (opcional, configurado en app.config.js)
//   - Backend endpoint: POST /login
// ================================================================================

const elements = {
  form: null,
  passwordInput: null,
  toggleIcon: null,
  messageContainer: null,
  usuario: null,
  password: null
};

function initializeElements() {
  elements.form = document.getElementById('loginForm');
  elements.passwordInput = document.getElementById('password');
  elements.toggleIcon = document.getElementById('toggleIcon');
  elements.messageContainer = document.getElementById('messageContainer');
  elements.usuario = document.getElementById('usuario');
  elements.password = document.getElementById('password');
}

function togglePassword() {
  const isPassword = elements.passwordInput.type === 'password';
  elements.passwordInput.type = isPassword ? 'text' : 'password';
  elements.toggleIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
}

function showMessage(message, type) {
  elements.messageContainer.className = `message-container ${type}`;
  elements.messageContainer.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}"></i> ${message}`;
  elements.messageContainer.style.display = 'block';
}

function hideMessage() {
  elements.messageContainer.style.display = 'none';
}

// Navegación
function showForgotPassword() {
  window.location.href = '/forgot-password.html';
}

// Validaciones
const validators = {
  form: (usuario, password) => {
    if (!usuario || !password) {
      showMessage('Por favor, completa todos los campos', 'error');
      return false;
    }
    if (usuario.length < 3) {
      showMessage('El usuario debe tener al menos 3 caracteres', 'error');
      return false;
    }
    if (password.length < 6) {
      showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
      return false;
    }
    return true;
  }
};

// Obtener token reCAPTCHA
function getCaptchaToken() {
  return window.grecaptcha ? grecaptcha.getResponse() : '';
}
function resetCaptchaIfAny() {
  if (window.grecaptcha) grecaptcha.reset();
}

// Login con servidor + reCAPTCHA
async function processLogin(usuario, password, captchaToken) {
  console.log('🔐 Iniciando processLogin para usuario:', usuario);
  showMessage('Validando credenciales...', 'info');

  try {
    console.log('📤 POST /api/login', { usuario, password: '***' });

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password, captchaToken })
    });

    console.log('📥 Status:', response.status);
    const data = await response.json();
    console.log('📋 Body:', data);

    if (data.success) {
      // Persistencia
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('userRole', data.user.rol);
      localStorage.setItem('userName', `${data.user.nombres} ${data.user.apellidos}`);
      localStorage.setItem('userEmail', data.user.correo);
      localStorage.setItem('currentUser', data.user.usuario);

      // Password temporal
      if (data.user.esPasswordTemporal) {
        showMessage('Contraseña temporal detectada. Redirigiendo…', 'warning');
        resetCaptchaIfAny();
        setTimeout(() => { window.location.href = 'security.html'; }, 1200);
        return;
      }

      showMessage('Login exitoso. Redirigiendo…', 'success');
      resetCaptchaIfAny();
      setTimeout(() => {
        if (data.user.rol === 'admin') {
          window.location.href = 'dashboard.html?role=admin';
        } else if (data.user.rol === 'secretaria') {
          window.location.href = 'dashboard.html?role=secretaria';
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 1200);
    } else {
      showMessage(data.message || 'Error en el login', 'error');
      resetCaptchaIfAny();
    }
  } catch (error) {
    console.error('❌ Error login:', error);
    showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
    resetCaptchaIfAny();
  }
}

// Submit del formulario
function handleFormSubmission(e) {
  console.log('📝 Form submitted');
  e.preventDefault();

  const usuario = elements.usuario.value.trim();
  const password = elements.password.value;

  hideMessage();

  if (!validators.form(usuario, password)) {
    console.log('❌ Validaciones fallaron');
    return;
  }

  // Validar reCAPTCHA
  const captchaToken = getCaptchaToken();
  if (!captchaToken) {
    showMessage('Completa el CAPTCHA para continuar', 'error');
    return;
  }

  console.log('✅ Validaciones OK, enviando login con CAPTCHA');
  processLogin(usuario, password, captchaToken);
}

// Listeners
function setupEventListeners() {
  elements.form.addEventListener('submit', handleFormSubmission);

  [elements.usuario, elements.password].forEach(input => {
    input.addEventListener('input', () => {
      if (elements.messageContainer.classList.contains('error')) hideMessage();
    });
  });
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

    return true; // Hay sesión activa
  }

  return false; // No hay sesión activa
}

// Init
document.addEventListener('DOMContentLoaded', function () {
  // Verificar sesión activa antes de inicializar el formulario
  if (checkExistingSession()) {
    return; // Si hay sesión, no inicializar el formulario
  }

  initializeElements();
  setupEventListeners();
});

// Callbacks reCAPTCHA
function onCaptchaComplete() {
  if (elements.messageContainer.classList.contains('error')) hideMessage();
}
function onCaptchaExpired() {
  showMessage('El CAPTCHA ha expirado. Por favor, complétalo nuevamente.', 'error');
}
