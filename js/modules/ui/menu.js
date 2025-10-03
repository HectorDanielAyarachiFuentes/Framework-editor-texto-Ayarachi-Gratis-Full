// js/modules/ui/menu.js

let menuButtons;

/**
 * Cierra todos los menús desplegables abiertos.
 */
export const closeAllMenus = () => {
    if (!menuButtons) return;
    menuButtons.forEach(button => {
        button.classList.remove('active');
        const dropdown = button.nextElementSibling;
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    });
};

/**
 * Inicializa la lógica para los botones de menú.
 */
export function initMenus() {
    menuButtons = document.querySelectorAll('.menu-button');

    menuButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const dropdown = button.nextElementSibling;
            const wasActive = button.classList.contains('active');
            
            closeAllMenus(); // Cierra otros antes de abrir uno nuevo

            if (!wasActive && dropdown) {
                button.classList.add('active');
                dropdown.classList.add('show');
            }
        });
    });

    // Cierra los menús si se hace clic fuera
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-item')) {
            closeAllMenus();
        }
    });
}