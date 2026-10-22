/**
 * Evento raíz que arranca la aplicación una vez que todo el árbol DOM
 * ha sido completamente cargado e interpretado por el navegador.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Gestor de Horario iniciado de forma exitosa.");

    // 1. Inicializar los escuchadores de eventos interactivos en todos los módulos
    if (typeof inicializarEventosCatalogo === 'function') {
        inicializarEventosCatalogo();
    }
    
    if (typeof inicializarEventosSeleccion === 'function') {
        inicializarEventosSeleccion();
    }
    
    if (typeof inicializarEventosFormulario === 'function') {
        inicializarEventosFormulario();
    }
    
    if (typeof inicializarEventosRejilla === 'function') {
        inicializarEventosRejilla();
    }

    // 2. Vincular el botón principal de "Generar Horarios" del panel central
    const btnGenerate = document.getElementById('btn-generate');
    if (btnGenerate) {
        btnGenerate.addEventListener('click', () => {
            // Ejecutar el motor de backtracking con descarte temprano (js/generador.js)
            if (typeof generarCombinacionesHorarios === 'function') {
                const todasLasCombinaciones = generarCombinacionesHorarios(EstadoApp.materiasSeleccionadas);
                
                // Aplicar filtros de entrada, salida y días libres activos (js/preferencias.js)
                let combinacionesFiltradas = todasLasCombinaciones;
                if (typeof filtrarCombinaciones === 'function') {
                    const filtrosActivos = obtenerFiltrosUI();
                    combinacionesFiltradas = filtrarCombinaciones(todasLasCombinaciones, filtrosActivos);
                }

                // Generar los metadatos completos (horas muertas, asistencia) para poder ordenar
                let resultadosListos = combinacionesFiltradas.map(combo => {
                    const metricas = typeof calcularMetricasCombinacion === 'function' 
                        ? calcularMetricasCombinacion(combo) 
                        : {};
                    return { combinacion: combo, metricas: metricas };
                });

                // Aplicar el ordenamiento selectivo actual
                const criterioOrdenamiento = document.getElementById('sort-select')?.value || "DIAS";
                if (typeof ordenarResultados === 'function') {
                    resultadosListos = ordenarResultados(resultadosListos, criterioOrdenamiento);
                }

                // Mostrar el panel de ordenamiento y preferencias sólo si había resultados iniciales
                const preferencesPanel = document.getElementById('preferences-panel');
                if (todasLasCombinaciones.length > 0 && preferencesPanel) {
                    preferencesPanel.classList.remove('hidden');
                }

                // Descomprimir el formato de ordenamiento para mandárselo limpio a la rejilla semanal
                const esquemasFinales = resultadosListos.map(r => r.combinacion);
                
                // Renderizar gráficamente en el CSS Grid (js/rejilla.js)
                if (typeof recibirNuevasCombinaciones === 'function') {
                    recibirNuevasCombinaciones(esquemasFinales);
                }
            }
        });
    }

    // 3. Vincular los eventos de cambio en filtros post-generación para recalcular al instante
    vincularEventosPostGeneracion();

    // 4. Renderizar por primera vez el catálogo para pintar las materias en la pantalla
    if (typeof renderizarCatalogo === 'function') {
        renderizarCatalogo();
    }
    
    // 5. Renderizar el estado inicial vacío de la selección de asignaturas
    if (typeof renderizarSeleccion === 'function') {
        renderizarSeleccion();
    }
});

/**
 * Captura el estado en tiempo real de los campos del panel de preferencias.
 * @returns {Object} Filtros estructurados
 */
function obtenerFiltrosUI() {
    const checkboxesDias = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
    const diasLibresElegidos = Array.from(checkboxesDias).map(chk => chk.value);
    
    const horaEntrada = document.getElementById('filter-hora-entrada')?.value || null;
    const horaSalida = document.getElementById('filter-hora-salida')?.value || null;

    return {
        diasLibres: diasLibresElegidos.length > 0 ? diasLibresElegidos : null,
        horaMinEntrada: horaEntrada || null,
        horaMaxSalida: horaSalida || null
    };
}

/**
 * Escucha cambios en las preferencias de filtrado u ordenamiento para refrescar la rejilla sin forzar al usuario a presionar "Generar Horarios" de nuevo.
 */
function vincularEventosPostGeneracion() {
    const preferencesPanel = document.getElementById('preferences-panel');
    if (!preferencesPanel) return;

    // Escuchar cambios en los checkboxes de días libres, entrada o salida
    preferencesPanel.addEventListener('change', () => {
        const btnGenerate = document.getElementById('btn-generate');
        if (btnGenerate && !btnGenerate.disabled) {
            // Disparar programáticamente el click para actualizar el listado completo con los nuevos filtros
            btnGenerate.click();
        }
    });
}
