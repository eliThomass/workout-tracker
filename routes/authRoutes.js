// API routes for authentication
// such as Login, Signup, etc.

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Helper function to generate a token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// SIGN UP: Create a new user account
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Data Validation (Rubric Requirement)
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }

        // Create the user, hashing happens automatticaly in User.js pre-hook 
        const newUser = new User({ email, password });
        await newUser.save();

        // Generate a token so they are immediately logged in after signing up
        const token = generateToken(newUser._id);

        // 201 Created
        res.status(201).json({ message: 'User created successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during sign up.' });
    }
});

// LOG IN: Authenticate an existing user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Data validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            // 401 Unauthorized
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Verify the password using the helper method in User.js
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate the valid token
        const token = generateToken(user._id);

        // 200 OK
        res.status(200).json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// LOG OUT: End the session
router.post('/logout', (req, res) => {
    // This route just gives the client a clean 200 OK response.
    // The actual logging out (deletion of token) will be done in the frontend locally.
    res.status(200).json({ message: 'Successfully logged out. Please delete your local token.' });
});

export default router;



