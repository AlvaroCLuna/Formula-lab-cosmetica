# Siguiente incremento de programación

## 1. Arquitectura objetivo del producto

Formula Lab Cosmética será una plataforma modular tipo ERP para formulación cosmética, inteligencia de insumos, trazabilidad documental, usuarios, organizaciones, operación de laboratorio, producción, inventario, costos y aprendizaje asistido.

La arquitectura objetivo contempla:

- Backend central con API segura.
- Base de datos MySQL.
- Aplicación web tipo ERP.
- APK Android conectada al mismo backend.
- Separación lógica de datos por organización.
- Usuarios registrados por correo.
- Sistema de licencias por usuario.
- Recuperación de contraseña.
- Sincronización en tiempo real entre clientes.
- Almacenamiento de documentos originales sin alteración.
- Historial y auditoría de cambios.
- Módulo Laboratorio con reglas químicas estructuradas y evidencia técnica asociada.

La arquitectura debe evitar acoplar el sistema al Excel histórico. Los archivos heredados podrán usarse como fuente de importación, comparación o validación, pero no gobernarán el modelo final.

## 2. Incremento 1: funcionalidad que sí se implementará

El Incremento 1 construirá únicamente la base funcional mínima para iniciar sesión, entrar al panel principal y usar el módulo Inteligencia de Insumos con carga rápida de documentos.

### Alcance funcional obligatorio

- Estructura base frontend/backend.
- Configuración de MySQL.
- Modelo mínimo de organización y usuario.
- Inicio de sesión por correo.
- Panel híbrido inicial.
- Módulo Inteligencia de Insumos.
- Drag & drop para PDF, CSV y TXT.
- Selector manual de archivos.
- Carga múltiple.
- Validación de tipos admitidos.
- Registro de archivos cargados.
- Estados de procesamiento.
- Extracción inicial de campos.
- Vista previa de resultados.
- Trazabilidad por campo:
  - documento;
  - página, línea o celda;
  - tipo de dato;
  - nivel de confianza;
  - estado de validación.
- Guardar borrador.
- Corregir.
- Aprobar.
- Rechazar.
- Historial básico de cambios.

### Reglas del Incremento 1

- No guardar automáticamente una ficha como validada.
- No inventar información faltante.
- Todo dato extraído debe conservar trazabilidad con su archivo fuente.
- Una ficha aprobada no debe sobrescribirse sin historial.
- La interfaz debe estar en español.
- El diseño debe ser moderno tipo ERP, no parecido a una hoja de Excel.
- La estructura debe preparar multiempresa mediante `organization_id`, sin implementar administración multiempresa completa.

## 3. Funcionalidad preparada pero no implementada todavía

Estas capacidades deben influir en el diseño del modelo, nombres, estructura y límites del sistema, pero no se desarrollarán completamente en el Incremento 1:

- Sistema de licencias.
- Recuperación completa de contraseña por correo transaccional.
- Sincronización en tiempo real.
- APK Android.
- Facturación.
- Producción.
- Inventario.
- Costos completos.
- Gestor de formulaciones.
- Laboratorio avanzado.
- Reglas químicas avanzadas.
- Administración multiempresa completa.
- Roles y permisos avanzados.

## 4. Funcionalidad fuera de alcance

No se implementará en el Incremento 1:

- CRM.
- Facturación funcional.
- Etiquetas.
- Producción.
- Inventario operativo.
- Costeo completo.
- Recomendaciones automáticas de formulación.
- Motor de compatibilidad química.
- Generación automática de advertencias químicas sin reglas validadas.
- APK instalable.
- Pagos o activación real de licencias.

## 5. Stack propuesto

- Frontend web: React, Vite y TypeScript.
- UI: CSS propio con variables de diseño, componentes internos e iconos con `lucide-react`.
- Backend: Node.js, Express y TypeScript.
- Base de datos: MySQL.
- Driver/ORM: Prisma o Drizzle. Preferencia inicial: Prisma por velocidad de modelado, migraciones y claridad.
- Autenticación: correo y contraseña con hash seguro.
- Sesión: JWT para prototipo, preparado para refresh tokens.
- Carga de archivos: `multer`.
- Extracción PDF: `pdf-parse`.
- Extracción CSV: `csv-parse`.
- Extracción TXT: lectura controlada del archivo.
- Validación: `zod`.
- Pruebas: Vitest para unidades críticas.

## 6. Modelo mínimo de datos

### `organizations`

- `id`
- `name`
- `status`
- `created_at`
- `updated_at`

### `users`

- `id`
- `organization_id`
- `email`
- `password_hash`
- `full_name`
- `status`
- `last_login_at`
- `created_at`
- `updated_at`

### `documents`

- `id`
- `organization_id`
- `uploaded_by_user_id`
- `original_filename`
- `stored_filename`
- `mime_type`
- `file_extension`
- `size_bytes`
- `storage_path`
- `status`
- `rejection_reason`
- `created_at`
- `updated_at`

Estados iniciales:

- `pendiente`
- `procesando`
- `procesado`
- `requiere_revision`
- `rechazado`

### `document_processing_jobs`

- `id`
- `organization_id`
- `document_id`
- `status`
- `started_at`
- `finished_at`
- `error_message`
- `created_at`

### `raw_material_drafts`

- `id`
- `organization_id`
- `created_by_user_id`
- `status`
- `approved_version_id`
- `created_at`
- `updated_at`

### `extracted_values`

- `id`
- `organization_id`
- `draft_id`
- `document_id`
- `field_key`
- `field_label`
- `value`
- `source_document_name`
- `source_reference`
- `data_type`
- `evidence_type`
- `confidence`
- `validation_status`
- `created_at`
- `updated_at`

Tipos de evidencia:

- `documental`
- `inferido`

Estados de validación:

- `pendiente`
- `validado`
- `corregido`
- `en_conflicto`
- `rechazado`

### `raw_material_validated_versions`

- `id`
- `organization_id`
- `draft_id`
- `version_number`
- `approved_by_user_id`
- `approved_at`
- `snapshot_json`

### `audit_log`

- `id`
- `organization_id`
- `user_id`
- `entity_type`
- `entity_id`
- `action`
- `before_json`
- `after_json`
- `created_at`

## 7. Árbol de carpetas propuesto

```text
FormulaLab_Cosmetica_Starter/
  package.json
  app/
    frontend/
      package.json
      index.html
      vite.config.ts
      tsconfig.json
      src/
        main.tsx
        App.tsx
        styles.css
        types.ts
        api/
          client.ts
        components/
          AppShell.tsx
          Sidebar.tsx
          HybridDashboard.tsx
          UploadDropzone.tsx
          DocumentList.tsx
          ExtractedFieldPreview.tsx
          FieldStatusBadge.tsx
        pages/
          LoginPage.tsx
          IngredientIntelligencePage.tsx
    backend/
      package.json
      tsconfig.json
      src/
        server.ts
        config.ts
        db.ts
        types.ts
        routes/
          auth.routes.ts
          documents.routes.ts
          drafts.routes.ts
        services/
          auth.service.ts
          storage.service.ts
          extraction.service.ts
          field-mapper.service.ts
          audit.service.ts
        middleware/
          auth.middleware.ts
        validators/
          auth.schemas.ts
          documents.schemas.ts
  database/
    migrations/
      001_incremento_1_base.sql
    seeds/
      demo_organization.sql
  storage/
    incoming/
    processed/
    rejected/
  tests/
    backend/
      extraction.test.ts
      auth.test.ts
```

## 8. Flujo técnico de carga documental

1. El usuario inicia sesión por correo.
2. El frontend carga el panel híbrido y entra al módulo Inteligencia de Insumos.
3. El usuario arrastra o selecciona archivos PDF, CSV o TXT.
4. El frontend valida tipo y tamaño de forma preliminar.
5. El backend valida nuevamente tipo, extensión y contenido básico.
6. El archivo original se guarda en `storage/incoming` sin alteración.
7. Se crea un registro en `documents` con estado `pendiente`.
8. Se crea un `document_processing_job`.
9. El backend cambia el documento a `procesando`.
10. El servicio de extracción obtiene texto, líneas, páginas o celdas según el tipo.
11. El mapeador inicial intenta asociar valores a campos conocidos.
12. Cada dato propuesto se guarda en `extracted_values` con documento, referencia, tipo de dato, confianza y estado `pendiente`.
13. Si faltan datos o hay baja confianza, el documento queda como `requiere_revision`.
14. Si la extracción básica termina sin error, el documento queda como `procesado`.
15. El usuario revisa la vista previa.
16. El usuario puede guardar borrador, corregir valores, aprobar o rechazar.
17. Cada cambio relevante genera entrada en `audit_log`.
18. Aprobar crea un snapshot en `raw_material_validated_versions`; no sobrescribe silenciosamente una ficha aprobada.

## 9. Regla de seguridad técnica para Laboratorio futuro

El módulo Laboratorio no debe generar incompatibilidades, reacciones, riesgos o recomendaciones sin una regla estructurada y una fuente técnica asociada.

Cada regla futura deberá contener:

- código;
- nombre;
- descripción;
- condición;
- severidad;
- evidencia o fuente;
- versión;
- estado de validación;
- responsable de aprobación.

Si no hay evidencia suficiente, el sistema deberá marcar:

> Información insuficiente para evaluar.

Esta regla aplica desde el diseño del modelo aunque el Laboratorio avanzado no se implemente en el Incremento 1.

## 10. Criterios de aceptación

- La aplicación tiene frontend y backend separados.
- El backend se conecta a MySQL.
- Existe modelo mínimo de organización y usuario.
- Un usuario puede iniciar sesión por correo.
- El usuario autenticado puede abrir el panel híbrido inicial.
- Existe una pantalla de Inteligencia de Insumos en español.
- La pantalla permite drag & drop y selección manual.
- Se aceptan PDF, CSV y TXT.
- Se rechazan tipos no permitidos con mensaje claro.
- Los archivos cargados quedan registrados en base de datos.
- Cada archivo muestra estado de procesamiento.
- La extracción inicial muestra campos propuestos cuando hay evidencia.
- Los campos muestran documento, página/línea/celda, tipo de dato, confianza y estado de validación.
- Los datos faltantes no se inventan.
- El usuario puede guardar borrador.
- El usuario puede corregir un valor.
- El usuario puede aprobar.
- El usuario puede rechazar.
- Las acciones generan historial básico.
- Una aprobación crea snapshot o versión, no sobrescritura silenciosa.
- El sistema queda preparado estructuralmente para licencias, APK y tiempo real sin implementarlos por completo.

## 11. Riesgos y dependencias

- MySQL debe estar instalado, accesible y con credenciales definidas antes de probar persistencia real.
- La extracción de PDF puede variar mucho según si el documento tiene texto real, tablas complejas o escaneo como imagen.
- OCR queda fuera del Incremento 1; PDFs escaneados podrían requerir revisión manual.
- La recuperación completa de contraseña requiere proveedor SMTP o servicio de correo transaccional.
- La APK futura requerirá decisiones de empaquetado, firma y entorno Android.
- Las reglas químicas avanzadas requieren fuentes técnicas confiables, validación humana y responsables de aprobación.
- El modelo de licencias queda preparado, pero su activación real dependerá de reglas comerciales y, si aplica, pagos.
