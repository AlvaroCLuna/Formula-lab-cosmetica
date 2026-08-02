# Arquitectura actualizada

## Estilo

Plataforma modular tipo ERP con backend central, base de datos MySQL, aplicación web, APK Android futura y comunicación en tiempo real para mantener ambas experiencias conectadas.

## Capas

- Frontend web: panel híbrido, formularios, tablas, paneles laterales y drag & drop.
- APK Android: cliente móvil conectado al mismo backend y a los mismos permisos de usuario.
- Backend API: autenticación, licencias, reglas de negocio, versionado, validación, extracción y auditoría.
- Tiempo real: eventos para sincronizar estados de documentos, fichas y sesiones entre web y APK.
- Base de datos MySQL: entidades normalizadas, historial, licencias, usuarios, organizaciones y relaciones documentales.
- Almacenamiento: documentos originales, versiones procesadas y rechazadas.
- Servicios de extracción: PDF, DOCX, XLSX, CSV, TXT e imágenes.

## Módulos iniciales

- Identidad, usuarios por correo y recuperación de contraseña.
- Licencia única por usuario registrado.
- Organizaciones con separación lógica de datos.
- Materias primas.
- Inteligencia de Insumos.
- Documentos y trazabilidad de evidencia.
- Sincronización en tiempo real.

## Módulos posteriores

- APK Android funcional completa.
- Formulaciones y versiones.
- Laboratorio guiado para mezclas inteligentes.
- Reglas de incompatibilidad, reacciones químicas, reacciones exotérmicas, neutralización funcional, pH, temperatura y dosis.
- Proveedores.
- Documentos.
- Costos.

## Restricción

No acoplar la arquitectura al Excel histórico. El Excel será fuente de importación y exportación.

No permitir que una recomendación automática de mezcla sustituya la revisión técnica. El sistema debe guiar, advertir y documentar la evidencia, no inventar compatibilidades ni seguridad.
