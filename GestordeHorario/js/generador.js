/**
 * Genera todas las combinaciones válidas de horarios usando backtracking con descarte temprano.
 * @param {Array<Object>} materiasSeleccionadas - Lista de materias elegidas con su estado actual (fijadas/excluidas)
 * @returns {Array<Array<Object>>} Lista de combinaciones válidas encontradas
 */
function generarCombinacionesHorarios(materiasSeleccionadas) {
    const combinacionesValidadas = [];
    
    // Si el usuario no ha seleccionado ninguna materia, retornamos un arreglo vacío
    if (materiasSeleccionadas.length === 0) return combinacionesValidadas;

    // 1. Filtrar las secciones de cada materia según las preferencias de "Fijar" y "Excluir"
    const materiasProcesadas = materiasSeleccionadas.map(sel => {
        const materiaOriginal = buscarMateriaPorCodigo(sel.codigo);
        if (!materiaOriginal) return null;

        let seccionesFiltradas = materiaOriginal.secciones;
        
        // Si el usuario fijó una sección, solo consideramos esa sección
        if (sel.seccionFijada) {
            seccionesFiltradas = materiaOriginal.secciones.filter(s => s.id === sel.seccionFijada);
        } 
        // Si no está fijada, pero hay exclusiones, removemos las secciones correspondientes
        else if (sel.seccionesExcluidas && sel.seccionesExcluidas.length > 0) {
            seccionesFiltradas = materiaOriginal.secciones.filter(s => !sel.seccionesExcluidas.includes(s.id));
        }
        
        return {
            codigo: materiaOriginal.codigo,
            nombre: materiaOriginal.nombre,
            seccionesDisponibles: seccionesFiltradas
        };
    }).filter(Boolean); // Limpiar posibles nulos por si alguna materia no se encontró

    // 2. Función recursiva del algoritmo de Backtracking
    function buscarCombinaciones(indiceMateria, combinacionParcial) {
        // Condición de parada exitosa: logramos asignar una sección válida a cada materia de la lista
        if (indiceMateria === materiasProcesadas.length) {
            // Guardamos una copia exacta (clon profundo) de la combinación parcial completada
            combinacionesValidadas.push([...combinacionParcial]);
            return;
        }
        
        const materiaActual = materiasProcesadas[indiceMateria];
        
        // Iterar de forma secuencial por cada una de las secciones que quedan disponibles para esta materia
        for (const seccion of materiaActual.seccionesDisponibles) {
            let tieneChoque = false;
            
            // DESCARTE TEMPRANO: Verificar si esta sección colisiona con las secciones ya aceptadas en la ruta parcial
            for (const seccionAceptada of combinacionParcial) {
                if (chocanSecciones(seccion, seccionAceptada.seccionInfo)) {
                    tieneChoque = true;
                    break; // Poda inmediata de la rama recursiva (Descarte Temprano)
                }
            }
            
            // Si la sección no genera colisiones con el horario parcial construido, avanzamos
            if (!tieneChoque) {
                // Registrar la sección en la ruta parcial
                combinacionParcial.push({
                    codigoMateria: materiaActual.codigo,
                    nombreMateria: materiaActual.nombre,
                    seccionInfo: seccion
                });
                
                // Llamada recursiva profunda para intentar encajar una sección en la siguiente materia
                buscarCombinaciones(indiceMateria + 1, combinacionParcial);
                
                // DESHACER EL CAMBIO (Backtrack): Removemos el último elemento para probar con la siguiente sección
                combinacionParcial.pop();
            }
        }
    }

    // Iniciar la recursión partiendo desde la primera materia de la lista (índice 0) con un esquema limpio
    buscarCombinaciones(0, []);
    return combinacionesValidadas;
}
