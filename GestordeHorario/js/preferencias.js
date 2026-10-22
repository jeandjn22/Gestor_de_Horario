/**
 * Filtra las combinaciones generadas según las preferencias seleccionadas por el usuario.
 * @param {Array} combinaciones - Arreglo de combinaciones válidas producidas por el generador
 * @param {Object} filtros - Estructura con filtros: { diasLibres: ['SAB'], horaMinEntrada: "08:00", horaMaxSalida: "16:00" }
 * @returns {Array} Combinaciones que cumplen de forma simultánea con todos los criterios
 */
function filtrarCombinaciones(combinaciones, filtros) {
    return combinaciones.filter(combo => {
        for (const asignacion of combo) {
            for (const sesion of asignacion.seccionInfo.horario) {
                // 1. Filtro Obligatorio de Días Libres
                if (filtros.diasLibres && filtros.diasLibres.includes(sesion.dia)) {
                    return false; 
                }

                // Extraer la información de los bloques correspondientes para validar horas reales
                const bloquesInfo = sesion.bloques.map(id => BLOQUES.find(b => b.id === id)).filter(Boolean);
                if (bloquesInfo.length === 0) continue;

                // Calcular el rango real de la clase en minutos desde la medianoche
                const inicioSesionMin = Math.min(...bloquesInfo.map(b => horaAMinutos(b.inicio)));
                const finSesionMin = Math.max(...bloquesInfo.map(b => horaAMinutos(b.fin)));

                // 2. Filtro de Hora Mínima de Entrada
                if (filtros.horaMinEntrada) {
                    const minEntradaPermitida = horaAMinutos(filtros.horaMinEntrada);
                    if (inicioSesionMin < minEntradaPermitida) return false;
                }

                // 3. Filtro de Hora Máxima de Salida
                if (filtros.horaMaxSalida) {
                    const maxSalidaPermitida = horaAMinutos(filtros.horaMaxSalida);
                    if (finSesionMin > maxSalidaPermitida) return false;
                }
            }
        }
        return true;
    });
}

/**
 * Calcula las métricas de rendimiento y conveniencia para una combinación específica.
 * @param {Array} combinacion - Una combinación de secciones elegidas
 * @returns {Object} Métricas calculadas (Días, Horas Muertas, Rangos)
 */
function calcularMetricasCombinacion(combinacion) {
    // Agrupar todas las clases asignadas según el día de la semana
    const mapaDias = { LUN: [], MAR: [], MIE: [], JUE: [], VIE: [], SAB: [] };
    
    combinacion.forEach(asignacion => {
        asignacion.seccionInfo.horario.forEach(sesion => {
            const bloquesInfo = sesion.bloques.map(id => BLOQUES.find(b => b.id === id)).filter(Boolean);
            if (bloquesInfo.length > 0) {
                const inicio = Math.min(...bloquesInfo.map(b => horaAMinutos(b.inicio)));
                const fin = Math.max(...bloquesInfo.map(b => horaAMinutos(b.fin)));
                mapaDias[sesion.dia].push({ inicio, fin });
            }
        });
    });

    let totalDiasAsistencia = 0;
    let totalHorasMuertasMinutos = 0;
    let sumaHorasSalidaMinutos = 0;
    let menorEntradaGlobal = Infinity;
    let mayorSalidaGlobal = -Infinity;

    Object.keys(mapaDias).forEach(dia => {
        const clasesDelDia = mapaDias[dia];
        if (clasesDelDia.length === 0) return;

        totalDiasAsistencia++;
        
        // Ordenar las clases del mismo día de forma secuencial por hora de inicio
        clasesDelDia.sort((a, b) => a.inicio - b.inicio);

        // Capturar los extremos globales de entrada y salida para pintar en las tarjetas
        if (clasesDelDia[0].inicio < menorEntradaGlobal) menorEntradaGlobal = clasesDelDia[0].inicio;
        
        const ultimaClaseDelDia = clasesDelDia[clasesDelDia.length - 1];
        if (ultimaClaseDelDia.fin > mayorSalidaGlobal) mayorSalidaGlobal = ultimaClaseDelDia.fin;

        // Acumular la hora de salida de este día para poder promediar al final
        sumaHorasSalidaMinutos += ultimaClaseDelDia.fin;

        // Calcular Horas Muertas: suma del tiempo libre entre clases consecutivas del mismo día
        for (let i = 0; i < clasesDelDia.length - 1; i++) {
            const finClaseActual = clasesDelDia[i].fin;
            const inicioClaseSiguiente = clasesDelDia[i + 1].inicio;
            if (inicioClaseSiguiente > finClaseActual) {
                totalHorasMuertasMinutos += (inicioClaseSiguiente - finClaseActual);
            }
        }
    });

    return {
        diasAsistencia: totalDiasAsistencia,
        horasMuertas: totalHorasMuertasMinutos / 60, // Convertido a horas flotantes para ordenamientos directos
        promedioSalidaMinutos: totalDiasAsistencia > 0 ? (sumaHorasSalidaMinutos / totalDiasAsistencia) : 0,
        // Cadenas de texto formateadas listas para inyectar en la rejilla:
        txtEntradaMasTemprana: menorEntradaGlobal !== Infinity ? minutosAHoraStr(menorEntradaGlobal) : "--:--",
        txtSalidaMasTardia: mayorSalidaGlobal !== -Infinity ? minutosAHoraStr(mayorSalidaGlobal) : "--:--"
    };
}

/**
 * Ordena un conjunto de resultados estructurados basándose en el criterio elegido.
 * @param {Array} resultados - Estructuras con { combinacion, metricas }
 * @param {string} criterio - Opción elegida: "DIAS", "HORAS_MUERTAS" o "SALIDA_TEMPRANA"
 * @returns {Array} Resultados ordenados
 */
function ordenarResultados(resultados, criterio) {
    return resultados.sort((a, b) => {
        if (criterio === "DIAS") {
            // Criterio: Menos días de asistencia primero
            return a.metricas.diasAsistencia - b.metricas.diasAsistencia;
        }
        if (criterio === "HORAS_MUERTAS") {
            // Criterio: Menos brechas de ventanas libres primero
            return a.metricas.horasMuertas - b.metricas.horasMuertas;
        }
        if (criterio === "SALIDA_TEMPRANA") {
            // Criterio: Menor promedio acumulado de hora de salida primero
            return a.metricas.promedioSalidaMinutos - b.metricas.promedioSalidaMinutos;
        }
        return 0;
    });
}
