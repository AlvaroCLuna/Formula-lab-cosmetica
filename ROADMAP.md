# Roadmap

## Incremento 1 - COMPLETADO Y APROBADO

Base ERP funcional con autenticación, shell principal, MySQL/MariaDB, Inteligencia de Insumos, carga documental, extracción inicial, trazabilidad, auditoría básica, validación funcional completa y respaldo en GitHub.

## Incremento 2 - IMPLEMENTADO, PENDIENTE DE APROBACION FORMAL

Gestor de Formulaciones:

- Listado de formulaciones.
- Identificador permanente.
- Nombre, categoria, estado y version.
- Ingredientes visibles desde el listado.
- Chips por funcion cosmetica.
- Vista rapida.
- Modo aprendizaje.
- Creacion de borradores.
- Versionado.
- Aprobacion.
- Inmutabilidad de versiones aprobadas.
- Comparacion entre versiones.
- Trazabilidad.
- Historial de cambios.
- Relacion con materias primas maestras.
- Preparacion para costeo y produccion futuros.
- Validacion documentada en `docs/18_Validacion_Incremento_2.md`.

## Incremento 3 - COMPLETADO Y APROBADO

Materias Primas Maestras:

- Base de conocimiento de ingredientes.
- Listado, busqueda, filtros, categorias, familias y estados.
- Ficha tecnica completa versionada.
- Inmutabilidad de fichas validadas.
- Relaciones con fabricantes, proveedores, productos, documentos, formulaciones y lotes preparados.
- Vista rapida lateral y modo aprendizaje.
- Inteligencia operativa: formulaciones asociadas, uso promedio, proveedores, documentos, costo promedio preparado y ultima actualizacion.
- Validacion documentada en `docs/19_Validacion_Incremento_3.md`.

## Incremento 4 - IMPLEMENTADO, PENDIENTE DE APROBACION FORMAL

Formula Engine:

- Editor visual de formulaciones con fases.
- Drag & drop nativo de ingredientes entre fases.
- Reordenamiento de fases.
- Calculo escalado de porcentajes y gramos.
- Validaciones automaticas del motor.
- Comparacion avanzada de versiones por ingrediente, porcentaje, orden y fase.
- Preparacion para reglas y costeo futuro sin implementar esos modulos.
- Validacion documentada en `docs/20_Validacion_Incremento_4.md`.

## Incremento 5 - Pendiente de especificacion

No iniciar hasta aprobacion formal del Incremento 4.

## Fases posteriores

- Registro completo de usuarios.
- Recuperación real de contraseña con correo transaccional.
- Roles y permisos avanzados.
- Administración multiempresa completa.
- Sistema de licencias.
- Sincronización en tiempo real.
- APK Android.
- Laboratorio guiado con reglas estructuradas.
- Inventario, producción, costos completos y calidad.
