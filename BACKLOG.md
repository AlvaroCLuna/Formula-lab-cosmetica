# Backlog

## Incremento 1

Estado: COMPLETADO Y APROBADO.

No realizar mas cambios sobre Incremento 1 salvo correcciones criticas futuras.

## Incremento 2 - Gestor de Formulaciones

Estado: COMPLETADO Y APROBADO.

- Modelo de familias de formulacion implementado.
- Modelo de versiones de formulacion implementado.
- Modelo de ingredientes por version implementado.
- Relacion con materias primas maestras implementada.
- Listado, busqueda, filtros, vista rapida y chips implementados.
- Modo aprendizaje implementado sin inventar informacion tecnica.
- Flujo de borrador, revision, aprobacion, rechazo y nueva version implementado.
- Inmutabilidad de versiones aprobadas implementada con bloqueo 409.
- Comparacion entre versiones implementada.
- Historial en `audit_log` implementado.
- Campos preparatorios para costeo y produccion agregados sin implementar esos modulos.

## Incremento 3 - Materias Primas Maestras

Estado: COMPLETADO Y APROBADO.

- Catalogo maestro implementado como base de conocimiento.
- Busqueda, filtros, categorias, familias y estados implementados.
- Ficha tecnica completa versionada implementada.
- Relaciones con fabricantes, proveedores, productos comerciales, documentos y lotes preparados.
- Inteligencia de uso en formulaciones, proveedores, documentos, costo promedio preparado y ultima actualizacion implementada.
- Vista rapida lateral y modo aprendizaje implementados.
- Auditoria de creacion, edicion, aprobacion y archivado implementada.
- Seeds con 30 materias primas demo agregados.

## Incremento 4 - Formula Engine

Estado: COMPLETADO Y APROBADO.

- Motor de calculo y validacion implementado.
- Fases estructuradas por version implementadas.
- Editor visual con drag & drop nativo implementado.
- Escalado por batch implementado.
- Comparacion avanzada de versiones implementada.
- Preparacion para reglas y costeo futuro implementada a nivel arquitectonico.

## Incremento 5 - Motor de Costos

Estado: COMPLETADO Y APROBADO.

- Productos comerciales enriquecidos implementados.
- Historial de precios implementado.
- Normalizacion de costos implementada.
- Costeo de formulaciones por escenarios implementado.
- Simulador y resumen ejecutivo implementados.
- Alertas de costo implementadas.
- Soporte inicial MXN/USD implementado con tipo de cambio manual.

## Incremento 6 - Inventario y Lotes

Estado: COMPLETADO Y APROBADO.

- Almacenes y ubicaciones implementados.
- Lotes de materia prima con estados operativos implementados.
- Movimientos y kardex implementados.
- Reservas y liberaciones implementadas con bloqueo de saldos negativos.
- Transferencias implementadas como salida y entrada relacionadas.
- Alertas de caducidad, cuarentena, bloqueo, agotado y stock insuficiente implementadas.
- Disponibilidad desde formulaciones escaladas implementada sin descuento automatico.
- Integracion preparatoria con costos de entrada, moneda y tipo de cambio implementada.
- UI ERP de inventario con vista rapida y modo aprendizaje implementada.
- Seeds con 2 almacenes, 8 ubicaciones, 25 lotes y movimientos demo agregados.

## Incremento 7 - Laboratorio y Produccion MVP

Estado: COMPLETADO Y APROBADO.

- Ordenes de produccion implementadas.
- Generacion desde formulacion aprobada implementada.
- Consumo teorico con FEFO, disponibilidad y costo esperado implementado.
- Consumo real con descuento de inventario y kardex implementado.
- Checklist obligatorio implementado.
- Bitacora cronologica implementada.
- Parametros de proceso implementados.
- Cierre con lote de producto terminado implementado.
- Calculo de rendimiento, diferencia y merma implementado.
- Dashboard y UI ERP tipo laboratorio implementados.

## Incremento 7.5 - Centro de Conocimiento Cosmetico

Estado: IMPLEMENTADO, PENDIENTE DE APROBACION FORMAL.

- Menu Centro de Conocimiento implementado.
- Categorias de productos cosmeticos implementadas.
- Familias y subfamilias formulativas implementadas.
- Necesidades cosmeticas implementadas con productos, familias, materias primas, equipo y controles sugeridos.
- Busqueda universal implementada con relaciones registradas, sin IA generativa.
- Seleccion guiada implementada con reglas declarativas.
- Glosario y modo aprendizaje implementados.
- Validacion documentada con diagrama de flujo y diagrama ER Mermaid.
- Pendiente: aprobacion formal antes de iniciar Incremento 8.

## Pendiente para fases posteriores

- Registro completo de usuarios por correo.
- Recuperacion real de contrasena con proveedor SMTP.
- Roles y permisos.
- Administracion basica y avanzada de organizacion.
- Mejora de extraccion de PDF con tablas complejas.
- OCR para documentos escaneados.
- Sistema de licencias.
- Eventos de sincronizacion en tiempo real.
- APK instalable.
- Compras completas.
- Planificacion avanzada MRP.
- Produccion avanzada.
- Facturacion.
- Calidad avanzada.
- Laboratorio avanzado.
- Motor de reglas quimicas.
