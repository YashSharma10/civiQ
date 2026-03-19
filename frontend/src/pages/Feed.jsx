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

      <div className="h-full w-full snap-start relative bg-[#0a0a0a] text-white shrink-0 group overflow-hidden border-b border-gray-900/50">
        {/* Background Layer */}
        {post.imageUrl ? (
          <img src={post.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="post" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#006aff]/80 via-purple-900/80 to-black"></div>
        )}

        {/* Overlay Gradients for readability */}
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-0"></div>
        <div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-0"></div>

        {/* Content Layer (Bottom Left) */}
        <div className="absolute bottom-0 left-0 right-16 p-4 flex flex-col justify-end pointer-events-none z-10">
          {/* Repost indicator */}
          {post.type === 'repost' && (
            <div className="flex items-center gap-1.5 text-[12px] text-white/80 font-bold mb-2">
              <Repeat2 className="w-4 h-4" /> {post.authorName} reposted
            </div>
          )}

          <div className="flex items-center gap-2 mb-2 pointer-events-auto">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${post.authorId}&backgroundColor=006aff`}
              className="w-10 h-10 rounded-full border border-white/20" alt="avatar" />
            <div className="flex flex-col">
              <span className="font-bold text-[15px] drop-shadow-md">{post.authorName}</span>
              <span className="text-[12px] text-white/70 drop-shadow-md">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {post.type === 'repost' && post.repostedFrom?.content && (
            <div className="mb-2 p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 pointer-events-auto">
              <p className="text-[11px] font-bold text-white/70 mb-1">{post.repostedFrom.authorName}</p>
              <p className="text-[13px] text-white/90 line-clamp-2">{post.repostedFrom.content}</p>
            </div>
          )}

          {post.content && (
            <p className="text-[15px] font-medium leading-snug drop-shadow-md pointer-events-auto mb-2 pr-2">
              {post.content}
            </p>
          )}
        </div>

        {/* Actions Sidebar (Right) */}
        <div className="absolute bottom-6 right-2 flex flex-col items-center gap-4 z-10 w-14 pointer-events-auto">
          <button onClick={handleUpvote} className="flex flex-col items-center gap-1 group/btn">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover/btn:bg-white/20 transition-all">
              <ThumbsUp className={`w-5 h-5 ${hasUpvoted ? 'fill-[#006aff] text-[#006aff]' : 'text-white'}`} />
            </div>
            <span className="text-[12px] font-bold text-white drop-shadow-md">{upvotes}</span>
          </button>

          <button onClick={() => setShowComments(v => !v)} className="flex flex-col items-center gap-1 group/btn">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover/btn:bg-white/20 transition-all">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-[12px] font-bold text-white drop-shadow-md">{post.comments?.length || 0}</span>
          </button>

          <button onClick={() => { if (!user) return alert('Please log in!'); setRepostModal(true); }} className="flex flex-col items-center gap-1 group/btn">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover/btn:bg-white/20 transition-all">
               <Repeat2 className={`w-5 h-5 ${hasReposted ? 'text-[#10b981]' : 'text-white'}`} />
            </div>
            <span className="text-[12px] font-bold text-white drop-shadow-md">{post.reposts?.length || 0}</span>
          </button>

          <button className="flex flex-col items-center gap-1 group/btn mt-2">
            <MoreHorizontal className="w-6 h-6 text-white drop-shadow-md" />
          </button>
        </div>

        {/* Comments Overlay */}
        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 max-h-[60%] bg-white text-black rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 overflow-y-auto flex flex-col">
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <h3 className="font-bold text-[15px]">Comments</h3>
                <button onClick={() => setShowComments(false)} className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <CommentsSection post={post} onCommented={onRefresh} />
              </div>
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
    <div className="h-full w-full snap-start relative bg-[#0a0a0a] text-white shrink-0 group overflow-hidden border-b border-gray-900/50">
      {/* Background Layer */}
      {issue.imageUrl ? (
        <img src={getImageUrl(issue.imageUrl)} className="absolute inset-0 w-full h-full object-cover" alt="issue" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-orange-900/80 to-black"></div>
      )}

      {/* Overlay Gradients for readability */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-0"></div>
      <div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-0"></div>

      {/* Top Badge */}
      <div className="absolute top-4 left-4 flex gap-2 z-10 pointer-events-auto">
        <span className="text-[11px] font-extrabold text-white bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-red-500/30 tracking-wide uppercase">
          🚨 Issue
        </span>
        <span className="text-[11px] font-extrabold text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-white/10 tracking-wide uppercase">
          {issue.status}
        </span>
      </div>

      {/* Content Layer (Bottom Left) */}
      <div className="absolute bottom-0 left-0 right-16 p-4 flex flex-col justify-end pointer-events-none z-10">
        <div className="flex items-center gap-2 mb-3 pointer-events-auto">
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${issue.authorId}&backgroundColor=006aff`}
            className="w-10 h-10 rounded-full border border-white/20 shadow-md" alt="avatar" />
          <div className="flex flex-col">
            <span className="font-bold text-[15px] drop-shadow-md">{issue.department || issue.authorName || 'Concerned Citizen'}</span>
            <span className="text-[12px] text-white/70 drop-shadow-md">
              {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        <p className="text-[18px] font-bold leading-snug drop-shadow-md pointer-events-auto mb-1 pr-2">
          {issue.title}
        </p>
        <p className="text-[14px] text-white/80 font-medium leading-snug drop-shadow-md pointer-events-auto mb-2 line-clamp-3 pr-2">
          {issue.description}
        </p>
      </div>

      {/* Actions Sidebar (Right) */}
      <div className="absolute bottom-6 right-2 flex flex-col items-center gap-4 z-10 w-14 pointer-events-auto">
        <button onClick={handleUpvote} className="flex flex-col items-center gap-1 group/btn">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${hasUpvoted ? 'bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-black/40 backdrop-blur-md border border-white/10 group-hover/btn:bg-white/20'}`}>
            <Plus className={`w-6 h-6 stroke-[3] ${hasUpvoted ? 'text-white' : 'text-white'}`} />
          </div>
          <span className="text-[12px] font-bold text-white drop-shadow-md">{upvotes}</span>
        </button>

        <Link to={`/issue/${issue._id}`} className="flex flex-col items-center gap-1 group/btn">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover/btn:bg-white/20 transition-all">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-md">View</span>
        </Link>
        
        <button className="flex flex-col items-center gap-1 group/btn">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover/btn:bg-white/20 transition-all">
            <Send className="w-5 h-5 text-white -rotate-45 ml-1" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-md">Share</span>
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
  const [showCreateModal, setShowCreateModal] = useState(false);
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
    <div className="flex gap-5 border-b border-gray-200/60">
      {['Trending', 'Posts', 'Issues'].map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)}
          className={`pb-2.5 text-[14px] cursor-pointer relative transition-colors ${activeTab === tab ? 'text-[#006aff] font-bold' : 'text-gray-500 font-semibold hover:text-gray-800'}`}>
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
      <div className="py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-white shadow-sm border rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Search className="w-5 h-5 text-gray-300" />
        </div>
        <p className="font-semibold text-gray-400">Loading feed...</p>
      </div>
    );
    return (
      <div className="flex-1 w-full mx-auto overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black h-full relative border-x border-gray-900/50 md:rounded-b-2xl md:shadow-xl md:border-b">
        {items.map((item, idx) =>
          item._feedType === 'post'
            ? <PostCard key={`p-${item._id || idx}`} post={item} onRefresh={fetchAll} />
            : <IssueCard key={`i-${item._id || idx}`} issue={item} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f3f5]">
      {/* Create Post Modal (Mobile) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="md:hidden fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm p-0">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-[17px]">Create Post</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="p-4 pb-8">
                <CreatePost onPosted={() => { fetchAll(); setShowCreateModal(false); }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MOBILE (< md) ── */}
      <div className="md:hidden flex flex-col" style={{ height: 'calc(100dvh - 56px)' }}>
        <div className="sticky top-14 z-40 bg-white border-b border-gray-200 px-4 pt-3 pb-0 shadow-sm flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-[22px] font-extrabold text-gray-900">Feed</h1>
            <button onClick={() => setShowCreateModal(true)} className="w-8 h-8 rounded-full border-[1.5px] border-[#006aff] flex items-center justify-center text-[#006aff] hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
          <TabBar layoutId="feed-tab-m" />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <FeedList layoutId="feed-tab-m" />
        </div>
      </div>

      {/* ── DESKTOP (≥ md) ── */}
      <div className="hidden md:flex max-w-6xl mx-auto w-full gap-8 px-6 py-8 items-start justify-center">

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
        <div className="flex-1 min-w-0 flex flex-col h-[calc(100vh-120px)] max-w-[500px]">
          <div className="bg-white rounded-t-2xl border border-gray-200 shadow-sm px-6 pt-5 pb-0 flex-shrink-0 z-10">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-[24px] font-extrabold text-gray-900">Feed</h1>
              <Link to="/report" className="flex items-center gap-1.5 px-4 py-2 bg-[#006aff] text-white rounded-xl font-bold text-[13px] hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4 stroke-[3]" /> Report Issue
              </Link>
            </div>
            <TabBar layoutId="feed-tab-d" />
          </div>
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-black/5 rounded-b-2xl">
            <FeedList layoutId="feed-tab-d" />
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-[300px] flex-shrink-0 sticky top-24 space-y-4">
          <CreatePost onPosted={fetchAll} />
        </aside>

      </div>
    </div>
  );
}
