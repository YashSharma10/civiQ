const express = require('express');
const router = express.Router();
const {
    getIssues,
    getIssueById,
    createIssue,
    updateIssueStatus,
    upvoteIssue,
    addComment,
    getUserIssues,
    reviewIssue
} = require('../controllers/issueController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getIssues)
    .post(protect, createIssue);

router.route('/my')
    .get(protect, getUserIssues);

// Ensure /my is ABOVE /:id so it doesn't get matched as an ID
router.route('/:id')
    .get(getIssueById);

router.route('/:id/status')
    .put(protect, updateIssueStatus);

router.route('/:id/upvote')
    .put(protect, upvoteIssue);

router.route('/:id/comments')
    .post(protect, addComment);

router.route('/:id/review')
    .post(protect, reviewIssue);

module.exports = router;
