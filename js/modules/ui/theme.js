// js/modules/ui/theme.js

export function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('ayarachiTheme', themeName);
}

export function loadTheme() {
    const savedTheme = localStorage.getItem('ayarachiTheme') || 'light';
    setTheme(savedTheme);
}
