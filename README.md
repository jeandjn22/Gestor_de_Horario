# Gestor de Horario

**Curso:** Desarrollo de Lenguajes para Clientes Web  
**Profesor:** Ing. Victor Kneider  
**Integrantes:** Jean D'Joumblat - Andres Pereira

---

## 1. Descripción General
**Gestor de Horario** es una aplicación web de página única diseñada para que los estudiantes universitarios puedan estructurar su horario académico ideal de manera fluida y veloz. A partir de un catálogo de asignaturas institucional provisto, la aplicación calcula dinámicamente colisiones de tiempo, procesa exclusiones o fijaciones de secciones específicas, y renderiza tableros interactivos semanales utilizando layouts bidimensionales modernos.

Toda la lógica de negocio y algorítmica se ejecuta del lado del cliente en memoria de sesión, garantizando una experiencia interactiva sin necesidad de servidores, base de datos ni persistencia rígida (`localStorage`).

## 2. Decisiones de Diseño e Identidad Visual
* **Nombre de la Aplicación:** Gestor de Horario.
* **Paleta de Colores (Estilo Moderno y Minimalista de Alto Contraste):**
  * Fondo Principal (`--bg-main: #f8fafc`): Un tono gris pizarra extremadamente suave que reduce la fatiga visual.
  * Fondo de Paneles (`--panel-bg: #ffffff`): Bloques blancos puros con bordes finos (`#e2e8f0`) para segmentar los controles limpiamente y dar un aspecto de tarjetas flotantes.
  * Tono Primario (`--primary: #0f172a`): Azul noche oscuro para tipografías jerárquicas y barras principales, asegurando legibilidad extrema.
  * Acento e Interacción (`--accent: #2563eb`): Azul eléctrico vibrante para enfocar bordes, botones interactivos activos y estados seleccionados.
  * Estados de Alerta (`--error: #dc2626`): Rojo de alta visibilidad para notificar UC excedidas o incompatibilidades de materias.
* **Tipografía:** Se adoptó una pila de fuentes sans-serif nativa de sistema (`-apple-system`, `Segoe UI`, `Roboto`) para optimizar tiempos de renderizado en frío y evitar dependencias de red externas (como Google Fonts).
* **Iconografía:** Uso de caracteres unicode nativos y formas geométricas limpias para mantener el foco en la data del horario, asegurando un diseño ligero y cohesivo en todas las vistas (Catálogo, Selección, Formulario y Rejilla).

## 3. Lógica de Optimización y Métricas de Ordenamiento
Para organizar y jerarquizar los horarios generados de forma automática, el sistema calcula de manera matemática tres métricas de rendimiento por cada combinación válida, permitiendo al estudiante priorizar su comodidad:

1. **Menos días de asistencia:** Agrupa las clases asignadas por día de la semana y cuenta los días con actividad académica. Ideal para estudiantes que buscan optimizar los costos de traslado asistiendo la menor cantidad de días a la institución.
2. **Menos horas muertas:** Calcula la brecha temporal exacta (en minutos) entre el final de una clase y el inicio de la siguiente dentro de un mismo día operativo. Las ordena de menor a mayor para maximizar el uso continuo del tiempo del estudiante y evitar largas ventanas libres en la universidad.
3. **Salida más temprana:** Calcula la hora de finalización de la última clase de cada día con actividad y promedia dichos valores en la semana. Ordena las opciones priorizando esquemas donde el estudiante se libere lo antes posible de la jornada diaria.

## 4. Instrucciones para la Ejecución Local
Al ser un desarrollo construido bajo la metodología de **Vanilla JavaScript (JS Puro)**, la aplicación se ejecuta íntegramente en el navegador y no requiere compiladores ni configuraciones de servidor complejas.

1. Descargue o clone la estructura de la carpeta del proyecto `GestordeHorario`.
2. Asegúrese de mantener la jerarquía de archivos y carpetas intacta (`css/`, `data/`, `js/`).
3. Abra el archivo `index.html` directamente en cualquier navegador moderno (Chrome, Edge, Firefox, Safari) haciendo doble clic sobre él, o utilice entornos de desarrollo local como la extensión **Live Server** de Visual Studio Code (`http://127.0.0.1:5500`).

## 5. Decisiones Arquitectónicas y División del Trabajo
La coordinación general de la arquitectura de la aplicación (definición de variables globales compartidas, orden de carga de scripts en el HTML e implementación del tiempo basado en minutos enteros desde la medianoche para agilizar cálculos) fue planificada y diseñada en conjunto por ambos integrantes.

Las responsabilidades de codificación incremental se dividieron equitativamente de la siguiente manera:

* **Integrante 1 — Núcleo Matemático y Algorítmico:**
  * Implementación de transformaciones horarias en minutos totales (`tiempo.js`).
  * Desarrollo del algoritmo recursivo con poda inmediata y descarte temprano (`generador.js`).
  * Procesamiento matemático de brechas horarias y cálculo de métricas analíticas (`preferencias.js`).
* **Integrante 2 — Maquetación, DOM y UI Dinámica:**
  * Diseño semántico de los contenedores de control (`index.html` y `styles.css`).
  * Renderizado interactivo del catálogo, barras de búsqueda e inyección de datos con horas legibles (`catalogo.js`).
  * Estructuración del grid bidimensional de filas de tiempo asimétricas, modal manual y hoja de estilos de impresión (`rejilla.js`, `seleccion.js`, `formulario.js`, `resumen.js` y `print.css`).
