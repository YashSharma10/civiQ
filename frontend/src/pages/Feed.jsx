import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Play, Send, Repeat2, Search, X, Image, ThumbsUp, MessageCircle, ChevronDown } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

// ─── Repost Modal ───────────────────────────────────────────────────
const RepostModal = ({ post, onClose, onReposted }) => {
  const { user } = useUser();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRepost = async () => {
    if (!user) return alert('Please log in to repost!');
    setLoading(true);
    try {
      await api.post(`/posts/${post._id}/repost`, {
        authorName: user.fullName || user.username || 'Anonymous',
        quoteComment: comment,
      });
      onReposted();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[17px]">Repost</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* Original post preview */}
        <div className="mx-5 my-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Original Post by {post.authorName}</p>
          <p className="text-[14px] text-gray-800 line-clamp-3">{post.content}</p>
        </div>
        <div className="px-5 pb-2">
          <textarea
            className="w-full border border-gray-200 rounded-2xl p-4 text-[15px] resize-none outline-none focus:border-[#006aff] transition-colors placeholder:text-gray-400"
            rows={3}
            placeholder="Add a comment (optional)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleRepost} disabled={loading}
            className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#006aff] hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
            <Repeat2 className="w-5 h-5" />
            {loading ? 'Reposting...' : 'Repost'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Comments Section ────────────────────────────────────────────────
const CommentsSection = ({ post, onCommented }) => {
  const { user } = useUser();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComment = async () => {
    if (!user) return alert('Please log in to comment!');
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post(`/posts/${post._id}/comment`, {
        userName: user.fullName || user.username || 'Anonymous',
        text: text.trim(),
      });
      setText('');
      onCommented();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-100 px-4 pt-3 pb-4">
      {/* Existing comments */}
      {post.comments?.slice(-3).map((c, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.userId}&backgroundColor=006aff`}
            className="w-7 h-7 rounded-full flex-shrink-0" alt="avatar" />
          <div className="bg-gray-50 rounded-2xl px-3 py-2 flex-1">
            <span className="text-[12px] font-bold text-gray-900">{c.userName} </span>
            <span className="text-[13px] text-gray-700">{c.text}</span>
          </div>
        </div>
      ))}
      {/* Input */}
      <div className="flex gap-2 mt-2">
        {user && <img src={user.imageUrl} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" alt="me" />}
        <input
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-[14px] outline-none focus:ring-2 ring-[#006aff]/20 placeholder:text-gray-400"
          placeholder="Write a comment..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleComment()}
        />
        <button onClick={handleComment} disabled={!text.trim() || loading}
          className="p-2 bg-[#006aff] rounded-full text-white disabled:opacity-40 hover:bg-blue-600 transition-colors flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Create Post Panel ───────────────────────────────────────────────
const CreatePost = ({ onPosted }) => {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!user) return alert('Please log in to post!');
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.post('/posts', {
        content: content.trim(),
        authorName: user.fullName || user.username || 'Anonymous',
      });
      setContent('');
      onPosted();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
      <div className="flex gap-3 items-start">
        <img src={user.imageUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="me" />
        <textarea
          className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-[15px] resize-none outline-none focus:bg-white focus:ring-2 ring-[#006aff]/20 transition-all border border-transparent focus:border-gray-200 placeholder:text-gray-400"
          rows={2}
          placeholder="Share a community update or issue..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between mt-3 pl-[52px]">
        <div className="flex gap-3 text-gray-500">
          <button className="flex items-center gap-1.5 text-[13px] font-semibold hover:text-[#006aff] transition-colors">
            <Image className="w-4 h-4" /> Photo
          </button>
        </div>
        <button onClick={handlePost} disabled={!content.trim() || loading}
          className="px-5 py-2 bg-[#006aff] text-white rounded-full font-bold text-[13px] disabled:opacity-40 hover:bg-blue-600 transition-colors">
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
};

// ─── Post Card ───────────────────────────────────────────────────────
const PostCard = ({ post, onRefresh }) => {
  const { user } = useUser();
  const [upvotes, setUpvotes] = useState(post.upvotes?.length || 0);
  const [hasUpvoted, setHasUpvoted] = useState(user && post.upvotes?.includes(user?.id));
  const [showComments, setShowComments] = useState(false);
  const [repostModal, setRepostModal] = useState(false);

  const hasReposted = user && post.reposts?.includes(user?.id);

  const handleUpvote = async () => {
    if (!user) return alert('Please log in to like!');
    const newVal = hasUpvoted ? upvotes - 1 : upvotes + 1;
    setUpvotes(newVal);
    setHasUpvoted(!hasUpvoted);
    try {
      await api.put(`/posts/${post._id}/upvote`);
    } catch {
      setUpvotes(upvotes);
      setHasUpvoted(hasUpvoted);
    }
  };

  return (
    <>
      <AnimatePresence>{repostModal && <RepostModal post={post} onClose={() => setRepostModal(false)} onReposted={onRefresh} />}</AnimatePresence>

      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 mb-4 overflow-hidden">
        {/* Repost indicator */}
        {post.type === 'repost' && (
          <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[12px] text-gray-400 font-semibold">
            <Repeat2 className="w-4 h-4" /> {post.authorName} reposted
          </div>
        )}

        {/* If repost, show original context */}
        {post.type === 'repost' && post.repostedFrom?.content && (
          <div className="mx-4 mb-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-[11px] font-bold text-gray-400 mb-1">{post.repostedFrom.authorName}</p>
            <p className="text-[14px] text-gray-700 line-clamp-3">{post.repostedFrom.content}</p>
          </div>
        )}

        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${post.authorId}&backgroundColor=006aff`}
              className="w-10 h-10 rounded-full" alt="avatar" />
            <div>
              <p className="font-bold text-gray-900 text-[14px]">{post.authorName}</p>
              <p className="text-[12px] text-gray-400">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-[16px] text-gray-900 leading-relaxed">{post.content}</p>
          </div>
        )}

        {/* Image */}
        {post.imageUrl && (
          <div className="px-4 mb-3">
            <div className="rounded-2xl overflow-hidden border border-gray-100">
              <img src={post.imageUrl} className="w-full object-cover max-h-72" alt="post" />
            </div>
          </div>
        )}

        {/* Counts row */}
        <div className="px-4 pb-2 flex items-center gap-4 text-[12px] text-gray-400 font-semibold">
          {upvotes > 0 && <span>{upvotes} like{upvotes !== 1 ? 's' : ''}</span>}
          {post.comments?.length > 0 && <span>{post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}</span>}
          {post.reposts?.length > 0 && <span>{post.reposts.length} repost{post.reposts.length !== 1 ? 's' : ''}</span>}
        </div>

        {/* Action Bar */}
        <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-100 pt-2">
          <button onClick={handleUpvote}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-[14px] transition-all
              ${hasUpvoted ? 'bg-blue-50 text-[#006aff]' : 'text-gray-600 hover:bg-gray-50'}`}>
            <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-[#006aff]' : ''}`} />
            Like
          </button>

          <button onClick={() => setShowComments(v => !v)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-[14px] text-gray-600 hover:bg-gray-50 transition-colors">
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>

          <button onClick={() => { if (!user) return alert('Please log in!'); setRepostModal(true); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-[14px] transition-all
              ${hasReposted ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Repeat2 className="w-4 h-4" />
            {hasReposted ? 'Reposted' : 'Repost'}
          </button>
        </div>

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <CommentsSection post={post} onCommented={onRefresh} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

// ─── Issue Card (existing from reports) ─────────────────────────────
const IssueCard = ({ issue }) => {
  const { user } = useUser();
  const [upvotes, setUpvotes] = useState(issue.upvotes?.length || 0);
  const [hasUpvoted, setHasUpvoted] = useState(user && issue.upvotes?.includes(user?.id));

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  const handleUpvote = async () => {
    if (!user) return alert('Please log in to upvote!');
    const newVal = hasUpvoted ? upvotes - 1 : upvotes + 1;
    setUpvotes(newVal);
    setHasUpvoted(!hasUpvoted);
    try {
      await api.put(`/issues/${issue._id}/upvote`);
    } catch {
      setUpvotes(upvotes);
      setHasUpvoted(hasUpvoted);
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 mb-4 overflow-hidden pb-1">
      {/* Badge */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-white bg-[#006aff] px-2.5 py-0.5 rounded-full">🚨 Issue Report</span>
        <span className="text-[11px] font-semibold text-gray-400">{issue.status}</span>
      </div>

      {/* Header */}
      <div className="px-4 pt-2 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${issue.authorId}&backgroundColor=006aff`}
            className="w-10 h-10 rounded-full" alt="avatar" />
          <div>
            <p className="font-bold text-gray-900 text-[14px]">{issue.department || issue.authorName || 'Concerned Citizen'}</p>
            <p className="text-[12px] text-gray-400">{new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"><MoreHorizontal className="w-5 h-5" /></button>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[17px] font-bold text-gray-900 leading-snug">{issue.title}</p>
        <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">{issue.description}</p>
      </div>

      {/* Image */}
      <div className="px-4 mb-3">
        <div className="rounded-2xl overflow-hidden">
          <img src={getImageUrl(issue.imageUrl)} className="w-full aspect-video object-cover" alt="issue" />
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 py-2 mb-1 flex items-center gap-3">
        <button onClick={handleUpvote}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[16px] transition-all
            ${hasUpvoted ? 'bg-[#10b981] text-white' : 'bg-[#10b981] text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)] hover:scale-[1.02]'}`}>
          <Plus className="w-5 h-5 stroke-[3]" /> {upvotes}
        </button>
        <Link to={`/issue/${issue._id}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-gray-700 text-[14px] border-2 border-gray-100 hover:bg-gray-50 bg-white">
          <MessageCircle className="w-4 h-4" /> View
        </Link>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-gray-700 text-[14px] border-2 border-gray-100 hover:bg-gray-50 bg-white">
          <Send className="w-4 h-4 -rotate-45" /> Send
        </button>
      </div>
    </div>
  );
};

// ─── Main Feed Page ──────────────────────────────────────────────────
export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('Trending');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const categories = ['Roads & Transit', 'Water & Sanitation', 'Electricity', 'Waste Management', 'Public Safety', 'Other'];

  const fetchAll = async () => {
    try {
      const [postsRes, issuesRes] = await Promise.all([api.get('/posts'), api.get('/issues')]);
      setPosts(postsRes.data);
      setIssues(issuesRes.data.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Interleave posts and issues for a mixed feed
  const buildFeed = () => {
    const tagged = [
      ...posts.map(p => ({ ...p, _feedType: 'post' })),
      ...issues.map(i => ({ ...i, _feedType: 'issue' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return tagged;
  };

  const feed = buildFeed();

  const TabBar = ({ layoutId }) => (
    <div className="flex gap-7 border-b border-gray-200/60">
      {['Trending', 'Posts', 'Issues'].map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)}
          className={`pb-3 text-[15px] cursor-pointer relative transition-colors ${activeTab === tab ? 'text-[#006aff] font-bold' : 'text-gray-500 font-semibold hover:text-gray-800'}`}>
          {tab}
          {activeTab === tab && <motion.div layoutId={layoutId} className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#006aff] rounded-t-full" />}
        </button>
      ))}
    </div>
  );

  const filteredFeed = () => {
    if (activeTab === 'Posts') return feed.filter(i => i._feedType === 'post');
    if (activeTab === 'Issues') return feed.filter(i => i._feedType === 'issue');
    return feed; // Trending = everything
  };

  const FeedList = ({ layoutId }) => {
    const items = filteredFeed();
    if (loadingPosts) return (
      <div className="py-20 text-center">
        <div className="w-12 h-12 bg-white shadow-sm border rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Search className="w-5 h-5 text-gray-300" />
        </div>
        <p className="font-semibold text-gray-400">Loading feed...</p>
      </div>
    );
    return (
      <>
        <CreatePost onPosted={fetchAll} />
        {items.map((item, idx) =>
          item._feedType === 'post'
            ? <PostCard key={`p-${item._id || idx}`} post={item} onRefresh={fetchAll} />
            : <IssueCard key={`i-${item._id || idx}`} issue={item} />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f3f5]">

      {/* ── MOBILE (< md) ── */}
      <div className="md:hidden max-w-[480px] mx-auto flex flex-col pb-20">
        <div className="sticky top-16 z-40 bg-white border-b border-gray-100 pt-5 px-4 pb-0 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-[28px] font-extrabold text-gray-900">Issues</h1>
            <Link to="/report" className="w-9 h-9 rounded-full border-[1.5px] border-[#006aff] flex items-center justify-center text-[#006aff] hover:bg-blue-50 transition-colors">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </Link>
          </div>
          <TabBar layoutId="feed-tab-m" />
        </div>
        <div className="p-4 pt-5">
          <FeedList layoutId="feed-tab-m" />
        </div>
      </div>

      {/* ── DESKTOP (≥ md) ── */}
      <div className="hidden md:flex max-w-6xl mx-auto w-full gap-6 px-6 py-8 items-start">

        {/* Left sidebar */}
        <aside className="w-[220px] flex-shrink-0 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-[15px]">Categories</h3>
            </div>
            <div className="p-3 space-y-0.5">
              {categories.map(cat => (
                <button key={cat} className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-[#006aff]/5 hover:text-[#006aff] transition-colors">
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2">
            <h3 className="font-bold text-gray-900 text-[14px] mb-3">Quick Actions</h3>
            <Link to="/report" className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#006aff] text-white rounded-xl font-bold text-[13px] hover:bg-blue-600 transition-colors">
              <Plus className="w-4 h-4 stroke-[3]" /> Report Issue
            </Link>
            <Link to="/dashboard" className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-[13px] hover:bg-gray-200 transition-colors">
              View Map
            </Link>
          </div>
        </aside>

        {/* Center feed */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 pt-5 pb-0">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-[24px] font-extrabold text-gray-900">Community Feed</h1>
              <Link to="/report" className="flex items-center gap-1.5 px-4 py-2 bg-[#006aff] text-white rounded-xl font-bold text-[13px] hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4 stroke-[3]" /> Report Issue
              </Link>
            </div>
            <TabBar layoutId="feed-tab-d" />
          </div>
          <div>
            <FeedList layoutId="feed-tab-d" />
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-[250px] flex-shrink-0 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-[15px]">🔥 Trending Issues</h3>
            </div>
            <div className="p-3 space-y-1">
              {issues.slice(0, 5).map((issue, i) => (
                <Link to={`/issue/${issue._id}`} key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer block">
                  <span className="text-[12px] font-extrabold text-[#006aff] min-w-[16px] mt-0.5">#{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug">{issue.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">+{issue.upvotes?.length || 0} supports</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-[15px] mb-4">Platform Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Issues Reported', value: `${issues.length}+` },
                { label: 'Community Posts', value: `${posts.length}` },
                { label: 'Avg. Response', value: '48h' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-500">{s.label}</span>
                  <span className="text-[14px] font-extrabold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
