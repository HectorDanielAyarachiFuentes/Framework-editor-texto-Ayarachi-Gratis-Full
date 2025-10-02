// js/app.js

// Importaciones de UI
import { initMenus } from './modules/ui/menus.js';
import { initTableGrid } from './modules/ui/tableGrid.js';
import { initSourceCodeModal } from './modules/ui/sourceModal.js';
import { initTheme } from './modules/ui/theme.js';
import { initPdfViewer } from './modules/ui/pdfViewer.js';

// Importaciones de Reglas y Marcadores
import { initRulers } from './modules/rulers/rulers.js';
import { initIndentMarkers } from './modules/rulers/indentMarkers.js';
import { initMarginMarkers } from './modules/rulers/marginMarkers.js';

// Importaciones del Editor
import { initToolbarCommands } from './modules/editor/commands.js';
import { initActions } from './modules/editor/actions.js';
import { initWordCount } from './modules/rulers/wordCount.js';

/**
 * Carga y aplica la imagen de fondo de la aplicación desde el almacenamiento local.
 */
function loadAppBackground() {
    const imageUrl = localStorage.getItem('ayarachiAppBackground');
    if (imageUrl) {
        document.body.style.backgroundImage = `url('${imageUrl}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    }
}

/**
 * Carga y aplica la imagen de fondo del área de escritura desde el almacenamiento local.
 */
function loadEditorBackground() {
    const imageUrl = localStorage.getItem('ayarachiEditorBackground');
    if (imageUrl) {
        const editorBody = document.querySelector('.editor-body');
        editorBody.style.backgroundImage = `url('${imageUrl}')`;
        editorBody.style.backgroundSize = 'cover';
        editorBody.style.backgroundRepeat = 'no-repeat';
        editorBody.style.backgroundPosition = 'center';
    }
}

// Esperar a que el DOM esté completamente cargado para inicializar todo
document.addEventListener('DOMContentLoaded', () => {
    // UI
    initMenus();
    initTableGrid();
    initSourceCodeModal();
    initPdfViewer();
    initTheme();
    loadAppBackground(); // Cargar el fondo de la aplicación
    loadEditorBackground(); // Cargar el fondo del editor

    // Reglas
    initRulers();
    initIndentMarkers();
    initMarginMarkers();

    // Editor
    initToolbarCommands();
    initActions();
    initWordCount();

    console.log('Editor Ayarachi inicializado.');
});