# Validación funcional del Incremento 1

## Objetivo

Validar funcionalmente el Incremento 1 sin iniciar el Incremento 2, corregir fallas encontradas dentro del alcance aprobado y confirmar el estado final del módulo base ERP e Inteligencia de Insumos.

## Alcance validado

- Autenticación.
- Panel ERP.
- Inteligencia de Insumos.
- Persistencia MySQL/MariaDB.
- Seguridad básica.
- Auditoría.
- Responsive.
- Tema claro/oscuro preparado y funcional.

## Ambiente usado

- Sistema operativo: Windows.
- Node.js: disponible localmente.
- Base de datos: MariaDB/MySQL de XAMPP.
- Base validada: `formulalab_cosmetica`.
- Backend: `node app/backend/dist/server.js`.
- Frontend: Vite en `http://localhost:5173`.
- API: `http://localhost:4000`.

## Datos de prueba

Usuarios:

- `demo@formulalab.local`, organización `demo-org`.
- `validacion@formulalab.local`, organización `validation-org`.

Archivos temporales usados:

- `C:\tmp\insumo_validacion.pdf`
- `C:\tmp\insumo_validacion.csv`
- `C:\tmp\insumo_validacion.txt`
- `C:\tmp\sin_evidencia.txt`
- `C:\tmp\archivo_no_permitido.exe`

## Lista de pruebas ejecutadas

### Autenticación

- Login correcto.
- Login con contraseña incorrecta.
- Logout.
- Persistencia de sesión mediante token después de reiniciar backend.
- Acceso bloqueado a `/documents` sin autenticación.

### Panel ERP

- Carga de pantalla de login.
- Carga del AppShell después de login.
- Presencia de Sidebar.
- Presencia de TopBar.
- Presencia de navegación.
- Presencia de panel híbrido.
- Presencia del módulo Inteligencia de Insumos.
- Responsive en viewport móvil `390x844`.
- Toggle claro/oscuro.

### Inteligencia de Insumos

- Selección manual desde navegador.
- Carga múltiple desde navegador.
- Carga múltiple por API.
- Carga de PDF con texto.
- Carga de CSV.
- Carga de TXT.
- Rechazo de archivo `.exe`.
- Estados `procesado`, `requiere_revision` y `rechazado`.
- Estados `pendiente` y `procesando` confirmados como parte del flujo transaccional del backend.
- Extracción de campos.
- Trazabilidad por campo.
- Guardar borrador.
- Corregir valor.
- Aprobar ficha con snapshot.
- Rechazar ficha en borrador.
- Bloqueo de rechazo posterior a aprobación.
- Bloqueo de corrección posterior a aprobación.
- Bloqueo de aprobación sin evidencia.

### Persistencia

- Reinicio de backend.
- Consulta posterior con el mismo token.
- Confirmación de permanencia de documentos, borradores, valores extraídos y auditoría en MySQL/MariaDB.

### Seguridad básica

- Separación por `organization_id`.
- Usuario de `validation-org` no ve documentos de `demo-org`.
- Contraseña incorrecta devuelve `401`.
- Acceso sin token devuelve `401`.
- Archivo no permitido no se guarda en `storage/incoming`.
- `.env`, `node_modules`, `dist` y archivos cargados quedan ignorados por Git.
- No se registran contraseñas ni secretos desde la aplicación.

## Resultados técnicos

Lote funcional por API:

```json
{
  "health": "ok",
  "badLogin": 401,
  "noAuth": 401,
  "goodLoginHasToken": true,
  "sessionEmail": "demo@formulalab.local",
  "logoutOk": true,
  "uploadStatuses": "insumo_validacion.pdf:procesado; insumo_validacion.csv:procesado; archivo_no_permitido.exe:rechazado; insumo_validacion.txt:procesado",
  "documentCountBeforeRestart": 13,
  "documentCountAfterRestart": 13,
  "latestDraftStatus": "borrador",
  "latestDraftFields": 11,
  "correctedStatus": "corregido",
  "approvedStatus": "aprobado",
  "versionNumber": 1,
  "rejectAfterApprove": 409,
  "patchAfterApprove": 409,
  "noEvidenceStatus": "requiere_revision",
  "approveNoEvidence": 409,
  "rejectedDraftStatus": "rechazado",
  "documentCountOtherOrg": 0,
  "auditLogDemoOrg": 18,
  "invalidFileStored": 0
}
```

Pruebas automatizadas:

```text
2 test files passed
5 tests passed
```

Build:

```text
Backend TypeScript: correcto
Frontend TypeScript + Vite: correcto
```

Auditoría de dependencias de producción:

```text
npm audit --omit=dev
found 0 vulnerabilities
```

Validación UI:

```json
{
  "hasSidebar": true,
  "hasTopbar": true,
  "hasHybridDashboard": true,
  "hasDropzone": true,
  "navItems": ["Panel", "Inteligencia", "Materias primas", "Calidad", "Aprendizaje"]
}
```

Validación responsive:

```json
{
  "width": 390,
  "sidebarWidth": 76,
  "topbarDirection": "column"
}
```

Validación tema:

```json
{
  "beforeTheme": "light",
  "afterTheme": "dark"
}
```

## Errores encontrados

### CSV de dos columnas no extraía campos

El mapeador inicial reconocía líneas tipo `Campo: Valor`, pero no archivos CSV estructurados como:

```text
Campo,Valor
Nombre comercial,Aceite de Jojoba Refinado
```

Resultado esperado: extraer campos con referencia por fila.

### Ficha aprobada podía rechazarse después

La acción `rechazar` todavía podía cambiar el estado de una ficha aprobada.

Resultado esperado: una ficha aprobada es inmutable y debe requerir una nueva versión para cambios posteriores.

### Valor de ficha aprobada podía corregirse después

La API permitía corregir valores vinculados a un draft aprobado.

Resultado esperado: solo pueden corregirse fichas en borrador.

### Ficha sin evidencia podía aprobarse

El backend no impedía aprobar un borrador sin valores extraídos.

Resultado esperado: no aprobar sin evidencia documental.

### `updated_at` no tenía default en migración Prisma

La migración generada por Prisma no agregó default SQL a `updated_at`, lo que causó fecha cero al insertar un usuario de validación con SQL directo.

Resultado esperado: `updated_at` debe tener valor válido desde base de datos.

### Tema claro/oscuro solo estaba preparado visualmente

El botón existía, pero no cambiaba estado.

Resultado esperado: toggle funcional, aunque sea básico.

## Correcciones realizadas

- `extraction.service.ts`: normalización de filas CSV `Campo,Valor` a evidencia tipo `Campo: Valor`.
- `extraction.test.ts`: prueba para CSV normalizado.
- `drafts.routes.ts`: bloqueo de corrección si el draft no está en `borrador`.
- `drafts.routes.ts`: bloqueo de guardar/rechazar/aprobar si el draft ya no está en `borrador`.
- `drafts.routes.ts`: bloqueo de aprobación sin evidencia extraída.
- `schema.prisma`: `updatedAt` ahora usa `@default(now()) @updatedAt`.
- Nueva migración Prisma: `20260802222048_incremento_1_validation_fixes`.
- Nuevo SQL manual: `database/migrations/002_incremento_1_validation_fixes.sql`.
- `AppShell.tsx`: toggle real `light/dark`.
- `styles.css`: variables de tema oscuro dentro de `data-theme="dark"`.
- `CHANGELOG.md`: registro de correcciones de validación.

## Evidencias técnicas

- API `/health` respondió `ok`.
- Login válido generó token.
- Login inválido devolvió `401`.
- `/documents` sin token devolvió `401`.
- Logout respondió `ok`.
- Carga múltiple procesó PDF, CSV y TXT.
- Archivo `.exe` fue registrado como `rechazado`.
- No se encontró `.exe` en `storage/incoming`.
- Documento sin campos quedó en `requiere_revision`.
- Usuario de otra organización obtuvo `0` documentos.
- `audit_log` registró acciones de carga, guardado, corrección, aprobación y rechazo.
- Backend y frontend compilaron sin errores.
- Pruebas automatizadas pasaron.
- Producción reportó 0 vulnerabilidades con `npm audit --omit=dev`.

## Limitaciones pendientes

- Drag & drop fue validado estructuralmente por UI y código, pero la prueba automatizada de navegador se hizo mediante selector manual por limitaciones prácticas de simulación de arrastre de archivos.
- PDFs escaneados sin texto siguen fuera del Incremento 1 porque requieren OCR.
- Los estados `pendiente` y `procesando` existen y se usan en backend, pero pueden ser transitorios porque el procesamiento actual es síncrono y rápido.
- Recuperación de contraseña queda preparada, no envía correo real.
- Sistema de licencias, sincronización en tiempo real y APK no están implementados, según alcance aprobado.

## Confirmación final

Incremento 1 aprobado funcionalmente tras correcciones de validación.

Estado para usuario aprobador: pendiente de aprobación formal.

No se inició el Incremento 2.
