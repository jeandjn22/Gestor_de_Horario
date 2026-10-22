/**
 * Guarda la combinación seleccionada como el horario final y monta la vista de resumen.
 * @param {Array} combinacionElegida - Set de secciones seleccionadas por el estudiante
 */
function establecerHorarioDefinitivo(combinacionElegida) {
    const appContainer = document.querySelector('.app-container');
    const summaryView = document.getElementById('summary-view');

    if (!appContainer || !summaryView) return;

    // Ocultar la interfaz interactiva de configuración y selección
    appContainer.classList.add('hidden');
    summaryView.classList.remove('hidden');

    // Calcular el total de unidades de crédito finales
    const totalUC = combinacionElegida.reduce((sum, asignacion) => {
        const mat = buscarMateriaPorCodigo(asignacion.codigoMateria);
        return sum + (mat ? mat.uc : 0);
    }, 0);

    // Clonar la rejilla semanal generada para meterla en la vista de impresión
    const originalGrid = document.querySelector('.weekly-grid');
    const clonedGrid = originalGrid.cloneNode(true);
    
    // Quitar comportamientos interactivos del clon para la impresión limpia
    clonedGrid.querySelectorAll('.grid-session-card').forEach(card => {
        card.style.cursor = 'default';
    });

    
    let htmlFilasTabla = "";
    combinacionElegida.forEach(asignacion => {
        // Formatear los horarios legibles de cada sesión
        const listaHorarios = asignacion.seccionInfo.horario.map(ses => {
            return `${ses.dia}: ${obtenerHorarioLegible(ses.bloques)}`;
        });
        const horariosTexto = listaHorarios.join('<br>');

        // Extraer las aulas correspondientes
        const listaAulas = asignacion.seccionInfo.horario.map(ses => ses.aula);
        const aulasTexto = listaAulas.join(' / ');

        // Acumular la fila HTML de forma limpia con variables ya procesadas
        htmlFilasTabla += `
            <tr>
                <td><strong>${asignacion.codigoMateria}</strong></td>
                <td>${asignacion.nombreMateria}</td>
                <td><span class="badge">${asignacion.seccionInfo.id}</span></td>
                <td>${asignacion.seccionInfo.profesor}</td>
                <td>${horariosTexto}</td>
                <td>📍 ${aulasTexto}</td>
            </tr>
        `;
    });

    // Maquetación semántica de la hoja final inyectando las filas precalculadas
    summaryView.innerHTML = `
        <div class="print-actions-bar">
            <button id="btn-back-to-app" class="btn btn-secondary">&larr; Volver a Editar</button>
            <button id="btn-trigger-print" class="btn btn-success">🖨️ Imprimir Horario</button>
        </div>

        <div class="printable-document">
            <div class="print-header">
                <h2>Comprobante de Horario Académico</h2>
                <p><strong>Institución:</strong> Universidad del Zulia</p>
                <p><strong>Período:</strong> Inscripción Regular — Trimestre Actual</p>
                <p><strong>Carga Académica Total:</strong> <span class="badge font-weight-bold">${totalUC} Unidades de Crédito</span></p>
            </div>

            <div class="print-grid-container">
                <h3>Esquema Semanal Distribuido</h3>
                <div class="grid-wrapper-print"></div>
            </div>

            <div class="print-table-container">
                <h3>Detalle Analítico de Asignaturas</h3>
                <table class="summary-data-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Materia</th>
                            <th>Sec.</th>
                            <th>Profesor Asignado</th>
                            <th>Horarios Legibles</th>
                            <th>Aula</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${htmlFilasTabla}
                    </tbody>
                </table>
            </div>
            
            <div class="print-signature-block">
                <div class="signature-line">Firma del Estudiante</div>
                <div class="signature-line">Control de Estudios</div>
            </div>
        </div>
    `;

    // Insertar la rejilla clonada en su contenedor específico de impresión
    summaryView.querySelector('.grid-wrapper-print').appendChild(clonedGrid);

    // Evento para regresar a la aplicación sin perder datos en memoria
    document.getElementById('btn-back-to-app').addEventListener('click', () => {
        summaryView.classList.add('hidden');
        appContainer.classList.remove('hidden');
        summaryView.innerHTML = "";
    });

    // Evento nativo del sistema para lanzar la ventana de impresión
    document.getElementById('btn-trigger-print').addEventListener('click', () => {
        window.print();
    });
}
