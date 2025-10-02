// js/modules/ui/pdfViewer.js

let modal, pdfCanvas, pdfCtx, annotationCanvas, annotationCtx, closeButton, prevButton, nextButton, pageInfo;
let drawToolBtn, drawColorInput, drawWidthSelect, clearPageBtn, downloadBtn, zoomInBtn, zoomOutBtn, zoomLevelDisplay;

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let currentScale = 1.5;

// Estado de las anotaciones
let annotations = {}; // Guardará los dibujos por número de página
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function getCanvasOffset(canvas) {
    const rect = canvas.getBoundingClientRect();
    return { top: rect.top, left: rect.left };
}
/**
 * Renderiza una página específica del PDF.
 * @param {number} num - El número de página a renderizar.
 */
function renderPage(num) {
    pageRendering = true;
    // Usando la promesa de PDF.js para obtener la página
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: currentScale });
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;
        annotationCanvas.height = viewport.height;
        annotationCanvas.width = viewport.width;

        // Renderizar la página en el canvas
        const renderContext = {
            canvasContext: pdfCtx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        // Esperar a que el renderizado termine
        renderTask.promise.then(function() {
            // Alinear el canvas de anotaciones sobre el canvas del PDF
            const pdfPosition = pdfCanvas.getBoundingClientRect();
            const bodyPosition = pdfCanvas.parentElement.getBoundingClientRect();
            annotationCanvas.style.top = `${pdfPosition.top - bodyPosition.top}px`;
            annotationCanvas.style.left = `${pdfPosition.left - bodyPosition.left}px`;

            pageRendering = false;
            if (pageNumPending !== null) {
                // Hay una nueva página esperando ser renderizada
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            redrawAnnotations(num); // Redibujar anotaciones para la página actual
        });
    });

    // Actualizar el contador de páginas
    pageInfo.textContent = `Página ${num} / ${pdfDoc.numPages}`;
    zoomLevelDisplay.textContent = `${Math.round(currentScale * 100)}%`;
}

/**
 * Si una página está siendo renderizada, se pone en cola la nueva solicitud.
 * Si no, se renderiza inmediatamente.
 * @param {number} num - El número de página.
 */
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    saveAnnotations(pageNum + 1);
    queueRenderPage(pageNum);
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    saveAnnotations(pageNum - 1);
    queueRenderPage(pageNum);
}

function closeModal() {
    modal.style.display = 'none';
    pdfDoc = null;
}

function zoomIn() {
    if (currentScale >= 3.0) return; // Límite de zoom
    currentScale += 0.25;
    queueRenderPage(pageNum);
}

function zoomOut() {
    if (currentScale <= 0.5) return; // Límite de zoom
    currentScale -= 0.25;
    queueRenderPage(pageNum);
}

async function downloadPdfWithAnnotations() {
    if (!pdfDoc) return;

    alert('Preparando la descarga... Esto puede tardar unos momentos.');

    // Guardar las anotaciones de la página actual antes de empezar
    saveAnnotations(pageNum);

    const { jsPDF } = window.jspdf;
    let newPdf;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 }); // Usar escala 1 para calidad original
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        // Si hay anotaciones para esta página, dibujarlas sobre el canvas
        if (annotations[i]) {
            const img = new Image();
            img.src = annotations[i];
            await new Promise(resolve => img.onload = resolve);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        const imgData = canvas.toDataURL('image/png');
        const orientation = canvas.width > canvas.height ? 'l' : 'p';
        if (i === 1) newPdf = new jsPDF(orientation, 'pt', [canvas.width, canvas.height]);
        else newPdf.addPage([canvas.width, canvas.height], orientation);
        newPdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    }

    newPdf.save('documento_anotado.pdf');
}

// --- Lógica de Anotaciones ---

function startDrawing(e) {
    isDrawing = true;
    const offset = getCanvasOffset(annotationCanvas);
    [lastX, lastY] = [e.clientX - offset.left, e.clientY - offset.top];
}

function draw(e) {
    if (!isDrawing) return;
    const offset = getCanvasOffset(annotationCanvas);
    const currentX = e.clientX - offset.left;
    const currentY = e.clientY - offset.top;

    annotationCtx.beginPath();
    annotationCtx.moveTo(lastX, lastY);
    annotationCtx.lineTo(currentX, currentY);
    annotationCtx.strokeStyle = drawColorInput.value;
    annotationCtx.lineWidth = drawWidthSelect.value;
    annotationCtx.lineCap = 'round';
    annotationCtx.stroke();

    [lastX, lastY] = [currentX, currentY];
}

function stopDrawing() {
    isDrawing = false;
}

function saveAnnotations(pageNumber) {
    if (annotationCanvas.width > 0) {
        annotations[pageNumber] = annotationCanvas.toDataURL();
    }
}

function redrawAnnotations(pageNumber) {
    clearAnnotations();
    if (annotations[pageNumber]) {
        const img = new Image();
        img.onload = function() {
            annotationCtx.drawImage(img, 0, 0);
        };
        img.src = annotations[pageNumber];
    }
}

function clearAnnotations() {
    annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
}

function clearCurrentPage() {
    if (confirm('¿Estás seguro de que quieres borrar todas las anotaciones de esta página?')) {
        clearAnnotations();
        delete annotations[pageNum];
    }
}

function setupAnnotationListeners() {
    annotationCanvas.addEventListener('mousedown', startDrawing);
    annotationCanvas.addEventListener('mousemove', draw);
    annotationCanvas.addEventListener('mouseup', stopDrawing);
    annotationCanvas.addEventListener('mouseout', stopDrawing);
    clearPageBtn.addEventListener('click', clearCurrentPage);
}

/**
 * Abre el visor de PDF con el archivo cargado.
 * @param {ArrayBuffer} pdfData - Los datos del archivo PDF.
 */
export function openPdfViewer(pdfData) {
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    loadingTask.promise.then(function(pdf) {
        pdfDoc = pdf;
        pageNum = 1;
        annotations = {}; // Limpiar anotaciones al abrir un nuevo PDF
        renderPage(pageNum);
        modal.style.display = 'flex';
    }, function (reason) {
        console.error(reason);
        alert('Error al cargar el PDF.');
    });
}

export function initPdfViewer() {
    modal = document.getElementById('pdfViewerModal');
    pdfCanvas = document.getElementById('pdfCanvas');
    pdfCtx = pdfCanvas.getContext('2d');
    annotationCanvas = document.getElementById('annotationCanvas');
    annotationCtx = annotationCanvas.getContext('2d');

    closeButton = document.getElementById('closePdfViewer');
    prevButton = document.getElementById('pdfPrevPage');
    nextButton = document.getElementById('pdfNextPage');
    pageInfo = document.getElementById('pdfPageInfo');

    drawToolBtn = document.getElementById('pdfDrawTool');
    drawColorInput = document.getElementById('pdfDrawColor');
    drawWidthSelect = document.getElementById('pdfDrawWidth');
    clearPageBtn = document.getElementById('pdfClearPage');
    downloadBtn = document.getElementById('pdfDownload');
    zoomInBtn = document.getElementById('pdfZoomIn');
    zoomOutBtn = document.getElementById('pdfZoomOut');
    zoomLevelDisplay = document.getElementById('pdfZoomLevel');

    closeButton.addEventListener('click', closeModal);
    prevButton.addEventListener('click', onPrevPage);
    nextButton.addEventListener('click', onNextPage);
    downloadBtn.addEventListener('click', downloadPdfWithAnnotations);
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    setupAnnotationListeners();
}