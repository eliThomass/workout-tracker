import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // We can use date for the Sorting requirement
    date: {
        type: Date,
        default: Date.now
    },
    // Derived Data fields from User Story 6 
    durationMinutes: {
        type: Number,
        default: 0
    },
    totalSets: {
        type: Number,
        default: 0
    },
    recordsBroken: {
        type: Number,
        default: 0
    },
    // The actual workout data
    exercisesLogged: [{
        exerciseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exercise',
            required: true
        },
        sets: [{
            reps: { type: Number, required: true },
            weight: { type: Number, required: true }
        }]
    }]
});

export default mongoose.model('Workout', workoutSchema);

