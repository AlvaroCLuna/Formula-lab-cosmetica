# Migracion de Datos Reales - Incremento Piloto

## Objetivo

Preparar Formula Lab Cosmetica para cargar datos reales de prueba sin convertirlos automaticamente en operaciones comerciales, formulaciones aprobadas ni movimientos productivos irreversibles.

## Fuentes soportadas inicialmente

- XLSX.
- CSV.
- PDF.
- TXT.
- Legado Shampoo Solido: `ShampooSolido_Mercado.xlsx`, `recetas.xlsx`, proveedores, formulaciones, costos, ingredientes y relaciones disponibles.

## Mapeo funcional

| Fuente | Destino objetivo | Regla |
| --- | --- | --- |
| Recetas/formulaciones | Formulaciones y versiones | Se cargan como referencia, experimental o en desarrollo; no se aprueban automaticamente. |
| Materias primas | Materias primas maestras | Se reutiliza trazabilidad documental e Inteligencia de Insumos. |
| Proveedores/productos/precios | Motor de Costos | Se previsualizan antes de crear productos comerciales o precios. |
| Documentos tecnicos | KDE/Documentos | No se duplican documentos; se relacionan por evidencia. |
| Productos piloto | `pilot_products` | Se registran como productos no liberados comercialmente. |
| Pruebas LAB | `pilot_lab_trials` + LIMS | Se generan proyecto y muestra piloto no productivos. |

## Vista previa obligatoria

Antes de confirmar una importacion el sistema clasifica:

- Registros nuevos.
- Posibles duplicados.
- Conflictos.
- Registros incompletos o rechazados.
- Registros que requieren revision humana.

## Protecciones

- No se borran datos existentes.
- No se sobrescriben formulaciones aprobadas.
- No se crea facturacion.
- No se libera producto comercial.
- No se consume inventario comercial irreversible.
- No se aprueba una formulacion por resultado de laboratorio.

## Pendientes de validacion humana

- Confirmar fuentes originales, autor y fecha cuando vengan incompletos.
- Asociar documentos tecnicos reales antes de usar datos como evidencia aprobada.
- Resolver duplicados y conflictos antes de importacion definitiva.
- Revisar costos y precios con documento origen antes de usarlos en escenarios.

## Reporte inicial demo

- Productos piloto creados: 5.
- Materias primas base disponibles: al menos 30 desde incrementos previos.
- Importacion legado Shampoo Solido: preparada como previsualizacion con registros nuevos, duplicados y conflictos.
- Pruebas piloto demo: hasta 5 enlazadas a versiones de formulacion existentes.
