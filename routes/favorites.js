const express = require('express');
const router = express.Router();
const Poem = require('../models/poem');

// Add poem to favorites
router.post('/add', async (req, res) => {
    const { title, author, content } = req.body;

    if (!title || !author || !content) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields (title, author, content) are required.' 
        });
    }

    try {
        // Check if the poem already exists in the database
        const existingPoem = await Poem.findOne({ title, author });
        if (!existingPoem) {
            const poem = new Poem({ title, author, content });
            await poem.save(); // Save the poem to MongoDB
        }

        res.json({ success: true, message: 'Poem added to favorites!' });
    } catch (err) {
        console.error('Error saving poem:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add poem to favorites.', 
            error: err.message 
        });
    }
});

// View favorite poems
router.get('/', async (req, res) => {
    try {
        const favorites = await Poem.find(); // Fetch all poems from the database
        res.render('favorites', { favorites });
    } catch (err) {
        console.error('Error fetching favorites:', err.message);
        res.render('favorites', { favorites: [] });
    }
});

// Remove poem from favorites
router.post('/remove', async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ 
            success: false, 
            message: 'Title is required to remove a favorite.' 
        });
    }

    try {
        // Remove the poem by title
        await Poem.deleteOne({ title });

        // Redirect back to the favorites page after successful removal
        res.redirect('/favorites');
    } catch (err) {
        console.error('Error removing poem:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove favorite.', 
            error: err.message 
        });
    }
});

module.exports = router;

