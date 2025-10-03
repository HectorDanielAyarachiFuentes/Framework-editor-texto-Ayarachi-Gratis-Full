// js/modules/editor/utils.js

export function findParentTag(tagName, rootNode) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    let node = selection.getRangeAt(0).startContainer;
    let element = node.nodeType === 3 ? node.parentNode : node;
    while (element && element !== rootNode && element.tagName !== tagName.toUpperCase()) {
        element = element.parentNode;
        if (rootNode && !rootNode.contains(element)) return null; // No salir del editor
    }
    return (element && element.tagName === tagName.toUpperCase()) ? element : null;
}

export function getParagraph(rootNode) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    let node = selection.focusNode;
    let element = node.nodeType === 3 ? node.parentNode : node;
    while (element && element !== rootNode && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'].includes(element.tagName)) {
        element = element.parentNode;
    }
    return (element && rootNode && rootNode.contains(element)) ? element : null;
}
