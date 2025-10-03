// js/modules/rulers/marginMarkers.js
import { drawRulers } from './rulers.js';

let editor;
let editorBody;
let topMarker;

/**
 * Actualiza la posición del marcador de margen superior.
 */
export function updateMarginMarkersPosition() {
    if (!editor || !topMarker) return;
    
    topMarker.style.display = 'block';
    const editorStyle = window.getComputedStyle(editor);
    const paddingTop = parseFloat(editorStyle.paddingTop) || 0;
    topMarker.style.top = `${paddingTop}px`;
};

function startDrag(e) {
    e.preventDefault();
    const draggedMarker = e.target;
    const startY = e.clientY;
    const editorStyle = window.getComputedStyle(editor);
    const initialPadding = parseFloat(editorStyle.paddingTop) || 0;

    function onDrag(e) {
        const dy = e.clientY - startY;
        let newPaddingTop = Math.max(0, initialPadding + dy);

        draggedMarker.style.top = `${newPaddingTop}px`;
        editor.style.paddingTop = `${newPaddingTop}px`;
        editor.style.setProperty('--editor-padding-top', `${newPaddingTop}px`);
    }

    function endDrag() {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', endDrag);
        document.body.style.cursor = '';
        drawRulers(); // Redibujar las reglas para ajustar los números
    }
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.body.style.cursor = 'ns-resize';
}

/**
 * Inicializa los marcadores de margen.
 */
export function initMarginMarkers() {
    editor = document.getElementById('editor');
    editorBody = document.querySelector('.editor-body');
    topMarker = document.getElementById('margin-top');

    if (!editor || !editorBody || !topMarker) return;

    topMarker.addEventListener('mousedown', startDrag);

    // Sincronizar con el scroll del contenedor del editor
    editorBody.addEventListener('scroll', () => {
        const scrollTop = editorBody.scrollTop;
        topMarker.style.transform = `translateY(-${scrollTop}px)`;
    });

    const resizeObserver = new ResizeObserver(updateMarginMarkersPosition);
    resizeObserver.observe(editor);
    
    updateMarginMarkersPosition();
}