
// Módulo para gestionar el cambio de tema (claro/oscuro)

/**
 * Actualiza el menú de temas para marcar como activo el tema seleccionado.
 * @param {string} themeName - El nombre del tema activo.
 */
function updateThemeMenu(themeName) {
    const themeItems = document.querySelectorAll('[data-action="setTheme"]');
    themeItems.forEach(item => {
        if (item.dataset.theme === themeName) {
            item.classList.add('active-theme');
        } else {
            item.classList.remove('active-theme');
        }
    });
}

/**
 * Aplica un tema específico al documento.
 * @param {string} themeName - El nombre del tema a aplicar (ej. 'light', 'dark', 'xp').
 */
function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    updateThemeMenu(themeName);
}

/**
 * Aplica el tema guardado en localStorage o el tema 'light' por defecto.
 */
function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// Inicializar el tema al cargar la página
document.addEventListener('DOMContentLoaded', applyInitialTheme);

// Exponer las funciones para que puedan ser llamadas desde otros módulos
export { setTheme };
