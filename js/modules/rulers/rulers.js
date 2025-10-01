// js/modules/rulers/rulers.js

// Variables a nivel de módulo para que sean accesibles por todas las funciones aquí.
let rulerH, rulerV, numbersH, numbersV, editor;
const PX_PER_CM = 37.795; // Píxeles por centímetro

/**
 * Dibuja los números y ajusta el tamaño de las reglas basado en el contenido del editor.
 * Se exporta porque el módulo de marcadores de margen necesita llamarla para redibujar
 * los números cuando el padding del editor cambia.
 */
export function drawRulers() {
    if (!editor) return;

    // Obtiene el padding-top actual desde la variable CSS para un cálculo preciso.
    const editorStyle = getComputedStyle(editor);
    const editorPaddingTop = parseFloat(editorStyle.getPropertyValue('--editor-padding-top')) || 0;
    
    // Limpiar números existentes para redibujar.
    numbersH.innerHTML = '';
    numbersV.innerHTML = '';

    // El tamaño de las reglas debe coincidir con el tamaño del contenido desplazable.
    const contentHeight = editor.scrollHeight;
    const contentWidth = editor.scrollWidth;

    rulerV.style.height = `${contentHeight}px`;

    // Calculamos el ancho y alto total para saber cuántos números dibujar.
    const totalWidth = contentWidth + editor.clientWidth;
    const totalHeight = contentHeight + editor.clientHeight;
    
    // Dibujar números en la regla horizontal.
    const editorWidthInCm = totalWidth / PX_PER_CM;
    for (let i = 1; i < editorWidthInCm; i++) {
        const number = document.createElement('span');
        number.textContent = i;
        // Se añade un offset de 25px para alinear con el inicio del editor, no de la regla.
        number.style.left = `${(i * PX_PER_CM) + 25 + 2}px`; 
        numbersH.appendChild(number);
    }

    // Dibujar números en la regla vertical.
    const editorHeightInCm = totalHeight / PX_PER_CM;
    for (let i = 1; i < editorHeightInCm; i++) {
        const number = document.createElement('span');
        number.textContent = i;
        // Se añade el offset del padding superior del editor.
        number.style.top = `${(i * PX_PER_CM) + editorPaddingTop}px`;
        numbersV.appendChild(number);
    }
    
    // Se asegura de que la posición esté sincronizada después de redibujar.
    syncRulers(); 
}

/**
 * Sincroniza la posición de las reglas y los números con el scroll del editor.
 * Esta función es interna del módulo y no necesita ser exportada.
 */
function syncRulers() {
    if (!editor) return;

    const scrollLeft = editor.scrollLeft;
    const scrollTop = editor.scrollTop;
    const editorStyle = getComputedStyle(editor);
    const editorPaddingTop = parseFloat(editorStyle.getPropertyValue('--editor-padding-top')) || 0;

    // Sincronizar regla horizontal: movemos el fondo y el contenedor de números.
    rulerH.style.backgroundPosition = `${25 - scrollLeft}px center, ${25 - scrollLeft}px center, ${25 - scrollLeft}px center`;
    numbersH.style.transform = `translateX(-${scrollLeft}px)`;

    // Sincronizar regla vertical: el fondo se desplaza restando el scroll al padding.
    rulerV.style.backgroundPosition = `center ${editorPaddingTop - scrollTop}px, center ${editorPaddingTop - scrollTop}px, center ${editorPaddingTop - scrollTop}px`;
    numbersV.style.transform = `translateY(-${scrollTop}px)`;
}

/**
 * Función principal de inicialización para las reglas.
 * Busca los elementos en el DOM y configura los event listeners.
 */
export function initRulers() {
    rulerH = document.querySelector('.ruler-h');
    rulerV = document.querySelector('.ruler-v');
    numbersH = document.querySelector('.ruler-numbers-h');
    numbersV = document.querySelector('.ruler-numbers-v');
    editor = document.getElementById('editor');
    
    if (!rulerH || !editor) {
        console.error("No se encontraron los elementos de las reglas o el editor.");
        return;
    }

    // Escuchar el evento de scroll del editor para sincronizar.
    editor.addEventListener('scroll', syncRulers);
    
    // Usar ResizeObserver para redibujar las reglas si el tamaño del editor cambia.
    const resizeObserver = new ResizeObserver(drawRulers);
    resizeObserver.observe(editor);
    
    // Dibujar las reglas por primera vez.
    drawRulers();
}