// js/modules/ui/sourceModal.js
import { updateWordCount } from '../rulers/wordCount.js';

let modal, sourceCodeTextarea, editor;

function closeModal() {
    if (modal) modal.style.display = 'none';
}

function saveSourceCode() {
    editor.innerHTML = sourceCodeTextarea.value;
    updateWordCount();
    closeModal();
}

/**
 * Abre la ventana modal con el código fuente del editor.
 */
export function openSourceCodeModal() {
    if (!modal || !sourceCodeTextarea || !editor) return;
    sourceCodeTextarea.value = editor.innerHTML;
    modal.style.display = 'flex';
}

/**
 * Inicializa la ventana modal de código fuente.
 */
export function initSourceCodeModal() {
    modal = document.getElementById('sourceCodeModal');
    sourceCodeTextarea = document.getElementById('sourceCodeTextarea');
    editor = document.getElementById('editor');

    if (!modal) return;

    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelSourceCode')?.addEventListener('click', closeModal);
    document.getElementById('saveSourceCode')?.addEventListener('click', saveSourceCode);
}