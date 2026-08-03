# Roadmap

## Incremento 1 - COMPLETADO Y APROBADO

Base ERP funcional con autenticacion, shell principal, MySQL/MariaDB, Inteligencia de Insumos, carga documental, extraccion inicial, trazabilidad, auditoria basica, validacion funcional completa y respaldo en GitHub.

## Incremento 2 - COMPLETADO Y APROBADO

Gestor de Formulaciones con listado, identificador permanente, versiones, ingredientes visibles, chips por funcion cosmetica, vista rapida, modo aprendizaje, borradores, aprobacion, inmutabilidad, comparacion, trazabilidad e historial.

Validacion documentada en `docs/18_Validacion_Incremento_2.md`.

## Incremento 3 - COMPLETADO Y APROBADO

Materias Primas Maestras como base de conocimiento de ingredientes, con ficha tecnica versionada, relaciones, inteligencia operativa, vista rapida, modo aprendizaje y auditoria.

Validacion documentada en `docs/19_Validacion_Incremento_3.md`.

## Incremento 4 - COMPLETADO Y APROBADO

Formula Engine como motor operativo reutilizable, con editor visual por fases, drag & drop, calculo escalado, validaciones automaticas, comparacion avanzada y preparacion para reglas/costeo.

Validacion documentada en `docs/20_Validacion_Incremento_4.md`.

## Incremento 5 - COMPLETADO Y APROBADO

Motor de Costos con productos comerciales enriquecidos, historial de precios, normalizacion, escenarios fechados, simulador, alertas y soporte inicial MXN/USD.

Validacion documentada en `docs/21_Validacion_Incremento_5.md`.

## Incremento 6 - IMPLEMENTADO, PENDIENTE DE APROBACION FORMAL

Inventario y Lotes:

- Almacenes, zonas, ubicaciones y responsables.
- Lotes de materia prima relacionados con materia prima maestra, producto comercial, proveedor y fabricante.
- Estados de lote: pendiente de recepcion, recibido, cuarentena, aprobado, rechazado, bloqueado, agotado, caducado y archivado.
- Movimientos de inventario con kardex trazable.
- Reservas y liberaciones sin permitir saldos negativos.
- Transferencias como salida y entrada relacionadas.
- Alertas de caducidad, cuarentena, bloqueo y stock insuficiente.
- Preparacion FEFO/FIFO con sugerencia inicial FEFO.
- Disponibilidad desde formulaciones escaladas sin descontar inventario automaticamente.
- Integracion con Motor de Costos para costo, moneda, tipo de cambio y precio origen preparado.

Validacion documentada en `docs/22_Validacion_Incremento_6.md`.

## Fases posteriores

- Registro completo de usuarios.
- Recuperacion real de contrasena con correo transaccional.
- Roles y permisos avanzados.
- Administracion multiempresa completa.
- Sistema de licencias.
- Sincronizacion en tiempo real.
- APK Android.
- Laboratorio guiado con reglas estructuradas.
- Compras completas.
- Produccion completa.
- Facturacion.
- Calidad avanzada.
