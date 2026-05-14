import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

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
  .then(() => console.log(`Connected successfully to database: ${dbName}`))
  .catch(err => console.error('MongoDB connection error:', err));

// Mount the API routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
