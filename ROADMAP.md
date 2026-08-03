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

## Incremento 6 - COMPLETADO Y APROBADO

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

## Incremento 7 - COMPLETADO Y APROBADO

Laboratorio y Produccion MVP:

- Ordenes de produccion desde versiones aprobadas.
- Estados, prioridad, responsable, operador y fechas.
- Consumo teorico con FEFO, disponibilidad y costo esperado.
- Consumo real con descuento de inventario, movimiento y kardex.
- Checklist obligatorio antes de iniciar.
- Bitacora cronologica y parametros de proceso.
- Cierre con lote de producto terminado y calculo de rendimiento.
- Dashboard ERP de produccion y experiencia tipo laboratorio.

Validacion documentada en `docs/23_Validacion_Incremento_7.md`.

## Incremento 7.5 - COMPLETADO Y APROBADO

Centro de Conocimiento Cosmetico:

- Exploracion por productos cosmeticos, familias formulativas, subfamilias y necesidades.
- Catalogo educativo con explicacion simple y tecnica, sin sustituir procedimientos validados.
- Busqueda universal basada en relaciones registradas y evidencia interna.
- Seleccion guiada por necesidad, zona de uso, forma fisica y dificultad.
- Integracion con materias primas maestras, formulaciones, documentos y aprendizaje.
- Diagramas Mermaid requeridos en validacion.

Validacion documentada en `docs/24_Validacion_Incremento_7_5.md`.

## Incremento 7.8 - COMPLETADO Y APROBADO

Knowledge Document Engine:

- Repositorio documental transversal para todos los modulos.
- Tipos tecnicos, comerciales, cientificos, normativos, produccion y laboratorio.
- Carga multiformato con versionado, tags, relaciones reutilizables, OCR preparado y chunks para RAG futuro.
- Busqueda universal documental por metadata, etiquetas, texto extraido, OCR y relaciones.
- Vista previa integrada para PDF, imagen, TXT y CSV.
- Dashboard documental y panel lateral de trazabilidad.

Validacion documentada en `docs/25_Validacion_Incremento_7_8.md`.

## Incremento 8 - COMPLETADO Y APROBADO

LIMS - Laboratory Information Management System:

- Proyectos de laboratorio con codigos permanentes, estados, responsables y formulacion/version aprobada relacionada.
- Muestras con lote piloto, ubicacion, condiciones, estado y liberacion.
- Catalogo versionado de metodos de ensayo con bloqueo de metodos validados.
- Instrumentos con calibracion y advertencia de uso vencido.
- Ensayos con metodo, instrumento, resultado, conformidad, evidencia KDE y auditoria.
- Estudios de estabilidad con puntos de evaluacion.
- No conformidades y liberacion tecnica con bloqueo de resultados usados.
- Dashboard, timeline, captura guiada, comparacion visual preparada y modo aprendizaje.

Validacion documentada en `docs/26_Validacion_Incremento_8.md`.

## Incremento 9 - COMPLETADO Y APROBADO

Control de Calidad:

- Especificaciones versionadas para materiales, proceso y producto terminado.
- Planes de muestreo configurables.
- Inspeccion de recepcion con cuarentena, aprobacion y rechazo.
- Control de producto en proceso y terminado preparado.
- Liberaciones y rechazos trazables.
- Desviaciones, no conformidades, CAPA y disposiciones.
- Integracion con Inventario, Produccion, LIMS y KDE por referencias documentales y operativas.
- Dashboard, colas, semaforos, panel lateral y modo aprendizaje.

Validacion documentada en `docs/27_Validacion_Incremento_9.md`.

## Incremento 10 - IMPLEMENTADO, PENDIENTE DE APROBACION FORMAL

Compras y Abastecimiento:

- Solicitudes de compra con origen, prioridad, responsable, renglones y evidencia.
- Requisiciones y RFQ para comparar proveedores y condiciones.
- Cotizaciones historicas sin sobrescritura y relacionadas con productos comerciales.
- Comparativas con criterio y motivo de seleccion.
- Ordenes de compra con aprobacion, moneda MXN/USD, importes y documentos.
- Recepcion contra OC con soporte parcial, cuarentena inicial y trazabilidad a inventario/calidad.
- Devoluciones a proveedor con movimiento de inventario preparado.
- Evaluacion de proveedores y sugerencias de abastecimiento.
- Dashboard ERP, panel lateral, alertas, acciones guiadas y modo aprendizaje.

Validacion documentada en `docs/28_Validacion_Incremento_10.md`.

## Fases posteriores

- Registro completo de usuarios.
- Recuperacion real de contrasena con correo transaccional.
- Roles y permisos avanzados.
- Administracion multiempresa completa.
- Sistema de licencias.
- Sincronizacion en tiempo real.
- APK Android.
- Laboratorio guiado con reglas estructuradas.
- Compras avanzadas.
- Planificacion avanzada MRP.
- Produccion avanzada.
- Facturacion.
- LIMS / calidad avanzada.
