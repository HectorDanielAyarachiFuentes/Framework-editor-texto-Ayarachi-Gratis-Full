
// Módulo para gestionar el cambio de tema (claro/oscuro)

// Función para aplicar el tema guardado o el predeterminado
function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Función para alternar el tema
function toggleTheme() {
    let currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Función para inicializar el botón de cambio de tema
function initTheme() {
    const themeToggleButton = document.querySelector('[data-action="toggleTheme"]');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }
}

// Inicializar el tema al cargar la página
applyInitialTheme();

// Exponer las funciones para que puedan ser llamadas desde otros módulos
export { initTheme, toggleTheme };
