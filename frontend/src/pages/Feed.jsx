import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Play, Send, Repeat2, Search } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const FeedCard = ({ issue }) => {
  const { user } = useUser();
  const [upvotes, setUpvotes] = useState(issue.upvotes?.length || 0);
  const [hasUpvoted, setHasUpvoted] = useState(user && issue.upvotes?.includes(user?.id));

  const handleUpvote = async () => {
    if (!user) return alert("Please log in to upvote!");
    try {
      if (hasUpvoted) {
        setUpvotes(prev => prev - 1);
        setHasUpvoted(false);
      } else {
        setUpvotes(prev => prev + 1);
        setHasUpvoted(true);
        try {
          await api.put(`/issues/${issue._id}/upvote`);
        } catch(e) {
          setUpvotes(prev => prev - 1);
          setHasUpvoted(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  // Fun little hack to show a video overlay just like Reels based on the image provided
  const isVideoStyle = Math.random() > 0.5;

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 mb-4 overflow-hidden pb-1">
      {/* Header */}
      <div className="p-4 flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden shadow-sm">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${issue.authorId || issue._id}&backgroundColor=006aff`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">{issue.department || "Concerned Citizen"} <span className="text-gray-400 font-medium text-[13px] ml-1">• {new Date(issue.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></h4>
          </div>
        </div>
        <button className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content - Match exact image styling */}
      <div className="px-4 pb-3">
        <p className="text-[17px] font-bold text-gray-900 leading-snug">{issue.title} {issue.category === 'Roads & Transit' ? '📝' : ''}</p>
      </div>

      {/* Media Overlay mimicking Reel style */}
      <div className="relative w-full aspect-video bg-gray-50 px-4 mb-3">
        <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-200">
          <img src={getImageUrl(issue.imageUrl)} alt="Issue Media" className="w-full h-full object-cover" />
          {isVideoStyle && (
             <div className="absolute inset-0 bg-black/10 flex items-center justify-center cursor-pointer group">
               <div className="w-[60px] h-[60px] bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border-[2.5px] border-white/70 group-hover:scale-110 transition-transform shadow-2xl">
                 <Play className="w-[28px] h-[28px] text-white ml-1.5 fill-white" />
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Action Bar from image mock */}
      <div className="px-4 py-2 mb-1 flex items-center gap-3">
        <button 
          onClick={handleUpvote}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[16px] transition-all
            ${hasUpvoted ? 'bg-[#10b981] text-white shadow-md' : 'bg-[#10b981] text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)] hover:scale-[1.02]'}`}
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          {upvotes}
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-gray-700 text-[15px] border-2 border-gray-100 hover:bg-gray-50 transition-colors shadow-sm bg-white">
          <Repeat2 className="w-5 h-5 stroke-[2.5]" />
          Repost
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-gray-700 text-[15px] border-2 border-gray-100 hover:bg-gray-50 transition-colors shadow-sm bg-white">
          <Send className="w-5 h-5 stroke-[2.5] -rotate-45 -mt-0.5 -ml-1" />
          Send
        </button>
      </div>
    </div>
  );
};

export default function Feed() {
  const [issues, setIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('Trending');
  const categories = ['Roads & Transit', 'Water & Sanitation', 'Electricity', 'Waste Management', 'Public Safety', 'Other'];

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const { data } = await api.get('/issues');
        setIssues(data.reverse());
      } catch (err) {
        console.error(err);
      }
    };
    fetchIssues();
  }, []);

  const TabBar = ({ layoutId }) => (
    <div className="flex gap-7 border-b border-gray-200/60">
      {['Trending', 'Nearby', 'Following'].map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)}
          className={`pb-3 text-[15px] cursor-pointer relative transition-colors ${activeTab === tab ? 'text-[#006aff] font-bold' : 'text-gray-500 font-semibold hover:text-gray-800'}`}>
          {tab}
          {activeTab === tab && <motion.div layoutId={layoutId} className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#006aff] rounded-t-full" />}
        </button>
      ))}
    </div>
  );

  const CardList = () => issues.length > 0
    ? issues.map((issue, idx) => <FeedCard key={issue._id || idx} issue={issue} />)
    : (
      <div className="py-20 text-center">
        <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-6 h-6 text-gray-300" />
        </div>
        <p className="font-semibold text-gray-400">Loading issues...</p>
      </div>
    );

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
        <div className="p-4 pt-5 space-y-4">
          <CardList />
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
                <button key={cat} className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-[#006aff]/8 hover:text-[#006aff] transition-colors">
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
              <h1 className="text-[24px] font-extrabold text-gray-900">Issues Feed</h1>
              <Link to="/report" className="flex items-center gap-1.5 px-4 py-2 bg-[#006aff] text-white rounded-xl font-bold text-[13px] hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4 stroke-[3]" /> Report
              </Link>
            </div>
            <TabBar layoutId="feed-tab-d" />
          </div>
          <div className="space-y-4">
            <CardList />
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-[250px] flex-shrink-0 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-[15px]">🔥 Trending</h3>
            </div>
            <div className="p-3 space-y-1">
              {issues.slice(0, 5).map((issue, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <span className="text-[12px] font-extrabold text-[#006aff] min-w-[16px] mt-0.5">#{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug">{issue.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">+{issue.upvotes?.length || 0} supports</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-[15px] mb-4">Platform Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Issues Reported', value: `${issues.length}+` },
                { label: 'Avg. Response', value: '48h' },
                { label: 'Active Users', value: '50k+' },
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
