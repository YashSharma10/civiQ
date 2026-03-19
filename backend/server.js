const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');
const connectDB = require('./config/db');
const issueRoutes = require('./routes/issueRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/issues', issueRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
    res.send('Civic Issue Tracker API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
