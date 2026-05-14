import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Exercise from './models/Exercise.js';

// Import our route files 
import authRoutes from './routes/authRoutes.js'; 
import workoutRoutes from './routes/workoutRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON data
app.use(express.json());
// Serve static files from the public directory (HTML, CSS, Client-side JS)
app.use(express.static(path.join(__dirname, 'public')));

const dbName = 'cpsc431_thomaseli';
const mongoURI = `mongodb://127.0.0.1:27017/${dbName}`;

// Connect to MongoDB
mongoose.connect(mongoURI)
    .then(async () => {
        console.log(`Connected successfully to database: ${dbName}`);
          
        // Check if there are any default exercises (where createdBy is null)
        const defaultCount = await Exercise.countDocuments({ createdBy: null });
      
        if (defaultCount === 0) {
            console.log('No default exercises found. Seeding database...');
            const defaultExercises = [
                { name: 'Bench Press', muscleGroup: 'Chest' },
                { name: 'Barbell Squat', muscleGroup: 'Legs' },
                { name: 'Deadlift', muscleGroup: 'Back' },
                { name: 'Overhead Press', muscleGroup: 'Shoulders' },
                { name: 'Pull Up', muscleGroup: 'Back' },
                { name: 'Push Up', muscleGroup: 'Chest' },
                { name: 'Bicep Curl', muscleGroup: 'Arms' },
                { name: 'Tricep Extension', muscleGroup: 'Arms' },
                { name: 'Plank', muscleGroup: 'Core' },
                { name: 'Treadmill Run', muscleGroup: 'Cardio' }
            ];
          
            await Exercise.insertMany(defaultExercises);
            console.log('Default exercises seeded successfully!');
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Mount the API routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
