let seccionCount = 0;

/**
 * Inicializa los disparadores globales del formulario manual.
 */
function inicializarEventosFormulario() {
    const btnOpen = document.getElementById('btn-open-manual-form');
    if (btnOpen) {
        btnOpen.addEventListener('click', () => abrirModalMateriaManual());
    }
}

/**
 * Abre el modal con el formulario limpio para registrar una nueva materia.
 */
function abrirModalMateriaManual() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    seccionCount = 0;
    
    modalContainer.innerHTML = `
        <div class="modal-card">
            <div class="modal-header">
                <h2>Registrar Materia Manual</h2>
                <button class="btn-close-modal" id="btn-close-form">&times;</button>
            </div>
            <form id="manual-materia-form" novalidate>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label for="man-codigo">Código de Materia:</label>
                        <input type="text" id="man-codigo" placeholder="Ej: EXT-101">
                        <span class="error-msg" id="err-man-codigo"></span>
                    </div>
                    <div class="form-group">
                        <label for="man-nombre">Nombre de la Materia:</label>
                        <input type="text" id="man-nombre" placeholder="Ej: Inteligencia Artificial">
                        <span class="error-msg" id="err-man-nombre"></span>
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label for="man-trimestre">Trimestre (1 al 5):</label>
                        <input type="number" id="man-trimestre" min="1" max="5" value="1">
                        <span class="error-msg" id="err-man-trimestre"></span>
                    </div>
                    <div class="form-group">
                        <label for="man-uc">Unidades de Crédito (1 al 5):</label>
                        <input type="number" id="man-uc" min="1" max="5" value="3">
                        <span class="error-msg" id="err-man-uc"></span>
                    </div>
                </div>

                <div class="sections-form-wrapper">
                    <div class="sections-form-header">
                        <h3>Configuración de Secciones</h3>
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-add-form-section">+ Nueva Sección</button>
                    </div>
                    <span class="error-msg" id="err-man-secciones" style="display:block; margin-bottom:10px;"></span>
                    <div id="form-sections-container">
                        <!-- Las secciones añadidas aparecerán aquí dinámicamente -->
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="btn-cancel-form">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Materia</button>
                </div>
            </form>
        </div>
    `;

    modalContainer.classList.remove('hidden');

    // Vincular Eventos Internos
    document.getElementById('btn-close-form').addEventListener('click', cerrarModalFormulario);
    document.getElementById('btn-cancel-form').addEventListener('click', cerrarModalFormulario);
    document.getElementById('btn-add-form-section').addEventListener('click', () => agregarSeccionAFormulario());
    document.getElementById('manual-materia-form').addEventListener('submit', procesarSubmitFormulario);

    // Obligatorio: iniciar con mínimo una sección armada de forma automática
    agregarSeccionAFormulario();
}

/**
 * Agrega dinámicamente los campos para configurar una sección y sus respectivas sesiones.
 */
function agregarSeccionAFormulario(datosPreexistentes = null) {
    const container = document.getElementById('form-sections-container');
    if (!container) return;

    seccionCount++;
    const currentSecId = seccionCount;

    const secCard = document.createElement('div');
    secCard.className = "form-section-card";
    secCard.id = `form-sec-card-${currentSecId}`;

    secCard.innerHTML = `
        <div class="form-section-card-header">
            <h4>Sección Dinámica</h4>
            <button type="button" class="btn-remove-form-section" data-id="${currentSecId}">&times;</button>
        </div>
        <div class="form-grid-2">
            <div class="form-group">
                <label>Identificador Único de Sección:</label>
                <input type="text" class="sec-id-input" placeholder="Ej: 001" value="${datosPreexistentes ? datosPreexistentes.id : '001'}">
                <span class="error-msg err-sec-id"></span>
            </div>
            <div class="form-group">
                <label>Profesor Asignado:</label>
                <input type="text" class="sec-profesor-input" placeholder="Ej: Prof. Kneider" value="${datosPreexistentes ? datosPreexistentes.profesor : ''}">
                <span class="error-msg err-sec-profesor"></span>
            </div>
        </div>

        <div class="sessions-form-wrapper">
            <h5>Bloques y Horarios Semanales</h5>
            <div class="sessions-selectors-grid">
                <div class="form-group">
                    <label>Día:</label>
                    <select class="ses-dia-select">
                        <option value="LUN">Lunes</option>
                        <option value="MAR">Martes</option>
                        <option value="MIE">Miércoles</option>
                        <option value="JUE">Jueves</option>
                        <option value="VIE">Viernes</option>
                        <option value="SAB">Sábado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Aula:</label>
                    <input type="text" class="ses-aula-input" placeholder="Ej: LAB-1" value="${datosPreexistentes ? datosPreexistentes.horario[0]?.aula : ''}">
                    <span class="error-msg err-ses-aula"></span>
                </div>
            </div>
            <div class="form-group">
                <label>Selecciona los Bloques que ocupa (Mantén presionado Ctrl para seleccionar consecutivos):</label>
                <select class="ses-bloques-select" multiple style="height: 120px;">
                    <!-- Se listan todos los bloques institucionales del catálogo provisto -->
                    ${BLOQUES.map(b => `<option value="${b.id}">[${b.tipo.toUpperCase()}] ${b.id}: ${b.inicio} a ${b.fin}</option>`).join('')}
                </select>
                <span class="error-msg err-ses-bloques"></span>
            </div>
        </div>
    `;

    // Configurar valores por defecto en caso de que sean datos preexistentes
    if (datosPreexistentes && datosPreexistentes.horario[0]) {
        secCard.querySelector('.ses-dia-select').value = datosPreexistentes.horario[0].dia;
        const selectBloques = secCard.querySelector('.ses-bloques-select');
        Array.from(selectBloques.options).forEach(opt => {
            if (datosPreexistentes.horario[0].bloques.includes(opt.value)) opt.selected = true;
        });
    }

    // Evento para remover esta sección específica
    secCard.querySelector('.btn-remove-form-section').addEventListener('click', (e) => {
        const idToRemove = e.target.dataset.id;
        const cardNode = document.getElementById(`form-sec-card-${idToRemove}`);
        if (cardNode) cardNode.remove();
    });

    container.appendChild(secCard);
}

/**
 * Valida de forma estricta los campos y procesa el almacenamiento temporal en memoria.
 */
function procesarSubmitFormulario(e) {
    e.preventDefault();

    // Limpiar todos los mensajes de error previos
    document.querySelectorAll('.error-msg').forEach(el => { el.textContent = ""; el.classList.remove('active'); });

    let formularioValido = true;

    // 1. Validar Datos Básicos de la Materia
    const txtCodigo = document.getElementById('man-codigo').value.trim().toUpperCase();
    const txtNombre = document.getElementById('man-nombre').value.trim();
    const numTrimestre = parseInt(document.getElementById('man-trimestre').value);
    const numUC = parseInt(document.getElementById('man-uc').value);

    if (!txtCodigo) {
        mostrarErrorCampo('err-man-codigo', "El código de la materia es requerido.");
        formularioValido = false;
    } else if (buscarMateriaPorCodigo(txtCodigo)) {
        mostrarErrorCampo('err-man-codigo', "Este código ya existe en el catálogo institucional.");
        formularioValido = false;
    }

    if (!txtNombre) {
        mostrarErrorCampo('err-man-nombre', "El nombre de la materia es requerido.");
        formularioValido = false;
    }

    if (isNaN(numTrimestre) || numTrimestre < 1 || numTrimestre > 5) {
        mostrarErrorCampo('err-man-trimestre', "Debe indicar un trimestre entre 1 y 5.");
        formularioValido = false;
    }

    if (isNaN(numUC) || numUC < 1 || numUC > 5) {
        mostrarErrorCampo('err-man-uc', "Las Unidades de Crédito deben estar entre 1 y 5.");
        formularioValido = false;
    }

    // 2. Validar Secciones Estructuradas
    const formSectionCards = document.querySelectorAll('.form-section-card');
    if (formSectionCards.length === 0) {
        mostrarErrorCampo('err-man-secciones', "Debe registrar como mínimo una sección para la materia.");
        formularioValido = false;
    }

        const listaSeccionesProcesadas = [];

        formSectionCards.forEach(card => {
            const inputSecId = card.querySelector('.sec-id-input').value.trim();
            const inputProfesor = card.querySelector('.sec-profesor-input').value.trim();
            const selectDia = card.querySelector('.ses-dia-select').value;
            const inputAula = card.querySelector('.ses-aula-input').value.trim();
            const selectedBloques = Array.from(card.querySelector('.ses-bloques-select').options)
                                        .filter(opt => opt.selected)
                                        .map(opt => opt.value);

            let secValida = true;

            if (!inputSecId) {
                card.querySelector('.err-sec-id').textContent = "Identificador requerido.";
                secValida = false;
            } else if (listaSeccionesProcesadas.some(s => s.id === inputSecId)) {
                card.querySelector('.err-sec-id').textContent = "ID de sección duplicado en esta materia.";
                secValida = false;
            }

            if (!inputProfesor) {
                card.querySelector('.err-sec-profesor').textContent = "Escriba el nombre del docente.";
                secValida = false;
            }

            if (!inputAula) {
                card.querySelector('.err-ses-aula').textContent = "Aula requerida.";
                secValida = false;
            }

            if (selectedBloques.length === 0) {
                card.querySelector('.err-ses-bloques').textContent = "Debe marcar al menos un bloque horario.";
                secValida = false;
            } else {
                // Validación Cruzada Obligatoria con js/tiempo.js (Consecutivos y Mismo Tipo)
                if (typeof sonBloquesConsecutivosYDelMismoTipo === 'function') {
                    if (!sonBloquesConsecutivosYDelMismoTipo(selectedBloques)) {
                        card.querySelector('.err-ses-bloques').textContent = "Los bloques deben ser consecutivos y pertenecer al mismo tipo (Regulares o Laboratorios).";
                        secValida = false;
                    }
                }
            }

            if (!secValida) {
                formularioValido = false;
            } else {
                listaSeccionesProcesadas.push({
                    id: inputSecId,
                    profesor: inputProfesor,
                    horario: [
                        {
                            dia: selectDia,
                            aula: inputAula,
                            bloques: selectedBloques
                        }
                    ]
                });
            }
        });

        // Si todas las validaciones integradas pasaron con éxito, se almacena en memoria
        if (formularioValido) {
            const nuevaMateriaManual = {
                codigo: txtCodigo,
                nombre: txtNombre,
                trimestre: numTrimestre,
                uc: numUC,
                secciones: listaSeccionesProcesadas
            };

            if (agregarMateriaManual(nuevaMateriaManual)) {
                cerrarModalFormulario();
                if (typeof renderizarCatalogo === 'function') renderizarCatalogo();
            }
        }
    }

    function mostrarErrorCampo(idElemento, mensaje) {
        const el = document.getElementById(idElemento);
        if (el) {
            el.textContent = mensaje;
            el.classList.add('active');
        }
    }

    function cerrarModalFormulario() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.classList.add('hidden');
            modalContainer.innerHTML = "";
        }
    }
