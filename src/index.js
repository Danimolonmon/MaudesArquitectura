/**
 * Cloudflare Worker — Maudes Arquitectura
 *
 * Secrets necesarios (Cloudflare Dashboard > Workers > Settings > Variables):
 *   RESEND_API_KEY   → API key de Resend (https://resend.com)
 *   LEAD_TO_EMAIL    → destinatario de los leads (marta@maudesarquitectura.com)
 *   LEAD_FROM_EMAIL  → remitente verificado en Resend (ej. web@maudesarquitectura.com)
 *
 * Rutas:
 *   POST /api/lead  → procesa el formulario y envía email
 *   *               → sirve archivos estáticos desde el binding ASSETS
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Formulario de leads ──────────────────────────────────────────────
    if (url.pathname === '/api/lead' && request.method === 'POST') {
      return handleLead(request, env);
    }

    // ── Archivos estáticos (HTML, CSS, fonts, imágenes…) ─────────────────
    return env.ASSETS.fetch(request);
  },
};

// ── handleLead ───────────────────────────────────────────────────────────────

async function handleLead(request, env) {
  // 1. Parsear formulario
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response('No se pudo leer el formulario.', { status: 400 });
  }

  const tiene_terreno = (formData.get('tiene_terreno') || '').trim().toLowerCase();
  const ubicacion     = (formData.get('ubicacion')     || '').trim();
  const m2_parcela    = (formData.get('m2_parcela')    || '').trim();
  const plazo         = (formData.get('plazo')         || '').trim();
  const email         = (formData.get('email')         || '').trim();
  const telefono      = (formData.get('telefono')      || '').trim();

  // 2. Validar campos obligatorios
  if (!tiene_terreno || !ubicacion || !plazo || !email) {
    return new Response('Faltan campos obligatorios.', { status: 400 });
  }

  // Solo aceptamos leads que tienen terreno
  if (tiene_terreno !== 'si') {
    return new Response('Esta solución es solo para personas con terreno.', { status: 400 });
  }

  // Validación básica de email
  if (!email.includes('@') || !email.includes('.')) {
    return new Response('El email no tiene un formato válido.', { status: 400 });
  }

  // 3. Comprobar variables de entorno
  if (!env.RESEND_API_KEY || !env.LEAD_TO_EMAIL || !env.LEAD_FROM_EMAIL) {
    console.error('Faltan secrets: RESEND_API_KEY, LEAD_TO_EMAIL o LEAD_FROM_EMAIL');
    return new Response('Error de configuración del servidor.', { status: 500 });
  }

  // 4. Construir email
  const fecha = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const plazoLabel = { 'ya': 'Ya (inmediato)', '3-6m': '3–6 meses', '6-12m': '6–12 meses' }[plazo] || plazo;

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

  // 5. Enviar via Resend
  let resendOk = false;
  try {
    console.log('Enviando email con Resend...');
    console.log('FROM:', env.LEAD_FROM_EMAIL);
    console.log('TO:', env.LEAD_TO_EMAIL);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    env.LEAD_FROM_EMAIL,
        to:      env.LEAD_TO_EMAIL,
        subject: 'Nuevo lead Maudes Arquitectura',
        html:    '<p>Test lead Maudes Arquitectura</p>',
      }),
    });

    if (res.ok) {
      resendOk = true;
    } else {
      const resBody = await res.text();
      console.error('Resend error status:', res.status);
      console.error('Resend error body:', resBody);
    }
  } catch (err) {
    console.error('Error conectando con Resend:', err);
  }

  // 6. Redirigir siempre — si Resend falló, gracias.html lo indica sutilmente
  const dest = new URL(resendOk ? '/gracias.html' : '/gracias.html?ok=0', request.url);
  return Response.redirect(dest.toString(), 303);
}
