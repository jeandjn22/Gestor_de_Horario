/**
 * Inicializa los eventos del panel de configuración y selección.
 */
function inicializarEventosSeleccion() {
    const topeUcInput = document.getElementById('tope-uc-input');
    const btnAddTrimestre = document.getElementById('btn-add-trimestre');
    const btnGenerate = document.getElementById('btn-generate');

    if (topeUcInput) {
        topeUcInput.addEventListener('change', (e) => {
            const nuevoTope = parseInt(e.target.value) || 0;
            const ucActuales = calcularTotalUC();

            if (nuevoTope < 1) {
                alert("El tope de Unidades de Crédito debe ser un número entero positivo.");
                e.target.value = EstadoApp.topeUC;
                return;
            }

            // --- IMPEDIR EXCEDER EL MÁXIMO DE 28 UC ---
            if (nuevoTope > 28) {
                alert("El tope máximo de Unidades de Crédito institucional permitido es de 28 UC.");
                e.target.value = EstadoApp.topeUC;
                return;
            }

            if (nuevoTope < ucActuales) {
                alert(`No puedes bajar el tope por debajo de las UC ya seleccionadas (${ucActuales} UC).`);
                e.target.value = EstadoApp.topeUC;
                return;
            }

            EstadoApp.topeUC = nuevoTope;
            actualizarContadoresUI();
        });
    }

    if (btnAddTrimestre) {
        btnAddTrimestre.addEventListener('click', agregarTrimestreCompleto);
    }
}

/**
 * Calcula la suma total de UC de las materias que el usuario ha seleccionado.
 * @returns {number}
 */
function calcularTotalUC() {
    return EstadoApp.materiasSeleccionadas.reduce((total, sel) => {
        const materia = buscarMateriaPorCodigo(sel.codigo);
        return total + (materia ? materia.uc : 0);
    }, 0);
}

/**
 * Agrega una materia a la selección validando que no exceda el tope de UC.
 * @param {string} codigo 
 */
function agregarMateriaASeleccion(codigo) {
    const materia = buscarMateriaPorCodigo(codigo);
    if (!materia) return;

    // Verificar si ya está seleccionada
    if (EstadoApp.materiasSeleccionadas.some(s => s.codigo === codigo)) return;

    const ucActuales = calcularTotalUC();
    if (ucActuales + materia.uc > EstadoApp.topeUC) {
        alert(`No se puede agregar "${materia.nombre}". Supera el tope máximo de ${EstadoApp.topeUC} UC.`);
        return;
    }

    // Insertar en la selección inicializando sin fijados ni exclusiones
    EstadoApp.materiasSeleccionadas.push({
        codigo: materia.codigo,
        seccionFijada: null,
        seccionesExcluidas: []
    });

    // Invalidar resultados previos de horarios al alterar la selección (Requerimiento 4.5)
    if (typeof invalidarResultadosHorarios === 'function') {
        invalidarResultadosHorarios();
    }

    renderizarSeleccion();
    if (typeof renderizarCatalogo === 'function') renderizarCatalogo();
}

/**
 * Remueve una materia de la selección actual.
 * @param {string} codigo 
 */
function removerMateriaDeSeleccion(codigo) {
    EstadoApp.materiasSeleccionadas = EstadoApp.materiasSeleccionadas.filter(s => s.codigo !== codigo);
    
    if (typeof invalidarResultadosHorarios === 'function') {
        invalidarResultadosHorarios();
    }

    renderizarSeleccion();
    if (typeof renderizarCatalogo === 'function') renderizarCatalogo();
}

/**
 * Atajo para agregar todas las materias de un trimestre específico.
 */
function agregarTrimestreCompleto() {
    const trimestreSel = document.getElementById('trimestre-filter')?.value;
    if (!trimestreSel) {
        alert("Por favor, selecciona un trimestre específico en el filtro superior antes de usar este atajo.");
        return;
    }

    const trimestreNum = parseInt(trimestreSel);
    const todasLasMaterias = obtenerTodasLasMaterias();

    // Buscar materias pertenecientes a este trimestre que aún no estén elegidas
    const materiasDelTrimestre = todasLasMaterias.filter(m => m.trimestre === trimestreNum);
    const materiasPorAgregar = materiasDelTrimestre.filter(m => 
        !EstadoApp.materiasSeleccionadas.some(s => s.codigo === m.codigo)
    );

    if (materiasPorAgregar.length === 0) {
        alert("Todas las materias de este trimestre ya están en tu selección.");
        return;
    }

    // Calcular el impacto de UC
    const ucActuales = calcularTotalUC();
    const ucNuevas = materiasPorAgregar.reduce((sum, m) => sum + m.uc, 0);
    const ucTotalResultante = ucActuales + ucNuevas;

    if (ucTotalResultante > EstadoApp.topeUC) {
        const exceso = ucTotalResultante - EstadoApp.topeUC;
        alert(`No se agregó ninguna materia. El total de UC (${ucTotalResultante}) excedería el tope configurado por ${exceso} UC.`);
        return;
    }

    // Si pasa la validación se agregan todas de golpe
    materiasPorAgregar.forEach(m => {
        EstadoApp.materiasSeleccionadas.push({
            codigo: m.codigo,
            seccionFijada: null,
            seccionesExcluidas: []
        });
    });

    if (typeof invalidarResultadosHorarios === 'function') {
        invalidarResultadosHorarios();
    }

    renderizarSeleccion();
    if (typeof renderizarCatalogo === 'function') renderizarCatalogo();
}

/**
 * Actualiza los contadores de texto y badges en la interfaz.
 */
function actualizarContadoresUI() {
    const counterMaterias = document.getElementById('counter-materias');
    const counterUc = document.getElementById('counter-uc');
    const btnGenerate = document.getElementById('btn-generate');

    const totalMaterias = EstadoApp.materiasSeleccionadas.length;
    const totalUc = calcularTotalUC();

    if (counterMaterias) counterMaterias.textContent = `${totalMaterias} Materias`;
    if (counterUc) {
        counterUc.textContent = `${totalUc} / ${EstadoApp.topeUC} UC`;
        if (totalUc > EstadoApp.topeUC - 4) {
            counterUc.style.backgroundColor = '#fef2f2';
            counterUc.style.borderColor = '#fca5a5';
            counterUc.style.color = 'var(--error)';
        } else {
            counterUc.style.backgroundColor = '';
            counterUc.style.borderColor = '';
            counterUc.style.color = '';
        }
    }

    if (btnGenerate) {
        btnGenerate.disabled = totalMaterias === 0;
    }
}

/**
 * Renderiza el listado visual en el panel central de las asignaturas escogidas.
 */
function renderizarSeleccion() {
    const container = document.getElementById('selection-container');
    if (!container) return;

    actualizarContadoresUI();

    if (EstadoApp.materiasSeleccionadas.length === 0) {
        container.innerHTML = `<p class="empty-state">No has seleccionado ninguna materia todavía.</p>`;
        return;
    }

    container.innerHTML = "";

    // Ejecutar el módulo de choques preventivos para inyectar incompatibilidades en la interfaz (Módulo 4.4)
    let incompatibilidades = [];
    if (typeof detectarMateriasIncompatibles === 'function') {
        const materiasParaTest = EstadoApp.materiasSeleccionadas.map(sel => {
            const mat = buscarMateriaPorCodigo(sel.codigo);
            let disponibles = mat ? mat.secciones : [];
            if (sel.seccionFijada) {
                disponibles = disponibles.filter(s => s.id === sel.seccionFijada);
            } else {
                disponibles = disponibles.filter(s => !sel.seccionesExcluidas.includes(s.id));
            }
            return { codigo: sel.codigo, seccionesDisponibles: disponibles };
        });
        incompatibilidades = detectarMateriasIncompatibles(materiasParaTest);
    }

    // Bucle principal para renderizar las materias seleccionadas
        EstadoApp.materiasSeleccionadas.forEach(sel => {
        const materia = buscarMateriaPorCodigo(sel.codigo);
        if (!materia) return;

        const card = document.createElement('div');
        card.className = "selection-item-card";
        
        const conflicto = incompatibilidades.find(inc => inc.matA === sel.codigo || inc.matB === sel.codigo);
        const coMateria = conflicto ? (conflicto.matA === sel.codigo ? conflicto.matB : conflicto.matA) : null;

        // --- PROCESAR LAS OPCIONES DEL SELECT APARTE ---
        let htmlOpcionesSelect = `<option value="">Ninguna (Considerar todas)</option>`;
        materia.secciones.forEach(sec => {
            const esSeleccionada = sel.seccionFijada === sec.id ? 'selected' : '';
            htmlOpcionesSelect += `<option value="${sec.id}" ${esSeleccionada}>Sección ${sec.id}</option>`;
        });

        // --- PROCESAR LOS CHECKBOXES DE EXCLUSIÓN APARTE ---
        let htmlCheckboxesExclusion = "";
        materia.secciones.forEach(sec => {
            const estaExcluida = sel.seccionesExcluidas.includes(sec.id);
            const esUnicaDisponible = !sel.seccionFijada && (materia.secciones.length - sel.seccionesExcluidas.length <= 1) && !estaExcluida;
            
            const txtChecked = estaExcluida ? 'checked' : '';
            const txtDisabled = (sel.seccionFijada || esUnicaDisponible) ? 'disabled' : '';
            const claseTachado = estaExcluida ? 'text-muted line-through' : '';

            htmlCheckboxesExclusion += `
                <label class="${claseTachado}">
                    <input type="checkbox" class="chk-excluir" value="${sec.id}" ${txtChecked} ${txtDisabled}> 
                    ${sec.id}
                </label>
            `;
        });

        // HTML final limpio e inyectado de forma plana sin escapes complejos
        card.innerHTML = `
            <div class="selection-item-top">
                <div>
                    <span class="materia-code">${materia.codigo}</span>
                    <h4 class="selection-item-title">${materia.nombre}</h4>
                </div>
                <button class="btn-remove-selection" style="background:none; border:none; color:var(--error); font-weight:bold; cursor:pointer;">&times;</button>
            </div>
            
            ${coMateria ? `<div class="alert alert-error-inline">⚠️ Incompatible con: <strong>\${coMateria}</strong> (Todas sus secciones chocan)</div>` : ''}

            <div class="selection-item-controls">
                <div class="form-group-inline">
                    <label>Fijar Sección:</label>
                    <select class="select-fijar-seccion">
                        ${htmlOpcionesSelect}
                    </select>
                </div>

                <div class="exclusion-zone">
                    <label>Excluir Secciones:</label>
                    <div class="exclusion-checkboxes">
                        ${htmlCheckboxesExclusion}
                    </div>
                </div>
            </div>
        `;

        // Botón de eliminar de la lista
        card.querySelector('.btn-remove-selection').addEventListener('click', () => {
            removerMateriaDeSeleccion(sel.codigo);
        });

        // Select para Fijar una sección determinada
        const selectFijar = card.querySelector('.select-fijar-seccion');
        selectFijar.addEventListener('change', (e) => {
            sel.seccionFijada = e.target.value || null;
            if (sel.seccionFijada) {
                sel.seccionesExcluidas = []; // Si se fija, se limpian las exclusiones automáticas
            }
            if (typeof invalidarResultadosHorarios === 'function') invalidarResultadosHorarios();
            renderizerNuevamenteTodo();
        });

        // Checkboxes para Excluir secciones
        card.querySelectorAll('.chk-excluir').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const secId = e.target.value;
                if (e.target.checked) {
                    // Validar regla de que no se pueden excluir la totalidad de las secciones
                    if (sel.seccionesExcluidas.length + 1 >= materia.secciones.length) {
                        alert("No puedes excluir la totalidad de las secciones de una materia seleccionada.");
                        e.target.checked = false;
                        return;
                    }
                    if (!sel.seccionesExcluidas.includes(secId)) {
                        sel.seccionesExcluidas.push(secId);
                    }
                } else {
                    sel.seccionesExcluidas = sel.seccionesExcluidas.filter(id => id !== secId);
                }
                if (typeof invalidarResultadosHorarios === 'function') invalidarResultadosHorarios();
                renderizerNuevamenteTodo();
            });
        });

        container.appendChild(card);
    });
}

/**
 * Función auxiliar para refrescar la UI unificada de control
 */
function renderizerNuevamenteTodo() {
    renderizarSeleccion();
    if (typeof renderizarCatalogo === 'function') renderizarCatalogo();
}
