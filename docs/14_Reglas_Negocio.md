# Reglas de negocio

Este documento resume reglas operativas derivadas de `ARQUITECTURA_MAESTRA.md`. No reemplaza la arquitectura maestra; solo la aterriza para implementación.

## Jerarquía

- `ARQUITECTURA_MAESTRA.md` tiene prioridad máxima.
- Ninguna regla de negocio puede contradecir la arquitectura maestra.
- Si una regla parece incompleta o contradictoria, se documenta el conflicto y se espera aprobación.

## Conocimiento técnico

- El activo principal del sistema es el conocimiento técnico cosmético.
- Las materias primas, formulaciones, documentos, proveedores, reglas y experiencias forman parte del conocimiento.
- La receta no es la entidad principal; es una representación del conocimiento.

## Evidencia

- Todo dato técnico debe conservar origen, evidencia, usuario, fecha, versión y nivel de confianza.
- Los documentos originales nunca deben alterarse.
- PDF, SDS, TDS, COA, imágenes y certificados deben conservarse como evidencia original.

## Inteligencia de Insumos

- Ningún dato extraído puede guardarse automáticamente como validado.
- Todo valor extraído debe tener documento fuente y referencia verificable.
- Si no hay información suficiente, el sistema debe mostrar que el dato falta o requiere revisión.
- La IA puede resumir, organizar, relacionar y proponer; nunca afirmar información técnica sin evidencia.

## Versionado

- Nada aprobado puede sobrescribirse.
- Todo objeto importante debe versionarse, incluyendo materias primas, fichas, formulaciones, reglas, documentos y laboratorio.
- Una nueva aprobación crea una nueva versión o snapshot.

## Auditoría

Toda modificación relevante debe registrar:

- usuario;
- fecha;
- acción;
- motivo cuando aplique;
- valor anterior;
- valor nuevo.

## Multiempresa

- Toda entidad debe pertenecer a una organización.
- El Incremento 1 debe incluir `organization_id` en entidades persistentes relevantes.
- La administración multiempresa completa puede implementarse después, pero la separación lógica de datos existe desde la primera versión.

## Motor de reglas

- Las reglas técnicas no deben estar codificadas directamente como lógica rígida sin registro.
- Toda regla debe existir como dato estructurado y versionado.
- Cada regla debe contener código, nombre, descripción, condición, severidad, evidencia, versión, estado de validación y responsable.

## Laboratorio

El módulo Laboratorio no debe generar incompatibilidades, reacciones, riesgos o recomendaciones sin una regla estructurada y una fuente técnica asociada.

Si no hay evidencia suficiente, el sistema deberá marcar:

> Información insuficiente para evaluar.

## Eliminación de datos

- No deben existir eliminaciones físicas para información técnica relevante.
- Los estados permitidos deben representar conservación lógica, por ejemplo activo, inactivo, archivado, rechazado u obsoleto.
