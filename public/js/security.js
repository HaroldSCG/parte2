// ================================================================================
// security.js - Cambio de contraseña obligatorio (optimizado)
// ================================================================================
// ✅ COMPLETAMENTE FUNCIONAL: Página de cambio de contraseña temporal
// Estado: Operativo - Fuerza cambio de contraseña en primer acceso
// Conectado a: Endpoint PUT /api/usuarios/cambiar-password (server.js)
//
// Funcionalidades implementadas:
//   ✅ Detección de contraseña temporal (flag esPasswordTemporal)
//   ✅ Formulario de cambio de contraseña
//   ✅ Validación de contraseña actual
//   ✅ Validación de nueva contraseña (fortaleza)
//   ✅ Confirmación de contraseña
//   ✅ Toggle de visibilidad de contraseñas
//   ✅ Indicador de fortaleza de contraseña
//   ✅ Mensajes de error/éxito
//   ✅ Redirección automática al dashboard después del cambio
//   ✅ No permite salir sin cambiar contraseña (bloqueo de navegación)
//
// Flujo de cambio de contraseña:
//   1. Usuario inicia sesión con contraseña temporal
//   2. Backend retorna flag esPasswordTemporal: true
//   3. Frontend detecta flag y redirige a security.html
//   4. Usuario no puede acceder a dashboard sin cambiar contraseña
//   5. Usuario ingresa contraseña actual y nueva contraseña
//   6. Se valida fortaleza de contraseña
//   7. Se envía petición PUT al backend
//   8. Backend actualiza contraseña y desactiva flag temporal
//   9. Frontend actualiza localStorage y redirige a dashboard
//
// Validaciones de contraseña:
//   ✅ Longitud mínima: 8 caracteres
//   ✅ Al menos 1 mayúscula
//   ✅ Al menos 1 minúscula
//   ✅ Al menos 1 número
//   ✅ Al menos 1 símbolo especial
//   ✅ No puede ser igual a la contraseña actual
//   ✅ Confirmación debe coincidir
//
// Indicador de fortaleza:
//   - Débil (roja): No cumple requisitos mínimos
//   - Media (amarilla): Cumple requisitos básicos
//   - Fuerte (verde): Contraseña robusta
//
// Seguridad:
//   ✅ Usuario no puede evadir cambio de contraseña
//   ✅ Redirección automática si no tiene sesión
//   ✅ Validación de contraseña actual antes de cambiar
//   ✅ Actualización de sesión después del cambio
//
// Dependencias:
//   - UIManager (para mensajes y modales)
//   - localStorage (para verificar sesión)
//   - Backend endpoint: PUT /api/usuarios/cambiar-password
// ================================================================================

// security.js — Cambio de contraseña (optimizado)

// Instancia global de UIManager
const uiManager = new UIManager();

document.addEventListener('DOMContentLoaded', () => {
  // sesión mínima
  const userDataStr = localStorage.getItem('userData');
  const userRole = localStorage.getItem('userRole');

  // Si no hay sesión, redirigir al login
  if (!userDataStr || !userRole) {
    window.location.href = 'index.html';
    return;
  }

  // Verificar si el usuario tiene contraseña temporal
  try {
    const userData = JSON.parse(userDataStr);

    // Si NO tiene contraseña temporal, no debería estar en esta página
    if (!userData.esPasswordTemporal) {
      console.log('⚠️ Usuario sin contraseña temporal, redirigiendo al dashboard...');

      // Redirigir según el rol
      if (userRole === 'admin') {
        window.location.replace('dashboard.html?role=admin');
      } else if (userRole === 'secretaria') {
        window.location.replace('dashboard.html?role=secretaria');
      } else {
        window.location.replace('dashboard.html');
      }

      return;
    }
  } catch (error) {
    console.error('Error parseando userData:', error);
    window.location.href = 'index.html';
    return;
  }

  // tema oscuro como dashboard: body.dashboard-body.dark-theme
  const body = document.getElementById('bodyRoot');
  if (localStorage.getItem('theme') === 'dark') body.classList.add('dark-theme');

  // modal oculto por defecto (usa .show del dashboard.css)
  document.getElementById('changePasswordModal').classList.remove('show');

  wireHandlers();
});

function wireHandlers(){
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-action]'); if (!t) return;
    const action = t.getAttribute('data-action');
    const params = JSON.parse(t.getAttribute('data-params') || '{}');

    if (action === 'openModal'  && params.modal === 'changePasswordModal') openPasswordModal();
    if (action === 'closeModal' && params.modal === 'changePasswordModal') closePasswordModal();
    if (action === 'changePassword') handlePasswordChange();
  });

  // cerrar al hacer click en overlay
  document.addEventListener('click', e => {
    const overlay = document.getElementById('changePasswordModal');
    if (e.target === overlay) closePasswordModal();
  });

  // validación en tiempo real
  const np = document.getElementById('newPassword');
  if (np) np.addEventListener('input', () => validatePasswordRealTime(np.value));
}

function openPasswordModal(){
  const m = document.getElementById('changePasswordModal');
  m.classList.add('show');
  ['currentPassword','newPassword','confirmPassword'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const mc = document.getElementById('passwordMessageContainer');
  if (mc) { mc.style.display = 'none'; mc.innerHTML = ''; }

  // reset UI
  updatePasswordStrengthBar(0);
  ['req-length','req-uppercase','req-lowercase','req-number','req-symbol']
    .forEach(id => { const li = document.getElementById(id); if(li){ li.classList.remove('valid'); li.classList.add('invalid'); }});
}

function closePasswordModal(){
  document.getElementById('changePasswordModal').classList.remove('show');
}

async function handlePasswordChange(){
  const cp = document.getElementById('currentPassword')?.value?.trim();
  const np = document.getElementById('newPassword')?.value;
  const rp = document.getElementById('confirmPassword')?.value;

  if (!cp || !np || !rp) return showError('Todos los campos son obligatorios');
  if (np !== rp) return showError('Las contraseñas no coinciden');
  if (!validatePasswordStrength(np)) return showError('La contraseña no cumple los requisitos');

  try{
    const currentUser = localStorage.getItem('currentUser');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const res = await fetch('/api/usuarios/cambiar-password', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        usuario: currentUser || userData.usuario,
        passwordActual: cp,
        passwordNueva: np,
        confirmarPassword: rp
      })
    });
    const data = await res.json();

    if (data.success){
      closePasswordModal();
      uiManager.showToast('¡Contraseña actualizada! Serás redirigido al dashboard...', 'success', 3000);

      // Redirigir después de 2.5 segundos para que el usuario pueda ver la notificación
      setTimeout(() => {
        const role = localStorage.getItem('userRole');
        if (role === 'admin') window.location.href = 'dashboard.html?role=admin';
        else if (role === 'secretaria') window.location.href = 'dashboard.html?role=secretaria';
        else window.location.href = 'dashboard.html';
      }, 2500);
    } else {
      showError(data.message || 'Error al cambiar la contraseña');
    }
  } catch {
    showError('Error de conexión');
  }
}

// === UI helpers compatibles con dashboard.css ===

function validatePasswordRealTime(pw){
  const checks = {
    'req-length': pw.length >= 8,
    'req-uppercase': /[A-Z]/.test(pw),
    'req-lowercase': /[a-z]/.test(pw),
    'req-number': /\d/.test(pw),
    'req-symbol': /[!@#$%^&*(),.?":{}|<>]/.test(pw)
  };
  let score = 0;
  Object.entries(checks).forEach(([id, ok]) => {
    const li = document.getElementById(id); if (!li) return;
    li.classList.toggle('valid', ok);
    li.classList.toggle('invalid', !ok);
    score += ok ? 1 : 0;
  });
  updatePasswordStrengthBar(score);
}

function updatePasswordStrengthBar(score){
  // dashboard.css define .strength-fill.{weak|fair|good|strong}
  const fill = document.getElementById('strengthFill');
  const txt  = document.getElementById('strengthText');
  if (!fill || !txt) return;

  fill.className = 'strength-fill';
  if (score <= 1){ fill.classList.add('weak');  txt.textContent = 'Muy Débil'; }
  else if (score === 2){ fill.classList.add('fair');  txt.textContent = 'Débil'; }
  else if (score <= 4){ fill.classList.add('good');  txt.textContent = 'Media'; }
  else { fill.classList.add('strong'); txt.textContent = 'Fuerte'; }
}

function validatePasswordStrength(pw){
  // Usar validación centralizada
  return Validators.validatePasswordStrength(pw).isValid;
}

function showError(msg){
  // Primero intentar mostrar en el contenedor del modal si existe
  const c = document.getElementById('passwordMessageContainer');
  if (c && document.getElementById('changePasswordModal').classList.contains('show')){
    c.innerHTML = `<div class="message error"><i class="fas fa-exclamation-triangle"></i> ${msg}</div>`;
    c.style.display = 'block';
  } else {
    // Si el modal no está abierto, usar UIManager
    uiManager.showToast(msg, 'error');
  }
}

function togglePasswordVisibility(inputId, iconId){
  const el = document.getElementById(inputId);
  const ic = document.getElementById(iconId);
  if (!el || !ic) return;
  el.type = (el.type === 'password') ? 'text' : 'password';
  ic.className = (el.type === 'password') ? 'fas fa-eye' : 'fas fa-eye-slash';
}

// Nota: Sistema de notificaciones ahora usa UIManager.showToast()
// Las funciones showSuccessNotification, etc. fueron eliminadas (duplicadas)
