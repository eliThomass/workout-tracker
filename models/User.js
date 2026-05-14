import mongoose from 'mongoose';
// We need bcrypt to hash passwords
// Cannot store raw passwords in DB
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        // Unique prevents duplicate accounts
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
});

// Pre-save hook to hash the password before saving it to MongoDB
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Generate a salt and hash the password
        // Salt adds a bit of extra security
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Helper method to compare passwords during login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);


