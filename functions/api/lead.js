/**
 * Cloudflare Pages Function — POST /api/lead
 *
 * Variables de entorno necesarias (configurar en Cloudflare Pages > Settings > Environment Variables):
 *   RESEND_API_KEY   → tu API key de Resend (https://resend.com)
 *   LEAD_TO_EMAIL    → email donde recibirás los leads (ej. marta@maudesarquitectura.com)
 *   LEAD_FROM_EMAIL  → remitente verificado en Resend (ej. web@maudesarquitectura.com)
 *                      ⚠️ El dominio del remitente DEBE estar verificado en tu cuenta de Resend.
 */

/** Maneja solo peticiones POST */
export async function onRequestPost(context) {
  const { request, env } = context;

  // ── 1. Parsear el cuerpo del formulario ──────────────────────────────────
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, 'No se pudo leer el formulario.');
  }

  const tiene_terreno = (formData.get('tiene_terreno') || '').trim();
  const ubicacion     = (formData.get('ubicacion')     || '').trim();
  const m2_parcela    = (formData.get('m2_parcela')    || '').trim();
  const plazo         = (formData.get('plazo')         || '').trim();
  const email         = (formData.get('email')         || '').trim();
  const telefono      = (formData.get('telefono')      || '').trim();

  // ── 2. Validación de campos obligatorios ─────────────────────────────────
  if (!tiene_terreno || !ubicacion || !plazo || !email) {
    return errorResponse(400, 'Faltan campos obligatorios.');
  }

  // Solo aceptamos leads que SÍ tienen terreno
  if (tiene_terreno !== 'si') {
    return errorResponse(400, 'Esta solución está pensada solo para personas con terreno.');
  }

  // Validación básica de email
  if (!email.includes('@') || !email.includes('.')) {
    return errorResponse(400, 'El email no tiene un formato válido.');
  }

  // ── 3. Comprobar que las variables de entorno están configuradas ──────────
  if (!env.RESEND_API_KEY || !env.LEAD_TO_EMAIL || !env.LEAD_FROM_EMAIL) {
    console.error('Faltan variables de entorno: RESEND_API_KEY, LEAD_TO_EMAIL o LEAD_FROM_EMAIL');
    return errorResponse(500, 'Error de configuración del servidor.');
  }

  // ── 4. Construir el cuerpo del email ─────────────────────────────────────
  const fecha = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const plazoLabel = {
    'ya':    'Ya (inmediato)',
    '3-6m':  '3–6 meses',
    '6-12m': '6–12 meses',
  }[plazo] || plazo;

  const textBody = [
    'Nuevo lead recibido desde Maudes Arquitectura',
    '─'.repeat(44),
    `Fecha:          ${fecha}`,
    '',
    `¿Tiene terreno? Sí`,
    `Ubicación:      ${ubicacion}`,
    `M² de parcela:  ${m2_parcela || 'No indicado'}`,
    `Plazo:          ${plazoLabel}`,
    `Email:          ${email}`,
    `Teléfono:       ${telefono || 'No indicado'}`,
    '─'.repeat(44),
    'Enviado desde landing-ads.html',
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f1e1a">
      <h2 style="margin:0 0 4px;font-size:1.2rem">Nuevo lead — Maudes Arquitectura</h2>
      <p style="margin:0 0 20px;color:#62605a;font-size:0.85rem">${fecha}</p>
      <table style="width:100%;border-collapse:collapse;font-size:0.92rem">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a;width:160px">¿Tiene terreno?</td><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Sí</strong></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a">Ubicación</td><td style="padding:8px 0;border-bottom:1px solid #eee">${ubicacion}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a">M² de parcela</td><td style="padding:8px 0;border-bottom:1px solid #eee">${m2_parcela || '<em style="color:#aaa">No indicado</em>'}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a">Plazo</td><td style="padding:8px 0;border-bottom:1px solid #eee">${plazoLabel}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a">Email</td><td style="padding:8px 0;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#62605a">Teléfono</td><td style="padding:8px 0">${telefono || '<em style="color:#aaa">No indicado</em>'}</td></tr>
      </table>
      <p style="margin-top:24px;font-size:0.78rem;color:#aaa">Enviado desde landing-ads.html · Maudes Arquitectura</p>
    </div>
  `.trim();

  // ── 5. Enviar email via Resend ────────────────────────────────────────────
  let resendOk = false;
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    env.LEAD_FROM_EMAIL,
        to:      env.LEAD_TO_EMAIL,
        subject: 'Nuevo lead — Maudes Arquitectura',
        text:    textBody,
        html:    htmlBody,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error('Resend error:', resendRes.status, err);
    } else {
      resendOk = true;
    }
  } catch (err) {
    console.error('Error conectando con Resend:', err);
  }

  // ── 6. Redirigir siempre a gracias.html ──────────────────────────────────
  // Se redirige en ambos casos para no exponer errores internos al usuario.
  // Si Resend falla, se pasa ?ok=0 para que gracias.html lo muestre sutilmente.
  const redirectUrl = new URL(resendOk ? '/gracias.html' : '/gracias.html?ok=0', request.url);
  return Response.redirect(redirectUrl.toString(), 303);
}

/** Rechaza cualquier método que no sea POST */
export async function onRequest(context) {
  return new Response('Método no permitido.', {
    status: 405,
    headers: { Allow: 'POST' },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function errorResponse(status, message) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
