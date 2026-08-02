# Formula Lab Cosmética

ERP moderno especializado en formulación cosmética, inteligencia de insumos, trazabilidad, costos, producción y aprendizaje asistido.

## Estado

Versión de arquitectura actualizada para construir una plataforma con backend central, base de datos MySQL, aplicación web, APK Android futura, sincronización en tiempo real, usuarios registrados por correo y licencia única por usuario.

El Excel `ShampooSolido_Mercado.xlsx` y los scripts Python existentes se consideran legado reutilizable, no el sistema final.

## Principios ya aprobados

- Panel híbrido: indicadores ejecutivos arriba y módulos operativos debajo.
- Las formulaciones aprobadas son inmutables.
- Cada cambio genera una versión nueva.
- Identificadores permanentes por entidad.
- Vista rápida de ingredientes desde el listado de formulaciones.
- Modo aprendizaje y tarjetas contextuales de insumos.
- Carga documental automática por drag & drop.
- Todo dato técnico conserva fuente, nivel de confianza y estado de validación.
- Ningún dato extraído se publica como validado sin revisión humana o política explícita de aprobación.
- Cada usuario registrado tendrá una licencia única.
- La web y la APK deberán conectarse al mismo backend y reflejar cambios en tiempo real cuando aplique.
- El módulo Laboratorio deberá guiar mezclas y advertir incompatibilidades, reacciones químicas, reacciones exotérmicas, neutralizaciones funcionales, riesgos por pH, temperatura y dosis.

## Primer alcance de programación

1. Autenticación por correo, recuperación de contraseña, usuario y licencia.
2. Base de datos MySQL y separación lógica por organización.
3. Aplicación web ERP con panel híbrido.
4. Inteligencia de Insumos: carga rápida de PDF, CSV y TXT.
5. Trazabilidad documental por campo extraído.
6. Estados de procesamiento, revisión, aprobación, corrección y rechazo.
7. Preparación de arquitectura para sincronización en tiempo real y APK Android.

Consulta `docs/15_Siguiente_Incremento.md`.
