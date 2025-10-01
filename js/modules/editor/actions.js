// js/modules/editor/actions.js
import { executeCommand } from './commands.js';
import { updateWordCount } from '../rulers/wordCount.js';
import { findParentTag, getParagraph } from './utils.js';
import { openSourceCodeModal } from '../ui/sourceModal.js';
import { updateMarginMarkersPosition } from '../rulers/marginMarkers.js';
import { closeAllMenus } from '../ui/menus.js';

let editor;

const actionHandlers = {
    newDocument: () => {
        if (confirm('¿Estás seguro de que quieres iniciar un nuevo documento?')) {
            editor.innerHTML = '<p>¡Bienvenido a Ayarachi!</p>';
            updateWordCount();
        }
    },
    fullscreen: () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    },
    print: () => window.print(),
    createLink: () => {
        const url = prompt('Introduce la URL:');
        if (url) executeCommand('createLink', url);
    },
    insertImage: () => {
        const imageUrl = prompt('Introduce la URL de la imagen:');
        if (imageUrl) executeCommand('insertImage', imageUrl);
    },
    sourceCode: () => {
        openSourceCodeModal();
    },
    wordCount: () => {
        const text = editor.innerText || editor.textContent;
        const words = text.match(/\b\w+\b/g) || [];
        const charCount = text.length;
        alert(`Conteo de palabras: ${words.length}\nConteo de caracteres: ${charCount}`);
    },
    deleteTableRow: () => {
        const row = findParentTag('TR');
        if (row) {
            row.remove();
        } else {
            alert('Por favor, coloca el cursor en la fila que deseas eliminar.');
        }
    },
    deleteTableColumn: () => {
        const cell = findParentTag('TD') || findParentTag('TH');
        if (cell) {
            const cellIndex = cell.cellIndex;
            const table = findParentTag('TABLE');
            if (table) {
                for (const row of table.rows) {
                    if (row.cells[cellIndex]) {
                        row.deleteCell(cellIndex);
                    }
                }
            }
        } else {
            alert('Por favor, coloca el cursor en la columna que deseas eliminar.');
        }
    },
    deleteTable: () => {
        const table = findParentTag('TABLE');
        if (table && confirm('¿Estás seguro de que quieres eliminar esta tabla?')) {
            table.remove();
        } else if (!table) {
            alert('Por favor, coloca el cursor dentro de una tabla para eliminarla.');
        }
    },
    applyStyle: (element) => {
        const style = element.dataset.style;
        if (!style) return;
        executeCommand('formatBlock', '<p>');
        const blockElement = getParagraph();
        if (blockElement) {
            blockElement.classList.toggle(`style-${style}`);
        }
    },
    setPageSize: (element) => {
        const size = element.dataset.size;
        editor.className = editor.className.replace(/page-\w+/g, '').replace('page-view', '').trim();
        if (size !== 'auto') {
            editor.classList.add('page-view', `page-${size}`);
        }
        updateMarginMarkersPosition();
    }
};

/**
 * Inicializa los listeners para todos los elementos con `data-action`.
 */
export function initActions() {
    editor = document.getElementById('editor');
    document.querySelectorAll('[data-action]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const action = element.dataset.action;
            if (actionHandlers[action]) {
                actionHandlers[action](element);
            }
            closeAllMenus();
        });
    });
}