# Backlog

## Incremento 1

Estado: COMPLETADO Y APROBADO.

No realizar más cambios sobre Incremento 1 salvo correcciones críticas futuras.

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

Estado: IMPLEMENTADO, PENDIENTE DE APROBACION FORMAL.

- Productos comerciales enriquecidos implementados.
- Historial de precios implementado.
- Normalizacion de costos implementada.
- Costeo de formulaciones por escenarios implementado.
- Simulador y resumen ejecutivo implementados.
- Alertas de costo implementadas.
- Soporte inicial MXN/USD implementado con tipo de cambio manual.
- Pendiente: aprobacion formal antes de iniciar Incremento 6.

## Pendiente para fases posteriores

- Registro completo de usuarios por correo.
- Recuperación real de contraseña con proveedor SMTP.
- Roles y permisos.
- Administración básica y avanzada de organización.
- Mejora de extracción de PDF con tablas complejas.
- OCR para documentos escaneados.
- Sistema de licencias.
- Eventos de sincronización en tiempo real.
- APK instalable.
- Facturación.
- Producción.
- Inventario operativo.
- Costos completos.
- Laboratorio avanzado.
- Motor de reglas químicas.
