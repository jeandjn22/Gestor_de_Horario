/**
 * Inicializa los eventos del panel del catálogo (Búsqueda y Filtros).
 * Se debe llamar cuando el DOM esté completamente cargado.
 */
function inicializarEventosCatalogo() {
    const searchInput = document.getElementById('search-input');
    const trimestreFilter = document.getElementById('trimestre-filter');

    if (searchInput) {
        searchInput.addEventListener('input', renderizarCatalogo);
    }
    if (trimestreFilter) {
        trimestreFilter.addEventListener('change', renderizarCatalogo);
    }
}

/**
 * Traduce una lista de IDs de bloques a una cadena legible de rango de tiempo "HH:MM a HH:MM".
 * @param {Array<string>} bloqueIds - Ejemplo: ["B01", "B02"]
 * @returns {string} Ejemplo: "07:00 a 08:30"
 */
function obtenerHorarioLegible(bloqueIds) {
    if (!bloqueIds || bloqueIds.length === 0) return "Sin horario";
    
    // Buscar la información de cada bloque en la constante global BLOQUES
    const bloquesInfo = bloqueIds.map(id => BLOQUES.find(b => b.id === id)).filter(Boolean);
    if (bloquesInfo.length === 0) return "Horario inválido";
    
    // Ordenar los bloques por hora de inicio por seguridad
    bloquesInfo.sort((a, b) => horaAMinutos(a.inicio) - horaAMinutos(b.inicio));
    
    const horaInicio = bloquesInfo[0].inicio;
    const horaFin = bloquesInfo[bloquesInfo.length - 1].fin;
    
    return `${horaInicio} a ${horaFin}`;
}

/**
 * Renderiza el catálogo de materias en el contenedor correspondiente del DOM,
 * aplicando los filtros de búsqueda y trimestre activos en tiempo real.
 */
function renderizarCatalogo() {
    const container = document.getElementById('catalog-container');
    if (!container) return;

    // Obtener los valores de los filtros
    const query = document.getElementById('search-input')?.value.toLowerCase().trim() || "";
    const trimestreSel = document.getElementById('trimestre-filter')?.value || "";

    // Obtener todo el universo de materias (catálogo provisto + manuales)
    const todasLasMaterias = obtenerTodasLasMaterias();

    // Filtrar materias en tiempo real
    const materiasFiltradas = todasLasMaterias.filter(materia => {
        const matchesTrimestre = trimestreSel === "" || materia.trimestre === parseInt(trimestreSel);
        const matchesQuery = query === "" || 
                             materia.nombre.toLowerCase().includes(query) || 
                             materia.codigo.toLowerCase().includes(query);
        return matchesTrimestre && matchesQuery;
    });

    // Limpiar contenedor
    container.innerHTML = "";

    if (materiasFiltradas.length === 0) {
        container.innerHTML = `<p class="empty-state">No se encontraron materias con los filtros aplicados.</p>`;
        return;
    }

    // Construir los elementos del DOM
    materiasFiltradas.forEach(materia => {
        const item = document.createElement('div');
        item.className = `catalog-item ${materia.esManual ? 'manual-item' : ''}`;
        item.dataset.codigo = materia.codigo;

        const estaSeleccionada = EstadoApp.materiasSeleccionadas.some(s => s.codigo === materia.codigo);

        // Procesar las secciones aparte para evitar escapes y caracteres inválidos
        let htmlSecciones = "";
        materia.secciones.forEach(sec => {
            let htmlSesiones = "";
            sec.horario.forEach(ses => {
                htmlSesiones += `<li>• <strong>${ses.dia}:</strong> ${obtenerHorarioLegible(ses.bloques)} en Aula ${ses.aula}</li>`;
            });

            htmlSecciones += `
                <div class="section-detail-row">
                    <div class="section-profesor"><strong>Sección ${sec.id}:</strong> ${sec.profesor}</div>
                    <ul class="section-horarios-list">
                        ${htmlSesiones}
                    </ul>
                </div>
            `;
        });

        // Estructura HTML del elemento del catálogo
        item.innerHTML = `
            <div class="catalog-item-summary">
                <div class="catalog-item-meta">
                    <span class="materia-code">${materia.codigo}</span>
                    <span class="badge font-weight-bold">${materia.trimestre}° Trim</span>
                    <span class="badge text-muted">${materia.uc} UC</span>
                    ${materia.esManual ? '<span class="badge badge-manual">Manual</span>' : ''}
                </div>
                <h3 class="materia-title">${materia.nombre}</h3>
                <div class="catalog-item-footer">
                    <span class="text-muted">${materia.secciones.length} secciones</span>
                    <div class="catalog-item-actions">
                        <button class="btn-toggle-details text-accent" style="background:none; border:none; cursor:pointer; font-size:0.85rem; padding:4px;">Ver detalle</button>
                        <button class="btn btn-secondary btn-sm btn-add-to-selection" ${estaSeleccionada ? 'disabled' : ''}>
                            ${estaSeleccionada ? 'Agregada' : 'Agregar'}
                        </button>
                    </div>
                </div>
            </div>
            <div class="catalog-item-details hidden">
                <h4>Secciones Disponibles:</h4>
                <div class="sections-details-list">
                    ${htmlSecciones}
                </div>
                ${materia.esManual ? `
                    <div class="manual-crud-buttons" style="margin-top: 10px; display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm btn-edit-manual" style="flex: 1;">Editar</button>
                        <button class="btn btn-secondary btn-sm btn-delete-manual" style="flex: 1; color: var(--error); border-color: var(--error);">Eliminar</button>
                    </div>
                ` : ''}
            </div>
        `;

        // Evento para expandir/colapsar detalles (Transición requerida)
        const toggleBtn = item.querySelector('.btn-toggle-details');
        const detailsDiv = item.querySelector('.catalog-item-details');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            detailsDiv.classList.toggle('hidden');
            toggleBtn.textContent = detailsDiv.classList.contains('hidden') ? 'Ver detalle' : 'Ocultar detalle';
        });

        // Evento para agregar a la selección
        const addBtn = item.querySelector('.btn-add-to-selection');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof agregarMateriaASeleccion === 'function') {
                agregarMateriaASeleccion(materia.codigo); 
            }
        });

        // Eventos especiales si es materia manual (Editar / Eliminar)
        if (materia.esManual) {
            item.querySelector('.btn-delete-manual').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`¿Estás seguro de que deseas eliminar la materia manual ${materia.codigo}?`)) {
                    eliminarMateriaManual(materia.codigo);
                    renderizarCatalogo();
                    if (typeof renderizarSeleccion === 'function') renderizarSeleccion();
                }
            });

            item.querySelector('.btn-edit-manual').addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof abrirModalEditarMateriaManual === 'function') {
                    abrirModalEditarMateriaManual(materia.codigo);
                }
            });
        }

        container.appendChild(item);
    });
}
