// js/modules/ui/pdfViewer.js

let modal, pdfCanvas, pdfCtx, annotationCanvas, annotationCtx, closeButton, prevButton, nextButton, pageInfo;
let selectToolBtn, textToolBtn, drawToolBtn, drawColorInput, drawWidthSelect, clearPageBtn, downloadBtn, zoomInBtn, zoomOutBtn, zoomLevelDisplay;

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let currentScale = 1.5;

// Estado de las anotaciones
let annotations = {}; // Guardará los objetos de anotación por página.

// Estado de la interacción
let isDrawing = false;
let isDragging = false;
let currentTool = 'select'; // 'select', 'draw', o 'text'
let currentPath = [];
let selectedObject = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

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
    let newPdf = null;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 }); // Usar escala 1 para calidad original
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        // Si hay anotaciones para esta página, dibujarlas sobre el canvas
        const pageAnnotations = annotations[i] || [];
        // Clonamos el contexto para no afectar el original
        const tempAnnotationCanvas = document.createElement('canvas');
        await renderAnnotationsToContext(pageAnnotations, tempAnnotationCanvas.getContext('2d'), canvas.width, canvas.height);
        ctx.drawImage(tempAnnotationCanvas, 0, 0, canvas.width, canvas.height);

        const imgData = canvas.toDataURL('image/png');
        const orientation = canvas.width > canvas.height ? 'l' : 'p';
        if (i === 1) newPdf = new jsPDF(orientation, 'pt', [canvas.width, canvas.height]);
        else newPdf.addPage([canvas.width, canvas.height], orientation);
        newPdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    }

    newPdf.save('documento_anotado.pdf');
}

// --- Lógica de Anotaciones ---

function getMousePos(e) {
    const offset = getCanvasOffset(annotationCanvas);
    const currentX = e.clientX - offset.left;
    const currentY = e.clientY - offset.top;
    return { x: currentX, y: currentY };
}

function handleMouseDown(e) {
    const pos = getMousePos(e);

    if (currentTool === 'select') {
        selectedObject = findObjectAt(pos.x, pos.y);
        if (selectedObject) {
            isDragging = true;
            dragOffsetX = pos.x - selectedObject.x;
            dragOffsetY = pos.y - selectedObject.y;
        }
        redrawAnnotations(pageNum);
    } else if (currentTool === 'draw') {
        isDrawing = true;
        currentPath = [{ x: pos.x, y: pos.y }];
    }
}

function handleMouseMove(e) {
    if (isDrawing && currentTool === 'draw') {
        const pos = getMousePos(e);
        currentPath.push({ x: pos.x, y: pos.y });
        redrawAnnotations(pageNum); // Redibuja todo + el camino actual
    } else if (isDragging && selectedObject && currentTool === 'select') {
        const pos = getMousePos(e);
        selectedObject.x = pos.x - dragOffsetX;
        selectedObject.y = pos.y - dragOffsetY;
        redrawAnnotations(pageNum);
    }
}

function handleMouseUp() {
    if (isDrawing && currentTool === 'draw') {
        isDrawing = false;
        if (currentPath.length > 1) {
            if (!annotations[pageNum]) annotations[pageNum] = [];
            annotations[pageNum].push({
                type: 'path',
                points: currentPath,
                color: drawColorInput.value,
                width: drawWidthSelect.value
            });
        }
        currentPath = [];
    } else if (isDragging) {
        isDragging = false;
    }
    redrawAnnotations(pageNum);
}

function handleMouseClick(e) {
    if (currentTool === 'text') {
        const text = prompt("Introduce el texto que quieres añadir:");
        if (!text) return;

        const pos = getMousePos(e);
        const fontSize = drawWidthSelect.value * 5;

        if (!annotations[pageNum]) annotations[pageNum] = [];
        annotations[pageNum].push({
            type: 'text',
            content: text,
            x: pos.x,
            y: pos.y,
            font: `${fontSize}px Arial`,
            color: drawColorInput.value
        });
        redrawAnnotations(pageNum);
    }
}

function handleDoubleClick(e) {
    if (currentTool === 'select' && selectedObject && selectedObject.type === 'text') {
        const newText = prompt("Edita el texto:", selectedObject.content);
        if (newText !== null) {
            selectedObject.content = newText;
            redrawAnnotations(pageNum);
        }
    }
}

function handleKeyDown(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObject) {
            const pageAnnotations = annotations[pageNum] || [];
            const index = pageAnnotations.indexOf(selectedObject);
            if (index > -1) {
                pageAnnotations.splice(index, 1);
                selectedObject = null;
                redrawAnnotations(pageNum);
            }
        }
    }
}

function findObjectAt(x, y) {
    const pageAnnotations = annotations[pageNum] || [];
    // Iterar en orden inverso para seleccionar el objeto de encima
    for (let i = pageAnnotations.length - 1; i >= 0; i--) {
        const obj = pageAnnotations[i];
        if (obj.type === 'text') {
            // Medir el texto para crear un bounding box
            annotationCtx.font = obj.font;
            const metrics = annotationCtx.measureText(obj.content);
            const height = parseInt(obj.font, 10); // Aproximación de la altura
            if (x >= obj.x && x <= obj.x + metrics.width && y >= obj.y && y <= obj.y + height) {
                return obj;
            }
        }
        // La detección de clics en 'path' es más compleja y se omite por ahora
    }
    return null;
}

function saveAnnotations() {
    // Las anotaciones ya se guardan en el objeto `annotations` en tiempo real.
    // Esta función se mantiene por si se necesita lógica adicional en el futuro.
}

async function renderAnnotationsToContext(pageAnnotations, ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    for (const obj of pageAnnotations) {
        if (obj.type === 'path') {
            ctx.beginPath();
            ctx.moveTo(obj.points[0].x, obj.points[0].y);
            for (let i = 1; i < obj.points.length; i++) {
                ctx.lineTo(obj.points[i].x, obj.points[i].y);
            }
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = obj.width;
            ctx.lineCap = 'round';
            ctx.stroke();
        } else if (obj.type === 'text') {
            ctx.font = obj.font;
            ctx.fillStyle = obj.color;
            ctx.textBaseline = 'top';
            ctx.fillText(obj.content, obj.x, obj.y);
        }
    }
}

async function redrawAnnotations(pageNumber) {
    annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    const pageAnnotations = annotations[pageNumber] || [];
    
    await renderAnnotationsToContext(pageAnnotations, annotationCtx, annotationCanvas.width, annotationCanvas.height);

    // Dibujar el path actual si se está dibujando
    if (isDrawing && currentPath.length > 1) {
        annotationCtx.beginPath();
        annotationCtx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
            annotationCtx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        annotationCtx.strokeStyle = drawColorInput.value;
        annotationCtx.lineWidth = drawWidthSelect.value;
        annotationCtx.lineCap = 'round';
        annotationCtx.stroke();
    }

    // Resaltar el objeto seleccionado
    if (selectedObject && selectedObject.type === 'text') {
        annotationCtx.font = selectedObject.font;
        const metrics = annotationCtx.measureText(selectedObject.content);
        const height = parseInt(selectedObject.font, 10);
        annotationCtx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
        annotationCtx.lineWidth = 2;
        annotationCtx.strokeRect(selectedObject.x - 2, selectedObject.y - 2, metrics.width + 4, height + 4);
    }
}

function clearCurrentPage() {
    if (confirm('¿Estás seguro de que quieres borrar todas las anotaciones de esta página?')) {
        annotations[pageNum] = [];
        selectedObject = null;
        delete annotations[pageNum];
        redrawAnnotations(pageNum);
    }
}

function setTool(tool) {
    currentTool = tool;
    if (tool === 'draw') {
        drawToolBtn.classList.add('active');
        textToolBtn.classList.remove('active');
        selectToolBtn.classList.remove('active');
        annotationCanvas.style.cursor = 'crosshair';
    } else if (tool === 'text') {
        textToolBtn.classList.add('active');
        drawToolBtn.classList.remove('active');
        selectToolBtn.classList.remove('active');
        annotationCanvas.style.cursor = 'text';
    } else if (tool === 'select') {
        selectToolBtn.classList.add('active');
        textToolBtn.classList.remove('active');
        drawToolBtn.classList.remove('active');
        annotationCanvas.style.cursor = 'default';
    }
    selectedObject = null;
    redrawAnnotations(pageNum);
}

function setupAnnotationListeners() {
    annotationCanvas.addEventListener('mousedown', handleMouseDown);
    annotationCanvas.addEventListener('mousemove', handleMouseMove);
    annotationCanvas.addEventListener('mouseup', handleMouseUp);
    annotationCanvas.addEventListener('mouseout', handleMouseUp); // Termina la acción si el ratón sale
    annotationCanvas.addEventListener('click', handleMouseClick);
    annotationCanvas.addEventListener('dblclick', handleDoubleClick);
    
    // Listener de teclado en la ventana para la tecla Supr
    window.addEventListener('keydown', handleKeyDown);

    selectToolBtn.addEventListener('click', () => setTool('select'));
    textToolBtn.addEventListener('click', () => setTool('text'));
    drawToolBtn.addEventListener('click', () => setTool('draw'));

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
        selectedObject = null;
        queueRenderPage(pageNum);
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

    selectToolBtn = document.getElementById('pdfSelectTool');
    textToolBtn = document.getElementById('pdfTextTool');
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
    setTool('select'); // Herramienta inicial
}