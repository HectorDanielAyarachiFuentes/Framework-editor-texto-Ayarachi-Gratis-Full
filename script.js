
        document.addEventListener('DOMContentLoaded', () => {
            const editor = document.getElementById('editor');

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
                deleteTable: () => {
                    const selection = window.getSelection();
                    if (!selection.rangeCount) return;
                    let node = selection.getRangeAt(0).startContainer;
                    let table = node.nodeType === 3 ? node.parentNode : node;
                    while (table && table.tagName !== 'TABLE') {
                        table = table.parentNode;
                    }
                    if (table) {
                        if (confirm('¿Estás seguro de que quieres eliminar esta tabla?')) {
                            table.parentNode.removeChild(table);
                        }
                    } else {
                        alert('Por favor, coloca el cursor dentro de una tabla para eliminarla.');
                    }
                },
            };

            document.querySelectorAll('[data-action]').forEach(element => {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = element.dataset.action;
                    if (actionHandlers[action]) {
                        actionHandlers[action]();
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
            updateWordCount(); // Llamada inicial

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
                for (let i = 0; i < 100; i++) { // 10x10 grid
                    const cell = document.createElement('div');
                    cell.dataset.row = Math.floor(i / 10);
                    cell.dataset.col = i % 10;
                    gridPicker.appendChild(cell);
                }

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
        });
