const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_BASE_URL = 'https://poetrydb.org';

// Advanced search route
router.get('/advanced-search', async (req, res) => {
    const { author, keyword, title, page = 1, limit = 20 } = req.query;

    let exactTitleAndAuthorMatches = [];
    let prioritizedMatches = [];
    let primaryMatches = [];
    let secondaryMatches = [];
    let error = null;

    try {
        // Step 1: Fetch poems by exact title if provided
        if (title) {
            try {
                const titleResponse = await axios.get(`${API_BASE_URL}/title/${title}`);
                const allTitleMatches = Array.isArray(titleResponse.data) ? titleResponse.data : []; // Ensure it's an array

                if (author) {
                    exactTitleAndAuthorMatches = allTitleMatches.filter(poem =>
                        poem.author.toLowerCase().includes(author.toLowerCase())
                    );
                }
                prioritizedMatches = allTitleMatches.filter(poem =>
                    !exactTitleAndAuthorMatches.some(match => match.title === poem.title)
                );
            } catch (error) {
                console.error(`Error fetching poems by title: ${error.message}`);
            }
        }


        // Step 2: Fetch poems by author
        if (author) {
            const authorResponse = await axios.get(`${API_BASE_URL}/author/${author}`);
            const poemsByAuthor = Array.isArray(authorResponse.data) ? authorResponse.data : [];
            if (keyword) {
                primaryMatches = poemsByAuthor.filter(poem =>
                    poem.lines.some(line => line.toLowerCase().includes(keyword.toLowerCase()))
                );
            } else {
                primaryMatches = poemsByAuthor;
            }
        }

        // Step 3: Fetch poems by keyword
        if (keyword) {
            const keywordResponse = await axios.get(`${API_BASE_URL}/lines/${keyword}`);
            const poemsByKeyword = Array.isArray(keywordResponse.data) ? keywordResponse.data : [];
            secondaryMatches = poemsByKeyword.filter(poem =>
                !exactTitleAndAuthorMatches.some(match => match.title === poem.title) &&
                !prioritizedMatches.some(match => match.title === poem.title) &&
                !primaryMatches.some(match => match.title === poem.title)
            );
        }

        // Combine and paginate results
        const combinedResults = [
            ...exactTitleAndAuthorMatches,
            ...prioritizedMatches,
            ...primaryMatches,
            ...secondaryMatches,
        ];

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedResults = combinedResults.slice(startIndex, endIndex);

        res.render('searchResults', {
            poems: paginatedResults,
            total: combinedResults.length,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(combinedResults.length / limit),
            keyword: keyword || '', // Ensure keyword is always passed
            author: author || '',   // Ensure author is always passed
            title: title || '',     // Ensure title is always passed
            type: 'advanced search',
            error,
        });

    } catch (err) {
        console.error(err);
        error = 'An error occurred while searching. Please try again.';
        res.render('searchResults', { poems: [], total: 0, currentPage: 1, totalPages: 1, keyword: '', type: 'advanced search', error });
    }
});

module.exports = router;
