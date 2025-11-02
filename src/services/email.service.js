// email-hybrid.js - Sistema híbrido: API de Brevo con respaldo SMTP

const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

// Función para enviar correo con API de Brevo (método preferido) con reintentos
async function sendBrevoAPI(recipientEmail, temporalPassword, attempt = 1, maxAttempts = 3) {
    try {
        console.log(`📧 Intentando envío con API de Brevo (intento ${attempt}/${maxAttempts})...`);

        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
            throw new Error('BREVO_API_KEY no configurada');
        }

        const emailData = {
            sender: {
                name: "Sistema AcademicoDB",
                email: "henryalibat4@gmail.com"  // Usar tu email verificado en Brevo
            },
            to: [{
                email: recipientEmail,
                name: "Usuario"
            }],
            subject: "🔑 Tu contraseña temporal - AcademicoDB",
            htmlContent: createEmailTemplate(temporalPassword)
        };

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(emailData),
            timeout: 8000 // Timeout de 8 segundos
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ API de Brevo: Correo enviado exitosamente (intento ${attempt})`);
            return {
                success: true,
                messageId: result.messageId,
                method: 'brevo-api',
                attempt: attempt
            };
        } else {
            const error = await response.json();
            throw new Error(`API Error ${response.status}: ${error.message || response.statusText}`);
        }

    } catch (error) {
        console.log(`❌ API de Brevo intento ${attempt} falló:`, error.message);

        // Si es un error de conexión (ECONNRESET) y aún tenemos intentos, reintentar
        if ((error.code === 'ECONNRESET' || error.message.includes('ECONNRESET')) && attempt < maxAttempts) {
            console.log(`🔄 Reintentando en 2 segundos... (${attempt + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
            return await sendBrevoAPI(recipientEmail, temporalPassword, attempt + 1, maxAttempts);
        }

        return {
            success: false,
            error: error.message,
            attempts: attempt
        };
    }
}

// Función para enviar correo con SMTP de Brevo (método de respaldo)
async function sendBrevoSMTP(recipientEmail, temporalPassword) {
    try {
        console.log('📧 Intentando envío con SMTP de Brevo...');

        const transporter = nodemailer.createTransport({
            host: 'smtp-relay.sendinblue.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.BREVO_USER || '982907001@smtp-brevo.com',
                pass: process.env.BREVO_PASS || 'XsT6t9FmqdaW12DU'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: '"AcademicoDB Sistema" <henryalibat4@gmail.com>',
            to: recipientEmail,
            subject: '🔑 Tu contraseña temporal - AcademicoDB',
            html: createEmailTemplate(temporalPassword)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ SMTP de Brevo: Correo enviado exitosamente');

        return {
            success: true,
            messageId: info.messageId,
            method: 'brevo-smtp'
        };

    } catch (error) {
        console.log('❌ SMTP de Brevo falló:', error.message);
        return { success: false, error: error.message };
    }
}

// Función para crear el template del correo
function createEmailTemplate(temporalPassword) {
    return `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">🔑 Contraseña Temporal</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Sistema AcademicoDB</p>
            </div>

            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #333;">Hola,</p>
                <p style="font-size: 16px; color: #333;">Has solicitado una nueva contraseña temporal para tu cuenta en AcademicoDB.</p>

                <div style="background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; border-left: 4px solid #4CAF50;">
                    <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;"><strong>Tu contraseña temporal es:</strong></p>
                    <div style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; color: #4CAF50; background: #f8f9fa; padding: 15px; border-radius: 5px; letter-spacing: 2px;">
                        ${temporalPassword}
                    </div>
                </div>

                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⚠️ Información importante:</strong></p>
                    <ul style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">
                        <li>Esta contraseña expira en <strong>24 horas</strong></li>
                        <li>Al iniciar sesión, serás redirigido automáticamente para crear una nueva contraseña</li>
                        <li>No compartas esta información con nadie</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000" style="display: inline-block; background: #4CAF50; color: white; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        Iniciar Sesión Ahora
                    </a>
                </div>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">

                <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                    Este correo se generó automáticamente desde el Sistema AcademicoDB.<br>
                    Si no solicitaste esta recuperación, puedes ignorar este mensaje.
                </p>
            </div>
        </div>
    `;
}

// Función principal: Intenta API primero, luego SMTP como respaldo
async function sendBrevoEmail(recipientEmail, temporalPassword) {
    console.log('📧 Enviando correo con sistema híbrido a:', recipientEmail);

    // Primer intento: API de Brevo
    const apiResult = await sendBrevoAPI(recipientEmail, temporalPassword);
    if (apiResult.success) {
        return apiResult;
    }

    console.log('🔄 API de Brevo falló, intentando con SMTP...');

    // Segundo intento: SMTP de Brevo
    const smtpResult = await sendBrevoSMTP(recipientEmail, temporalPassword);
    if (smtpResult.success) {
        return smtpResult;
    }

    console.log('❌ Ambos métodos fallaron');

    return {
        success: false,
        error: `API falló: ${apiResult.error}. SMTP falló: ${smtpResult.error}`
    };
}

module.exports = { sendBrevoEmail };