/**
 * Cloudflare Worker — Maudes Arquitectura
 *
 * Secrets necesarios (Cloudflare Dashboard > Workers > Settings > Variables):
 *   RESEND_API_KEY   → API key de Resend (https://resend.com)
 *   LEAD_TO_EMAIL    → destinatario de los leads (marta@maudesarquitectura.es)
 *   LEAD_FROM_EMAIL  → remitente verificado en Resend (ej. web@maudesarquitectura.es)
 *
 * Rutas:
 *   POST /api/lead  → procesa el formulario y envía email
 *   *               → sirve archivos estáticos desde el binding ASSETS
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Alias de URL limpia para la página de equipo
    if (url.pathname === '/quienes-somos') {
      return env.ASSETS.fetch(new Request(new URL('/quienes-somos.html', request.url), request));
    }

    if (url.pathname === '/privacidad') {
      return env.ASSETS.fetch(new Request(new URL('/privacidad.html', request.url), request));
    }

    if (url.pathname === '/landing-ads' || url.pathname === '/landing-ads.html') {
      return serveLandingAds(request, env);
    }

    // Alias de URL limpia para landing SEO vivienda unifamiliar
    if (url.pathname === '/arquitecto-vivienda-unifamiliar') {
      return env.ASSETS.fetch(new Request(new URL('/arquitecto-vivienda-unifamiliar.html', request.url), request));
    }

    // Alias de URL limpia para landing SEO rehabilitación
    if (url.pathname === '/rehabilitacion-vivienda') {
      return env.ASSETS.fetch(new Request(new URL('/rehabilitacion-vivienda.html', request.url), request));
    }

    // Alias de URL limpia para artículo SEO coste construcción
    if (url.pathname === '/cuanto-cuesta-construir-una-casa') {
      return env.ASSETS.fetch(new Request(new URL('/cuanto-cuesta-construir-una-casa.html', request.url), request));
    }

    // Alias de URL limpia para artículo SEO terrenos
    if (url.pathname === '/comprar-terreno-construir-casa') {
      return env.ASSETS.fetch(new Request(new URL('/comprar-terreno-construir-casa.html', request.url), request));
    }

    // ── Formulario de leads ──────────────────────────────────────────────
    if (url.pathname === '/api/lead' && request.method === 'POST') {
      return handleLead(request, env);
    }

    // ── Archivos estáticos (HTML, CSS, fonts, imágenes…) ─────────────────
    return env.ASSETS.fetch(request);
  },
};

async function serveLandingAds(request, env) {
  const assetRequest = new Request(new URL('/landing-ads.html', request.url), request);
  const response = await env.ASSETS.fetch(assetRequest);

  if (!response.ok) {
    return response;
  }

  const html = await response.text();
  const siteKey = env.TURNSTILE_SITE_KEY || '';

  return new Response(html.replace('__TURNSTILE_SITE_KEY__', escAttr(siteKey)), {
    status: response.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

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
  const nombre        = (formData.get('nombre')        || '').trim();
  const telefono      = (formData.get('telefono')      || '').trim();
  const privacidad    = formData.get('privacidad') === 'aceptada';
  const turnstileToken = (formData.get('cf-turnstile-response') || '').toString();
  const comentarios = (formData.get('comentarios') || '').toString().trim();

  // 2. Validar campos obligatorios
  if (!tiene_terreno || !ubicacion || !plazo || !email) {
    return new Response('Faltan campos obligatorios.', { status: 400 });
  }

  if (!privacidad) {
    return new Response('Debes aceptar la politica de privacidad.', { status: 400 });
  }

  // Solo aceptamos leads que tienen terreno
  if (tiene_terreno !== 'si') {
    return new Response('Esta solución es solo para personas con terreno.', { status: 400 });
  }

  // Validación básica de email
  if (!email.includes('@') || !email.includes('.')) {
    return new Response('El email no tiene un formato válido.', { status: 400 });
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    console.error('Falta secret: TURNSTILE_SECRET_KEY');
    return new Response('Error de configuracion del servidor.', { status: 500 });
  }

  const turnstileOk = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, request);
  if (!turnstileOk) {
    return new Response('No se pudo validar la proteccion anti-spam.', { status: 400 });
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

  // Normalizar opcionales: null/undefined/vacío → "No indicado"
  const safe_nombre   = nombre     || 'No indicado';
  const safe_m2       = m2_parcela || 'No indicado';
  const safe_telefono = telefono   || 'No indicado';
  const safe_comentarios = comentarios || 'No indicado';

  const htmlBody = [
    '<h2>Nuevo lead Maudes Arquitectura</h2>',
    '<p><strong>Fecha:</strong> ' + esc(fecha) + '</p>',
    '<p><strong>Tiene terreno:</strong> S&iacute;</p>',
    '<p><strong>Ubicaci&oacute;n:</strong> ' + esc(ubicacion) + '</p>',
    '<p><strong>M&sup2; parcela:</strong> ' + esc(safe_m2) + '</p>',
    '<p><strong>Plazo:</strong> ' + esc(plazoLabel) + '</p>',
    '<p><strong>Nombre:</strong> ' + esc(safe_nombre) + '</p>',
    '<p><strong>Email:</strong> ' + esc(email) + '</p>',
    '<p><strong>Tel&eacute;fono:</strong> ' + esc(safe_telefono) + '</p>',
    '<p><strong>Privacidad:</strong> Aceptada</p>',
    '<p><strong>Comentarios:</strong> ' + esc(safe_comentarios) + '</p>',
  ].join('\n');

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
        html:    htmlBody,
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

// ── Helpers ──────────────────────────────────────────────────────────────────

async function verifyTurnstile(token, secret, request) {
  if (!token) {
    return false;
  }

  const remoteIp = request.headers.get('CF-Connecting-IP') || '';
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);

  if (remoteIp) {
    body.append('remoteip', remoteIp);
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const result = await response.json();
    return Boolean(result.success);
  } catch (err) {
    console.error('Error validando Turnstile:', err);
    return false;
  }
}

function escAttr(value) {
  return String(value ?? '').replace(/"/g, '&quot;');
}

/** Escapa caracteres HTML para evitar inyección en el cuerpo del email */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
