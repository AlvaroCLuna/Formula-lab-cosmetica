# Validacion Incremento 2 - Gestor de Formulaciones

Fecha: 2026-08-02

## Resultado general

Incremento 2 implementado y validado tecnicamente. Queda pendiente de aprobacion formal del usuario antes de iniciar Incremento 3.

## Pruebas ejecutadas

- `npm.cmd run db:generate`
- `npm.cmd --workspace app/backend exec -- prisma migrate dev --name incremento_2_formulaciones`
- `npm.cmd run db:seed`
- `npm.cmd run build`
- `npm.cmd run test`
- Validacion API con backend compilado en `http://localhost:4000`.
- Validacion visual con navegador integrado en `http://localhost:5173`.

## Resultados

- Prisma Client generado correctamente.
- Migracion `20260802232618_incremento_2_formulaciones` aplicada sobre MySQL/MariaDB `formulalab_cosmetica`.
- Seed cargado con usuario demo, 7 materias primas maestras y formulacion demo aprobada.
- Build backend/frontend completado sin errores.
- Pruebas backend: 4 archivos, 9 pruebas aprobadas.
- API: login demo correcto, listado de formulaciones correcto, creacion de borrador correcta, aprobacion correcta, bloqueo de edicion de version aprobada con HTTP 409, nueva version desde aprobada correcta.
- UI desktop: listado, chips, vista rapida, modo aprendizaje y creacion visibles sin overflow horizontal.
- UI movil 390x844: modulo visible, filas visibles y sin overflow horizontal.

## Errores encontrados

- Los tests nuevos quedaron inicialmente fuera del patron configurado de Vitest.
- El helper de inmutabilidad podia terminar como error generico si una ruta no interceptaba el estado no editable.
- Componentes nuevos mostraban algunos caracteres corruptos por codificacion en PowerShell.

## Correcciones realizadas

- Se movieron pruebas del Incremento 2 a `tests/backend`.
- Se agrego `isEditableVersion` y las rutas devuelven HTTP 409 ante intento de editar version inmutable.
- Se normalizaron textos nuevos a ASCII para evitar mojibake en este entorno.
- Se agregaron estilos responsive para el Gestor de Formulaciones.

## Evidencias tecnicas

- Conteo persistente posterior a seed/validacion:
  - Familias de formulacion: 3.
  - Versiones de formulacion: 4.
  - Ingredientes de formulacion: 10.
  - Materias primas maestras: 7.
  - Auditorias de formulacion: 6.
- Validacion API:
  - Codigo permanente creado: `FLC-FRM-000003`.
  - Estado aprobado: `aprobada`.
  - Edicion posterior bloqueada: HTTP 409.
  - Nueva version creada: version 2.
- Validacion navegador:
  - Desktop sin overflow horizontal.
  - Movil 390x844 sin overflow horizontal.

## Limitaciones pendientes

- Registro completo de usuarios por correo sigue fuera de este incremento.
- Recuperacion real de contrasena con SMTP queda preparada para futuro.
- Costeo completo, produccion, inventario operativo y laboratorio avanzado no fueron implementados.
- Reglas quimicas avanzadas no fueron implementadas.
- La comparacion de versiones es funcional y basica; puede enriquecerse con resaltado visual en incrementos posteriores.

## Confirmacion final

Incremento 2 implementado y validado tecnicamente. Requiere aprobacion formal antes de iniciar Incremento 3.
