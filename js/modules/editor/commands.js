// js/modules/editor/commands.js
import { closeAllMenus } from '../ui/menu.js';

let editor;

export function executeCommand(command, value = null) {
    document.execCommand(command, false, value);
    if(editor) {
        editor.focus();
    }
}

export function initToolbarCommands() {
    editor = document.getElementById('editor');

    document.querySelectorAll('.toolbar-button[data-command], .dropdown-item[data-command]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const command = button.dataset.command;
            executeCommand(command);
            closeAllMenus();
        });
    });

    document.querySelectorAll('.toolbar-select[data-command]').forEach(select => {
        select.addEventListener('change', () => {
            const command = select.dataset.command;
            executeCommand(command, select.value);
        });
    });
    
    document.getElementById('fontSizeSelect').addEventListener('change', function() {
        executeCommand('fontSize', this.value);
    });

    document.querySelectorAll('input[type="color"][data-command]').forEach(input => {
        input.addEventListener('input', () => {
            const command = input.dataset.command;
            executeCommand(command, input.value);
        });
    });
}
