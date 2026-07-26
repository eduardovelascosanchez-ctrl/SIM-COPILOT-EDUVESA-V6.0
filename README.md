# SimCopilot EDUVESA · Fase 5

Aplicación web estática y modular para simulación clínica educativa PALS y NRP.

Incluye una biblioteca ampliada de **27 escenarios: 16 PALS y 11 NRP**.

El panel privado del instructor permite modificar de forma independiente FC, SpO₂, presión sistólica, presión diastólica, FR y ETCO₂.

## Publicar en GitHub Pages

1. Descomprime el ZIP.
2. Sube **el contenido de la carpeta** a la raíz de tu repositorio.
3. En GitHub abre **Settings → Pages**.
4. Elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
5. Guarda. La publicación suele estar disponible en unos minutos.

No requiere compilación, Node.js, base de datos ni claves externas.

## Acceso de instructor

El PIN inicial es `2026`. Se guarda únicamente en el navegador del dispositivo.

## Estructura

- `index.html`: interfaz principal.
- `css/styles.css`: diseño adaptable.
- `data/scenarios.js`: biblioteca editable de escenarios.
- `js/`: lógica modular del simulador.
- `manifest.webmanifest` y `sw.js`: instalación y uso sin conexión.
- `assets/icons/`: iconos de la aplicación.

## Uso responsable

Herramienta educativa para simulación clínica. No sustituye el juicio clínico, los algoritmos y manuales vigentes ni la evaluación realizada por instructores autorizados. No es una aplicación oficial de AHA, AAP u otras organizaciones.
