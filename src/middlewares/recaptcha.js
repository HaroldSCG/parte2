// middlewares/recaptcha.js
async function verifyRecaptcha(req, res, next) {
  try {
    console.log('🔒 Verificando reCAPTCHA...');

    const token = req.body && req.body.captchaToken;
    if (!token) {
      console.log('❌ Token de CAPTCHA faltante');
      return res.status(400).json({ success: false, message: 'CAPTCHA es requerido' });
    }

    console.log('📤 Enviando token a Google para verificación...');

    const params = new URLSearchParams();
    params.append('secret', process.env.RECAPTCHA_SECRET_KEY);
    params.append('response', token);

    // Para desarrollo local, no validar IP
    if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') {
      params.append('remoteip', req.ip);
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const result = await response.json();
    console.log('📥 Respuesta de Google reCAPTCHA:', result);

    if (!result.success) {
      console.log('❌ CAPTCHA inválido:', result['error-codes']);
      return res.status(403).json({
        success: false,
        message: 'CAPTCHA inválido. Por favor, inténtalo de nuevo.',
        errors: result['error-codes']
      });
    }

    // Verificar si estamos usando claves de prueba
    const isTestKey = process.env.RECAPTCHA_SECRET_KEY === '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

    // En desarrollo o con claves de prueba, no validar hostname estrictamente
    if (process.env.NODE_ENV === 'production' && !isTestKey) {
      const allowedHosts = ['localhost', '127.0.0.1', 'tu-dominio.com'];
      if (result.hostname && !allowedHosts.includes(result.hostname)) {
        console.log('❌ Hostname no permitido:', result.hostname);
        return res.status(403).json({
          success: false,
          message: 'Origen no permitido',
          hostname: result.hostname
        });
      }
    }

    // Las claves de prueba siempre devuelven success: true
    if (isTestKey) {
      console.log('🧪 Usando claves de prueba de reCAPTCHA');
    }

    console.log('✅ CAPTCHA verificado exitosamente');
    return next();

  } catch (error) {
    console.error('❌ Error verificando CAPTCHA:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno validando CAPTCHA'
    });
  }
}

module.exports = { verifyRecaptcha };
