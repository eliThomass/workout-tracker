import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    muscleGroup: {
        type: String,
        // This will be used for the Filtering requirement 
        enum: ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Cardio', 'Other'],
        default: 'Other'
    },
    isCustom: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null means it's a pre-determined, default exercise
    }
});

export default mongoose.model('Exercise', exerciseSchema);
