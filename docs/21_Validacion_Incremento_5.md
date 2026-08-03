# Validacion Incremento 5 - Motor de Costos

Fecha: 2026-08-02

## Resultado general

Incremento 5 implementado y validado tecnicamente. Queda pendiente de aprobacion formal antes de iniciar Incremento 6.

## Pruebas ejecutadas

- `npm.cmd run db:generate`
- Migracion SQL manual `20260803003000_incremento_5_motor_costos`.
- `npm.cmd --workspace app/backend exec -- prisma migrate resolve --applied 20260803003000_incremento_5_motor_costos`
- `npm.cmd run db:seed`
- `npm.cmd run build`
- `npm.cmd run test`
- `npm.cmd audit --omit=dev`
- `npm.cmd --workspace app/backend exec -- prisma migrate status`
- Validacion API con backend compilado.
- Validacion navegador desktop y movil.
- Validacion de calculos conocidos en pruebas unitarias.

## Resultados

- Build backend/frontend completado sin errores.
- Pruebas backend: 7 archivos, 16 pruebas aprobadas.
- Auditoria npm: 0 vulnerabilidades productivas.
- Prisma Migrate Status: base al dia con 6 migraciones.
- API: simulacion de costos y guardado de escenario validados.
- UI desktop: resumen ejecutivo, simulador, desglose y alertas visibles sin overflow.
- UI movil 390x844: modulo visible sin overflow horizontal.

## Errores encontrados

- MySQL rechazo un nombre de indice demasiado largo en productos comerciales.

## Correcciones realizadas

- Se reemplazo el indice por `rmcp_org_perm_code_key`.
- Se creo el indice faltante y se marco la migracion como aplicada.

## Evidencias tecnicas

- Datos persistidos:
  - Productos comerciales: 30.
  - Historicos de precio: 30.
  - Escenarios de costo: 1.
  - Lineas de escenario: 7.
  - Auditorias de costo/precio: 1.
- Validacion API:
  - Version costeada: `frm-shampoo-v1`.
  - Costo lote MXN demo: 374.606.
  - Ingredientes costeados: 7.
  - Alertas: 1.
  - Escenario guardado separado de la formulacion.

## Limitaciones pendientes

- No se implementaron compras completas, inventario operativo, produccion ni facturacion.
- El tipo de cambio se registra manualmente; no hay consulta externa automatica.
- La seleccion manual avanzada de proveedor queda preparada mediante producto comercial y estrategia, pero puede enriquecerse en incrementos posteriores.

## Confirmacion final

Incremento 5 implementado y validado tecnicamente. Requiere aprobacion formal antes de iniciar Incremento 6.
