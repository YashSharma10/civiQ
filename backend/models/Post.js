const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  imageUrl: { type: String, default: '' },
  // Reposts: array of userId strings who have reposted
  reposts: [{ type: String }],
  // Original post reference if this is a repost
  repostedFrom: {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    authorName: { type: String, default: '' },
    content: { type: String, default: '' },
  },
  // Upvotes (likes)
  upvotes: [{ type: String }],
  // Comments
  comments: [{
    userId: { type: String },
    userName: { type: String },
    text: { type: String },
    date: { type: Date, default: Date.now }
  }],
  type: { type: String, enum: ['post', 'repost'], default: 'post' }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
