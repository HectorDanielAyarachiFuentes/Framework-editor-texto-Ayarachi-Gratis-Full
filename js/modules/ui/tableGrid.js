// js/modules/ui/tableGrid.js
import { executeCommand } from '../editor/commands.js';
import { closeAllMenus } from './menus.js';

/**
 * Inicializa el selector de cuadrícula para insertar tablas.
 */
export function initTableGrid() {
    const gridPicker = document.getElementById('tableGridPicker');
    const gridSizeDisplay = document.getElementById('tableGridSize');

    if (!gridPicker || !gridSizeDisplay) return;

    // Crear las celdas de la cuadrícula
    const gridFragment = document.createDocumentFragment();
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            const cell = document.createElement('div');
            cell.dataset.row = i;
            cell.dataset.col = j;
            gridFragment.appendChild(cell);
        }
    }
    gridPicker.appendChild(gridFragment);

    // Evento para resaltar la selección
    gridPicker.addEventListener('mouseover', e => {
        if (!e.target.dataset.row) return;

        const rows = parseInt(e.target.dataset.row, 10) + 1;
        const cols = parseInt(e.target.dataset.col, 10) + 1;
        gridSizeDisplay.textContent = `${cols}x${rows}`;

        gridPicker.querySelectorAll('div').forEach(cell => {
            const cellRow = parseInt(cell.dataset.row, 10);
            const cellCol = parseInt(cell.dataset.col, 10);
            cell.classList.toggle('highlight', cellRow < rows && cellCol < cols);
        });
    });
    
    // Evento para limpiar al salir
    gridPicker.addEventListener('mouseleave', () => {
         gridSizeDisplay.textContent = '0x0';
         gridPicker.querySelectorAll('div').forEach(cell => cell.classList.remove('highlight'));
    });

    // Evento para insertar la tabla al hacer clic
    gridPicker.addEventListener('click', e => {
        if (e.target.dataset.row) {
            const rows = parseInt(e.target.dataset.row, 10) + 1;
            const cols = parseInt(e.target.dataset.col, 10) + 1;
            insertTable(rows, cols);
        }
    });
}

/**
 * Inserta una tabla HTML en el editor.
 * @param {number} rows - Número de filas.
 * @param {number} cols - Número de columnas.
 */
function insertTable(rows, cols) {
    if (rows <= 0 || cols <= 0) return;

    let tableHtml = '<table border="1" style="width: 100%; border-collapse: collapse;"><tbody>';
    for (let i = 0; i < rows; i++) {
        tableHtml += '<tr>';
        for (let j = 0; j < cols; j++) {
            tableHtml += '<td><p><br></p></td>';
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';
    
    executeCommand('insertHTML', tableHtml);
    closeAllMenus();
}