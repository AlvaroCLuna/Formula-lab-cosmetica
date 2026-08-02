# Especificación del Incremento 2

## Módulo

Gestor de Formulaciones.

## Estado

Especificado, pendiente de aprobación.

No programar hasta recibir aprobación formal.

## 1. Alcance del Incremento 2

El Incremento 2 construirá el primer módulo funcional para gestionar formulaciones cosméticas como conocimiento versionado, trazable e inmutable al aprobarse.

Incluye:

- Listado de formulaciones.
- Identificador permanente.
- Nombre.
- Categoría.
- Estado.
- Versión.
- Ingredientes visibles desde el listado.
- Chips por función cosmética.
- Vista rápida.
- Modo aprendizaje.
- Creación de borradores.
- Versionado.
- Aprobación.
- Inmutabilidad de versiones aprobadas.
- Comparación entre versiones.
- Trazabilidad.
- Historial de cambios.
- Relación con materias primas maestras.
- Preparación para costeo y producción futuros.

No incluye:

- Costeo completo.
- Producción.
- Inventario operativo.
- Compras.
- CRM.
- Laboratorio avanzado.
- Motor de reglas químicas.
- Recomendaciones automáticas de formulación.
- APK.
- Sincronización en tiempo real.

## 2. Modelo de datos

### `formulation_families`

Representa la identidad permanente de una formulación.

- `id`
- `organization_id`
- `permanent_code`
- `name`
- `category`
- `status`
- `current_version_id`
- `created_by_user_id`
- `created_at`
- `updated_at`

Estados:

- `activa`
- `en_desarrollo`
- `archivada`
- `obsoleta`

### `formulation_versions`

Representa cada versión de una formulación.

- `id`
- `organization_id`
- `formulation_family_id`
- `version_number`
- `status`
- `name`
- `category`
- `objective`
- `notes`
- `approved_by_user_id`
- `approved_at`
- `created_by_user_id`
- `created_at`
- `updated_at`

Estados:

- `borrador`
- `en_revision`
- `aprobada`
- `rechazada`
- `obsoleta`

### `formulation_ingredients`

Representa ingredientes dentro de una versión.

- `id`
- `organization_id`
- `formulation_version_id`
- `raw_material_master_id`
- `display_name`
- `inci`
- `cosmetic_function`
- `phase`
- `percentage`
- `unit`
- `order_index`
- `source_type`
- `source_reference`
- `created_at`
- `updated_at`

Campos preparados para futuro:

- `estimated_cost`
- `production_notes`
- `inventory_lock_policy`

### `raw_material_masters`

Materia prima maestra mínima para relacionar formulaciones con conocimiento técnico.

- `id`
- `organization_id`
- `permanent_code`
- `common_name`
- `inci`
- `status`
- `created_at`
- `updated_at`

### `formulation_version_comparisons`

Registro opcional de comparaciones guardadas.

- `id`
- `organization_id`
- `base_version_id`
- `target_version_id`
- `summary_json`
- `created_by_user_id`
- `created_at`

### `audit_log`

Se reutiliza para historial:

- creación de familia;
- creación de versión;
- edición de borrador;
- cambio de ingrediente;
- aprobación;
- rechazo;
- comparación guardada.

## 3. Flujos funcionales

### Listar formulaciones

1. El usuario entra al Gestor de Formulaciones.
2. El sistema muestra familias de formulación de su organización.
3. Cada fila muestra código permanente, nombre, categoría, estado, versión actual e ingredientes principales.
4. Los ingredientes se muestran como chips con función cosmética.
5. El usuario puede abrir vista rápida sin abandonar el listado.

### Crear borrador

1. El usuario crea una nueva formulación.
2. El sistema genera un identificador permanente, por ejemplo `FLC-FRM-000001`.
3. Se crea una familia y una versión `1` en estado `borrador`.
4. El usuario agrega ingredientes relacionados con materias primas maestras.
5. Cada cambio queda en historial.

### Editar borrador

1. El usuario modifica nombre, categoría, objetivo, notas o ingredientes.
2. El sistema permite cambios solo si la versión está en `borrador` o `en_revision`.
3. Cada modificación registra valor anterior y nuevo.

### Aprobar versión

1. El usuario revisa la formulación.
2. El sistema valida que la versión tenga ingredientes.
3. El usuario aprueba.
4. La versión queda `aprobada`.
5. La versión aprobada se vuelve inmutable.
6. La familia apunta a esa versión como versión actual.

### Crear nueva versión desde aprobada

1. El usuario solicita nueva versión.
2. El sistema copia la versión aprobada anterior.
3. Se crea una nueva versión en `borrador`.
4. La versión aprobada original permanece intacta.

### Comparar versiones

1. El usuario selecciona dos versiones de la misma familia.
2. El sistema muestra diferencias de nombre, categoría, notas e ingredientes.
3. Los ingredientes se comparan por materia prima, porcentaje, fase y función.
4. La comparación no modifica datos.

## 4. Pantallas

### `FormulationListPage`

- Tabla/listado tipo ERP.
- Búsqueda por código, nombre, categoría e ingrediente.
- Filtros por estado y categoría.
- Ingredientes visibles desde el listado.
- Chips por función cosmética.
- Acceso a vista rápida.
- Acción crear borrador.

### `FormulationQuickView`

- Panel lateral.
- Código permanente.
- Versión actual.
- Estado.
- Ingredientes principales.
- Función cosmética.
- Modo aprendizaje con tarjetas de contexto.
- Historial reciente.
- Acciones según estado.

### `FormulationDraftPage`

- Editor de borrador.
- Datos generales.
- Ingredientes.
- Porcentajes.
- Fases.
- Relación con materia prima maestra.
- Guardar borrador.
- Enviar a revisión.
- Aprobar.
- Rechazar.

### `VersionCompareView`

- Selector de versión base.
- Selector de versión objetivo.
- Diferencias resaltadas.
- Ingredientes agregados, retirados o modificados.
- Sin edición directa.

## 5. APIs

### Formulaciones

- `GET /formulations`
- `POST /formulations`
- `GET /formulations/:id`
- `GET /formulations/:id/versions`
- `POST /formulations/:id/versions`
- `GET /formulations/:id/quick-view`

### Versiones

- `GET /formulation-versions/:id`
- `PATCH /formulation-versions/:id`
- `POST /formulation-versions/:id/submit-review`
- `POST /formulation-versions/:id/approve`
- `POST /formulation-versions/:id/reject`
- `POST /formulation-versions/:id/clone`

### Ingredientes

- `POST /formulation-versions/:id/ingredients`
- `PATCH /formulation-ingredients/:id`
- `DELETE /formulation-ingredients/:id`

Nota: el borrado debe ser lógico o auditado. No se permite pérdida de información técnica.

### Comparación

- `GET /formulations/:id/compare?baseVersionId=...&targetVersionId=...`
- `POST /formulations/:id/compare`

## 6. Reglas de negocio

- Toda formulación pertenece a una organización.
- Toda formulación tiene identificador permanente.
- El identificador permanente no cambia aunque cambie el nombre.
- Una formulación aprobada no se sobrescribe.
- Cambiar una versión aprobada exige crear nueva versión.
- Toda modificación registra usuario, fecha, acción, valor anterior y valor nuevo.
- Una versión no puede aprobarse sin ingredientes.
- Los ingredientes deben relacionarse con materias primas maestras cuando existan.
- Si una materia prima aún no existe, el sistema puede permitir un ingrediente provisional claramente marcado.
- Modo aprendizaje no debe inventar información técnica.
- Toda tarjeta de aprendizaje debe indicar fuente o marcar información insuficiente.
- Costeo y producción solo quedan preparados; no se calculan en este incremento.

## 7. Criterios de aceptación

- El usuario autenticado puede abrir el Gestor de Formulaciones.
- El listado muestra formulaciones de su organización.
- Cada formulación muestra código permanente, nombre, categoría, estado y versión.
- El listado muestra ingredientes visibles.
- Los ingredientes aparecen como chips por función cosmética.
- La vista rápida muestra detalle sin salir del listado.
- El usuario puede crear una formulación en borrador.
- El usuario puede agregar ingredientes a una versión borrador.
- El usuario puede guardar cambios en borrador.
- El usuario puede aprobar una versión con ingredientes.
- Una versión aprobada queda inmutable.
- El usuario puede crear una nueva versión desde una aprobada.
- El usuario puede comparar dos versiones.
- Las acciones generan historial en `audit_log`.
- La estructura queda preparada para costeo y producción futuros.
- No se implementan costos completos ni producción.

## 8. Riesgos

- Definir porcentajes y fases puede abrir reglas químicas que pertenecen a Laboratorio avanzado.
- La relación con materias primas maestras requiere un modelo mínimo suficientemente estable.
- Si se permite ingrediente provisional, debe quedar visualmente diferenciado.
- La comparación entre versiones puede crecer en complejidad si se incluyen cálculos fuera de alcance.
- La UI puede saturarse si el listado muestra demasiados ingredientes; se deben limitar chips y usar vista rápida.

## 9. Dependencias

- Incremento 1 aprobado.
- Autenticación existente.
- `organization_id` existente.
- MySQL/MariaDB activo.
- Prisma configurado.
- `audit_log` existente.
- AppShell existente.
- Módulo de materias primas maestras mínimo o tabla base para relación.

## 10. Archivos que serán creados o modificados

### Backend

- `app/backend/prisma/schema.prisma`
- `app/backend/src/routes/formulations.routes.ts`
- `app/backend/src/routes/formulation-versions.routes.ts`
- `app/backend/src/routes/formulation-ingredients.routes.ts`
- `app/backend/src/services/formulations.service.ts`
- `app/backend/src/services/formulation-versioning.service.ts`
- `app/backend/src/services/formulation-comparison.service.ts`
- `app/backend/src/validators/formulations.schemas.ts`
- `app/backend/src/server.ts`

### Frontend

- `app/frontend/src/App.tsx`
- `app/frontend/src/components/Sidebar.tsx`
- `app/frontend/src/api/client.ts`
- `app/frontend/src/types.ts`
- `app/frontend/src/pages/FormulationListPage.tsx`
- `app/frontend/src/pages/FormulationDraftPage.tsx`
- `app/frontend/src/components/FormulationTable.tsx`
- `app/frontend/src/components/FormulationQuickView.tsx`
- `app/frontend/src/components/IngredientFunctionChip.tsx`
- `app/frontend/src/components/VersionCompareView.tsx`
- `app/frontend/src/components/LearningCard.tsx`
- `app/frontend/src/styles.css`

### Base de datos

- `database/migrations/003_incremento_2_formulaciones.sql`
- `database/seeds/demo_formulations.sql`
- Nueva migración Prisma generada para Incremento 2.

### Pruebas

- `tests/backend/formulations.test.ts`
- `tests/backend/formulation-versioning.test.ts`
- `tests/backend/formulation-comparison.test.ts`

### Documentación

- `CHANGELOG.md`
- `ROADMAP.md`
- `BACKLOG.md`
- `docs/18_Validacion_Incremento_2.md` al finalizar implementación y pruebas.

## Confirmación

Esta especificación no implementa código.

El Incremento 2 no debe comenzar hasta recibir aprobación formal.
