
// Módulo para gestionar el cambio de tema (claro/oscuro)

/**
 * Aplica un tema específico al documento.
 * @param {string} themeName - El nombre del tema a aplicar (ej. 'light', 'dark', 'xp').
 */
function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
}

/**
 * Aplica el tema guardado en localStorage o el tema 'light' por defecto.
 */
function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// Inicializar el tema al cargar la página
applyInitialTheme();

// Exponer las funciones para que puedan ser llamadas desde otros módulos
export { setTheme };
