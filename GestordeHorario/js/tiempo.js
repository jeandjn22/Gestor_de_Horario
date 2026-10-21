/**
 * Convierte una cadena en formato "HH:MM" a minutos totales transcurridos desde la medianoche.
 * @param {string} horaStr - Ejemplo: "07:30" o "18:15"
 * @returns {number} Minutos totales como número entero
 */
function horaAMinutos(horaStr) {
    if (!horaStr || typeof horaStr !== 'string') return 0;
    const [horas, minutos] = horaStr.split(':').map(Number);
    return (horas * 60) + minutos;
}

/**
 * Determina si dos intervalos de tiempo se superponen en el espacio horario.
 * Sigue la regla de intervalos semiabiertos [inicio, fin). 
 * Si una sesión termina exactamente a la hora en que comienza otra, NO constituye un choque.
 * @param {string} ini1 - Inicio primer intervalo
 * @param {string} fin1 - Fin primer intervalo
 * @param {string} ini2 - Inicio segundo intervalo
 * @param {string} fin2 - Fin segundo intervalo
 * @returns {boolean} True si hay superposición, False en caso contrario
 */
function haySuperposicion(ini1, fin1, ini2, fin2) {
    const start1 = horaAMinutos(ini1);
    const end1 = horaAMinutos(fin1);
    const start2 = horaAMinutos(ini2);
    const end2 = horaAMinutos(fin2);
    
    // Condición matemática de colisión de intervalos semiabiertos
    return start1 < end2 && start2 < end1;
}

/**
 * Verifica si una lista de IDs de bloques es consecutiva y pertenece al mismo tipo.
 * Requerido de forma estricta para la validación del formulario de materias manuales.
 * @param {Array<string>} bloqueIds - Arreglo de IDs elegidos (ej: ["B01", "B02"])
 * @returns {boolean} True si cumplen con las reglas institucionales del dataset
 */
function sonBloquesConsecutivosYDelMismoTipo(bloqueIds) {
    if (!bloqueIds || bloqueIds.length === 0) return false;
    
    // 1. Obtener la información real de los bloques desde la constante global provista
    const bloquesInfo = bloqueIds.map(id => BLOQUES.find(b => b.id === id)).filter(Boolean);
    
    // Si la cantidad no coincide, significa que se introdujo un ID de bloque inválido
    if (bloquesInfo.length !== bloqueIds.length) return false; 
    
    // 2. Validar que todos los bloques seleccionados pertenezcan exactamente al mismo tipo
    const tipoBase = bloquesInfo[0].tipo;
    const mismoTipo = bloquesInfo.every(b => b.tipo === tipoBase);
    if (!mismoTipo) return false;
    
    // 3. Ordenar secuencialmente por su hora de inicio para poder verificar consecutividad
    bloquesInfo.sort((a, b) => horaAMinutos(a.inicio) - horaAMinutos(b.inicio));
    
    // 4. Validar que el fin de un bloque calce exactamente con el inicio del bloque siguiente
    for (let i = 0; i < bloquesInfo.length - 1; i++) {
        if (bloquesInfo[i].fin !== bloquesInfo[i + 1].inicio) {
            return false; // Existe un salto o un vacío de tiempo entre bloques
        }
    }
    
    return true;
}

/**
 * Transforma una cantidad acumulada de minutos a una cadena legible "HH:MM".
 * Útil para reconstruir rangos horarios calculados por métricas en la interfaz.
 * @param {number} minutosTotales - Ejemplo: 510
 * @returns {string} Ejemplo: "08:30"
 */
function minutosAHoraStr(minutosTotales) {
    const hrs = Math.floor(minutosTotales / 60);
    const mins = minutosTotales % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
