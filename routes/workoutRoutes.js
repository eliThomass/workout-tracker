// API routes regarding workouts/exercise

import express from 'express';
import Workout from '../models/Workout.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply the authentication middleware to ALL routes in this file
router.use(requireAuth);

// CREATE: Save a completed workout
router.post('/', async (req, res) => {
    try {
        // Destructure the data sent from the client
        const { durationMinutes, totalSets, recordsBroken, exercisesLogged } = req.body;

        // Data Validation 
        if (!exercisesLogged || exercisesLogged.length === 0) {
            return res.status(400).json({ error: 'Workout must contain at least one exercise.' });
        }

        const newWorkout = new Workout({
            // req.user.id is from the middleware
            userId: req.user.id,
            durationMinutes,
            totalSets,
            recordsBroken,
            exercisesLogged
        });

        const savedWorkout = await newWorkout.save();
        
        // 201 Created
        res.status(201).json({ message: 'Workout saved successfully', workout: savedWorkout });
    } catch (error) {
        // 500 Internal Server Error
        console.error(error);
        res.status(500).json({ error: 'Failed to save workout.' });
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
