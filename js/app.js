// js/app.js

// Importaciones de UI
import { initMenus } from './modules/ui/menus.js';
import { initTableGrid } from './modules/ui/tableGrid.js';
import { initSourceCodeModal } from './modules/ui/sourceModal.js';

// Importaciones de Reglas y Marcadores
import { initRulers } from './modules/rulers/rulers.js';
import { initIndentMarkers } from './modules/rulers/indentMarkers.js';
import { initMarginMarkers } from './modules/rulers/marginMarkers.js';

// Importaciones del Editor
import { initToolbarCommands } from './modules/editor/commands.js';
import { initActions } from './modules/editor/actions.js';
import { initWordCount } from './modules/rulers/wordCount.js';

// Esperar a que el DOM esté completamente cargado para inicializar todo
document.addEventListener('DOMContentLoaded', () => {
    // UI
    initMenus();
    initTableGrid();
    initSourceCodeModal();

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