// js/modules/editor/wordCount.js

let editor;
let wordCountDisplay;

/**
 * Actualiza el texto del contador de palabras.
 */
export function updateWordCount() {
    if (!editor || !wordCountDisplay) return;
    const text = editor.innerText || editor.textContent;
    const words = text.match(/\b\w+\b/g) || [];
    const count = words.length;
    wordCountDisplay.textContent = `${count} palabra${count === 1 ? '' : 's'}`;
}

/**
 * Inicializa el contador de palabras.
 */
export function initWordCount() {
    editor = document.getElementById('editor');
    wordCountDisplay = document.getElementById('wordCountDisplay');

    if (editor && wordCountDisplay) {
        editor.addEventListener('input', updateWordCount);
        updateWordCount(); // Llamada inicial
    }
}