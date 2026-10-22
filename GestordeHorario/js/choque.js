/**
 * Verifica si dos secciones chocan entre sí.
 * Dos sesiones chocan cuando ocurren el mismo día y sus intervalos se superponen.
 * Una sesión que termina exactamente cuando otra comienza NO constituye un choque.
 * @param {Object} seccionA 
 * @param {Object} seccionB 
 * @returns {boolean} True si chocan, False si son compatibles
 */
function chocanSecciones(seccionA, seccionB) {
    for (const sesionA of seccionA.horario) {
        for (const sesionB of seccionB.horario) {
            // Solo pueden chocar si ocurren el mismo día de la semana
            if (sesionA.dia === sesionB.dia) {
                // Mapear los arreglos de IDs de bloques a objetos reales del catálogo institucional
                const bloquesA = sesionA.bloques.map(id => BLOQUES.find(b => b.id === id)).filter(Boolean);
                const bloquesB = sesionB.bloques.map(id => BLOQUES.find(b => b.id === id)).filter(Boolean);
                
                if (bloquesA.length === 0 || bloquesB.length === 0) continue;
                
                // Extraer el minuto de inicio absoluto del primer bloque y el minuto de fin del último
                const inicioA = bloquesA.reduce((min, b) => horaAMinutos(b.inicio) < horaAMinutos(min) ? b.inicio : min, bloquesA[0].inicio);
                const finA = bloquesA.reduce((max, b) => horaAMinutos(b.fin) > horaAMinutos(max) ? b.fin : max, bloquesA[0].fin);
                
                const inicioB = bloquesB.reduce((min, b) => horaAMinutos(b.inicio) < horaAMinutos(min) ? b.inicio : min, bloquesB[0].inicio);
                const finB = bloquesB.reduce((max, b) => horaAMinutos(b.fin) > horaAMinutos(max) ? b.fin : max, bloquesB[0].fin);
                
                // Invocar la lógica matemática de intervalos semiabiertos de js/tiempo.js
                if (haySuperposicion(inicioA, finA, inicioB, finB)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Identifica las materias incompatibles dentro de la selección actual.
 * Detecta pares de materias en los que TODAS las secciones disponibles de una
 * chocan con TODAS las secciones disponibles de la otra.
 * @param {Array<Object>} materiasProcesadas - Lista de materias elegidas con sus secciones ya filtradas (fijadas/excluidas)
 * @returns {Array<Object>} Arreglo con los objetos de pares incompatibles { matA, matB }
 */
function detectarMateriasIncompatibles(materiasProcesadas) {
    const incompatibilidades = [];
    
    // Comparación cruzada por parejas (algoritmo burbuja de indexación)
    for (let i = 0; i < materiasProcesadas.length; i++) {
        for (let j = i + 1; j < materiasProcesadas.length; j++) {
            const matA = materiasProcesadas[i];
            const matB = materiasProcesadas[j];
            
            let algunaCombinacionValida = false;
            
            // Verificar si existe al menos un par de secciones que sea compatible
            for (const secA of matA.seccionesDisponibles) {
                for (const secB of matB.seccionesDisponibles) {
                    if (!chocanSecciones(secA, secB)) {
                        algunaCombinacionValida = true;
                        break;
                    }
                }
                if (algunaCombinacionValida) break;
            }
            
            // Si recorrimos todas las secciones y ninguna es compatible, son 100% incompatibles
            if (!algunaCombinacionValida) {
                incompatibilidades.push({ matA: matA.codigo, matB: matB.codigo });
            }
        }
    }
    return incompatibilidades;
}
