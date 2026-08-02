# Changelog

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

## 0.1.1 - Validación funcional del Incremento 1

- Se corrigió extracción CSV para soportar archivos de dos columnas `Campo,Valor`.
- Se agregó prueba unitaria para reconocimiento de filas CSV normalizadas.
- Se corrigió inmutabilidad de fichas aprobadas: ya no pueden rechazarse ni corregirse después de aprobarse.
- Se bloqueó aprobación de fichas sin evidencia documental extraída.
- Se agregó migración correctiva para defaults de `updated_at` en tablas con auditoría temporal.
- Se agregó SQL espejo `database/migrations/002_incremento_1_validation_fixes.sql`.
- Se convirtió el control claro/oscuro en toggle funcional dentro del AppShell.
- Se documentó la validación funcional completa en `docs/16_Validacion_Incremento_1.md`.
