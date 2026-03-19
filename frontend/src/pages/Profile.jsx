import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import api from '../api/axios';
import { User, Clock, CheckCircle, AlertCircle, MapPin, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProgressStepper = ({ status }) => {
  const steps = ['Pending', 'Assigned', 'Inspect', 'In Progress', 'Resolved'];
  const currentIndex = Math.max(0, steps.indexOf(status));

  return (
    <div className="relative w-full max-w-4xl mx-auto py-2 sm:py-4 mb-4 mt-2">
      <div className="absolute top-4 sm:top-5 left-[10%] right-[10%] h-1 sm:h-1.5 bg-gray-200 rounded-full z-0 overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-primary rounded-full shadow-[0_0_10px_rgba(22,163,74,0.5)]"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        />
      </div>

      <div className="relative z-10 flex justify-between px-[5%] sm:px-[10%]">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isActive = index === currentIndex;
          
          return (
            <div key={step} className="flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ 
                  scale: isActive ? 1.3 : 1,
                  backgroundColor: isCompleted ? '#16a34a' : '#ffffff',
                  borderColor: isCompleted ? '#16a34a' : '#e5e7eb'
                }}
                transition={{ duration: 0.4, delay: index * 0.2 }}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-[3px] flex items-center justify-center relative transition-colors duration-300
                  ${isCompleted ? 'text-white shadow-[0_0_15px_rgba(22,163,74,0.5)] z-20' : 'text-gray-300 z-10'}`}
              >
                {isCompleted ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : <div className="w-2 h-2 rounded-full bg-gray-200" />}
                
                {isActive && status !== 'Resolved' && (
                  <span className="absolute w-full h-full rounded-full border-2 border-primary animate-ping opacity-50"></span>
                )}
              </motion.div>
              
              <motion.span 
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.4, delay: index * 0.2 + 0.1 }}
                 className={`absolute top-8 sm:top-12 text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-center whitespace-nowrap
                  ${isActive ? 'text-primary' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}
              >
                {step}
              </motion.span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user } = useUser();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null); 
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchMyIssues = async () => {
      try {
        const { data } = await api.get('/issues/my');
        setIssues(data);
      } catch (error) {
        console.error('Failed to fetch user issues', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMyIssues();
  }, [user]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/issues/${reviewModal}/review`, { rating, comment });
      setIssues(issues.map(issue => issue._id === reviewModal ? data : issue));
      setReviewModal(null);
      setRating(5);
      setComment('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting review');
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="bg-white rounded-3xl p-6 md:p-8 mb-8 md:mb-10 shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-100 text-primary rounded-full flex items-center justify-center border-4 border-white shadow-md">
          <User className="w-10 h-10 md:w-12 md:h-12" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{user?.fullName || user?.username || 'Citizen'}</h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">{user?.primaryEmailAddress?.emailAddress}</p>
          <div className="mt-2 text-xs md:text-sm font-bold text-primary bg-primary-50 px-3 py-1 rounded-full w-max">
            {issues.length} Issues Reported
          </div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Your Reporting History & Progress</h2>
      
      {issues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500">You haven't reported any issues yet.</h3>
          <p className="text-gray-400 mt-2 text-sm">Help your community by reporting a civic problem today!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {issues.map(issue => (
            <motion.div key={issue._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-5 md:p-6 pb-2 flex flex-col md:flex-row gap-6">
                {issue.imageUrl && (
                  <div className="h-40 w-full mb-4 rounded-xl overflow-hidden">
                    <img src={issue.imageUrl.startsWith('http') ? issue.imageUrl : `http://localhost:5000${issue.imageUrl}`} alt="Issue" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-grow flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{issue.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{issue.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 mt-auto">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> <span className="truncate max-w-[150px]">{issue.location}</span></span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Action Area based on Progress */}
                <div className="md:w-48 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  {issue.status === 'Resolved' && !issue.resolutionReview ? (
                    <div className="text-center">
                      <p className="text-xs font-bold text-green-600 mb-2">Issue has been resolved!</p>
                      <button onClick={() => setReviewModal(issue._id)} className="w-full py-2 bg-secondary text-gray-900 rounded-lg font-bold text-sm shadow-sm hover:scale-105 transition-all outline-none">
                        Leave a Review
                      </button>
                    </div>
                  ) : issue.resolutionReview ? (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 mb-1 flex items-center justify-between">
                        Your Rating <span className="flex text-secondary"><Star className="w-3 h-3 fill-secondary" /> {issue.resolutionReview.rating}</span>
                      </p>
                      <p className="text-xs text-gray-800 italic line-clamp-2 mb-1">"{issue.resolutionReview.comment}"</p>
                    </div>
                  ) : (
                    <div className="text-center opacity-70">
                      <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2 relative">
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                      <p className="text-[10px] sm:text-xs font-bold text-gray-400 mx-auto leading-tight">
                        Review unlocks after resolution
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step Wise Progress Stepper */}
              <div className="bg-gray-50/50 border-t border-gray-100 p-2 sm:p-4 mt-2">
                  <ProgressStepper status={issue.status} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Rate the Resolution</h3>
              <p className="text-sm text-gray-500 mb-6">How satisfied are you with how the authorities handled this issue?</p>
              
              <form onSubmit={handleReviewSubmit}>
                <div className="flex justify-center gap-2 mb-6 cursor-pointer">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="outline-none hover:scale-110 transition-transform">
                      <Star className={`w-10 h-10 ${rating >= star ? 'fill-secondary text-secondary drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Additional Comments (Optional)</label>
                  <textarea 
                    value={comment} 
                    onChange={e => setComment(e.target.value)} 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm"
                    rows="3"
                    placeholder="Tell us about the quality of the repair..."
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setReviewModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-green-700 transition-colors">Submit Review</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
