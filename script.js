// Contains all logic and localStorage handling

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'cyber_todo_tasks';

    // Data Manager for localStorage operations
    const DataManager = {
        loadTasks: () => {
            try {
                const tasksJson = localStorage.getItem(STORAGE_KEY);
                return tasksJson ? JSON.parse(tasksJson) : [];
            } catch (e) {
                console.error('Error loading tasks from localStorage:', e);
                return [];
            }
        },
        saveTasks: (tasks) => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            } catch (e) {
                console.error('Error saving tasks to localStorage:', e);
            }
        }
    };

    // Global State
    let tasks = [];
    let currentFilter = 'all'; // 'all', 'active', 'completed'

    // DOM Elements
    const addTaskInput = document.getElementById('addTaskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskListContainer = document.getElementById('taskListContainer');
    const filterAllBtn = document.getElementById('filterAllBtn');
    const filterActiveBtn = document.getElementById('filterActiveBtn');
    const filterCompletedBtn = document.getElementById('filterCompletedBtn');
    const emptyState = document.getElementById('emptyState');
    const progressBar = document.getElementById('progressBar');
    const toastContainer = document.getElementById('toastContainer');

    // Helper Functions
    const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
        toast.innerHTML = `<span class="icon">${icon}</span>${message}`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hidden');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    };

    const renderProgressBar = () => {
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
        progressBar.style.width = `${progress}%`;
    };

    // CRUD Operations
    const addTask = (text) => {
        if (!text.trim()) {
            showToast('Task description cannot be empty!', 'error');
            return;
        }
        const newTask = {
            id: generateUniqueId(),
            text: text.trim(),
            completed: false,
        };
        tasks.push(newTask);
        DataManager.saveTasks(tasks);
        renderTasks();
        addTaskInput.value = '';
        showToast('Mission added to the matrix!', 'success');
    };

    const toggleTaskCompletion = (id) => {
        tasks = tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        DataManager.saveTasks(tasks);
        renderTasks();
        showToast('Mission status updated!', 'success');
    };

    const editTask = (id, newText) => {
        if (!newText.trim()) {
            showToast('Task description cannot be empty!', 'error');
            return;
        }
        tasks = tasks.map(task =>
            task.id === id ? { ...task, text: newText.trim() } : task
        );
        DataManager.saveTasks(tasks);
        renderTasks();
        showToast('Mission updated!', 'success');
    };

    const deleteTask = (id) => {
        tasks = tasks.filter(task => task.id !== id);
        DataManager.saveTasks(tasks);
        renderTasks();
        showToast('Mission eliminated!', 'error');
    };

    // UI Rendering
    const createTaskElement = (task) => {
        const taskCard = document.createElement('div');
        taskCard.classList.add('card', 'task-item');
        if (task.completed) {
            taskCard.classList.add('completed');
        }
        taskCard.dataset.id = task.id;

        taskCard.innerHTML = `
            <div class="task-item-content">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-item-text">${task.text}</span>
            </div>
            <div class="task-item-actions">
                <button class="button edit-btn"><i class="fas fa-edit"></i> Edit</button>
                <button class="button delete-btn"><i class="fas fa-trash-alt"></i> Delete</button>
            </div>
        `;

        const checkbox = taskCard.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

        const editBtn = taskCard.querySelector('.edit-btn');
        const deleteBtn = taskCard.querySelector('.delete-btn');
        const taskTextSpan = taskCard.querySelector('.task-item-text');

        editBtn.addEventListener('click', () => {
            if (taskCard.classList.contains('editing')) {
                // Save logic
                const editInput = taskCard.querySelector('.editable-task-input');
                if (editInput) {
                    editTask(task.id, editInput.value);
                }
                taskCard.classList.remove('editing');
                editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
                editBtn.classList.remove('save-btn');
            } else {
                // Edit logic
                taskCard.classList.add('editing');
                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.value = task.text;
                editInput.classList.add('input-field', 'editable-task-input');
                taskTextSpan.replaceWith(editInput);
                editInput.focus();

                editBtn.innerHTML = '<i class="fas fa-save"></i> Save';
                editBtn.classList.add('save-btn');

                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        editBtn.click(); // Trigger save
                    }
                });
                // Revert if focus is lost without saving (optional, or rely on explicit save/cancel)
                editInput.addEventListener('blur', () => {
                    if (taskCard.classList.contains('editing') && editBtn.classList.contains('save-btn')) {
                         // If blur without explicit save, revert to original text and state
                         // This is a simple revert; a more robust solution might involve a cancel button
                         renderTasks(); // Re-render to revert this specific task card
                    }
                });
            }
        });

        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        return taskCard;
    };

    const renderTasks = () => {
        taskListContainer.innerHTML = '';
        let filteredTasks = [];

        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        } else {
            filteredTasks = tasks;
        }

        if (filteredTasks.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            filteredTasks.forEach(task => {
                taskListContainer.appendChild(createTaskElement(task));
            });
        }

        updateFilterButtons();
        renderProgressBar();
    };

    const updateFilterButtons = () => {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === currentFilter) {
                btn.classList.add('active');
            }
        });
    };

    // Event Listeners
    addTaskBtn.addEventListener('click', () => addTask(addTaskInput.value));

    addTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(addTaskInput.value);
        }
    });

    filterAllBtn.addEventListener('click', () => {
        currentFilter = 'all';
        renderTasks();
    });

    filterActiveBtn.addEventListener('click', () => {
        currentFilter = 'active';
        renderTasks();
    });

    filterCompletedBtn.addEventListener('click', () => {
        currentFilter = 'completed';
        renderTasks();
    });

    // Initialization
    const init = () => {
        tasks = DataManager.loadTasks();
        renderTasks();
    };

    init();
});
