// js/modules/editor/utils.js

/**
 * Encuentra el elemento padre con una etiqueta específica a partir de la selección actual.
 * @param {string} tagName - La etiqueta a buscar (ej. 'TABLE', 'TR').
 * @returns {HTMLElement|null} El elemento encontrado o null.
 */
export function findParentTag(tagName) {
    const editor = document.getElementById('editor');
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    let node = selection.getRangeAt(0).startContainer;
    let element = node.nodeType === 3 ? node.parentNode : node;

    while (element && element !== editor && element.tagName !== tagName.toUpperCase()) {
        element = element.parentNode;
        if (!editor.contains(element)) return null;
    }
    
    return (element && element.tagName === tagName.toUpperCase()) ? element : null;
}

/**
 * Obtiene el párrafo o bloque de texto actual donde está el cursor.
 * @returns {HTMLElement|null} El elemento de bloque encontrado o null.
 */
export function getParagraph() {
    const editor = document.getElementById('editor');
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    let node = selection.focusNode; // Usar focusNode es más robusto
    let element = node.nodeType === 3 ? node.parentNode : node;

    while (element && element !== editor && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'].includes(element.tagName)) {
        element = element.parentNode;
    }

    return (element && editor.contains(element)) ? element : null;
}