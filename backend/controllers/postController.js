const Post = require('../models/Post');
const { getAuth } = require('@clerk/express');

// GET all posts (newest first)
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create a new community post
exports.createPost = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { content, imageUrl, authorName } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content is required' });

    const post = await Post.create({
      authorId: userId,
      authorName: authorName || 'Anonymous',
      content: content.trim(),
      imageUrl: imageUrl || '',
    });
    res.status(201).json(post);
  } catch (err) {
    console.error('createPost error:', err);
    res.status(400).json({ message: err.message });
  }
};

// PUT upvote/un-upvote a post
exports.upvotePost = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.upvotes.indexOf(userId);
    if (idx === -1) {
      post.upvotes.push(userId);
    } else {
      post.upvotes.splice(idx, 1);
    }
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST repost — creates a new post entry that references the original
exports.repost = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const original = await Post.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Post not found' });

    // Track userId in original post's reposts array
    if (!original.reposts.includes(userId)) {
      original.reposts.push(userId);
      await original.save();
    }

    // Create a new repost entry in the feed
    const repost = await Post.create({
      authorId: userId,
      authorName: req.body.authorName || 'Anonymous',
      content: req.body.quoteComment || '',
      type: 'repost',
      repostedFrom: {
        postId: original._id,
        authorName: original.authorName,
        content: original.content,
      },
      imageUrl: original.imageUrl || '',
    });

    res.status(201).json(repost);
  } catch (err) {
    console.error('repost error:', err);
    res.status(500).json({ message: err.message });
  }
};

// POST add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({
      userId,
      userName: req.body.userName || 'Anonymous',
      text: req.body.text,
    });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE a post (only by author)
exports.deletePost = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.authorId !== userId) return res.status(403).json({ message: 'Forbidden' });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
