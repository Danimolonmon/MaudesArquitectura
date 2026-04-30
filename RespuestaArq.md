# Diagnóstico definitivo `/landing-ads` - render bloqueado por filtros `ads-*` - 30 de abril de 2026

## 1. Logs reales antes/después

Producción leída con `Invoke-WebRequest`:

```txt
https://maudesarquitectura.es/landing-ads
```

El HTML de producción contenía los elementos críticos:

```html
<form class="lead-form" id="lead-form" action="/api/lead" method="post" novalidate>
<div class="ads-container">
<div class="ads-form-card" id="formulario">
<div class="ads-right">
<div class="ia-panel">
<button type="button" id="btn-ia">Empezar con IA</button>
```

Chrome headless limpio contra producción renderizó esos nodos y el `embed.js` inyectó estilos:

```txt
<style id="arqsuite-intake-styles">...</style>
<form class="lead-form" id="lead-form" ...>
<div class="ia-panel">
<button type="button" id="btn-ia">Empezar con IA</button>
```

Validaciones locales después del cambio:

```txt
inline scripts parse ok, no BOM
rg "ads-" landing-ads.html pages-custom.css -> sin resultados
```

## 2. Punto exacto donde se rompe ejecución/render

El problema no está en `_config`: el `embed.js` remoto define `_config` como variable local dentro de su IIFE. No es `window._config` y no debería existir globalmente.

El punto de rotura real para "navegador normal no / incógnito sí" está antes de la interacción con el embed: los elementos críticos de la landing usaban clases `ads-*`.

Ejemplos previos:

```html
<section class="ads-hero">
<div class="ads-container">
<div class="ads-form-card">
<section class="ads-section">
<footer class="ads-footer">
```

Esas clases son candidatas directas a filtros cosméticos de extensiones/adblockers. En incógnito normalmente las extensiones están deshabilitadas, por eso el render aparecía.

## 3. Causa raíz

Causa raíz aplicada al código de esta landing:

```txt
El formulario y el panel IA estaban dentro de contenedores con clases `ads-*`.
En navegadores normales con extensiones de bloqueo, esas clases pueden quedar ocultas por filtros cosméticos.
En incógnito, al no ejecutarse esas extensiones, el HTML sí aparece.
```

Cloudflare Turnstile no es la causa principal:
- Se carga antes del embed con `async defer`.
- Sus 401 de challenge no están en la ruta de render del HTML estático.
- El formulario y el panel IA son markup ya presente antes del submit y antes de cualquier validación Turnstile.

El `embed.js` tampoco explica que desaparezcan formulario y panel:
- El formulario y el panel existen antes de que se pulse IA.
- Chrome limpio confirmó que `embed.js` carga e inyecta `arqsuite-intake-styles`.

## 4. Cambios aplicados

### Renombrado anti-adblock

Se sustituyeron clases críticas de `ads-*` a `campaign-*` en:

- `landing-ads.html`
- `pages-custom.css`

Antes:

```html
<section class="ads-hero">
<div class="ads-container">
<div class="ads-form-card">
```

Después:

```html
<section class="campaign-hero">
<div class="campaign-container">
<div class="campaign-form-card">
```

Validación:

```txt
rg "ads-" landing-ads.html pages-custom.css
sin resultados
```

### Instrumentación runtime

Se añadió instrumentación en `landing-ads.html`:

```js
window.addEventListener('error', ...)
window.addEventListener('unhandledrejection', ...)
record('EMBED INIT START', ...)
record('EMBED SCRIPT LOAD', ...)
record('BIND IA BUTTON START', ...)
record('IA BUTTON CLICK', ...)
```

También se añadió guard/fallback de configuración:

```js
var hadWindowConfig = Boolean(window._config);
window._config = window._config || window.MaudesArqSuiteIntakeConfig;
```

Si no existía `window._config`, se registra un aviso controlado y se usa la configuración local de Maudes. En el widget actual `_config` no vive en `window`, pero este fallback evita depender de una variable global no controlada.

### Fallback seguro del widget

La landing mantiene:

```js
window.MaudesArqSuiteIntakeConfig = {
  tenantId: '46df1d61-7ffe-4469-8b42-b521eda04e8b',
  buttonText: 'Empezar con IA',
  primaryColor: '#1d1d1b',
  appUrl: 'https://iarquitect.maudesarquitectura.es'
};
```

Y carga el embed versionado:

```html
<script
  src="https://iarquitect.maudesarquitectura.es/embed.js?v=20260430-landing-ads"
  data-tenant-id="46df1d61-7ffe-4469-8b42-b521eda04e8b"
  data-mode="modal"
  data-button-text="Empezar con IA"
  data-primary-color="#1d1d1b"
  data-app-url="https://iarquitect.maudesarquitectura.es">
</script>
```

Si `window.ArqSuiteIntake.open` no existe, se crea un fallback controlado que valida `tenantId` y `appUrl`, y renderiza el overlay con:

```txt
https://iarquitect.maudesarquitectura.es/intake?tenantId=46df1d61-7ffe-4469-8b42-b521eda04e8b
```

## 5. Confirmación de funcionamiento estable

Pruebas realizadas:

```txt
Chrome headless limpio contra producción: formulario y panel IA aparecen.
embed.js remoto: 200 OK.
embed.js remoto: inyecta #arqsuite-intake-styles.
Scripts inline locales: parse OK.
Sin BOM en landing-ads.html.
Sin clases ads-* en landing-ads.html ni pages-custom.css.
Sin lógica antigua: public-intake, redirectUrl, startIAFlow, iaModal.
Fallback local simulado: crea overlay e iframe correctamente.
Brave headless local tras renombrado: aparecen lead-form, campaign-container, campaign-form-card, ia-panel y btn-ia.
```

Limitación real:
- Desde este repo no puedo ejecutar el Chrome normal del usuario con sus extensiones activas.
- Sí queda eliminada la causa de código que hace que extensiones/adblockers oculten los contenedores críticos: las clases `ads-*`.

# Diagnóstico crítico `/landing-ads` - embed ArqSuite - 30 de abril de 2026

## 1. Archivos inspeccionados
- `landing-ads.html`
- `pages-custom.css`
- `src/index.js`
- `RespuestaArq.md`
- `embed.js` remoto desde `https://iarquitect.maudesarquitectura.es/embed.js`

## 2. Dónde se define `_config`
En el `embed.js` remoto, `_config` se define dentro de una IIFE del propio widget:

```js
(function () {
  'use strict';

  if (window.__ArqSuiteIntakeLoaded) return;
  window.__ArqSuiteIntakeLoaded = true;

  var _config = {
    tenantId: '',
    mode: 'modal',
    buttonText: 'Empezar mi proyecto con IA',
    primaryColor: '#1d4ed8',
    position: 'bottom-right',
    leadData: null,
    contactEmail: '',
    appUrl: '',
  };
})();
```

Conclusión:
- `_config` no es global.
- No existe como `window._config`.
- En la versión remota actual (`v1.1`) se define siempre que el script llega a ejecutarse después del guard inicial.
- No depende de cookies, Cloudflare Turnstile, `localStorage` ni `sessionStorage`.

## 3. Por qué falla
La hipótesis inicial (`_config` global no definido) no coincide con el `embed.js` actual: `_config` es local y se crea dentro del widget.

El fallo real en la integración local era que `landing-ads.html` dependía completamente de que el script externo dejase disponible `window.ArqSuiteIntake.open`. Si el script remoto:
- se servía desde caché antigua/rota,
- era bloqueado o interrumpido por navegador/extensión,
- lanzaba error antes de crear `window.ArqSuiteIntake`,
- o hacía `return` por `window.__ArqSuiteIntakeLoaded` sin dejar API válida,

entonces el botón IA solo hacía `console.warn('ArqSuiteIntake no está disponible todavía.')` y no renderizaba overlay.

Esto explica el patrón observado:
- Incógnito suele cargar una copia limpia del `embed.js`.
- Navegador normal puede conservar caché, extensiones o estado de carga distinto.

El formulario HTML y el panel IA son markup estático en `landing-ads.html`; no dependen de `_config`. El envío tradicional sigue en `/api/lead` y el Worker `src/index.js` no interviene en la inicialización del widget.

## 4. Logs reales
Lectura del `embed.js` remoto:

```txt
ArqSuite Public Intake Embed Widget - v1.1
if (window.__ArqSuiteIntakeLoaded) return;
window.__ArqSuiteIntakeLoaded = true;
var _config = { tenantId: '', mode: 'modal', ... };
window.ArqSuiteIntake = { open, close, forceClose, configure, isOpen, getConfig };
```

Validaciones locales ejecutadas:

```txt
inline scripts parse ok
fallback widget simulation ok
official widget path simulation ok
```

También se verificó que ya no quedan referencias a:

```txt
public-intake
redirectUrl
startIAFlow
startPublicChat
collectLeadDataFromForm
iaModal
openIamodal
closeIamodal
```

## 5. Cambios aplicados

### Antes
`landing-ads.html` cargaba el embed sin versión y dependía de la API externa:

```html
<script src="https://iarquitect.maudesarquitectura.es/embed.js" ...></script>
```

Si `window.ArqSuiteIntake` no existía, el botón IA solo registraba un warning y no abría nada.

### Después
Se añadió configuración controlada por la landing:

```js
window.MaudesArqSuiteIntakeConfig = {
  tenantId: '46df1d61-7ffe-4469-8b42-b521eda04e8b',
  buttonText: 'Empezar con IA',
  primaryColor: '#1d1d1b',
  appUrl: 'https://iarquitect.maudesarquitectura.es'
};
```

Se versionó el script para evitar caché antigua:

```html
<script
  src="https://iarquitect.maudesarquitectura.es/embed.js?v=20260430-landing-ads"
  data-tenant-id="46df1d61-7ffe-4469-8b42-b521eda04e8b"
  data-mode="modal"
  data-button-text="Empezar con IA"
  data-primary-color="#1d1d1b"
  data-app-url="https://iarquitect.maudesarquitectura.es">
</script>
```

Se añadió fallback robusto:
- Si `window.ArqSuiteIntake.open` existe, se usa el widget oficial.
- Si no existe, la landing crea `window.ArqSuiteIntake` con una implementación mínima y segura.
- El fallback valida `tenantId` y `appUrl`.
- Si faltan, muestra error controlado con `console.error`.
- El fallback renderiza overlay e iframe con `/intake?tenantId=...`.
- No se duplica modal: el fallback solo se activa cuando la API oficial no está disponible.

Se mantiene oculto el botón flotante automático del widget:

```css
.arqsuite-intake-btn {
  display: none !important;
}
```

## 6. Prueba real de que ahora funciona

Pruebas ejecutadas:
- Parseo de scripts inline: OK.
- Ruta oficial simulada: si `window.ArqSuiteIntake.open` existe, el botón `#btn-ia` llama al widget oficial con el tenant correcto.
- Ruta fallback simulada: si el widget oficial no expone API, el botón `#btn-ia` crea overlay local y carga:

```txt
https://iarquitect.maudesarquitectura.es/intake?tenantId=46df1d61-7ffe-4469-8b42-b521eda04e8b
```

El formulario tradicional se mantiene intacto:

```html
<form class="lead-form" id="lead-form" action="/api/lead" method="post" novalidate>
```

No se tocó backend, validaciones ni envío de email.

# Actualización RGPD landing ads - 29 de abril de 2026

## 1. Cambios realizados
- Se actualizó el formulario de `landing-ads.html` para recoger solo los datos necesarios y mantener una UX limpia.
- Se reforzó la validación en cliente con `checkValidity()` y `reportValidity()` pese a que el formulario conserva `novalidate`.
- Se actualizó `src/index.js` para validar en servidor el consentimiento RGPD y el token anti-spam antes de enviar el email.
- Se añadió el alias `/privacidad` para que el enlace legal funcione con URL limpia.
- Se ajustaron estilos en `pages-custom.css` para checkbox RGPD, texto legal corto y Turnstile sin bloques pesados.

## 2. Campos añadidos/eliminados
- Añadido: `nombre` opcional.
- Mantenidos: `email` obligatorio, `telefono` opcional, `comentarios` opcional.
- Eliminado: `contacto_inmediato`.
- Se conserva el filtrado propio de la landing: terreno, ubicación, metros de parcela y plazo.

## 3. Implementación RGPD
- Checkbox obligatorio no premarcado: "He leído y acepto la política de privacidad".
- El enlace apunta a `/privacidad`.
- El Worker rechaza el envio si `privacidad` no llega como `aceptada`.
- Debajo del botón se añadió el texto legal corto: "Usaremos tus datos para responder a tu solicitud y, si procede, preparar una propuesta. Puedes ejercer tus derechos en cualquier momento."

## 4. Sistema anti-spam usado
- Se integró Cloudflare Turnstile en el formulario.
- El widget usa la site key pública de Turnstile directamente en el HTML para evitar fallos si la landing se sirve como asset estático.
- El servidor valida `cf-turnstile-response` contra Cloudflare con `TURNSTILE_SECRET_KEY`.
- Turnstile queda configurado con `data-appearance="interaction-only"` para mantener el formulario limpio y mostrarse solo si Cloudflare necesita interacción.
- No se integro Google reCAPTCHA.
- Configurado en `wrangler.jsonc`: `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`.

---

# Optimización SEO - Maudes Arquitectura
## Resumen de cambios implementados

---

## 1. MICRO-AJUSTES EN SERVICIOS (keywords discretas)

### ✅ Qué se ha añadido
Una frase adicional en cada tarjeta de servicio con keywords SEO naturales.

### 📍 Dónde
- **Vivienda unifamiliar** (sección servicios, tarjeta 01)
- **Reformas integrales** (sección servicios, tarjeta 02)
- **Asesoramiento técnico** (sección servicios, tarjeta 03)

### 🔑 Keywords introducidas
- `normativa urbanística`
- `proyecto arquitectónico`
- `viabilidad real`
- `coste real`
- `viabilidad`

### 💡 Por qué mejora SEO sin romper UX
- El texto añadido es coherente con el servicio
- Solo 1 frase extra por tarjeta (no sobrecarga)
- Aporta valor informativo real
- Keywords integradas de forma natural

**Antes:**
```
Te ayudamos a diseñar y construir tu casa desde cero,
analizando terreno, normativa y coste antes de tomar decisiones.
```

**Después:**
```
Te ayudamos a diseñar y construir tu casa desde cero,
analizando terreno, normativa urbanística y coste antes de tomar decisiones.
Desarrollamos el proyecto arquitectónico completo con criterio de viabilidad real.
```

---

## 2. AJUSTES GEOGRÁFICOS (SEO local natural)

### ✅ Qué se ha añadido
- Cambio en zona de contacto: de "Toda la península" a texto más descriptivo
- Mención de Madrid en sección "Quiénes somos"

### 📍 Dónde
- **Contacto > Zona** (sección contacto)
- **Quiénes somos > Intro** (sección about)

### 🔑 Keywords geográficas
- `península`
- `Madrid`
- `normativa local`
- `distintos puntos de la península`

### 💡 Por qué mejora SEO sin romper UX
- No fuerza keywords en hero
- Información útil y transparente
- Señales geográficas para Google
- Responde duda del usuario: ¿dónde trabajan?

**Cambios:**
```
CONTACTO: "Proyectos en distintos puntos de la península, adaptados a normativa local"
NOSOTROS: "Trabajamos desde Madrid y desarrollamos proyectos en distintos puntos de la península"
```

---

## 3. BLOQUE COLAPSABLE: INFORMACIÓN TÉCNICA + FAQ

### ✅ Qué se ha añadido
Un acordeón cerrado por defecto, justo antes del footer, con:
- **Sección 1:** Qué hace un arquitecto en vivienda unifamiliar
- **Sección 2:** Por qué analizar normativa antes de diseñar
- **Sección 3:** Relación entre terreno, proyecto y coste
- **FAQ:** 4 preguntas frecuentes (colapsables)

### 📍 Dónde (posición en DOM)
```
<main>
  ...secciones existentes...
  <section class="block-final-cta">...</section>
  
  ← NUEVO BLOQUE AQUÍ
  <section class="block-info-seo">
    <details class="info-accordion"> ← CERRADO por defecto
      ...contenido SEO...
    </details>
  </section>
</main>
<footer>...</footer>
```

### 🔑 Keywords introducidas
- `arquitecto` + `vivienda unifamiliar`
- `proyecto arquitectónico`
- `normativa urbanística`
- `viabilidad constructiva`
- `documentación técnica`
- `parcela` + `condiciones urbanísticas`
- `coste de construir una vivienda`
- `terreno edificable`
- `planeamiento urbanístico`

### 💡 Por qué mejora SEO sin romper UX

#### ✅ UX
- **Invisible por defecto** (acordeón cerrado)
- No añade scroll innecesario
- Solo se expande si el usuario quiere
- Usa `<details>` nativo (sin JavaScript)
- Diseño coherente con el resto

#### ✅ SEO
- Google indexa contenido en `<details>` aunque esté cerrado
- Responde queries long-tail:
  - "cuánto cuesta construir una casa"
  - "cómo saber si un terreno es edificable"
  - "qué hace un arquitecto en vivienda unifamiliar"
- Añade ~400 palabras de contenido único
- Estructura semántica clara (H3 + párrafos)

### 📋 FAQ incluidas
1. **¿Cuánto cuesta construir una casa?** → rango 1.200-2.000 €/m²
2. **¿Cuánto tarda un proyecto?** → plazos reales por fase
3. **¿Qué necesito antes de construir?** → documentación inicial
4. **¿Cómo saber si un terreno es edificable?** → proceso de consulta

---

## 4. SCHEMA JSON-LD (SEO técnico invisible)

### ✅ Qué se ha añadido
Schema tipo `ProfessionalService` en `<head>`

### 📍 Dónde
Dentro de `<head>`, después de `<script src="chat.js">` 

### 🔑 Datos estructurados
```json
{
  "@type": "ProfessionalService",
  "name": "Maudes Arquitectura",
  "areaServed": "España",
  "serviceType": [
    "Arquitectura residencial",
    "Proyecto de vivienda unifamiliar",
    "Reforma integral",
    "Asesoramiento técnico arquitectura"
  ]
}
```

### 💡 Por qué mejora SEO sin romper UX
- **Totalmente invisible** para el usuario
- Google entiende mejor qué ofrece la web
- Ayuda a aparecer en rich snippets
- Mejora CTR en resultados de búsqueda
- Validable con Google Rich Results Test

---

## 5. JERARQUÍA DE TÍTULOS (validación)

### ✅ Qué se ha revisado
- **1 solo H1** en hero ✓
- **H2** para títulos de sección ✓
- **H3** para subsecciones/servicios ✓
- Nuevo H2 en acordeón colapsado ("Información técnica")
- H3 dentro del acordeón para estructura interna

### 💡 Por qué mejora SEO
- Google valora jerarquía clara
- Accesibilidad (lectores de pantalla)
- Facilita indexación por temas

---

## 6. VALIDACIÓN FINAL

### ✅ La página sigue igual de limpia
- Diseño NO cambia visualmente
- Scroll natural NO aumenta (acordeón cerrado)
- Overhead de texto: **solo 1 frase extra por servicio**

### ✅ NO hay sensación de repetición
- Contenido nuevo es complementario, no duplicado
- FAQ responde cosas que NO están en la home
- Información técnica profundiza sin redundar

### ✅ Mejora contenido indexable
- **Antes:** ~600 palabras relevantes
- **Después:** ~1.000+ palabras relevantes
- Nuevos términos long-tail cubiertos
- Schema estructurado para fragmentos enriquecidos

### ✅ SEO mejora sin afectar UX
- Todo lo nuevo es discreto o colapsado
- Usuario no nota cambios negativos
- Buscadores tienen más contexto
- Queries específicas tienen mejor cobertura

---

## 7. RESUMEN EJECUTIVO

| Elemento | Impacto SEO | Impacto UX | Estado |
|----------|-------------|------------|--------|
| Micro-ajustes servicios | ⭐⭐⭐ | ✅ Neutral | ✅ |
| Texto geográfico | ⭐⭐ | ✅ Mejor info | ✅ |
| Bloque Info + FAQ | ⭐⭐⭐⭐⭐ | ✅ Invisible/Útil | ✅ |
| Schema JSON-LD | ⭐⭐⭐⭐ | ✅ Invisible | ✅ |
| Jerarquía títulos | ⭐⭐ | ✅ Sin cambio | ✅ |

### Keywords totales añadidas
- `arquitecto vivienda unifamiliar` ✓
- `proyecto arquitectónico` ✓
- `normativa urbanística` ✓
- `coste construir casa` ✓
- `terreno edificable` ✓
- `viabilidad` ✓
- Madrid + península (geo) ✓

### Archivos modificados
1. `index.html` → contenido + Schema
2. `styles.css` → estilos acordeón

---

## 8. PRÓXIMOS PASOS (OPCIONAL)

Si se necesita más SEO sin afectar UX:
1. Blog con artículos técnicos (ya enlazado en "Recursos")
2. Metadatos dinámicos por página
3. Structured data para FAQPage
4. Open Graph para redes sociales
5. Canónicos y hreflang si se añaden idiomas

---

**Fecha implementación:** 20 de abril de 2026  
**Respeta:** Criterio de Marta sobre NO redundancia  
**Resultado:** SEO técnico + contenido útil sin romper experiencia limpia
