// Global variables 
const API_BASE = '/api';
let activeWorkoutSession = {
    startTime: null,
    exercises: [] // Array to hold exercises and their sets during an active workout
};

// Cache the exercises so we don't have to fetch them constantly
let exerciseLibrary = []; 

let timerInterval = null;

// ==========================================
// Helper Functions (UI & Auth)
// ==========================================

// Contextual UI: Switch between pages 
function showView(viewId) {
    // Hide all sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });
    // Show the target section
    document.getElementById(viewId).classList.remove('hidden');

    // Contextual Navigation: Show/hide nav based on token
    const hasToken = !!localStorage.getItem('token');
    if (hasToken) {
        document.getElementById('main-nav').classList.remove('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
    } else {
        document.getElementById('main-nav').classList.add('hidden');
    }
}

// Notifications: Visually distinct error/success messages 
function showNotification(message, type = 'error') {
    const notifyArea = document.getElementById('notification-area');
    const notifyText = document.getElementById('notification-text');
    
    notifyText.textContent = message;
    notifyArea.className = ''; // Reset classes
    
    if (type === 'error') {
        notifyArea.classList.add('notify-error');
    } else {
        notifyArea.classList.add('notify-success');
    }
    
    notifyArea.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notifyArea.classList.add('hidden');
    }, 5000);
}

document.getElementById('close-notification').addEventListener('click', () => {
    document.getElementById('notification-area').classList.add('hidden');
});

// Custom fetch wrapper that automatically adds the Auth Token to headers
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }
    return data;
}

// ==========================================
// AUTHENTICATION LOGIC
// ==========================================

// Handle Sign Up
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const data = await apiFetch('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        localStorage.setItem('token', data.token);
        showNotification('Account created successfully!', 'success');
    
        e.target.reset();

        initApp(); // Reload app state
    } catch (error) {
        showNotification(error.message);
    }
});

// Handle Log In
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        localStorage.setItem('token', data.token); // Store token locally (requirement)

        e.target.reset();

        showNotification('Logged in successfully!', 'success');
        initApp(); // Reload app state
    } catch (error) {
        showNotification(error.message);
    }
});

// Handle Log Out
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token'); // Destroy local token (requirement) 
    activeWorkoutSession.exercises = []; // Clear any active workout
    clearInterval(timerInterval);

    document.getElementById('login-form').reset();
    document.getElementById('signup-form').reset();

    showNotification('Logged out successfully.', 'success');
    showView('auth-section');
});

// ==========================================
// WORKOUT & EXERCISE LOGIC
// ==========================================



// Fetch exercises to populate library and dropdowns
async function loadExercises() {
    try {
        const exercises = await apiFetch('/workouts/exercises'); 
        exerciseLibrary = exercises;

        // Populate the dropdown in the active workout form
        const select = document.getElementById('exercise-select');
        select.innerHTML = '<option value="">-- Choose an Exercise --</option>';
        
        exercises.forEach(ex => {
            const option = document.createElement('option');
            option.value = ex._id;
            option.textContent = ex.name;
            select.appendChild(option);
        });

        // Populate the Library UI
        const libContainer = document.getElementById('exercise-list-container');
        libContainer.innerHTML = '';
        exercises.forEach(ex => {
            const badge = ex.isCustom ? '<span class="badge">Custom</span>' : '';
            libContainer.innerHTML += `
                <div class="card" style="padding: 1rem; margin-bottom: 0.5rem;">
                    <strong>${ex.name}</strong> (${ex.muscleGroup}) ${badge}
                </div>
            `;
        });
    } catch (error) {
        console.error('Failed to load exercises');
    }
}

// Start a Workout (User Story 3)
document.getElementById('start-workout-btn').addEventListener('click', () => {
    activeWorkoutSession.startTime = new Date();
    activeWorkoutSession.exercises = [];
    
    document.getElementById('active-workout-area').classList.remove('hidden');
    document.getElementById('finish-workout-btn').classList.remove('hidden');
    document.getElementById('start-workout-btn').classList.add('hidden');
    document.getElementById('active-sets-list').innerHTML = '';
    
    // Start the live timer
    document.getElementById('workout-timer').textContent = '00:00';
    timerInterval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - activeWorkoutSession.startTime) / 1000);
        
        // Format to MM:SS
        const minutes = String(Math.floor(diffInSeconds / 60)).padStart(2, '0');
        const seconds = String(diffInSeconds % 60).padStart(2, '0');
        
        document.getElementById('workout-timer').textContent = `${minutes}:${seconds}`;
    }, 1000);
});

// Handle Adding a Custom Exercise (User Story 4)
document.getElementById('custom-exercise-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('custom-ex-name').value;
    const muscleGroup = document.getElementById('custom-ex-group').value;

    try {
        await apiFetch('/workouts/exercises', {
            method: 'POST',
            body: JSON.stringify({ name, muscleGroup })
        });

        showNotification('Custom exercise added!', 'success');
        
        // Clear the input field for the next one
        document.getElementById('custom-ex-name').value = '';
        
        // Immediately reload the exercises 
        loadExercises(); 
    } catch (error) {
        showNotification(error.message);
    }
});

// Log a single set (User Story 5)
document.getElementById('log-set-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const exerciseId = document.getElementById('exercise-select').value;
    const weight = parseFloat(document.getElementById('set-weight').value);
    const reps = parseInt(document.getElementById('set-reps').value);

    // Data Validation (Rubric Requirement)
    if (weight < 0 || reps < 1) {
        showNotification('Weight must be positive and reps must be at least 1.', 'error');
        return;
    }

    // Find if we already started tracking this exercise in the current workout
    let exerciseLog = activeWorkoutSession.exercises.find(ex => ex.exerciseId === exerciseId);
    if (!exerciseLog) {
        exerciseLog = { exerciseId: exerciseId, sets: [] };
        activeWorkoutSession.exercises.push(exerciseLog);
    }

    // Add the set
    exerciseLog.sets.push({ weight, reps });

    // Update UI
    const exName = exerciseLibrary.find(e => e._id === exerciseId).name;
    const setNum = exerciseLog.sets.length;
    
    const li = document.createElement('li');
    li.innerHTML = `<strong>${exName}</strong> - Set ${setNum}: ${weight}lbs x ${reps} reps`;
    document.getElementById('active-sets-list').prepend(li); // Put newest at the top

    // Clear inputs for the next set
    document.getElementById('set-weight').value = '';
    document.getElementById('set-reps').value = '';
});

// Finish and save workout (Create operation with derived data)
document.getElementById('finish-workout-btn').addEventListener('click', async () => {
    if (activeWorkoutSession.exercises.length === 0) {
        showNotification('Cannot save an empty workout!', 'error');
        return;
    }

    // Calculate derived data (requirement)
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - activeWorkoutSession.startTime) / 60000);
    
    let totalSets = 0;
    activeWorkoutSession.exercises.forEach(ex => totalSets += ex.sets.length);

    const workoutPayload = {
        durationMinutes: durationMinutes || 1, // Minimum 1 min
        totalSets,
        recordsBroken: 0, 
        exercisesLogged: activeWorkoutSession.exercises
    };

    try {
        await apiFetch('/workouts', {
            method: 'POST',
            body: JSON.stringify(workoutPayload)
        });
        
        showNotification('Workout saved successfully!', 'success');

        clearInterval(timerInterval);
        
        // Reset UI
        document.getElementById('active-workout-area').classList.add('hidden');
        document.getElementById('finish-workout-btn').classList.add('hidden');
        document.getElementById('start-workout-btn').classList.remove('hidden');
        
        // Go to history to see it
        showView('history-section');
        loadHistory(); 
    } catch (error) {
        showNotification(error.message);
    }
});

// Fetch and Display History (Read Operation & User Story 6)
async function loadHistory() {
    try {
        const workouts = await apiFetch('/workouts');
        const container = document.getElementById('history-container');
        container.innerHTML = '';

        if (workouts.length === 0) {
            container.innerHTML = '<p>No workouts found. Start lifting!</p>';
            return;
        }

        const sortValue = document.getElementById('sort-history').value;
        
        workouts.sort((a, b) => {
            if (sortValue === 'newest') {
                return new Date(b.date) - new Date(a.date);
            } else if (sortValue === 'oldest') {
                return new Date(a.date) - new Date(b.date);
            } else if (sortValue === 'sets') {
                return b.totalSets - a.totalSets; // Highest sets first
            } else if (sortValue === 'records') {
                return b.recordsBroken - a.recordsBroken; // Most records first
            }
        });

        workouts.forEach(workout => {
            const dateStr = new Date(workout.date).toLocaleDateString();
            const medal = workout.recordsBroken > 0 ? `<span class="medal-icon">🥇 ${workout.recordsBroken}</span>` : '';
            
            let detailsHtml = '<div class="expanded-details hidden mt-2">';
            
            workout.exercisesLogged.forEach(exLog => {
                const exName = exLog.exerciseId ? exLog.exerciseId.name : 'Unknown Exercise';
                
                // Add the exercise name as a sub-header
                detailsHtml += `<h4 style="margin-bottom: 0.25rem;">${exName}</h4><ul>`;
                
                // Loop through every single set and display weight + reps
                exLog.sets.forEach((set, index) => {
                    detailsHtml += `<li>Set ${index + 1}: ${set.weight} lbs × ${set.reps} reps</li>`;
                });
                
                detailsHtml += '</ul><br>'; // Add a little space before the next exercise
            });
            detailsHtml += '</div>';

            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="history-summary">
                    <div>
                        <strong>${dateStr}</strong><br>
                        <small class="text-muted">${workout.durationMinutes} min • ${workout.totalSets} sets</small>
                    </div>
                    ${medal}
                </div>
                ${detailsHtml}
            `;

            // Click to expand/collapse
            card.addEventListener('click', () => {
                const details = card.querySelector('.expanded-details');
                details.classList.toggle('hidden');
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load history');
    }
}

// ==========================================
// Navigation listeners
// ==========================================
document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetView = e.target.getAttribute('data-target');
        showView(targetView);
        
        if (targetView === 'history-section') loadHistory();
        if (targetView === 'library-section') loadExercises(); // Refresh library
    });
});

// Listen for changes on the sorting dropdown
document.getElementById('sort-history').addEventListener('change', () => {
    loadHistory(); 
});

// On app init we should check for token and route accordingly
function initApp() {
    const token = localStorage.getItem('token');
    if (token) {
        showView('dashboard-section');
        // Fetch data since we are logged in
        loadExercises();
    } else {
        showView('auth-section');
    }
}

// Run on page load
initApp();
