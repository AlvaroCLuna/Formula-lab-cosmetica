# Changelog

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
