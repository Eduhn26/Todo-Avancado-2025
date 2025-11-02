const elements = {
    todoForm: document.querySelector("#todo-form"),
    todoInput: document.querySelector("#todo-input"),
    todoCategory: document.querySelector("#todo-category"),
    editCategory: document.querySelector("#edit-category"),
    todoList: document.querySelector("#todo-list"),
    editForm: document.querySelector("#edit-form"),
    editInput: document.querySelector("#edit-input"),
    cancelEditBtn: document.querySelector("#cancel-edit-btn"),
    searchInput: document.querySelector("#search-input"),
    eraseBtn: document.querySelector("#erase-button"),
    filterBtn: document.querySelector("#filter-select"),
    todoDate: document.querySelector("#todo-date"),
    editDate: document.querySelector("#edit-date"),
    todayBtn: document.querySelector("#today-btn"),
    clearCompletedBtn: document.querySelector("#clear-completed-btn"),
    exportBtn: document.querySelector("#export-btn"),
    modal: document.querySelector("#confirmation-modal"),
    modalConfirm: document.querySelector("#modal-confirm"),
    modalCancel: document.querySelector("#modal-cancel"),
    modalMessage: document.querySelector("#modal-message"),
    totalTasks: document.getElementById('total-tasks'),
    completedTasks: document.getElementById('completed-tasks'),
    todoPriority: document.querySelector("#todo-priority"),
    editPriority: document.querySelector("#edit-priority"),
    sortPriorityBtn: document.querySelector("#sort-priority-btn")
};
let oldInputValue;
let pendingAction = null;

const utils = {
    formatDate: (dateString) => {
        if (!dateString) return 'Sem data';
        
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        
        return date.toLocaleDateString('pt-BR');
    },

    getTodayDate: () => new Date().toISOString().split('T')[0],

    isDateUrgent: (dateString) => {
        if (!dateString) return false;
        
        const [year, month, day] = dateString.split('-');
        const taskDate = new Date(year, month - 1, day);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);
        
        return taskDate >= today && taskDate <= threeDaysFromNow;
    },

    isDateUpcoming: (dateString) => {
        if (!dateString) return false;
        
        const [year, month, day] = dateString.split('-');
        const taskDate = new Date(year, month - 1, day);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);
        
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        
        return taskDate > threeDaysFromNow && taskDate <= sevenDaysFromNow;
    }
};

const state = {
    currentFilter: localStorage.getItem('currentFilter') || 'all',
    isLoading: false
};

const updateTodoUrgency = (todo, dueDate) => {
    todo.classList.remove("urgent", "upcoming");
    if (dueDate) {
        if (utils.isDateUrgent(dueDate)) {
            todo.classList.add("urgent");
        } else if (utils.isDateUpcoming(dueDate)) {
            todo.classList.add("upcoming");
        }
    }
};

const showLoading = () => {
    state.isLoading = true;
    document.body.classList.add('loading');
};

const hideLoading = () => {
    state.isLoading = false;
    document.body.classList.remove('loading');
};

const checkEmptyState = () => {
    const todos = document.querySelectorAll('.todo');
    const emptyState = document.querySelector('.empty-state');
    
    if (todos.length === 0 && !emptyState) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = `
            <i class="fa-solid fa-clipboard-list"></i>
            <h3>Nenhuma tarefa encontrada</h3>
            <p>Adicione sua primeira tarefa acima!</p>
        `;
        elements.todoList.appendChild(emptyDiv);
    } else if (todos.length > 0 && emptyState) {
        emptyState.remove();
    }
};

const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        background-color: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        position: fixed;
        top: 15px;
        right: 15px;
        padding: 0.8rem 1.2rem;
        color: white;
        border-radius: 20px;
        z-index: 1001;
        animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
        box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
        font-weight: 500;
        font-size: 0.8rem;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

const updateStats = () => {
    const todos = getTodosLocalStorage();
    const total = todos.length;
    const completed = todos.filter(todo => todo.done).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    elements.totalTasks.textContent = total;
    elements.completedTasks.textContent = completed;

     const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
     if (total > 0) {
        document.getElementById('todo-stats').classList.add('stats-update');
        setTimeout(() => {
            document.getElementById('todo-stats').classList.remove('stats-update');
        }, 300);
    }
};

const toggleStatsView = () => {
    const stats = document.getElementById('todo-stats');
    stats.classList.toggle('stats-mini');
    
    stats.style.transform = 'scale(0.98)';
    setTimeout(() => {
        stats.style.transform = '';
    }, 150);

        showNotification(stats.classList.contains('stats-mini') ? 
        'Modo compacto ativado' : 'Modo normal ativado', 'success');
};

const showConfirmation = (message, callback) => {
    elements.modalMessage.textContent = message;
    elements.modal.classList.remove('hide');
    pendingAction = callback;
};

const createTodoElement = (text, done = false, dueDate = null, category = "", priority = "media") => {
    const todo = document.createElement("div");
    todo.className = `todo ${done ? 'done' : ''} ${PRIORITY_MAP[priority].color}`;
    
    const todoContent = document.createElement("div");
    todoContent.className = "todo-content";
    
    const todoTitle = document.createElement("h3");
    todoTitle.textContent = text;
    todoContent.appendChild(todoTitle);
    
    const metaContainer = document.createElement("div");
    metaContainer.className = "todo-meta";
    
    const dateElement = document.createElement("span");
    dateElement.className = "todo-date";
    dateElement.textContent = `📅 ${utils.formatDate(dueDate)}`;
    metaContainer.appendChild(dateElement);
    
    const priorityElement = document.createElement("span");
    priorityElement.className = `todo-priority ${PRIORITY_MAP[priority].color}`;
    priorityElement.textContent = PRIORITY_MAP[priority].label;
    priorityElement.title = `Prioridade: ${priority}`;
    metaContainer.appendChild(priorityElement);
    
    if (category) {
        const categoryElement = document.createElement("span");
        categoryElement.className = `todo-category category-${category}`;
        const categoryLabels = {
            'trabalho': '💼 Trabalho',
            'pessoal': '👤 Pessoal', 
            'estudos': '📚 Estudos',
            'saude': '❤️ Saúde',
            'casa': '🏠 Casa',
            'lazer': '🎮 Lazer'
        };
        categoryElement.textContent = categoryLabels[category] || category;
        categoryElement.title = `Categoria: ${categoryLabels[category] || category}`;
        metaContainer.appendChild(categoryElement);
    }
    
    todoContent.appendChild(metaContainer);
    todo.appendChild(todoContent);
    
    const buttons = [
        { class: 'finish-todo', icon: 'fa-check', title: 'Concluir tarefa' },
        { class: 'edit-todo', icon: 'fa-pen', title: 'Editar tarefa' },
        { class: 'remove-todo', icon: 'fa-xmark', title: 'Excluir tarefa' }
    ];
    
    buttons.forEach(({ class: btnClass, icon, title }) => {
        const button = document.createElement("button");
        button.className = btnClass;
        button.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        button.title = title;
        todo.appendChild(button);
    });
    
    updateTodoUrgency(todo, dueDate);
    todo.style.animation = 'fadeIn 0.5s ease';
    
    return todo;
};

const saveTodo = (text, done = false, save = true, dueDate = null, category = "", priority = "media") => {
    if (state.isLoading) return;
    
    showLoading();
    
    setTimeout(() => {
        const todoElement = createTodoElement(text, done, dueDate, category, priority);
        elements.todoList.appendChild(todoElement);
        
        if (save) {
            saveTodoLocalStorage({ text, done, dueDate, category, priority });
            showNotification('Tarefa adicionada com sucesso!');
            updateStats();
        }
        
        elements.todoInput.value = "";
        elements.todoDate.value = "";
        elements.todoCategory.value = "";
        elements.todoPriority.value = "media";
        
        hideLoading();
        checkEmptyState();
    }, 300);
};

const PRIORITY_MAP = {
    'baixa': { label: '🟢 Baixa', weight: 1, color: 'priority-baixa' },
    'media': { label: '🟡 Média', weight: 2, color: 'priority-media' },
    'alta': { label: '🔴 Alta', weight: 3, color: 'priority-alta' },
    'urgente': { label: '🚨 Urgente', weight: 4, color: 'priority-urgente' }
};

const clearCompletedTodos = () => {
    const completedTodos = document.querySelectorAll('.todo.done');
    if (completedTodos.length === 0) {
        showNotification('Nenhuma tarefa concluída para limpar!', 'warning');
        return;
    }
    
    showConfirmation(`Deseja remover ${completedTodos.length} tarefa(s) concluída(s)?`, () => {
        completedTodos.forEach(todo => {
            const todoTitle = todo.querySelector('h3').textContent;
            todo.remove();
            removeTodoLocalStorage(todoTitle);
        });
        showNotification('Tarefas concluídas removidas!');
        updateStats();
        checkEmptyState();
    });
};

const exportTodos = () => {
    const todos = getTodosLocalStorage();
    if (todos.length === 0) {
        showNotification('Nenhuma tarefa para exportar!', 'warning');
        return;
    }
    
    const exportText = ["=== MINHAS TAREFAS ===", ""];
    todos.forEach((todo, index) => {
        const status = todo.done ? '✅' : '⏳';
        const date = todo.dueDate ? utils.formatDate(todo.dueDate) : 'Sem data';
        const category = todo.category ? ` [${todo.category}]` : '';
        exportText.push(`${index + 1}. ${status} ${todo.text}${category} (${date})`);
    });
    
    const blob = new Blob([exportText.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minhas-tarefas.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Tarefas exportadas com sucesso!');
};

const toggleForms = () => {
    elements.editForm.classList.toggle("hide");
    elements.todoForm.classList.toggle("hide");
    elements.todoList.classList.toggle("hide");
};

const updateTodo = (text, dueDate = null, category = "", priority = "media") => {
    const todos = document.querySelectorAll(".todo");
    todos.forEach((todo) => {
        const todoTitle = todo.querySelector("h3");
        const metaContainer = todo.querySelector(".todo-meta");
        const dateElement = metaContainer ? metaContainer.querySelector(".todo-date") : null;
        const priorityElement = metaContainer ? metaContainer.querySelector(".todo-priority") : null;
        const categoryElement = metaContainer ? metaContainer.querySelector(".todo-category") : null;

        if (todoTitle.textContent === oldInputValue) {
            todoTitle.textContent = text;
            
            if (dateElement) {
                dateElement.textContent = `📅 ${utils.formatDate(dueDate)}`;
            }

            if (priorityElement) {
                priorityElement.textContent = PRIORITY_MAP[priority].label;
                priorityElement.className = `todo-priority ${PRIORITY_MAP[priority].color}`;
            } else if (metaContainer) {
                const newPriorityElement = document.createElement("span");
                newPriorityElement.className = `todo-priority ${PRIORITY_MAP[priority].color}`;
                newPriorityElement.textContent = PRIORITY_MAP[priority].label;
                newPriorityElement.title = `Prioridade: ${priority}`;
                metaContainer.insertBefore(newPriorityElement, categoryElement);
            }

            if (categoryElement) {
                if (category) {
                    const categoryLabels = {
                        'trabalho': '💼 Trabalho',
                        'pessoal': '👤 Pessoal', 
                        'estudos': '📚 Estudos',
                        'saude': '❤️ Saúde', 
                        'casa': '🏠 Casa',
                        'lazer': '🎮 Lazer'
                    };
                    categoryElement.textContent = categoryLabels[category] || category;
                    categoryElement.className = `todo-category category-${category}`;
                } else {
                    categoryElement.remove();
                }
            } else if (category && metaContainer) {
                const newCategoryElement = document.createElement("span");
                newCategoryElement.className = `todo-category category-${category}`;
                const categoryLabels = {
                    'trabalho': '💼 Trabalho',
                    'pessoal': '👤 Pessoal',
                    'estudos': '📚 Estudos',
                    'saude': '❤️ Saúde',
                    'casa': '🏠 Casa', 
                    'lazer': '🎮 Lazer'
                };
                newCategoryElement.textContent = categoryLabels[category] || category;
                metaContainer.appendChild(newCategoryElement);
            }

            todo.className = todo.className.replace(/\bpriority-(baixa|media|alta|urgente)\b/g, '');
            todo.classList.add(PRIORITY_MAP[priority].color);

            updateTodoUrgency(todo, dueDate);
            updateTodoLocalStorage(oldInputValue, text, dueDate, category, priority);
        }
    });
};

const sortTodosByPriority = () => {
    const todos = Array.from(elements.todoList.children).filter(el => el.classList.contains('todo'));
    const sortedTodos = todos.sort((a, b) => {
        const priorityA = getTodoPriorityWeight(a);
        const priorityB = getTodoPriorityWeight(b);
        
        return priorityB - priorityA;
    });
    
    sortedTodos.forEach(todo => elements.todoList.appendChild(todo));
    showNotification('Tarefas ordenadas por prioridade!');
};

const getTodoPriorityWeight = (todoElement) => {
    if (todoElement.classList.contains('priority-urgente')) return 4;
    if (todoElement.classList.contains('priority-alta')) return 3;
    if (todoElement.classList.contains('priority-media')) return 2;
    if (todoElement.classList.contains('priority-baixa')) return 1;
    return 2;
};

const getSearchedTodos = (search) => {
    const todos = document.querySelectorAll(".todo");
    const searchLower = search.toLowerCase();
    
    todos.forEach((todo) => {
        const todoTitle = todo.querySelector("h3").textContent.toLowerCase();
        const dateElement = todo.querySelector(".todo-date");
        const categoryElement = todo.querySelector(".todo-category");
        
        const todoDate = dateElement ? dateElement.textContent.toLowerCase() : "";
        const todoCategory = categoryElement ? categoryElement.textContent.toLowerCase() : "";
        
        const matchesSearch = todoTitle.includes(searchLower) || 
                             todoDate.includes(searchLower) || 
                             todoCategory.includes(searchLower);
        todo.style.display = matchesSearch ? "flex" : "none";
    });
};

const filterTodos = (filterValue) => {
    state.currentFilter = filterValue;
    localStorage.setItem('currentFilter', filterValue);
    
    const todos = document.querySelectorAll(".todo");
    const categories = ['trabalho', 'pessoal', 'estudos', 'saude', 'casa', 'lazer'];
    const priorities = ['baixa', 'media', 'alta', 'urgente'];
    
    todos.forEach((todo) => {
        const isDone = todo.classList.contains("done");
        const isUrgent = todo.classList.contains("urgent");
        const categoryElement = todo.querySelector(".todo-category");
        const todoCategory = categoryElement ? categoryElement.className.replace('todo-category category-', '') : '';
        const todoPriority = getTodoPriorityFromElement(todo);
        
        let shouldDisplay = true;
        
        switch (filterValue) {
            case "done":
                shouldDisplay = isDone;
                break;
            case "todo":
                shouldDisplay = !isDone;
                break;
            case "urgent":
                shouldDisplay = isUrgent;
                break;
            case "prioridade-urgente":
                shouldDisplay = todoPriority === 'urgente';
                break;
            case "prioridade-alta":
                shouldDisplay = todoPriority === 'alta';
                break;
            case "prioridade-media":
                shouldDisplay = todoPriority === 'media';
                break;
            case "prioridade-baixa":
                shouldDisplay = todoPriority === 'baixa';
                break;
            default:
                if (categories.includes(filterValue)) {
                    shouldDisplay = todoCategory === filterValue;
                }
                break;
        }
        
        todo.style.display = shouldDisplay ? "flex" : "none";
    });
};

const getTodoPriorityFromElement = (todoElement) => {
    if (todoElement.classList.contains('priority-urgente')) return 'urgente';
    if (todoElement.classList.contains('priority-alta')) return 'alta';
    if (todoElement.classList.contains('priority-media')) return 'media';
    if (todoElement.classList.contains('priority-baixa')) return 'baixa';
    return 'media';
};

const getTodosLocalStorage = () => {
    try {
        return JSON.parse(localStorage.getItem("todos")) || [];
    } catch {
        return [];
    }
};

const saveTodoLocalStorage = (newTodo) => {
    try {
        if (!newTodo.text?.trim()) throw new Error('Texto da tarefa inválido');
        const todos = getTodosLocalStorage();
        todos.push(newTodo);
        localStorage.setItem("todos", JSON.stringify(todos));
    } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
        showNotification('Erro ao salvar tarefa', 'error');
        updateStats();
    }
};

const removeTodoLocalStorage = (todoText) => {
    const todos = getTodosLocalStorage();
    const filteredTodos = todos.filter((todo) => todo.text !== todoText);
    localStorage.setItem("todos", JSON.stringify(filteredTodos));
    updateStats();
};

const updateTodoStatusLocalStorage = (todoText) => {
    const todos = getTodosLocalStorage();
    const updatedTodos = todos.map((todo) => {
        if (todo.text === todoText) {
            return { ...todo, done: !todo.done };
        }
        return todo;
    });
    localStorage.setItem("todos", JSON.stringify(updatedTodos));
    updateStats();
};

const updateTodoLocalStorage = (todoOldText, todoNewText, dueDate = null, category = "", priority = "media") => {
    const todos = getTodosLocalStorage();
    const updatedTodos = todos.map((todo) => 
        todo.text === todoOldText ? { 
            ...todo, 
            text: todoNewText, 
            dueDate, 
            category,
            priority 
        } : todo
    );
    localStorage.setItem("todos", JSON.stringify(updatedTodos));
};

const isTodoDuplicate = (text) => {
    const todos = getTodosLocalStorage();
    return todos.some(todo => todo.text.toLowerCase() === text.toLowerCase());
};

const handleTodoClick = (e) => {
    const targetEl = e.target;
    const parentEl = targetEl.closest(".todo");
    
    if (!parentEl) return;
    
    if (targetEl.tagName === 'BUTTON' || targetEl.closest('button')) {
        const button = targetEl.tagName === 'BUTTON' ? targetEl : targetEl.closest('button');
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    const todoContent = parentEl.querySelector(".todo-content");
    if (!todoContent) return;
    
    const todoTitle = todoContent.querySelector("h3").textContent || "";
    
    if (targetEl.classList.contains("finish-todo")) {
        parentEl.classList.toggle("done");
        updateTodoStatusLocalStorage(todoTitle);
        updateStats();
        showNotification(parentEl.classList.contains("done") ? 'Tarefa concluída!' : 'Tarefa reaberta!');
        return;
    }
    
    if (targetEl.classList.contains("remove-todo")) {
        showConfirmation(`Deseja remover a tarefa "${todoTitle}"?`, () => {
            parentEl.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                parentEl.remove();
                removeTodoLocalStorage(todoTitle);
                showNotification('Tarefa removida!');
                checkEmptyState();
            }, 300);
        });
        return;
    }
    
    if (targetEl.classList.contains("edit-todo")) {
        const metaContainer = todoContent.querySelector(".todo-meta");
        const dateElement = metaContainer ? metaContainer.querySelector(".todo-date") : null;
        const categoryElement = metaContainer ? metaContainer.querySelector(".todo-category") : null;
        const priorityElement = metaContainer ? metaContainer.querySelector(".todo-priority") : null;
        
        let todoDueDate = null;
        let todoCategory = "";
        let todoPriority = "media";
        
        if (dateElement) {
            const dateText = dateElement.textContent.replace('📅 ', '').trim();
            if (dateText !== 'Sem data') {
                const [day, month, year] = dateText.split('/');
                todoDueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        
        if (categoryElement) {
            todoCategory = categoryElement.className.replace('todo-category category-', '');
        }
        
        if (priorityElement) {
            const priorityText = priorityElement.textContent;
            if (priorityText.includes('🚨')) todoPriority = 'urgente';
            else if (priorityText.includes('🔴')) todoPriority = 'alta';
            else if (priorityText.includes('🟡')) todoPriority = 'media';
            else if (priorityText.includes('🟢')) todoPriority = 'baixa';
        }

        toggleForms();
        elements.editInput.value = todoTitle;
        elements.editDate.value = todoDueDate || '';
        elements.editCategory.value = todoCategory || '';
        elements.editPriority.value = todoPriority;
        oldInputValue = todoTitle;
    }
};

const handleKeydown = (e) => {
    if (e.key === 'Escape' && !elements.editForm.classList.contains('hide')) {
        toggleForms();
    }
    
    if (e.key === 'Enter' && document.activeElement === elements.todoInput) {
        e.preventDefault();
        elements.todoForm.dispatchEvent(new Event('submit'));
    }
};

const handleModalClick = (e) => {
    if (e.target === elements.modal) {
        pendingAction = null;
        elements.modal.classList.add("hide");
    }
};

const initializeApp = () => {
    elements.todoInput.setAttribute('aria-label', 'Digite uma nova tarefa');
    elements.searchInput.setAttribute('aria-label', 'Pesquisar tarefas');
    elements.filterBtn.setAttribute('aria-label', 'Filtrar tarefas');
    
    elements.modal.classList.add('hide');
    
    loadTodos();
};

const loadTodos = () => {
    showLoading();
    
    setTimeout(() => {
        try {
            const todos = getTodosLocalStorage();
            elements.todoList.innerHTML = '';
            
            if (todos.length === 0) {
                checkEmptyState();
                hideLoading();
                return;
            }
            
            const fragment = document.createDocumentFragment();
            
            todos.forEach((todo) => {
                const todoElement = createTodoElement(
                    todo.text, 
                    todo.done, 
                    todo.dueDate || null, 
                    todo.category || "",
                    todo.priority || "media"
                );
                fragment.appendChild(todoElement);
            });
            
            elements.todoList.appendChild(fragment);
            
            elements.filterBtn.value = 'all';
            filterTodos('all');
            updateStats();
            checkEmptyState();
            
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            showNotification('Erro ao carregar tarefas', 'error');
        } finally {
            hideLoading();
        }
    }, 0);
};

const setupEventListeners = () => {
    elements.todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputValue = elements.todoInput.value.trim();
    const dueDateValue = elements.todoDate.value;
    const categoryValue = elements.todoCategory.value;
    const priorityValue = elements.todoPriority.value;

    if (!inputValue) {
        showNotification('Por favor, digite uma tarefa!', 'warning');
        return;
    }

    if (inputValue.length < 3) {
        showNotification('A tarefa deve ter pelo menos 3 caracteres!', 'warning');
        return;
    }

    if (isTodoDuplicate(inputValue)) {
        showNotification('Esta tarefa já existe!', 'warning');
        return;
    }

    saveTodo(inputValue, false, true, dueDateValue, categoryValue, priorityValue);
});

  elements.editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const editInputValue = elements.editInput.value.trim();
    const editDateValue = elements.editDate.value;
    const editCategoryValue = elements.editCategory.value;
    const editPriorityValue = elements.editPriority.value;

    if (editInputValue) {
        updateTodo(editInputValue, editDateValue, editCategoryValue, editPriorityValue);
        showNotification('Tarefa atualizada com sucesso!');
    }
    toggleForms();
});

elements.sortPriorityBtn.addEventListener("click", sortTodosByPriority);

    document.addEventListener("click", handleTodoClick);
    elements.cancelEditBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleForms();
    });

    elements.searchInput.addEventListener("input", (e) => {
        getSearchedTodos(e.target.value.toLowerCase());
    });

    elements.eraseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        elements.searchInput.value = "";
        elements.searchInput.dispatchEvent(new Event("input"));
    });

    elements.filterBtn.addEventListener("change", (e) => {
        filterTodos(e.target.value);
    });

    elements.todayBtn.addEventListener("click", (e) => {
    e.preventDefault();
    elements.todoDate.value = utils.getTodayDate();
});

    elements.clearCompletedBtn.addEventListener("click", clearCompletedTodos);
    elements.exportBtn.addEventListener("click", exportTodos);

    elements.modalConfirm.addEventListener("click", () => {
        if (pendingAction) {
            pendingAction();
            pendingAction = null;
        }
        elements.modal.classList.add("hide");
    });

    elements.modalCancel.addEventListener("click", () => {
        pendingAction = null;
        elements.modal.classList.add("hide");
    });

    elements.modal.addEventListener("click", handleModalClick);

    document.addEventListener('keydown', handleKeydown);

    elements.todoList.addEventListener('mouseover', (e) => {
        const todo = e.target.closest('.todo');
        if (todo && !todo.classList.contains('done')) {
            todo.style.transform = 'translateY(-2px)';
        }
    });

    elements.todoList.addEventListener('mouseout', (e) => {
        const todo = e.target.closest('.todo');
        if (todo) {
            todo.style.transform = '';
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        initializeApp();
    });
} else {
    setupEventListeners();
    initializeApp();
}