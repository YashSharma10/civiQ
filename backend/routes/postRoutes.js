const express = require('express');
const router = express.Router();
const { getPosts, createPost, upvotePost, repost, addComment, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getPosts);
router.post('/', protect, createPost);
router.put('/:id/upvote', protect, upvotePost);
router.post('/:id/repost', protect, repost);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deletePost);

module.exports = router;
