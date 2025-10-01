// js/modules/editor/commands.js

let editor;

/**
 * Ejecuta un comando de formato en el editor.
 * @param {string} command - El comando a ejecutar.
 * @param {string|null} value - El valor para el comando (si es necesario).
 */
export function executeCommand(command, value = null) {
    document.execCommand(command, false, value);
    if (editor) editor.focus();
}

/**
 * Inicializa los listeners para los botones y selectores de la barra de herramientas.
 */
export function initToolbarCommands() {
    editor = document.getElementById('editor');

    // Botones de comando
    document.querySelectorAll('.toolbar-button[data-command], .dropdown-item[data-command]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            executeCommand(button.dataset.command);
        });
    });

    // Selectores de comando (ej. Fuente)
    document.querySelectorAll('.toolbar-select[data-command]').forEach(select => {
        select.addEventListener('change', () => {
            executeCommand(select.dataset.command, select.value);
        });
    });
    
    // Selector de tamaño de fuente
    document.getElementById('fontSizeSelect')?.addEventListener('change', function() {
        executeCommand('fontSize', this.value);
    });

    // Selectores de color
    document.querySelectorAll('input[type="color"][data-command]').forEach(input => {
        input.addEventListener('input', () => {
            executeCommand(input.dataset.command, input.value);
        });
    });
}