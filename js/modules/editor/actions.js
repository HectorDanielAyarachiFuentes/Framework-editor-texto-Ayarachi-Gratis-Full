// js/modules/editor/actions.js
import { executeCommand } from './commands.js';
import { updateWordCount } from './wordCount.js';
import { findParentTag, getParagraph } from './utils.js';
import { openSourceCodeModal } from '../ui/sourceModal.js';
import { openPdfViewer } from '../ui/pdfViewer.js';
import { updateMarginMarkersPosition } from '../rulers/marginMarkers.js';
import { setTheme } from '../ui/theme.js';
import { closeAllMenus } from '../ui/menu.js';

let editor;

const actionHandlers = {
    newDocument: () => {
        if (confirm('¿Estás seguro de que quieres iniciar un nuevo documento?')) {
            editor.innerHTML = '<p>¡Bienvenido a Ayarachi!</p>';
            updateWordCount();
        }
    },
    openFile: () => {
        // Dispara el input de archivo oculto
        const fileOpener = document.getElementById('file-opener');
        if (fileOpener) fileOpener.click();
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
        const row = findParentTag('TR', editor);
        if (row) {
            row.remove();
        } else {
            alert('Por favor, coloca el cursor en la fila que deseas eliminar.');
        }
    },
    deleteTableColumn: () => {
        const cell = findParentTag('TD', editor) || findParentTag('TH', editor);
        if (cell) {
            const cellIndex = cell.cellIndex;
            const table = findParentTag('TABLE', editor);
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
        const table = findParentTag('TABLE', editor);
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
        const blockElement = getParagraph(editor);
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
    },
    setPageBackground: () => {
        const editorBody = document.querySelector('.editor-body');
        const imageUrl = prompt('Introduce la URL de la imagen de fondo (deja en blanco para quitarla):');
        if (imageUrl !== null) { // Permite una cadena vacía para eliminar la imagen
            editorBody.style.backgroundImage = imageUrl ? `url('${imageUrl}')` : '';
            editorBody.style.backgroundSize = imageUrl ? 'cover' : '';
            editorBody.style.backgroundRepeat = imageUrl ? 'no-repeat' : '';
            editorBody.style.backgroundPosition = imageUrl ? 'center' : '';
            localStorage.setItem('ayarachiEditorBackground', imageUrl);
        }
    },
    setAppBackground: () => {
        const imageUrl = prompt('Introduce la URL de la imagen de fondo para la aplicación (deja en blanco para quitarla):');
        if (imageUrl !== null) { // Permite una cadena vacía para eliminar la imagen
            document.body.style.backgroundImage = imageUrl ? `url('${imageUrl}')` : '';
            document.body.style.backgroundSize = imageUrl ? 'cover' : '';
            document.body.style.backgroundRepeat = imageUrl ? 'no-repeat' : '';
            document.body.style.backgroundPosition = imageUrl ? 'center' : '';
            document.body.style.backgroundAttachment = imageUrl ? 'fixed' : '';
            // Guardar la URL en el almacenamiento local
            localStorage.setItem('ayarachiAppBackground', imageUrl);
        }
    }
    ,
    setTheme: (element) => {
        setTheme(element.dataset.theme);
    }
};

/**
 * Inicializa el manejador para el input de abrir archivo.
 */
function initFileOpener() {
    const fileOpener = document.getElementById('file-opener');
    editor = document.getElementById('editor');

    if (!fileOpener) return;

    fileOpener.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                // mammoth is available globally from the script tag in index.html
                mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                    .then(result => {
                        editor.innerHTML = result.value;
                        updateWordCount();
                    })
                    .catch(err => {
                        console.error("Error al procesar el archivo .docx:", err);
                        alert("Hubo un error al intentar leer el archivo .docx.");
                    });
            };
            reader.readAsArrayBuffer(file);
        } else if (fileName.endsWith('.pdf')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                openPdfViewer(e.target.result);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Tipo de archivo no soportado. Solo se pueden abrir archivos .docx y .pdf.');
        }

        // Limpiar el valor para poder abrir el mismo archivo de nuevo
        event.target.value = '';
    });
}

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

    initFileOpener();
}
