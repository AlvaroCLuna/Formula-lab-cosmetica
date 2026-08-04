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

Estado: COMPLETADO Y APROBADO.

- Menu Centro de Conocimiento implementado.
- Categorias de productos cosmeticos implementadas.
- Familias y subfamilias formulativas implementadas.
- Necesidades cosmeticas implementadas con productos, familias, materias primas, equipo y controles sugeridos.
- Busqueda universal implementada con relaciones registradas, sin IA generativa.
- Seleccion guiada implementada con reglas declarativas.
- Glosario y modo aprendizaje implementados.
- Validacion documentada con diagrama de flujo y diagrama ER Mermaid.

## Incremento 7.8 - Knowledge Document Engine

Estado: COMPLETADO Y APROBADO.

- Repositorio documental transversal implementado sobre la tabla `documents` existente.
- Tipos documentales implementados en `document_types`.
- Versionado implementado en `document_versions`; no se sobrescribe documento aprobado ni versionado.
- Etiquetas libres implementadas con codigos `TAG-000001`.
- Relaciones reutilizables implementadas con multiples entidades.
- Chunks y OCR preparado implementados para RAG futuro sin generar embeddings todavia.
- Fuentes de conocimiento implementadas con codigos `SRC-000001`.
- UI documental ERP implementada con drag & drop, filtros, tarjetas/lista, panel lateral y vista previa.
- Seeds con 50 documentos demo KDE y relaciones trazables agregados.
- Validacion documentada con Flowchart y ER Diagram Mermaid.

## Incremento 8 - LIMS

Estado: COMPLETADO Y APROBADO.

- Proyectos de laboratorio implementados.
- Muestras implementadas.
- Planes y metodos de ensayo implementados.
- Instrumentos con calibracion implementados.
- Ensayos y resultados implementados.
- Estabilidad con puntos de evaluacion implementada.
- Timeline de seguimiento implementado.
- No conformidades de laboratorio implementadas.
- Liberacion tecnica implementada con bloqueo de resultados.
- Integracion documental mediante KDE implementada por `evidence_document_id` y relaciones documentales reutilizables.
- UI ERP tipo laboratorio implementada.
- Seeds y pruebas agregadas.
- Validacion documentada con Flowchart y ER Diagram Mermaid.

## Incremento 9 - Control de Calidad

Estado: COMPLETADO Y APROBADO.

- Especificaciones de calidad implementadas.
- Criterios de especificacion implementados.
- Planes de muestreo implementados.
- Inspeccion de recepcion implementada.
- Controles de proceso y producto terminado preparados en modelo.
- Liberaciones, rechazo y cuarentena implementados.
- Desviaciones implementadas con contencion obligatoria.
- No conformidades implementadas.
- CAPA implementada.
- Disposiciones implementadas.
- Integracion con KDE por evidencia documental implementada.
- UI ERP moderna de Calidad implementada.
- Seeds y pruebas agregadas.
- Validacion documentada con Flowchart y ER Diagram Mermaid.

## Incremento 10 - Compras y Abastecimiento

Estado: COMPLETADO Y APROBADO.

- Solicitudes de compra implementadas.
- Requisiciones y RFQ implementados con identificadores permanentes.
- Cotizaciones implementadas sin sobrescribir historicos.
- Comparativas de proveedores implementadas con criterio y motivo de seleccion.
- Ordenes de compra implementadas con aprobacion y validaciones obligatorias.
- Recepcion contra OC implementada con soporte parcial y cuarentena inicial.
- Devolucion a proveedor implementada con movimiento de inventario.
- Evaluacion de proveedores implementada.
- Sugerencias de abastecimiento implementadas.
- Integracion con materias primas, productos comerciales, costos, inventario, calidad, KDE y auditoria implementada.
- UI ERP moderna de Compras con dashboard, panel lateral, alertas y modo aprendizaje implementada.
- Seeds y pruebas agregadas.
- Validacion documentada con Flowchart y ER Diagram Mermaid.

## Incremento 11 - CRM, Ventas y Pedidos

Estado: COMPLETADO Y APROBADO.

- Prospectos implementados.
- Clientes implementados mediante conversion de prospectos sin duplicar informacion.
- Contactos multiples implementados.
- Actividades comerciales implementadas.
- Oportunidades y pipeline implementados.
- Productos vendibles implementados con relacion a formulacion aprobada.
- Listas de precios versionadas implementadas.
- Cotizaciones comerciales implementadas.
- Aprobacion comercial basica implementada.
- Pedidos implementados con validacion de disponibilidad y produccion sugerida.
- Entregas parciales preparadas implementadas.
- Muestras comerciales implementadas.
- Integracion con KDE, auditoria, costos, produccion sugerida, calidad e inventario preparada/implementada segun alcance.
- UI ERP moderna con dashboard, Kanban, perfil 360, cotizador guiado y modo aprendizaje implementada.
- Seeds y pruebas agregadas.
- Validacion documentada con Flowchart y ER Diagram Mermaid.

## Incremento 12 - IA Responsable y Motor de Reglas

Estado: COMPLETADO Y APROBADO.

- Reglas estructuradas versionadas implementadas.
- Evaluador de reglas implementado.
- Alertas explicables implementadas.
- Asistente de consulta interno implementado con evidencia.
- RAG logico preparado sobre documentos, chunks y OCR.
- Respuestas con fuentes, confianza, advertencias y estado de validacion implementadas.
- Tipos de salida diferenciados implementados.
- Asistentes de formulacion, laboratorio/calidad y operativo preparados por alcance de consulta y reglas.
- Eventos de aprendizaje implementados sin reentrenamiento automatico.
- Confiabilidad de fuentes y proveedores IA configurables implementados sin secretos.
- Dashboard y UI ERP de inteligencia implementados.
- Seeds y pruebas agregadas.
- Validacion documentada con Flowchart y ER Diagram Mermaid.

## Incremento 13 - Reportes, BI y Tablero Ejecutivo

Estado: COMPLETADO Y APROBADO.

- Tablero ejecutivo implementado.
- Dashboards configurables por modulo implementados.
- Constructor de reportes implementado con entidades analiticas permitidas y sin SQL en frontend.
- Snapshots historicos fechados implementados.
- Alertas ejecutivas implementadas con fuente, criterio y severidad.
- Exportaciones auditadas implementadas para CSV, XLSX, PDF preparado y JSON.
- Programaciones de reportes preparadas sin envio automatico externo.
- Integracion BI de solo lectura con modulos operativos implementada.
- UI ERP responsive con KPIs, graficas, panel lateral, filtros, drilldown basico y modo aprendizaje implementada.
- Seeds y pruebas agregadas.
- Validacion documentada con Flowchart y ER Diagram Mermaid.

## Incremento 14 - Digital Twin + Knowledge Graph

Estado: IMPLEMENTADO, PENDIENTE DE APROBACION FORMAL.

- Catalogo de tipos de entidad implementado.
- Catalogo de tipos de relacion implementado.
- Gemelos digitales implementados sobre entidades existentes.
- Relaciones tipificadas implementadas con evidencia obligatoria y no duplicacion.
- Inactivacion de relaciones implementada sin borrado fisico.
- Timeline universal implementado.
- Eventos, snapshots, metricas y vistas implementados.
- Dashboard del grafo implementado.
- Buscador universal implementado.
- Vista 360 y grafo navegable implementados.
- UI ERP de conocimiento con grafo, arbol, timeline, tabla, tarjetas y modo aprendizaje implementada.
- Seeds y pruebas agregadas.
- Validacion documentada con Flowchart y ER Diagram Mermaid.

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
