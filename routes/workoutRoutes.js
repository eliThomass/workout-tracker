// API routes regarding workouts/exercise

import express from 'express';
import Workout from '../models/Workout.js';
import Exercise from '../models/Exercise.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply the authentication middleware to ALL routes in this file
router.use(requireAuth);

// CREATE: Save a completed workout
router.post('/', async (req, res) => {
    try {
        const { durationMinutes, totalSets, exercisesLogged } = req.body;

        if (!exercisesLogged || exercisesLogged.length === 0) {
            return res.status(400).json({ error: 'Workout must contain at least one exercise.' });
        }

        let recordsBroken = 0;

        for (const currentExercise of exercisesLogged) {
            // Find all past workouts for this specific user
            const pastWorkouts = await Workout.find({ userId: req.user.id });
            
            // Find the absolute highest weight they've ever lifted for this specific exercise
            let maxPastWeight = 0;
            pastWorkouts.forEach(workout => {
                workout.exercisesLogged.forEach(ex => {
                    if (ex.exerciseId.toString() === currentExercise.exerciseId) {
                        ex.sets.forEach(set => {
                            if (set.weight > maxPastWeight) maxPastWeight = set.weight;
                        });
                    }
                });
            });

            // Find the highest weight lifted in today's session
            let currentMaxWeight = 0;
            currentExercise.sets.forEach(set => {
                if (set.weight > currentMaxWeight) currentMaxWeight = set.weight;
            });

            // If today's max is greater than the historical max, it's a record
            if (currentMaxWeight > maxPastWeight) {
                recordsBroken++;
            }
        }

        const newWorkout = new Workout({
            userId: req.user.id,
            durationMinutes,
            totalSets,
            recordsBroken,
            exercisesLogged
        });

        const savedWorkout = await newWorkout.save();
        res.status(201).json({ message: 'Workout saved successfully', workout: savedWorkout });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save workout.' });
    }
});

// CREATE: Make a customer exercise
router.post('/exercises', async (req, res) => {
    try {
        const { name, muscleGroup } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Exercise name is required.' });
        }

        // Create the new exercise and link it to the logged-in user
        const newExercise = new Exercise({
            name,
            muscleGroup,
            isCustom: true,
            createdBy: req.user.id // This comes from the auth middleware
        });

        const savedExercise = await newExercise.save();
        
        // 201 Created
        res.status(201).json(savedExercise);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create custom exercise.' });
    }
});

// READ: Fetch all predetermined and user-specific custom exercises
router.get('/exercises', async (req, res) => {
    try {
        // Find exercises where createdBy is null (default) OR createdBy is the logged-in user
        const exercises = await Exercise.find({
            $or: [{ createdBy: null }, { createdBy: req.user.id }]
        }).sort({ name: 1 }); // Alphabetical sort requirement 
        
        res.status(200).json(exercises);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exercises.' });
    }
});

// READ: Get user's workout history
router.get('/', async (req, res) => {
    try {
        // Find workouts only belonging to the logged-in user
        // .sort({ date: -1 }) fulfills the Chronological Sorting requirement 
        const workouts = await Workout.find({ userId: req.user.id })
                                      .sort({ date: -1 })
                                      .populate('exercisesLogged.exerciseId', 'name muscleGroup'); 

        // 200 OK
        res.status(200).json(workouts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch workout history.' });
    }
});

// UPDATE: Modify a past workout
router.put('/:id', async (req, res) => {
    try {
        const workoutId = req.params.id;
        
        // Find the workout and make sure it belongs to this user before updating
        const updatedWorkout = await Workout.findOneAndUpdate(
            { _id: workoutId, userId: req.user.id }, 
            req.body, 
            { new: true, runValidators: true } // Returns the updated document and runs schema validation
        );

        if (!updatedWorkout) {
            // 404 Not Found
            return res.status(404).json({ error: 'Workout not found or unauthorized.' });
        }

        res.status(200).json({ message: 'Workout updated', workout: updatedWorkout });
    } catch (error) {
        res.status(400).json({ error: 'Invalid data provided for update.' });
    }
});

// DELETE: Remove a workout from history
router.delete('/:id', async (req, res) => {
    try {
        const workoutId = req.params.id;

        // Find workout by id & delete
        const deletedWorkout = await Workout.findOneAndDelete({ 
            _id: workoutId, 
            userId: req.user.id 
        });

        if (!deletedWorkout) {
            return res.status(404).json({ error: 'Workout not found or unauthorized.' });
        }

        res.status(200).json({ message: 'Workout deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete workout.' });
    }
});

export default router;
