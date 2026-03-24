var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/lead" && request.method === "POST") {
      return handleLead(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
async function handleLead(request, env) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response("No se pudo leer el formulario.", { status: 400 });
  }
  const tiene_terreno = (formData.get("tiene_terreno") || "").trim().toLowerCase();
  const ubicacion = (formData.get("ubicacion") || "").trim();
  const m2_parcela = (formData.get("m2_parcela") || "").trim();
  const plazo = (formData.get("plazo") || "").trim();
  const email = (formData.get("email") || "").trim();
  const telefono = (formData.get("telefono") || "").trim();
  if (!tiene_terreno || !ubicacion || !plazo || !email) {
    return new Response("Faltan campos obligatorios.", { status: 400 });
  }
  if (tiene_terreno !== "si") {
    return new Response("Esta soluci\xF3n es solo para personas con terreno.", { status: 400 });
  }
  if (!email.includes("@") || !email.includes(".")) {
    return new Response("El email no tiene un formato v\xE1lido.", { status: 400 });
  }
  if (!env.RESEND_API_KEY || !env.LEAD_TO_EMAIL || !env.LEAD_FROM_EMAIL) {
    console.error("Faltan secrets: RESEND_API_KEY, LEAD_TO_EMAIL o LEAD_FROM_EMAIL");
    return new Response("Error de configuraci\xF3n del servidor.", { status: 500 });
  }
  const fecha = (/* @__PURE__ */ new Date()).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    dateStyle: "full",
    timeStyle: "short"
  });
  const plazoLabel = { "ya": "Ya (inmediato)", "3-6m": "3\u20136 meses", "6-12m": "6\u201312 meses" }[plazo] || plazo;
  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f1e1a">
      <h2 style="margin:0 0 4px;font-size:1.2rem">Nuevo lead \u2014 Maudes Arquitectura</h2>
      <p style="margin:0 0 20px;color:#62605a;font-size:0.85rem">${fecha}</p>
      <table style="width:100%;border-collapse:collapse;font-size:0.92rem">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a;width:160px">\xBFTiene terreno?</td><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>S\xED</strong></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a">Ubicaci\xF3n</td><td style="padding:8px 0;border-bottom:1px solid #eee">${ubicacion}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a">M\xB2 de parcela</td><td style="padding:8px 0;border-bottom:1px solid #eee">${m2_parcela || '<em style="color:#aaa">No indicado</em>'}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a">Plazo</td><td style="padding:8px 0;border-bottom:1px solid #eee">${plazoLabel}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#62605a">Email</td><td style="padding:8px 0;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#62605a">Tel\xE9fono</td><td style="padding:8px 0">${telefono || '<em style="color:#aaa">No indicado</em>'}</td></tr>
      </table>
      <p style="margin-top:24px;font-size:0.78rem;color:#aaa">Enviado desde landing-ads.html \xB7 Maudes Arquitectura</p>
    </div>
  `.trim();
  let resendOk = false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.LEAD_FROM_EMAIL,
        to: env.LEAD_TO_EMAIL,
        subject: "Nuevo lead Maudes Arquitectura",
        html: htmlBody
      })
    });
    if (res.ok) {
      resendOk = true;
    } else {
      console.error("Resend error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Error conectando con Resend:", err);
  }
  const dest = new URL(resendOk ? "/gracias.html" : "/gracias.html?ok=0", request.url);
  return Response.redirect(dest.toString(), 303);
}
__name(handleLead, "handleLead");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
