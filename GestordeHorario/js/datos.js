/**
 * Estado global de la aplicación en memoria.
 * Almacena las materias manuales creadas en la sesión y la selección actual del usuario.
 */
const EstadoApp = {
    materiasManuales: [],
    materiasSeleccionadas: [], // Objetos con estructura: { codigo, nombre, seccionFijada: null, seccionesExcluidas: [] }
    topeUC: 28 // Valor por defecto según requerimiento 4.2
};

/**
 * Retorna la lista completa de materias unificando el catálogo provisto y las manuales.
 * @returns {Array<Object>} Lista de todas las materias disponibles
 */
function obtenerTodasLasMaterias() {
    // Marcamos visualmente si son del catálogo o manuales mediante una propiedad booleana
    const catalogoMarcado = MATERIAS.map(m => ({ ...m, esManual: false }));
    const manualesMarcadas = EstadoApp.materiasManuales.map(m => ({ ...m, esManual: true }));
    
    return [...catalogoMarcado, ...manualesMarcadas];
}

/**
 * Busca una materia por su código único en todo el universo de materias disponibles.
 * @param {string} codigo - Código de la materia (ej. "MAT-101")
 * @returns {Object|null} Objeto de la materia o null si no existe
 */
function buscarMateriaPorCodigo(codigo) {
    const todas = obtenerTodasLasMaterias();
    return todas.find(m => m.codigo === codigo) || null;
}

/**
 * Agrega una nueva materia manual al estado en memoria.
 * @param {Object} nuevaMateria - Objeto estructurado de materia manual con sus secciones y sesiones
 * @returns {boolean} True si se agregó con éxito, False si el código ya existe
 */
function agregarMateriaManual(nuevaMateria) {
    // Validar unicidad de código respecto a todo el catálogo unificado
    if (buscarMateriaPorCodigo(nuevaMateria.codigo)) {
        return false; 
    }
    
    EstadoApp.materiasManuales.push(nuevaMateria);
    return true;
}

/**
 * Elimina una materia manual del estado en memoria y la remueve de la selección si estaba elegida.
 * @param {string} codigo - Código de la materia manual a eliminar
 */
function eliminarMateriaManual(codigo) {
    // Remover de la lista de materias manuales
    EstadoApp.materiasManuales = EstadoApp.materiasManuales.filter(m => m.codigo !== codigo);
    // Remover de la selección actual por si el usuario la tenía agregada
    EstadoApp.materiasSeleccionadas = EstadoApp.materiasSeleccionadas.filter(m => m.codigo !== codigo);
}

/**
 * Actualiza una materia manual existente en memoria.
 * @param {string} codigoOriginal - Código antes de la edición
 * @param {Object} materiaActualizada - Nuevo objeto de la materia
 * @returns {boolean} True si se editó correctamente
 */
function actualizarMateriaManual(codigoOriginal, materiaActualizada) {
    // Si cambió el código, verificar que el nuevo código no choque con otra materia existente
    if (codigoOriginal !== materiaActualizada.codigo && buscarMateriaPorCodigo(materiaActualizada.codigo)) {
        return false;
    }
    
    const indice = EstadoApp.materiasManuales.findIndex(m => m.codigo === codigoOriginal);
    if (indice !== -1) {
        EstadoApp.materiasManuales[indice] = materiaActualizada;
        
        // Actualizar la referencia en la selección si estaba seleccionada
        const indiceSeleccion = EstadoApp.materiasSeleccionadas.findIndex(m => m.codigo === codigoOriginal);
        if (indiceSeleccion !== -1) {
            EstadoApp.materiasSeleccionadas[indiceSeleccion].codigo = materiaActualizada.codigo;
        }
        return true;
    }
    return false;
}
