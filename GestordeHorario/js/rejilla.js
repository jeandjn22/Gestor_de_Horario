// Variables para el control de la paginación de combinaciones
let combinacionesLocales = [];
let indiceActualCombo = 0;

// Configuración de la escala de la rejilla (7:00 AM a 6:15 PM)
const HORA_MIN_GRID = "07:00";
const RESOLUCION_MINUTOS = 15;

/**
 * Inicializa los controladores de navegación (Anterior / Siguiente) de las rejillas.
 */
function inicializarEventosRejilla() {
    const btnPrev = document.getElementById('btn-prev-schedule');
    const btnNext = document.getElementById('btn-next-schedule');
    const btnSave = document.getElementById('btn-save-definitive');

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (indiceActualCombo > 0) {
                indiceActualCombo--;
                mostrarCombinacionEnRejilla();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (indiceActualCombo < combinacionesLocales.length - 1) {
                indiceActualCombo++;
                mostrarCombinacionEnRejilla();
            }
        });
    }

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            if (combinacionesLocales[indiceActualCombo]) {
                // Esta función existirá en js/resumen.js
                establecerHorarioDefinitivo(combinacionesLocales[indiceActualCombo]);
            }
        });
    }
}

/**
 * Invoca el cálculo de combinación y refresca el estado de la rejilla.
 * Se llama desde el botón principal "Generar Horarios".
 */
function recibirNuevasCombinaciones(nuevasCombinaciones) {
    combinacionesLocales = nuevasCombinaciones;
    indiceActualCombo = 0;

    const wrapper = document.getElementById('schedule-grid-wrapper');
    const emptyState = document.getElementById('schedule-empty-state');
    const nav = document.getElementById('schedule-navigation');

    if (combinacionesLocales.length === 0) {
        wrapper.classList.add('hidden');
        nav.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `<p class="empty-state" style="color:var(--error);">⚠️ No existe ninguna combinación válida para la selección actual o los filtros aplicados.</p>`;
        return;
    }

    emptyState.classList.add('hidden');
    wrapper.classList.remove('hidden');
    nav.classList.remove('hidden');

    mostrarCombinacionEnRejilla();
}

/**
 * Invalida los resultados visuales si el usuario cambia la selección de materias.
 */
function invalidarResultadosHorarios() {
    combinacionesLocales = [];
    indiceActualCombo = 0;
    document.getElementById('schedule-grid-wrapper')?.classList.add('hidden');
    document.getElementById('schedule-navigation')?.classList.add('hidden');
    document.getElementById('preferences-panel')?.classList.add('hidden');
    document.getElementById('schedule-empty-state')?.classList.remove('hidden');
}

/**
 * Calcula la fila de inicio y fin en el CSS Grid según la hora institucional.
 * @param {string} horaStr - Ejemplo: "08:30"
 * @returns {number} Número de fila para el Grid
 */
function calcularFilaGrid(horaStr) {
    const minutosInicioBase = horaAMinutos(HORA_MIN_GRID);
    const minutosHoraActual = horaAMinutos(horaStr);
    
    // Sumamos 2 porque la fila 1 está ocupada por los títulos de los días (LUN, MAR...)
    return Math.floor((minutosHoraActual - minutosInicioBase) / RESOLUCION_MINUTOS) + 2;
}

/**
 * Mapea el identificador de texto del día a la columna correspondiente del CSS Grid.
 */
function obtenerColumnaDiaGrid(dia) {
    const columnas = { LUN: 2, MAR: 3, MIE: 4, JUE: 5, VIE: 6, SAB: 7 };
    return columnas[dia] || 2;
}

/**
 * Asigna un color hexadecimal persistente a cada materia basado en su código.
 */
function obtenerColorMateria(codigo) {
    let hash = 0;
    for (let i = 0; i < codigo.length; i++) {
        hash = codigo.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generar color tipo pastel para asegurar legibilidad del texto negro
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const colorPlano = "00000".substring(0, 6 - c.length) + c;
    
    // Modificar brillo para hacerlo pastel
    const r = parseInt(colorPlano.substring(0,2), 16) % 100 + 140;
    const g = parseInt(colorPlano.substring(2,4), 16) % 100 + 140;
    const b = parseInt(colorPlano.substring(4,6), 16) % 100 + 140;
    
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Renderiza la combinación actual en el tablero tridimensional e inyecta métricas.
 */
function mostrarCombinacionEnRejilla() {
    const comboActual = combinacionesLocales[indiceActualCombo];
    if (!comboActual) return;

    // 1. Actualizar Navegador superior
    document.getElementById('schedule-counter').textContent = `Opción ${indiceActualCombo + 1} de ${combinacionesLocales.length}`;

    // 2. Calcular y Pintar Métricas (Módulo 4.8)
    if (typeof calcularMetricasCombinacion === 'function') {
        const metricas = calcularMetricasCombinacion(comboActual);
        document.getElementById('metric-dias').textContent = `Días: ${metricas.diasAsistencia}`;
        document.getElementById('metric-muertas').textContent = `Horas Muertas: ${metricas.horasMuertas.toFixed(1)}h`;
        document.getElementById('metric-rango').textContent = `Rango: ${metricas.txtEntradaMasTemprana} a ${metricas.txtSalidaMasTardia}`;
    }

    // 3. Limpiar elementos previos insertados en la rejilla (excepto cabeceras estáticas)
    const grid = document.querySelector('.weekly-grid');
    if (!grid) return;

    // Remover bloques de horas previos y tarjetas de clases previas
    document.querySelectorAll('.grid-time-row, .grid-session-card').forEach(el => el.remove());

    // 4. Inyectar las etiquetas de horas en la primera columna lateral
    const minutosInicioBase = horaAMinutos(HORA_MIN_GRID);
    const totalFilas = 45; // De 7:00 a 18:15 en lapsos de 15 min

    for (let f = 0; f < totalFilas; f += 2) { // Pintamos cada 30 minutos para no saturar la vista
        const minutosActuales = minutosInicioBase + (f * RESOLUCION_MINUTOS);
        const horaTexto = minutosAHoraStr(minutosActuales);
        
        const labelHora = document.createElement('div');
        labelHora.className = "grid-time-row text-muted";
        labelHora.style.gridRowStart = f + 2;
        labelHora.style.gridColumnStart = 1;
        labelHora.textContent = horaTexto;
        grid.appendChild(labelHora);
    }

    // 5. Inyectar Sesiones de Clases de la Combinación
    comboActual.forEach(asignacion => {
        const colorFondo = obtenerColorMateria(asignacion.codigoMateria);

        asignacion.seccionInfo.horario.forEach(sesion => {
            const bloquesInfo = sesion.bloques.map(id => BLOQUES.find(b => b.id === id)).filter(Boolean);
            if (bloquesInfo.length === 0) return;

            // Extraer tiempos límites reales del bloque
            const horaInicio = bloquesInfo.reduce((min, b) => horaAMinutos(b.inicio) < horaAMinutos(min) ? b.inicio : min, bloquesInfo[0].inicio);
            const horaFin = bloquesInfo.reduce((max, b) => horaAMinutos(b.fin) > horaAMinutos(max) ? b.fin : max, bloquesInfo[0].fin);

            const rowStart = calcularFilaGrid(horaInicio);
            const rowEnd = calcularFilaGrid(horaFin);
            const col = obtenerColumnaDiaGrid(sesion.dia);

            // Crear tarjeta contenedora de la clase (CSS Grid Item)
            const tarjetaClase = document.createElement('div');
            tarjetaClase.className = "grid-session-card animate-fade-in";
            tarjetaClase.style.gridRow = `${rowStart} / ${rowEnd}`;
            tarjetaClase.style.gridColumn = `${col}`;
            tarjetaClase.style.backgroundColor = colorFondo;

            tarjetaClase.innerHTML = `
                <div class="session-card-content">
                    <span class="session-card-code">${asignacion.codigoMateria}</span>
                    <span class="session-card-sec">Sec ${asignacion.seccionInfo.id}</span>
                    <div class="session-card-aula">📍 ${sesion.aula}</div>
                </div>
            `;

            // Evento interactivo: Mostrar detalle completo expandido al hacer clic (Requerimiento 4.8)
            tarjetaClase.addEventListener('click', () => {
                alert(` Materia: ${asignacion.nombreMateria} (${asignacion.codigoMateria})\n Seccion: ${asignacion.seccionInfo.id}\n Docente: ${asignacion.seccionInfo.profesor}\n Horario: ${sesion.dia} de ${horaInicio} a ${horaFin}\n Ubicación: Aula ${sesion.aula}`);
            });

            grid.appendChild(tarjetaClase);
        });
    });
}
