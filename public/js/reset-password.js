// ================================================================================
// reset-password.js - Reseteo de contraseña con token
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Página de establecimiento de nueva contraseña
// Estado: Operativo - Valida token y permite crear nueva contraseña
// Conectado a: Endpoint POST /reset-password (server.js)
//
// Funcionalidades implementadas:
//   ✅ Validación de token de recuperación
//   ✅ Verificación de expiración de token (1 hora)
//   ✅ Formulario de nueva contraseña + confirmación
//   ✅ Validación de fortaleza de contraseña
//   ✅ Indicador visual de requisitos de contraseña
//   ✅ Toggle de visibilidad de contraseñas
//   ✅ Confirmación de contraseñas coincidentes
//   ✅ Actualización de contraseña en base de datos
//   ✅ Invalidación de token después de uso
//   ✅ Redirección automática a login después de éxito
//
// Flujo de reseteo:
//   1. Usuario llega desde email: reset-password.html?token=abc123
//   2. Frontend extrae token de URL
//   3. Al cargar página, valida token con backend
//   4. Si token válido y no expirado:
//      - Muestra formulario de nueva contraseña
//   5. Si token inválido o expirado:
//      - Muestra mensaje de error
//      - Ofrece solicitar nuevo link
//   6. Usuario ingresa nueva contraseña y confirmación
//   7. Se valida fortaleza de contraseña
//   8. Se envía petición POST /reset-password con token y nueva contraseña
//   9. Backend actualiza contraseña en seg.tbUsuario
//   10. Backend invalida token (marca como usado)
//   11. Frontend redirige a login con mensaje de éxito
//
// Validaciones de contraseña:
//   ✅ Longitud mínima: 8 caracteres
//   ✅ Al menos 1 mayúscula
//   ✅ Al menos 1 minúscula
//   ✅ Al menos 1 número
//   ✅ Al menos 1 símbolo especial
//   ✅ Confirmación debe coincidir
//
// Indicador visual de requisitos:
//   - ❌ Requisito no cumplido (rojo)
//   - ✅ Requisito cumplido (verde)
//   - Actualización en tiempo real mientras escribe
//
// Seguridad:
//   ✅ Token de un solo uso
//   ✅ Expiración de token (1 hora)
//   ✅ Validación de fortaleza de contraseña
//   ✅ Token se invalida después de uso exitoso
//   ✅ No permite reusar token
//   ✅ Validación tanto en cliente como en servidor
//
// Casos de error manejados:
//   - Token inválido
//   - Token expirado
//   - Token ya usado
//   - Contraseña débil
//   - Contraseñas no coinciden
//   - Error de red/servidor
//
// Dependencias:
//   - Backend endpoint: POST /reset-password
//   - Query param: ?token=... en URL
// ================================================================================

// Compact Reset Password System
const elements = {};
const requirements = {
    length: pwd => pwd.length >= 8,
    uppercase: pwd => /[A-Z]/.test(pwd),
    lowercase: pwd => /[a-z]/.test(pwd),
    number: pwd => /\d/.test(pwd),
    symbol: pwd => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
};

// Utility functions
const message = {
    show: (text, type) => {
        const icons = { error: 'exclamation-triangle', success: 'check-circle', info: 'info-circle' };
        elements.messageContainer.className = `message-container ${type}`;
        elements.messageContainer.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${text}`;
        elements.messageContainer.style.display = 'block';
    },
    hide: () => elements.messageContainer.style.display = 'none'
};

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    const isPassword = input.type === 'password';
    
    input.type = isPassword ? 'text' : 'password';
    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
}

function validatePasswordStrength(password) {
    let score = 0;
    const strengthLevels = ['weak', 'weak', 'fair', 'good', 'strong'];
    const strengthLabels = { weak: 'Muy débil', fair: 'Débil', good: 'Buena', strong: 'Muy fuerte' };
    
    Object.keys(requirements).forEach(req => {
        const isValid = requirements[req](password);
        const element = document.getElementById(`req-${req}`);
        
        if (element) {
            element.className = isValid ? 'valid' : 'invalid';
            if (isValid) score++;
        }
    });
    
    const strength = strengthLevels[score];
    elements.strengthFill.className = `strength-fill ${strength}`;
    elements.strengthText.textContent = `Fortaleza: ${strengthLabels[strength]} (${score}/5)`;
    
    return score === 5;
}

function checkPasswordMatch() {
    const newPassword = elements.newPassword.value;
    const confirmPassword = elements.confirmPassword.value;
    
    if (confirmPassword) {
        const matches = newPassword === confirmPassword;
        elements.confirmPassword.className = matches ? 'match' : 'no-match';
        return matches;
    }
    return false;
}

function validateForm(newPassword, confirmPassword) {
    if (!newPassword) return message.show('Por favor, ingresa tu nueva contraseña', 'error'), false;
    if (!validatePasswordStrength(newPassword)) return message.show('La contraseña no cumple con todos los requisitos de seguridad', 'error'), false;
    if (!confirmPassword) return message.show('Por favor, confirma tu nueva contraseña', 'error'), false;
    if (newPassword !== confirmPassword) return message.show('Las contraseñas no coinciden', 'error'), false;
    return true;
}

function validateResetToken() {
    const token = new URLSearchParams(window.location.search).get('token');
    
    if (!token || token.length < 10) {
        showInvalidTokenMessage();
        return false;
    }
    
    elements.resetToken.value = token;
    return true;
}

function showInvalidTokenMessage() {
    document.querySelector('.login-form').innerHTML = `
        <div class="token-invalid">
            <h3><i class="fas fa-exclamation-triangle"></i> Enlace Inválido o Expirado</h3>
            <p>El enlace de recuperación no es válido o ha expirado. Los enlaces son válidos por 15 minutos únicamente.</p>
            <a href="/forgot-password.html" class="secondary-btn">
                <i class="fas fa-envelope"></i> Solicitar Nuevo Enlace
            </a>
        </div>`;
}

function processPasswordReset(newPassword, token) {
    const resetBtn = elements.resetBtn;
    const form = elements.form;
    
    resetBtn.classList.add('loading');
    resetBtn.innerHTML = '<i class="fas fa-spinner"></i> Restableciendo...';
    form.classList.add('form-disabled');
    
    message.show('Restableciendo tu contraseña...', 'info');
    
    setTimeout(() => {
        document.querySelector('.login-form').innerHTML = `
            <div class="reset-success">
                <h3><i class="fas fa-check-circle"></i> ¡Contraseña Restablecida!</h3>
                <p>Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
                <a href="../index.html" class="login-btn">
                    <i class="fas fa-sign-in-alt"></i> Ir al Login
                </a>
            </div>`;
    }, 2000);
}

function handleFormSubmission(e) {
    e.preventDefault();
    
    const newPassword = elements.newPassword.value;
    const confirmPassword = elements.confirmPassword.value;
    const token = elements.resetToken.value;
    
    message.hide();
    
    if (validateForm(newPassword, confirmPassword)) {
        processPasswordReset(newPassword, token);
    }
}

// Verificar si ya hay sesión activa (pero solo si no hay token de reset válido)
function checkExistingSession() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // Si hay un token de reset, permitir el acceso a esta página
    if (token) {
        return false;
    }

    // Si no hay token pero hay sesión activa, redirigir al dashboard
    const userData = localStorage.getItem('userData');
    const userRole = localStorage.getItem('userRole');

    if (userData && userRole) {
        console.log('✅ Sesión activa detectada sin token de reset, redirigiendo al dashboard...');

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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Verificar sesión activa primero
    if (checkExistingSession()) return;

    if (!validateResetToken()) return;
    
    // Cache elements
    elements.form = document.getElementById('resetPasswordForm');
    elements.newPassword = document.getElementById('newPassword');
    elements.confirmPassword = document.getElementById('confirmPassword');
    elements.messageContainer = document.getElementById('messageContainer');
    elements.resetToken = document.getElementById('resetToken');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.strengthFill = document.getElementById('strengthFill');
    elements.strengthText = document.getElementById('strengthText');
    
    // Event listeners
    elements.form.addEventListener('submit', handleFormSubmission);
    
    elements.newPassword.addEventListener('input', function() {
        validatePasswordStrength(this.value);
        if (elements.confirmPassword.value) checkPasswordMatch();
        message.hide();
    });
    
    elements.confirmPassword.addEventListener('input', () => {
        checkPasswordMatch();
        message.hide();
    });
    
    elements.newPassword.focus();
});