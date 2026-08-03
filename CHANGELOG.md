# Changelog

## 0.13.0 - Incremento 13 implementado

- Se implemento Reportes, BI y Tablero Ejecutivo con dashboards, reportes configurables, snapshots, alertas ejecutivas, exportaciones y programaciones preparadas.
- Se agregaron modelos Prisma, migracion MySQL, SQL espejo, APIs, validaciones, seed y pruebas.
- Se integro BI con formulaciones, materias primas, documentos, inventario, produccion, calidad, compras, ventas, IA y auditoria mediante consultas de solo lectura operativa.
- Se agrego constructor de reportes con entidades permitidas, sin SQL desde frontend.
- Se agregaron snapshots fechados que no se recalculan silenciosamente y escenarios de exportacion auditados.
- Se agrego UI ERP de tablero ejecutivo con KPIs, graficas, tabs, panel lateral, alertas, exportaciones, filtros globales y modo aprendizaje.
- Se agregaron datos demo con 8 dashboards, 12 reportes, 6 snapshots, 10 alertas, exportaciones y programaciones preparadas.
- Se documento la validacion en `docs/31_Validacion_Incremento_13.md` con Flowchart y ER Diagram Mermaid.

## 0.12.0 - Incremento 12 implementado

- Se implemento IA Responsable y Motor de Reglas con reglas versionadas, evaluaciones, alertas explicables, consultas, respuestas con evidencia, eventos de aprendizaje y fuentes/proveedores configurables.
- Se agregaron modelos Prisma, migracion MySQL, SQL espejo, APIs, validaciones, seed y pruebas.
- Se integro la capa IA con KDE, documentos, materias primas, formulaciones, inventario, calidad, costos, compras, CRM y auditoria mediante consultas y referencias trazables.
- Se agrego evaluador estructurado que solo usa reglas validadas y registra entidad, regla, severidad, evidencia, version y datos evaluados.
- Se agrego recuperacion logica sobre documentos, chunks, OCR y entidades registradas sin embeddings externos ni claves en frontend.
- Se agrego UI ERP de IA con centro de consultas, panel de evidencia, semaforos de confianza, alertas explicables, fuentes, historial y modo aprendizaje.
- Se agregaron datos demo con 20 reglas, 30+ evaluaciones, 12+ alertas, 15+ consultas/respuestas, 10 eventos de aprendizaje y fuentes con confiabilidad.
- Se documento la validacion en `docs/30_Validacion_Incremento_12.md` con Flowchart y ER Diagram Mermaid.

## 0.11.0 - Incremento 11 implementado

- Se implemento CRM, Ventas y Pedidos con prospectos, clientes, contactos, actividades, oportunidades, productos vendibles, listas de precios, cotizaciones, aprobaciones, pedidos, entregas y muestras comerciales.
- Se agregaron modelos Prisma, migracion MySQL, SQL espejo, APIs, validaciones, seed y pruebas.
- Se integro el modulo comercial con formulaciones aprobadas, costos de referencia, inventario/disponibilidad preparada, produccion sugerida, calidad por bloqueo de entrega, KDE y auditoria.
- Se agregaron reglas para no duplicar prospectos convertidos, no vender formulaciones no aprobadas, no sobrescribir listas/cotizaciones historicas, no confirmar pedidos sin partidas y no entregar lotes no liberados.
- Se agrego UI ERP de CRM/Ventas con dashboard, pipeline Kanban, perfil 360, cotizador guiado, pedidos, entregas, panel lateral y modo aprendizaje.
- Se agregaron datos demo con 12 prospectos, 6 clientes, 18 contactos, 25 actividades, 10 oportunidades, 12 productos, 3 listas, 8 cotizaciones, 5 pedidos, 3 entregas y 4 muestras.
- Se documento la validacion en `docs/29_Validacion_Incremento_11.md` con Flowchart y ER Diagram Mermaid.

## 0.10.0 - Incremento 10 implementado

- Se implemento Compras y Abastecimiento con solicitudes, requisiciones, RFQ, cotizaciones, comparativas, ordenes de compra, aprobaciones, recepciones, devoluciones, evaluaciones de proveedores y sugerencias.
- Se agregaron modelos Prisma, migracion MySQL, SQL espejo, APIs, validaciones, seed y pruebas.
- Se integro Compras con materias primas maestras, productos comerciales, proveedores, Motor de Costos, Inventario, Calidad, KDE y auditoria.
- Se agregaron reglas para impedir OC sin proveedor/renglones, recepciones superiores al pendiente sin autorizacion y sobrescritura de cotizaciones/precios.
- Se agrego UI ERP de Compras con dashboard, panel lateral, acciones guiadas, alertas y modo aprendizaje.
- Se agregaron datos demo con 8 solicitudes, 4 requisiciones, 4 RFQ, 10 cotizaciones, 4 comparativas, 5 OC, 4 recepciones, 1 devolucion y 3 evaluaciones de proveedor.
- Se documento la validacion en `docs/28_Validacion_Incremento_10.md` con Flowchart y ER Diagram Mermaid.

## 0.9.0 - Incremento 9 implementado

- Se implemento Control de Calidad con especificaciones versionadas, planes de muestreo, inspecciones, liberaciones, desviaciones, no conformidades, CAPA y disposiciones.
- Se agregaron modelos Prisma, migracion MySQL, APIs, validaciones, seed y pruebas.
- Se integro Calidad con KDE mediante evidencias documentales y con LIMS por referencias, sin duplicar resultados de laboratorio.
- Se agregaron reglas para impedir liberacion con especificacion no aprobada, exigir contencion en desviaciones y disposicion para cierre de no conformidades.
- Se agrego UI ERP de Calidad con dashboard, colas, semaforos, panel lateral, captura guiada y modo aprendizaje.
- Se documento la validacion en `docs/27_Validacion_Incremento_9.md` con Flowchart y ER Diagram Mermaid.

## 0.8.0 - Incremento 8 implementado

- Se implemento LIMS como modulo de laboratorio para proyectos, muestras, ensayos, estabilidad, no conformidades y liberacion tecnica.
- Se agregaron modelos Prisma, migracion MySQL, APIs, validaciones, seeds y pruebas.
- Se integro LIMS con formulaciones aprobadas, muestras, metodos versionados, instrumentos, evidencias KDE y auditoria.
- Se agrego bloqueo de resultados liberados, motivo obligatorio para invalidacion/repeticion y advertencia para instrumentos con calibracion vencida.
- Se agrego UI ERP tipo laboratorio con dashboard, tarjetas, tabs, timeline, panel lateral, captura guiada y modo aprendizaje.
- Se agregaron datos demo con proyectos, muestras, metodos, instrumentos, ensayos, estabilidad, no conformidades y liberaciones.
- Se documento la validacion en `docs/26_Validacion_Incremento_8.md` con Flowchart y ER Diagram Mermaid.

## 0.7.8 - Incremento 7.8 implementado

- Se implemento Knowledge Document Engine como repositorio documental transversal del ERP.
- Se amplio el modelo documental con tipos, versiones, etiquetas, relaciones, chunks, OCR preparado, permisos y fuentes de conocimiento.
- Se agrego carga multiformato para PDF, DOCX, XLSX, CSV, TXT, imagenes, video y ZIP.
- Se agregaron APIs de dashboard, busqueda, carga, detalle, vista previa, versionado, relaciones y etiquetas.
- Se agrego UI ERP con explorador documental, drag & drop, tarjetas/lista, filtros, panel lateral, tags, versiones, relaciones y OCR/chunks.
- Se agregaron 50 documentos demo KDE, catalogo de 35 tipos documentales, etiquetas, OCR demo y relaciones trazables.
- Se agregaron pruebas del motor KDE y validacion documentada en `docs/25_Validacion_Incremento_7_8.md`.

## 0.7.5 - Incremento 7.5 implementado

- Se implemento el Centro de Conocimiento Cosmetico como modulo navegable desde el AppShell.
- Se agrego exploracion por categoria de producto, familia formulativa, subfamilia, necesidad cosmetica y glosario.
- Se agrego buscador universal basado en terminos y relaciones registradas, sin IA generativa ni invencion de contenido tecnico.
- Se agrego seleccion guiada por necesidad, zona de uso, forma fisica, dificultad y resultado deseado.
- Se agrego pestana educativa "Como se fabrica" con etapas generales, equipo, controles, errores frecuentes y notas de seguridad.
- Se agregaron APIs, modelos Prisma, migracion SQL/Prisma, seeds y pruebas basicas del Centro de Conocimiento.
- Se documento la validacion en `docs/24_Validacion_Incremento_7_5.md`.

## 0.7.0 - Incremento 7 implementado

- Se implemento Laboratorio y Produccion MVP con ordenes de produccion trazables.
- Se agrego generacion de orden desde version aprobada de formulacion.
- Se agrego consumo teorico con cantidades requeridas, disponibilidad, lotes FEFO sugeridos y costo esperado.
- Se agrego consumo real con lote utilizado, cantidad, merma, sustitucion autorizada, descuento de inventario y movimiento de kardex.
- Se agregaron bitacora, checklist obligatorio, parametros de proceso y cierre con lote de producto terminado.
- Se agrego dashboard de produccion con ordenes activas, produccion del dia, lotes producidos, consumo, merma y ordenes detenidas.
- Se agregaron APIs, migracion Prisma/SQL, seeds con ordenes demo y pruebas del servicio de produccion.
- Se documento la validacion en `docs/23_Validacion_Incremento_7.md`.

## 0.6.0 - Incremento 6 implementado

- Se implemento Inventario y Lotes con almacenes, ubicaciones, lotes de materia prima y estados operativos.
- Se agrego kardex trazable por lote con entradas, salidas, reservas, liberaciones, ajustes y transferencias relacionadas.
- Se agregaron reglas para impedir saldos negativos y reservas superiores a la existencia disponible.
- Se agregaron alertas por caducidad, cuarentena, bloqueo, stock insuficiente y lotes sin fecha de caducidad.
- Se preparo FEFO/FIFO e implemento sugerencia inicial FEFO para disponibilidad desde formulaciones escaladas.
- Se integro inventario con materias primas maestras, productos comerciales, proveedores, fabricantes y costos de entrada.
- Se agrego panel ERP de inventario con indicadores, filtros, listado, vista rapida, kardex y modo aprendizaje.
- Se agregaron migraciones Prisma/SQL, seeds con 2 almacenes, 8 ubicaciones, 25 lotes y movimientos demo.
- Se agregaron pruebas del motor de inventario y validacion documentada en `docs/22_Validacion_Incremento_6.md`.

## 0.5.0 - Incremento 5 implementado

- Se implemento el Motor de Costos con escenarios fechados que no modifican formulaciones aprobadas.
- Se ampliaron productos comerciales con presentacion, precio, moneda, impuestos, envio, compra minima, vigencia, cotizacion y observaciones.
- Se agrego historial de precios sin sobrescritura.
- Se agrego normalizacion de costo por gramo, kilogramo, mililitro, litro y unidad.
- Se agrego costeo por ingrediente, fase, lote, kg, participacion de costo y alertas.
- Se agrego simulador interactivo con lote, moneda, proveedor, costos adicionales, margen y markup.
- Se agregaron APIs de simulacion, guardado de escenarios, consulta y actualizacion historica de precios.
- Se agregaron datos demo con 30 productos comerciales, precios MXN/USD e historicos.
- Se documento la validacion en `docs/21_Validacion_Incremento_5.md`.

## 0.4.0 - Incremento 4 implementado

- Se implemento Formula Engine como motor operativo reutilizable para formulaciones.
- Se agregaron fases estructuradas por version de formulacion.
- Se agrego editor visual con fases, drag & drop nativo, movimiento de ingredientes y reordenamiento de fases.
- Se agrego calculo en tiempo real para porcentajes, gramos, subtotales por fase y total escalado.
- Se agregaron escalas 100 g, 250 g, 500 g, 1 kg, 5 kg, 20 kg y 100 kg sin alterar porcentajes.
- Se agregaron validaciones del motor: total distinto de 100, ingrediente repetido, fase vacia, materia prima inexistente, negativos y cantidades invalidas.
- Se agrego comparacion de engine entre versiones por ingredientes agregados, eliminados, porcentaje, orden y fase.
- Se preparo arquitectura para reglas futuras y costeo posterior sin implementar reglas quimicas ni costos completos.
- Se documento la validacion en `docs/20_Validacion_Incremento_4.md`.

## 0.3.0 - Incremento 3 implementado

- Se implemento el modulo Materias Primas Maestras como base de conocimiento de ingredientes.
- Se amplio `RawMaterialMaster` con codigo permanente, categoria, familia, funcion, estado y version vigente.
- Se agrego ficha tecnica versionada con propiedades, seguridad, compatibilidades, incompatibilidades, alergenos, observaciones, evidencia y confianza.
- Se agregaron relaciones para fabricantes, proveedores, productos comerciales, documentos y lotes preparados.
- Se integraron metricas automaticas: formulaciones asociadas, uso promedio, proveedores, documentos, costo promedio preparado y ultima actualizacion.
- Se agregaron APIs para listado, busqueda, filtros, vista rapida, creacion, edicion, aprobacion, archivado y nueva version.
- Se habilito el modulo en el AppShell y se agrego UI ERP responsive con modo aprendizaje.
- Se cargaron 30 materias primas demo representativas y versionadas.
- Se agregaron pruebas del servicio de Materias Primas Maestras.
- Se documento la validacion en `docs/19_Validacion_Incremento_3.md`.

## 0.2.0 - Incremento 2 implementado

- Se implemento el Gestor de Formulaciones con listado, busqueda, filtros, vista rapida, chips por funcion cosmetica y modo aprendizaje.
- Se agregaron familias de formulacion con identificador permanente y versiones con estado, snapshot de aprobacion e inmutabilidad.
- Se agregaron ingredientes por fase con orden de incorporacion, porcentaje, cantidad base y relacion opcional con materias primas maestras.
- Se agregaron APIs para crear borradores, editar versiones editables, enviar a revision, aprobar, rechazar, crear nueva version y comparar versiones.
- Se agregaron materias primas maestras minimas para relacionar ingredientes sin implementar inventario operativo.
- Se registro auditoria para acciones relevantes de formulacion, versiones, ingredientes y comparaciones.
- Se agregaron migraciones Prisma y SQL espejo del Incremento 2.
- Se actualizaron datos demo con una formulacion aprobada y materias primas maestras.
- Se agregaron pruebas de versionado y comparacion.
- Se documento la validacion del Incremento 2 en `docs/18_Validacion_Incremento_2.md`.

## 0.1.2 - Aprobación formal del Incremento 1

- Se marcó el Incremento 1 como COMPLETADO Y APROBADO.
- Se actualizó `ROADMAP.md` con el Gestor de Formulaciones como Incremento 2.
- Se actualizó `BACKLOG.md` separando tareas del Incremento 2 y fases posteriores.
- Se generó la especificación técnica y funcional del Incremento 2 en `docs/17_Especificacion_Incremento_2.md`.
- No se inició programación del Incremento 2.

## 0.1.1 - Validación funcional del Incremento 1

- Se corrigió extracción CSV para soportar archivos de dos columnas `Campo,Valor`.
- Se agregó prueba unitaria para reconocimiento de filas CSV normalizadas.
- Se corrigió inmutabilidad de fichas aprobadas: ya no pueden rechazarse ni corregirse después de aprobarse.
- Se bloqueó aprobación de fichas sin evidencia documental extraída.
- Se agregó migración correctiva para defaults de `updated_at` en tablas con auditoría temporal.
- Se agregó SQL espejo `database/migrations/002_incremento_1_validation_fixes.sql`.
- Se convirtió el control claro/oscuro en toggle funcional dentro del AppShell.
- Se documentó la validación funcional completa en `docs/16_Validacion_Incremento_1.md`.

## 0.1.0 - Incremento 1

- Se creó estructura base frontend/backend con TypeScript.
- Se configuró React, Vite, Node, Express, Prisma y MySQL.
- Se agregó autenticación por correo con login, logout y recuperación preparada.
- Se agregó modelo mínimo de organización y usuario.
- Se implementó AppShell con sidebar, topbar, panel híbrido, navegación y tema preparado.
- Se implementó módulo Inteligencia de Insumos con drag & drop, selección manual, carga múltiple, lista documental, estados y vista previa.
- Se agregó extracción inicial para PDF, CSV y TXT con trazabilidad por documento y referencia.
- Se agregaron acciones de guardar borrador, corregir, aprobar y rechazar.
- Se agregó historial básico en `audit_log`.
- Se agregaron migraciones SQL, schema Prisma y datos demo.
- Se agregaron pruebas básicas para autenticación y mapeo de campos.
