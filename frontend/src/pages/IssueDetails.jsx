import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import api from '../api/axios';
import { ThumbsUp, User, Activity,MessageSquare,Send, MapPin, Clock, Info, Check, Image as ImageIcon, Map, HandHeart, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import toast from 'react-hot-toast';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const TRACKING_STEPS = [
  { id: 'Pending', label: 'Pending Validation', description: 'Issue reported' },
  { id: 'Assigned', label: 'Assigned', description: 'Worker assigned' },
  { id: 'Inspect', label: 'Inspection', description: 'Site Inspection' },
  { id: 'In Progress', label: 'In Progress', description: 'Work started' },
  { id: 'Resolved', label: 'Resolved', description: 'Issue fixed' }
];

export default function IssueDetails() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const { user } = useUser();

  const [assignedWorkerName, setAssignedWorkerName] = useState('');
  const [isEditingWorker, setIsEditingWorker] = useState(true);
  const [isDonating, setIsDonating] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(50);
  const [customDonation, setCustomDonation] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('donate') === 'success') {
      toast.success('Thank you for your generous contribution! 💖', { duration: 5000 });
      window.history.replaceState(null, '', window.location.pathname);
    } else if (query.get('donate') === 'cancel') {
      toast.error('Donation was cancelled.', { duration: 4000 });
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleDonate = async () => {
    const amountInRs = customDonation ? parseInt(customDonation) : selectedDonation;
    if (!amountInRs || amountInRs < 50) return alert('Stripe requires a minimum total amount of ₹50 (approx $0.50 USD).');
    if (!user) return alert('Please login to donate');
    
    setIsDonating(true);
    try {
      const { data } = await api.post('/payments/create-checkout-session', {
        issueId: issue._id,
        issueTitle: issue.title,
        donationAmount: amountInRs * 100 // send strictly in paise
      });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Donation error:', err);
      alert(err.response?.data?.message || 'Error processing donation');
      setIsDonating(false);
    }
  };

  const fetchIssue = async () => {
    try {
      const { data } = await api.get(`/issues/${id}`);
      setIssue(data);
      setAssignedWorkerName(data.assignedToName || '');
      setIsEditingWorker(!data.assignedToName);
    } catch (error) {
      setError('Failed to fetch issue details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id, user]);

  const handleUpvote = async () => {
    if (!user) return alert('Please login to upvote');
    try {
      await api.put(`/issues/${id}/upvote`);
      fetchIssue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/issues/${id}/comments`, { text: commentText, userName: user.fullName || user.username || 'User' });
      setCommentText('');
      fetchIssue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (e) => {
    try {
      await api.put(`/issues/${id}/status`, { status: e.target.value });
      fetchIssue();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleAssignSave = async () => {
    if (!assignedWorkerName.trim()) return;
    try {
      await api.put(`/issues/${id}/status`, { assignedToName: assignedWorkerName.trim(), status: 'Assigned' });
      setIsEditingWorker(false);
      fetchIssue();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error assigning worker');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Issue not found'}</h2>
        <Link to="/dashboard" className="text-primary hover:underline flex items-center justify-center gap-2 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const isUpvoted = user && issue.upvotes.includes(user.id);
  const isAdmin = user && user.publicMetadata?.role === 'authority';
  const isAssignedToMe = user && issue.assignedToId === user.id;

  const currentStepIndex = Math.max(0, TRACKING_STEPS.findIndex(step => step.id === (issue.status || 'Pending')));
  const currentStep = TRACKING_STEPS[currentStepIndex];
  const lastStep = currentStepIndex > 0 ? TRACKING_STEPS[currentStepIndex - 1] : null;
  const nextStep = currentStepIndex < TRACKING_STEPS.length - 1 ? TRACKING_STEPS[currentStepIndex + 1] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-medium mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Issues
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {issue.imageUrl && (
              <div className="h-64 sm:h-96 w-full relative">
                <img src={issue.imageUrl.startsWith('http') ? issue.imageUrl : `http://localhost:5000${issue.imageUrl}`} alt={issue.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-sm rounded-full tracking-wide uppercase">
                  {issue.category}
                </span>
                
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${issue.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-200' : issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                  {issue.status}
                </span>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">{issue.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500 font-medium mb-8">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-bold">Reported by:</span> {issue.authorName}
                </div>
                {issue.assignedToName && (
                  <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    <User className="w-4 h-4" />
                    <span className="font-bold">Assigned to:</span> {issue.assignedToName}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {new Date(issue.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="prose max-w-none text-gray-600">
                <p className="whitespace-pre-wrap leading-relaxed">{issue.description}</p>
              </div>
              
              {/* Start Tracker */}
              <div className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 p-5 md:p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Live Issue Tracking
                  </h3>
                  
                  {/* Status Summary */}
                  <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6">
                    <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 text-left">
                      <p className="text-[10px] md:text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Last Step</p>
                      <p className="font-bold text-gray-800 text-xs md:text-base line-clamp-1">{lastStep ? lastStep.label : 'None'}</p>
                    </div>
                    <div className="bg-primary/5 p-3 md:p-4 rounded-xl border border-primary/20 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                      <p className="text-[10px] md:text-sm text-primary font-bold mb-1 uppercase tracking-wider">Current</p>
                      <p className="font-extrabold text-primary text-xs md:text-base line-clamp-1">{currentStep.label}</p>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 text-right">
                      <p className="text-[10px] md:text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Next Step</p>
                      <p className="font-bold text-gray-800 text-xs md:text-base line-clamp-1">{nextStep ? nextStep.label : 'Completed'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="relative flex flex-col md:flex-row justify-between items-start md:items-start pt-2">
                    {/* Background Line for desktop */}
                    <div className="hidden md:block absolute top-[15px] left-[10%] w-[80%] h-1 bg-gray-100 z-0"></div>
                    
                    {/* Active Line for desktop */}
                    <div 
                      className="hidden md:block absolute top-[15px] left-[10%] h-1 bg-primary z-0 transition-all duration-700 ease-in-out"
                      style={{ width: `${(Math.max(0, currentStepIndex) / (TRACKING_STEPS.length - 1)) * 80}%` }}
                    ></div>

                    {TRACKING_STEPS.map((step, index) => {
                      const isCompleted = index < currentStepIndex;
                      const isCurrent = index === currentStepIndex;

                      return (
                        <div key={step.id} className="relative z-10 flex md:flex-col items-center md:items-center gap-4 md:gap-3 w-full md:w-1/5 mb-8 md:mb-0 last:mb-0">
                          {/* Mobile connecting line */}
                          {index !== TRACKING_STEPS.length - 1 && (
                            <div className="md:hidden absolute left-[15px] top-[30px] w-0.5 h-[calc(100%+16px)] bg-gray-100 -translate-x-1/2 z-0">
                              <div 
                                className={`w-full bg-primary transition-all duration-700 ease-in-out`} 
                                style={{ height: isCompleted ? '100%' : '0%' }}
                              ></div>
                            </div>
                          )}

                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-500 z-10 bg-white
                            ${isCompleted ? 'border-primary bg-primary text-white shadow-md' : 
                              isCurrent ? 'border-primary text-primary shadow-[0_0_0_4px_rgba(79,70,229,0.15)] ring-[3px] ring-primary/20 ring-offset-1' : 
                              'border-gray-200 text-gray-400'}
                          `}>
                            {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                          </div>
                          
                          <div className="md:text-center pt-1 md:px-2 flex-grow md:flex-grow-0">
                            <p className={`font-bold text-sm transition-colors duration-300 ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                            <p className={`text-xs mt-1 ${isCurrent ? 'text-gray-700' : 'text-gray-500'} md:block`}>{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* End Tracker */}
              
              <div className="pt-8 mt-12 border-t border-gray-100 flex flex-col gap-8">
                {issue.status === 'Resolved' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 flex flex-col items-center gap-5"
                  >
                    <div className="w-full text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-3">
                        <span className="text-2xl">🎉</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Issue Successfully Resolved
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base max-w-lg mx-auto">
                        This civic issue has been addressed. Consider supporting our mission to continue building better communities.
                      </p>
                    </div>

                    <div className="w-full max-w-lg">
                      <p className="text-sm font-bold text-gray-700 mb-3 text-center uppercase tracking-wider">Select Donation Amount</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {[50, 100, 500].map(amt => (
                          <button
                            key={amt}
                            onClick={() => { setSelectedDonation(amt); setCustomDonation(''); }}
                            className={`py-2.5 rounded-xl font-bold transition-all border text-sm ${selectedDonation === amt && customDonation === '' ? 'bg-indigo-50 text-primary border-primary shadow-[0_0_0_2px_rgba(79,70,229,0.2)]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                          <input
                            type="number"
                            min="50"
                            placeholder="Custom"
                            value={customDonation}
                            onChange={(e) => {
                              setCustomDonation(e.target.value);
                              setSelectedDonation(0);
                            }}
                            className={`w-full h-full py-2.5 pl-7 pr-3 text-sm rounded-xl font-bold border outline-none transition-all ${customDonation || selectedDonation === 0 ? 'bg-indigo-50 border-primary text-primary focus:ring-2 focus:ring-primary shadow-inner' : 'bg-white border-gray-200 text-gray-700 focus:border-gray-300'}`}
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={handleDonate}
                        disabled={isDonating || (!customDonation && !selectedDonation)}
                        className="w-full bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isDonating ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        )}
                        {isDonating ? 'Processing...' : `Support with ₹${customDonation || selectedDonation || 0}`}
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <button 
                    onClick={handleUpvote}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${isUpvoted ? 'bg-indigo-50 text-indigo-700 border-indigo-200 border' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${isUpvoted ? 'fill-current' : ''}`} />
                    {isUpvoted ? 'Supported' : 'Support Issue'}
                    <span className="ml-2 bg-white px-2.5 py-0.5 rounded-md text-sm border shadow-sm">
                      {issue.upvotes.length}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Comments Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
          >
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-900">
              <MessageSquare className="w-6 h-6 text-primary" />
              Community Discussion ({issue.comments.length})
            </h3>
            
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-8 relative">
                <textarea 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts or updates..."
                  className="w-full px-4 py-4 pr-16 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-inner outline-none resize-none"
                  rows={3}
                  required
                />
                <button type="submit" className="absolute bottom-4 right-4 p-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                <p className="text-gray-600">Please <Link to="/login" className="text-primary font-bold hover:underline">login</Link> to join the discussion.</p>
              </div>
            )}
            
            <div className="space-y-6">
              {issue.comments.length > 0 ? (
                issue.comments.map((comment, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">{comment.userName}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No comments yet. Be the first to start the discussion!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {(isAdmin || isAssignedToMe) && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 border-t-4 border-t-primary"
            >
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                Authority Area
              </h3>
              
              {isAdmin && (
                <div className="space-y-2 mb-6">
                  <label className="block text-sm font-medium text-gray-700">Assign Worker / Official</label>

                  {isEditingWorker ? (
                    <div className="flex w-full">
                      <input
                        type="text"
                        value={assignedWorkerName}
                        onChange={(e) => setAssignedWorkerName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAssignSave()}
                        placeholder="Enter worker name..."
                        className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white text-sm font-medium shadow-sm"
                      />
                      <button
                        onClick={handleAssignSave}
                        className="px-4 py-2.5 bg-primary text-white rounded-r-xl font-bold text-sm hover:bg-green-600 transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span className="font-semibold text-indigo-800 text-sm truncate">{assignedWorkerName}</span>
                      </div>
                      <button
                        onClick={() => setIsEditingWorker(true)}
                        className="ml-2 p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-colors flex-shrink-0"
                        title="Edit assigned worker"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Update Status Pipeline</label>
                <select 
                  value={issue.status} 
                  onChange={handleStatusChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none bg-white font-medium shadow-sm"
                >
                  <option value="Pending">Pending Validation</option>
                  <option value="Assigned">Assigned & Scheduled</option>
                  <option value="Inspect">Inspection Phase</option>
                  <option value="In Progress">Actively In Progress</option>
                  <option value="Resolved">Resolved & Completed</option>
                </select>
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col"
          >
            <div className="p-4 bg-gray-100 border-b border-gray-200">
              <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" /> Location Map
              </h3>
            </div>
            <div className="h-64 bg-gray-200 relative flex items-center justify-center overflow-hidden z-0">
              {(issue.lat && issue.lng) ? (
                <MapContainer center={[issue.lat, issue.lng]} zoom={15} scrollWheelZoom={false} className="h-full w-full relative z-0">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[issue.lat, issue.lng]} />
                </MapContainer>
              ) : (
                <div className="text-gray-500 font-medium z-10 p-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 text-center">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  Location coordinates not provided
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
