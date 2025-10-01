document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');

    // --- INICIALIZACIÓN DE LAS REGLAS ---
    initRulers();

    // --- FUNCIONES BÁSICAS DEL EDITOR ---
    const executeCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editor.focus();
    };

    // --- MANEJO DE LA BARRA DE HERRAMIENTAS Y MENÚS ---
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

    // --- FUNCIÓN AUXILIAR PARA ENCONTRAR ELEMENTOS PADRE ---
    const findParentTag = (tagName, rootNode = editor) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;
        let node = selection.getRangeAt(0).startContainer;
        let element = node.nodeType === 3 ? node.parentNode : node;
        while (element && element !== rootNode && element.tagName !== tagName.toUpperCase()) {
            element = element.parentNode;
            if (!rootNode.contains(element)) return null; // No salir del editor
        }
        return (element && element.tagName === tagName.toUpperCase()) ? element : null;
    };

    // --- LÓGICA DE ACCIONES ESPECÍFICAS ---
    const actionHandlers = {
        newDocument: () => {
            if (confirm('¿Estás seguro de que quieres iniciar un nuevo documento?')) {
                editor.innerHTML = '<p>¡Bienvenido a Ayarachi!</p>';
                updateWordCount();
            }
        },
        fullscreen: () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        },
        print: () => window.print(),
        createLink: () => {
            const url = prompt('Introduce la URL:');
            if (url) executeCommand('createLink', url);
        },
        insertImage: () => {
            const imageUrl = prompt('Introduce la URL de la imagen:');
            if (imageUrl) executeCommand('insertImage', imageUrl);
        },
        sourceCode: () => {
            sourceCodeTextarea.value = editor.innerHTML;
            modal.style.display = 'flex';
        },
        wordCount: () => {
            const text = editor.innerText || editor.textContent;
            const words = text.match(/\b\w+\b/g) || [];
            const charCount = text.length;
            alert(`Conteo de palabras: ${words.length}\nConteo de caracteres: ${charCount}`);
        },
        deleteTableRow: () => {
            const row = findParentTag('TR');
            if (row) {
                row.parentNode.removeChild(row);
            } else {
                alert('Por favor, coloca el cursor en la fila que deseas eliminar.');
            }
        },
        deleteTableColumn: () => {
            const cell = findParentTag('TD') || findParentTag('TH');
            if (cell) {
                const cellIndex = cell.cellIndex;
                const table = findParentTag('TABLE');
                if (table) {
                    for (const row of table.rows) {
                        if (row.cells[cellIndex]) {
                            row.deleteCell(cellIndex);
                        }
                    }
                }
            } else {
                alert('Por favor, coloca el cursor en la columna que deseas eliminar.');
            }
        },
        deleteTable: () => {
            const table = findParentTag('TABLE');
            if (table) {
                if (confirm('¿Estás seguro de que quieres eliminar esta tabla?')) {
                    table.parentNode.removeChild(table);
                }
            } else {
                alert('Por favor, coloca el cursor dentro de una tabla para eliminarla.');
            }
        },
        applyStyle: (element) => {
            const style = element.dataset.style;
            if (!style) return;
    
            executeCommand('formatBlock', '<p>');
    
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let container = selection.getRangeAt(0).startContainer;
                let blockElement = container.nodeType === 3 ? container.parentNode : container;
    
                while (blockElement && blockElement !== editor && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'].includes(blockElement.tagName)) {
                    blockElement = blockElement.parentNode;
                }
    
                if (blockElement && editor.contains(blockElement)) {
                    blockElement.classList.toggle(`style-${style}`);
                }
            }
        },
        setPageSize: (element) => {
            const size = element.dataset.size;
            editor.classList.remove('page-view', 'page-A4', 'page-Letter', 'page-Legal', 'page-A5');
            if (size !== 'auto') {
                editor.classList.add('page-view');
                editor.classList.add(`page-${size}`);
            }
        }
    };

    document.querySelectorAll('[data-action]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const action = element.dataset.action;
            if (actionHandlers[action]) {
                actionHandlers[action](element);
            }
            closeAllMenus();
        });
    });

    // --- CONTADOR DE PALABRAS ---
    const wordCountDisplay = document.getElementById('wordCountDisplay');
    const updateWordCount = () => {
        const text = editor.innerText || editor.textContent;
        const words = text.match(/\b\w+\b/g) || [];
        const count = words.length;
        wordCountDisplay.textContent = `${count} palabra${count === 1 ? '' : 's'}`;
    };
    editor.addEventListener('input', updateWordCount);
    updateWordCount();

    // --- MODAL DE CÓDIGO FUENTE ---
    const modal = document.getElementById('sourceCodeModal');
    const sourceCodeTextarea = document.getElementById('sourceCodeTextarea');
    const closeModal = () => modal.style.display = 'none';
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelSourceCode').addEventListener('click', closeModal);
    document.getElementById('saveSourceCode').addEventListener('click', () => {
        editor.innerHTML = sourceCodeTextarea.value;
        updateWordCount();
        closeModal();
    });
    
    // --- SELECTOR DE CUADRÍCULA DE TABLA ---
    const gridPicker = document.getElementById('tableGridPicker');
    const gridSizeDisplay = document.getElementById('tableGridSize');
    if (gridPicker) {
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

        gridPicker.addEventListener('mouseover', e => {
            if (e.target.dataset.row) {
                const rows = parseInt(e.target.dataset.row, 10) + 1;
                const cols = parseInt(e.target.dataset.col, 10) + 1;
                gridSizeDisplay.textContent = `${cols}x${rows}`;
                gridPicker.querySelectorAll('div').forEach(cell => {
                    const cellRow = parseInt(cell.dataset.row, 10);
                    const cellCol = parseInt(cell.dataset.col, 10);
                    cell.classList.toggle('highlight', cellRow < rows && cellCol < cols);
                });
            }
        });
        
        gridPicker.addEventListener('mouseleave', () => {
             gridSizeDisplay.textContent = '0x0';
             gridPicker.querySelectorAll('div').forEach(cell => cell.classList.remove('highlight'));
        });

        const insertTable = (rows, cols) => {
            if (rows > 0 && cols > 0) {
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
        };

        gridPicker.addEventListener('click', e => {
            if (e.target.dataset.row) {
                const rows = parseInt(e.target.dataset.row, 10) + 1;
                const cols = parseInt(e.target.dataset.col, 10) + 1;
                insertTable(rows, cols);
            }
        });
    }

    // --- LÓGICA PARA ABRIR Y CERRAR MENÚS ---
    const menuButtons = document.querySelectorAll('.menu-button');
    const closeAllMenus = () => {
        menuButtons.forEach(button => {
            button.classList.remove('active');
            if (button.nextElementSibling) {
                button.nextElementSibling.classList.remove('show');
            }
        });
    };

    menuButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const dropdown = button.nextElementSibling;
            const wasActive = button.classList.contains('active');
            closeAllMenus();
            if (!wasActive && dropdown) {
                button.classList.add('active');
                dropdown.classList.add('show');
            }
        });
    });

    window.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-item')) {
            closeAllMenus();
        }
    });

    // --- LÓGICA DE LAS REGLAS CON NÚMEROS (VERSIÓN FINAL) ---
    function initRulers() {
        const rulerH = document.querySelector('.ruler-h');
        const rulerV = document.querySelector('.ruler-v');
        const numbersH = document.querySelector('.ruler-numbers-h');
        const numbersV = document.querySelector('.ruler-numbers-v');
        const editor = document.getElementById('editor');

        const PX_PER_CM = 37.795;

        const drawRulers = () => {
            // Limpiar números existentes
            numbersH.innerHTML = '';
            numbersV.innerHTML = '';

            // ***** INICIO DE LA CORRECCIÓN CLAVE *****
            // Hacemos que la regla vertical y horizontal sean tan grandes como el contenido del editor.
            // Esto asegura que haya espacio suficiente para dibujar todos los números.
            const contentHeight = editor.scrollHeight;
            const contentWidth = editor.scrollWidth;

            rulerV.style.height = `${contentHeight}px`;
            // ***** FIN DE LA CORRECCIÓN CLAVE *****

            // Calculamos los números a dibujar
            const totalWidth = contentWidth + editor.clientWidth;
            const totalHeight = contentHeight + editor.clientHeight;
            
            // Dibujar regla horizontal
            const editorWidthInCm = totalWidth / PX_PER_CM;
            for (let i = 1; i < editorWidthInCm; i++) {
                const number = document.createElement('span');
                number.textContent = i;
                number.style.left = `${(i * PX_PER_CM) + 2}px`;
                numbersH.appendChild(number);
            }

            // Dibujar regla vertical
            const editorHeightInCm = totalHeight / PX_PER_CM;
            for (let i = 1; i < editorHeightInCm; i++) {
                const number = document.createElement('span');
                number.textContent = i;
                number.style.top = `${i * PX_PER_CM}px`;
                numbersV.appendChild(number);
            }
        };

        const syncRulers = () => {
            // Sincronizar el scroll
            const scrollLeft = editor.scrollLeft;
            const scrollTop = editor.scrollTop;

            rulerH.style.backgroundPosition = `-${scrollLeft}px center, -${scrollLeft}px center, -${scrollLeft}px center`;
            numbersH.style.transform = `translateX(-${scrollLeft}px)`;

            rulerV.style.backgroundPosition = `center -${scrollTop}px, center -${scrollTop}px, center -${scrollTop}px`;
            numbersV.style.transform = `translateY(-${scrollTop}px)`;
        };
        
        drawRulers();
        editor.addEventListener('scroll', syncRulers);
        
        const resizeObserver = new ResizeObserver(drawRulers);
        resizeObserver.observe(editor);
    }
});