const addHabitForm = document.getElementById('add-habit-form');
const habitsListContainer = document.getElementById('habits-list');
const noHabitsMessage = document.getElementById('no-habits');
const habitDetailsModal = document.getElementById('habit-details-modal');
const modalCloseButton = habitDetailsModal.querySelector('.close-button');
const modalHabitTitle = document.getElementById('modal-habit-title');
const modalTotalCompletions = document.getElementById('modal-total-completions');
const modalCurrentStreak = document.getElementById('modal-current-streak');
const localStorageKey = 'habits';

let habits = loadHabitsFromStorage();
renderHabits(habits);

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 4. Persist with localStorage (Load)
function loadHabitsFromStorage() {
    const storedHabits = localStorage.getItem(localStorageKey);
    return storedHabits ? JSON.parse(storedHabits) : [];
}

// 4. Persist with localStorage (Save)
function saveHabitsToStorage() {
    localStorage.setItem(localStorageKey, JSON.stringify(habits));
}

// 1. Add & Display Habits: Render
function renderHabits(habitArray) {
    habitsListContainer.innerHTML = '';
    if (habitArray.length === 0) {
        noHabitsMessage.style.display = 'block';
        return;
    }
    noHabitsMessage.style.display = 'none';

    habitArray.map((habit, index) => {
        const habitDiv = document.createElement('div');
        habitDiv.classList.add('habit-item');
        const isDoneToday = habit.completionHistory && habit.completionHistory[getTodayDate()];

        habitDiv.innerHTML = `
            <div class="habit-details">
                <h3>${habit.title} ${habit.category ? `(${habit.category})` : ''}</h3>
                <div class="habit-progress">
                    <input type="checkbox" id="habit-${index}" data-index="${index}" ${isDoneToday ? 'checked' : ''}>
                    <label for="habit-${index}">Done Today</label>
                </div>
            </div>
            <div class="habit-actions">
                <button class="details-btn" data-index="${index}">Details</button>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
        `;
        habitsListContainer.appendChild(habitDiv);
    });

    // Add event listeners for progress checkboxes, details, and delete buttons
    const progressCheckboxes = document.querySelectorAll('.habit-progress input[type="checkbox"]');
    progressCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', markHabitComplete);
    });

    const detailsButtons = document.querySelectorAll('.details-btn');
    detailsButtons.forEach(button => {
        button.addEventListener('click', showHabitDetails);
    });

    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', deleteHabit);
    });
}

// 1. Add & Display Habits: Add Habit
addHabitForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const titleInput = document.getElementById('habit-title');
    const categoryInput = document.getElementById('habit-category');

    const title = titleInput.value.trim();
    const category = categoryInput.value.trim();

    if (!title) {
        alert('Habit title is required.');
        return;
    }

    const newHabit = {
        title: title,
        category: category,
        completionHistory: {} // Initialize empty history
    };
    habits.push(newHabit);
    saveHabitsToStorage();
    renderHabits(habits);

    addHabitForm.reset();
});

// 2. Track Daily Progress
function markHabitComplete(event) {
    const index = parseInt(event.target.dataset.index);
    if (!isNaN(index) && index >= 0 && index < habits.length) {
        const today = getTodayDate();
        habits[index].completionHistory = habits[index].completionHistory || {};
        habits[index].completionHistory[today] = event.target.checked;
        saveHabitsToStorage();
        // No need to re-render the whole list, but could update individual item if needed for streak display in the list
    }
}

// 3. Habit Management: Delete Habit
function deleteHabit(event) {
    const indexToDelete = parseInt(event.target.dataset.index);
    if (!isNaN(indexToDelete) && indexToDelete >= 0 && indexToDelete < habits.length) {
        habits = habits.filter((_, index) => index !== indexToDelete);
        saveHabitsToStorage();
        renderHabits(habits);
    }
}

// 3. Habit Management: View Details
function showHabitDetails(event) {
    const index = parseInt(event.target.dataset.index);
    if (!isNaN(index) && index >= 0 && index < habits.length) {
        const habit = habits[index];
        modalHabitTitle.textContent = habit.title;
        modalTotalCompletions.textContent = getTotalCompletions(habit.completionHistory);
        modalCurrentStreak.textContent = getCurrentStreak(habit.completionHistory);
        // Optional: Render history log in modal-history-log

        habitDetailsModal.style.display = 'block';
    }
}

// 3. Habit Management: Calculate Total Completions
function getTotalCompletions(history) {
    return Object.values(history).filter(completed => completed).length;
}

// 3. Habit Management: Calculate Current Streak
function getCurrentStreak(history) {
    let streak = 0;
    let currentDate = new Date();
    const sortedDates = Object.keys(history).sort((a, b) => new Date(b) - new Date(a)); // Sort by most recent

    for (const dateStr of sortedDates) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        const currentYear = currentDate.getFullYear();
        const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
        const currentDay = String(currentDate.getDate()).padStart(2, '0');
        const formattedCurrentDate = `${currentYear}-${currentMonth}-${currentDay}`;

        if (formattedDate === formattedCurrentDate && history[formattedDate]) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (formattedDate < formattedCurrentDate) {
            break; // Stop if we've gone past consecutive days
        } else {
            currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day
        }
    }
    return streak;
}

// Modal close functionality
modalCloseButton.addEventListener('click', function() {
    habitDetailsModal.style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target === habitDetailsModal) {
        habitDetailsModal.style.display = 'none';
    }
});

// On page load (already called after loading from storage)