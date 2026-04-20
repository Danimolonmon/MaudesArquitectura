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
