// js/modules/rulers/indentMarkers.js
import { getParagraph } from '../editor/utils.js';

const PX_PER_CM = 37.795;
const RULER_OFFSET = 25;
let editor;
let firstLineMarker, hangingMarker, leftMarker, rightMarker;

function updateMarkersPosition() {
    const p = getParagraph();
    const editorStyle = window.getComputedStyle(editor);
    const editorPaddingLeft = parseFloat(editorStyle.paddingLeft);
    const editorPaddingRight = parseFloat(editorStyle.paddingRight);
    const editorWidth = editor.clientWidth - editorPaddingLeft - editorPaddingRight;

    let firstLinePos = 0, hangingPos = 0, rightPos = editorWidth;

    if (p) {
        const style = window.getComputedStyle(p);
        const textIndent = parseFloat(style.textIndent) || 0;
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginRight = parseFloat(style.marginRight) || 0;

        firstLinePos = marginLeft + textIndent;
        hangingPos = marginLeft;
        rightPos = editorWidth - marginRight;
    }

    firstLineMarker.style.left = `${firstLinePos + RULER_OFFSET}px`;
    hangingMarker.style.left = `${hangingPos + RULER_OFFSET}px`;
    leftMarker.style.left = `${hangingPos + RULER_OFFSET}px`;
    rightMarker.style.left = `${rightPos + RULER_OFFSET}px`;
}

function startDrag(e) {
    e.preventDefault();
    const currentParagraph = getParagraph();
    if (!currentParagraph) return;

    const draggedMarker = e.target;
    const startX = e.clientX;
    const initialPositions = {
        firstLine: parseFloat(firstLineMarker.style.left) || RULER_OFFSET,
        left: parseFloat(leftMarker.style.left) || RULER_OFFSET,
        right: parseFloat(rightMarker.style.left) || (editor.clientWidth - parseFloat(window.getComputedStyle(editor).paddingRight) + RULER_OFFSET)
    };

    function onDrag(e) {
        const dx = e.clientX - startX;
        let { firstLine: newFirstLinePos, left: newLeftPos, right: newRightPos } = initialPositions;

        switch (draggedMarker.id) {
            case 'indent-first-line':
                newFirstLinePos += dx;
                break;
            case 'indent-hanging':
                newLeftPos += dx;
                newFirstLinePos = newLeftPos + (initialPositions.firstLine - initialPositions.left);
                break;
            case 'indent-left':
                newLeftPos += dx;
                newFirstLinePos += dx;
                break;
            case 'indent-right':
                newRightPos += dx;
                break;
        }

        firstLineMarker.style.left = `${newFirstLinePos}px`;
        hangingMarker.style.left = `${newLeftPos}px`;
        leftMarker.style.left = `${newLeftPos}px`;
        rightMarker.style.left = `${newRightPos}px`;

        applyIndentToParagraph(currentParagraph, newFirstLinePos, newLeftPos, newRightPos);
    }

    function endDrag() {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', endDrag);
        document.body.classList.remove('is-dragging');
        updateMarkersPosition(); // Resincronizar al final
    }

    document.body.classList.add('is-dragging');
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
}

function applyIndentToParagraph(p, firstLinePos, leftPos, rightPos) {
    const editorStyle = window.getComputedStyle(editor);
    const editorWidth = editor.clientWidth - parseFloat(editorStyle.paddingLeft) - parseFloat(editorStyle.paddingRight);
    
    const gridSize = PX_PER_CM / 10; // Ajuste a la grilla de 1mm
    const newMarginLeft = Math.round((leftPos - RULER_OFFSET) / gridSize) * gridSize;
    const newFirstLineIndent = Math.round((firstLinePos - RULER_OFFSET) / gridSize) * gridSize;
    const newRightPos = Math.round((rightPos - RULER_OFFSET) / gridSize) * gridSize;
    
    const newTextIndent = newFirstLineIndent - newMarginLeft;
    const newMarginRight = editorWidth - newRightPos;

    p.style.marginLeft = `${Math.max(0, newMarginLeft)}px`;
    p.style.textIndent = `${newTextIndent}px`;
    p.style.marginRight = `${Math.max(0, newMarginRight)}px`;
}

export function initIndentMarkers() {
    editor = document.getElementById('editor');
    firstLineMarker = document.getElementById('indent-first-line');
    hangingMarker = document.getElementById('indent-hanging');
    leftMarker = document.getElementById('indent-left');
    rightMarker = document.getElementById('indent-right');

    if (!editor || !firstLineMarker) return;

    let selectionTimeout;
    document.addEventListener('selectionchange', () => {
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(updateMarkersPosition, 10);
    });
    editor.addEventListener('keyup', updateMarkersPosition);
    updateMarkersPosition();

    [firstLineMarker, hangingMarker, leftMarker, rightMarker].forEach(marker => {
        marker.addEventListener('mousedown', startDrag);
    });

    editor.addEventListener('scroll', () => {
        const scrollLeft = editor.scrollLeft;
        [firstLineMarker, hangingMarker, leftMarker, rightMarker].forEach(marker => {
            marker.style.transform = `translateX(-${scrollLeft}px)`;
        });
    });
}