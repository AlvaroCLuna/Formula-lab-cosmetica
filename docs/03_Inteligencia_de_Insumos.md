# Módulo Inteligencia de Insumos

## Objetivo
Convertir documentos técnicos y comerciales en fichas estructuradas, trazables y revisables con mínima captura manual.

## Entrada
Carga individual o múltiple por drag & drop:
- PDF, DOCX, XLSX, CSV y TXT.
- Imágenes escaneadas.
- TDS, SDS, COA, fichas comerciales y listas de precios.

## Flujo
1. Recibir archivos.
2. Identificar tipo documental.
3. Extraer texto y tablas.
4. Detectar insumo, fabricante y proveedor.
5. Relacionar con un registro existente o proponer uno nuevo.
6. Mapear valores a campos.
7. Mostrar fuente y confianza.
8. Detectar conflictos y advertencias.
9. Revisar únicamente excepciones.
10. Aprobar y publicar.

## Campos mínimos
Código, nombre comercial, nombre común, INCI, CAS, EC, fabricante, proveedor, país, categoría, función, apariencia, color, olor, forma física, solubilidad, densidad, pH, uso recomendado, temperatura de incorporación, temperatura máxima, compatibilidades, incompatibilidades, precauciones, contraindicaciones, alérgenos, almacenamiento, vida útil, fuente, ubicación de origen, confianza y estado.

## Estados
Pendiente, procesando, extraído, requiere revisión, en conflicto, validado, rechazado y obsoleto.

## Regla de seguridad
La extracción automática nunca publica silenciosamente datos técnicos como definitivos. Debe existir revisión o una política explícita de aprobación.
