# Ajuste de conversión landing Maudes Arquitectura - 30 de abril de 2026

## Archivos modificados

- `landing-ads.html`
- `pages-custom.css`

## Cambios realizados

Se ha unificado el bloque de formulario + IA en una idea central:

> Validar si el terreno permite construir lo que el usuario tiene en mente antes de perder tiempo o dinero.

Y se han dejado dos formas claras de empezar:

- Contacto directo con el estudio.
- Primera prueba guiada con IA.

## Textos antes/después

### Cabecera del bloque

Antes:

- No había cabecera específica encima del bloque formulario + IA.

Después:

- Título: `¿Tu terreno permite construir lo que tienes en mente?`
- Subtítulo: `Lo analizamos contigo antes de que pierdas tiempo o dinero.`
- Intro: `Puedes empezar como prefieras:`

### Bloque izquierdo: formulario

Antes:

- Título: `Comprueba si tu terreno encaja`
- Subtexto: `Respuesta rápida. Evaluamos tu caso real, no una estimación genérica.`
- Microcopy inferior: `No vendemos casas. Evaluamos tu caso real.`

Después:

- Título: `Cuéntanos tu caso`
- Subtexto: `Revisamos tu situación real y te orientamos con criterio técnico.`
- Microcopy inferior: `Hablamos contigo directamente`

### Bloque derecho: IA

Antes:

- Kicker: `Camino rápido`
- Título: `Empieza tu proyecto con IA`
- Subtexto: `Cuéntanos tu parcela y la vivienda que imaginas. Nuestra IA te guía paso a paso para ordenar requisitos antes de hablar con el estudio.`
- CTA: `Empezar con IA`
- Bullets: `Orientación inicial en minutos`, `Sin compromiso`, `Pensado para vivienda en parcela propia`

Después:

- Kicker: `IA guiada`
- Título: `Haz una primera prueba guiada`
- Subtexto: `Ordena tu idea paso a paso antes de hablar con nosotros.`
- CTA: `Comprobar mi caso ahora`
- Bullet conservado: `Orientación inicial en minutos`
- Microcopy inferior: `Sin compromiso, sin llamadas`

También se actualizó el texto de respaldo del widget IA para que use el mismo CTA: `Comprobar mi caso ahora`.

## Limpieza global

Se eliminaron del bloque los textos:

- `rápido`
- `respuesta rápida`
- `camino rápido`
- `Empieza tu proyecto con IA`
- `Empezar con IA`
- `Comprueba si tu terreno encaja`

Comprobación realizada con búsqueda en `landing-ads.html` y `pages-custom.css`: no quedan coincidencias para esos textos.

## Confirmación de layout

No se ha tocado el backend, la lógica del formulario, los campos, el método de envío ni la estructura de grid de las dos columnas.

No se han movido bloques del sitio ni se han creado nuevas secciones fuera del bloque existente. Solo se añadió una cabecera textual dentro del mismo bloque formulario + IA y pequeños estilos tipográficos para integrarla con el diseño actual.

## Descripción visual del resultado

Visualmente, el usuario ve primero una pregunta clara sobre la viabilidad del terreno. Justo debajo aparece una frase que explica el valor real: analizar el caso antes de perder tiempo o dinero. Después se presenta la entrada `Puedes empezar como prefieras:` y, debajo, las dos opciones existentes en paralelo:

- A la izquierda, el formulario queda como vía de contacto directo: `Cuéntanos tu caso`.
- A la derecha, el panel IA queda como vía de primera exploración: `Haz una primera prueba guiada`, con CTA `Comprobar mi caso ahora`.

El bloque mantiene la composición actual: formulario a la izquierda, panel IA a la derecha, mismos campos y misma jerarquía visual de tarjetas.

## Validación final

- Se entiende en pocos segundos que la página sirve para validar la viabilidad del proyecto sobre un terreno.
- Hay una sola idea central: viabilidad real del proyecto.
- Hay dos caminos claros: contacto directo o prueba guiada con IA.
- Se eliminaron redundancias y tono de urgencia vacío.
- Se conserva el bullet permitido: `Orientación inicial en minutos`.
