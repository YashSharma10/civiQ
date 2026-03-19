import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import api from '../api/axios';
import { MapPin, AlertTriangle, CheckCircle, ArrowRight, Shield, Zap, Droplet, Trash2, Users, Activity, Target, X, ThumbsUp } from 'lucide-react';

const SwipeableCard = ({ issue, isTop, onSwipeRight, onSwipeLeft, index, total }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [0, -100], [0, 1]);

  const handleDragEnd = (e, info) => {
    if (info.offset.x > 100) {
      onSwipeRight();
    } else if (info.offset.x < -100) {
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1,
        zIndex: index,
        scale: isTop ? 1 : 1 - (total - 1 - index) * 0.05,
        y: isTop ? 0 : (total - 1 - index) * 15,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: isTop ? 1 : 1 - (total - 1 - index) * 0.05, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="absolute w-full h-[400px] sm:h-[450px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden cursor-grab active:cursor-grabbing flex flex-col"
    >
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-6 z-20 border-4 border-green-500 text-green-500 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-1 text-2xl font-extrabold uppercase rotate-[-15deg]">
        SUPPORT
      </motion.div>
      <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-6 z-20 border-4 border-red-500 text-red-500 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-1 text-2xl font-extrabold uppercase rotate-[15deg]">
        SKIP
      </motion.div>

      <div className="w-full h-[55%] relative bg-gray-200 pointer-events-none select-none">
        {issue.imageUrl ? (
          <img src={issue.imageUrl.startsWith('http') ? issue.imageUrl : `http://localhost:5000${issue.imageUrl}`} draggable={false} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
            <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-sm font-medium">No Image</span>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1.5">
          <ThumbsUp className="w-3.5 h-3.5 text-secondary" /> {issue.upvotes?.length || 0}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow pointer-events-none select-none bg-white">
        <span className="text-[10px] font-bold text-primary bg-primary-50 px-2 py-1 rounded-md uppercase tracking-wider w-max mb-3 border border-primary/20">{issue.category}</span>
        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight mb-2 line-clamp-2">{issue.title}</h3>
        <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1.5 mt-auto bg-gray-50 p-2 rounded-lg border border-gray-100">
          <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
          <span className="truncate">{issue.location}</span>
        </p>
      </div>
    </motion.div>
  );
};

const features = [
  {
    icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
    title: 'Report Instantly',
    description: 'See a pothole or broken streetlight? Snap a photo and notify authorities in seconds with our intuitive mobile-friendly tool.',
    color: 'bg-amber-50'
  },
  {
    icon: <MapPin className="w-8 h-8 text-primary" />,
    title: 'Precision Mapping',
    description: 'Pinpoint exactly where the problem is using our integrated interactive mapping system to ensure fast response times.',
    color: 'bg-primary-50'
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-secondary" />,
    title: 'Track Progress',
    description: 'Get real-time updates as your reported issues are reviewed, assigned, and successfully resolved by local authorities.',
    color: 'bg-yellow-50'
  }
];

const categories = [
  { name: 'Roads & Transit', icon: <MapPin className="w-6 h-6" />, color: 'bg-red-100 text-red-600' },
  { name: 'Water & Sanitation', icon: <Droplet className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600' },
  { name: 'Electricity', icon: <Zap className="w-6 h-6" />, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Waste Management', icon: <Trash2 className="w-6 h-6" />, color: 'bg-green-100 text-green-600' },
  { name: 'Public Safety', icon: <Shield className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600' },
  { name: 'Other Issues', icon: <Target className="w-6 h-6" />, color: 'bg-gray-100 text-gray-600' }
];

const stats = [
  { label: 'Issues Resolved', value: '15k+', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'Active Citizens', value: '50k+', icon: <Users className="w-5 h-5" /> },
  { label: 'Avg. Resolution Time', value: '48h', icon: <Activity className="w-5 h-5" /> }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function Home() {
  const [showIntro, setShowIntro] = useState(false);
  const [topIssues, setTopIssues] = useState([]);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const checkIntro = async () => {
      try {
        const actedIssues = JSON.parse(localStorage.getItem('actedIssues') || '[]');
        const { data } = await api.get('/issues');

        // Filter out issues the user has already supported or completely skipped/swiped
        let pendingIssues = data.filter(issue => {
          if (actedIssues.includes(issue._id)) return false;
          if (user && issue.upvotes.includes(user.id)) return false;
          return true;
        });

        // Top 3 most urgent
        const sorted = pendingIssues.sort((a, b) => b.upvotes.length - a.upvotes.length).slice(0, 3).reverse();

        if (sorted.length > 0) {
          setTopIssues(sorted);
          setShowIntro(true);
        }
      } catch (err) {
        console.error("Failed to load top issues for intro", err);
      }
    };
    checkIntro();
  }, [user]);

  const markAsActed = (id) => {
    const actedIssues = JSON.parse(localStorage.getItem('actedIssues') || '[]');
    if (!actedIssues.includes(id)) {
      actedIssues.push(id);
      localStorage.setItem('actedIssues', JSON.stringify(actedIssues));
    }
  };

  const handleSkipAll = () => {
    // Only close without marking the remaining as acted, so upon refresh they can see them again
    setShowIntro(false);
  };

  const removeCard = (id) => {
    markAsActed(id);
    setTopIssues(current => current.filter(issue => issue._id !== id));
    if (topIssues.length <= 1) {
      setShowIntro(false);
    }
  };

  const handleSupportCard = async (issue) => {
    if (!user) {
      alert('Please log in or sign up to support an issue!');
      navigate('/login');
      return;
    }

    try {
      if (!issue.upvotes.includes(user.id)) {
        await api.put(`/issues/${issue._id}/upvote`);
      }
    } catch (error) {
      console.error('Error upvoting from intro', error);
    }
    removeCard(issue._id);
  };

  const handleSkipCard = (issue) => {
    removeCard(issue._id);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden">

      {/* Intro Modal (Tinder Style) */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="w-full max-w-sm h-auto max-h-[650px] relative flex flex-col pt-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-6 text-white z-10 px-2 lg:px-0">
                <div>
                  <h2 className="text-3xl font-extrabold flex items-center gap-2 tracking-tight">Civi<span className="text-primary">Q</span></h2>
                  <p className="text-sm text-gray-300 mt-1 font-medium">Swipe Right to Support, Left to Skip</p>
                </div>
                <button onClick={handleSkipAll} className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 hover:scale-105 backdrop-blur-md transition-all border border-white/10 shadow-lg flex-shrink-0 ml-4">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Card Stack Area */}
              <div className="flex-grow w-full h-[450px] relative flex items-center justify-center my-4">
                <AnimatePresence>
                  {topIssues.map((issue, index) => {
                    const isTop = index === topIssues.length - 1;
                    return (
                      <SwipeableCard
                        key={issue._id}
                        issue={issue}
                        isTop={isTop}
                        onSwipeRight={() => handleSupportCard(issue)}
                        onSwipeLeft={() => handleSkipCard(issue)}
                        index={index}
                        total={topIssues.length}
                      />
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Bottom Manual Buttons */}
              {topIssues.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center gap-8 mt-5 mb-4 z-10">
                  <button onClick={() => handleSkipCard(topIssues[topIssues.length - 1])} className="w-16 h-16 bg-white flex items-center justify-center rounded-full shadow-[0_10px_25px_rgba(239,68,68,0.3)] text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95 transition-all outline-none">
                    <X className="w-8 h-8 stroke-[3]" />
                  </button>
                  <button onClick={() => handleSupportCard(topIssues[topIssues.length - 1])} className="w-16 h-16 bg-white flex items-center justify-center rounded-full shadow-[0_10px_25px_rgba(34,197,94,0.3)] text-green-500 hover:bg-green-50 hover:scale-110 active:scale-95 transition-all outline-none">
                    <ThumbsUp className="w-7 h-7 stroke-[2.5]" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gray-900 overflow-hidden pt-16">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center object-cover mix-blend-overlay opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 mix-blend-multiply" />
        </div>

        {/* Floating Abstract Shapes */}
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl z-0" />
        <motion.div animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 right-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-secondary animate-ping"></span>
            <span className="text-sm font-medium text-white tracking-wide uppercase">CiviQ Platform is Live</span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-5xl"
          >
            Empowering Citizens to <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-accent to-primary">Improve Our City</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mt-8 max-w-2xl mx-auto text-xl md:text-2xl text-gray-300 font-light leading-relaxed"
          >
            A transparent, modern platform for reporting and managing civic issues. Together we can build safer, cleaner, and better communities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 w-full sm:w-auto"
          >
            <Link to="/report" className="group flex justify-center items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-[0_0_40px_-10px_rgba(22,163,74,0.5)] hover:shadow-[0_0_60px_-15px_rgba(22,163,74,0.7)] hover:-translate-y-1">
              Report an Issue
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/dashboard" className="px-8 py-4 flex justify-center items-center bg-white text-gray-900 border border-white/20 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all backdrop-blur-md hover:-translate-y-1 shadow-lg">
              Explore Live Map
            </Link>
          </motion.div>
        </div>

        {/* Wave Divider Bottom */}
        <div className="absolute bottom-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.83,122.5,193.3,110.51,238.13,101.44,281.33,75.02,321.39,56.44Z" className="fill-gray-50"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-2">Simple Process</h2>
            <h3 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-6">How CiviQ Works</h3>
            <p className="text-xl text-gray-600 font-light leading-relaxed">Making a difference in your neighborhood has never been easier. Three simple steps to a better community.</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid lg:grid-cols-3 gap-10"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group relative bg-white rounded-3xl p-10 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center shadow-sm mb-8 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 relative z-10 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg border border-gray-100 shadow-gray-200/50 hover:-translate-y-1 transition-transform"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary mb-3">
                  {stat.icon}
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Report Any Issue</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-16">Our platform intelligently categorizes issues to route them to the correct local authorities instantly.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer border border-gray-100 group"
              >
                <div className={`w-14 h-14 ${cat.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="font-bold text-gray-800 text-sm text-center group-hover:text-primary transition-colors">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587474260580-589f81d596ea?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-multiply opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to see a change?</h2>
          <p className="text-xl text-primary-100 mb-10 font-light">Join thousands of citizens who are actively making their neighborhoods cleaner, safer, and better for everyone.</p>
          <Link to="/register" className="inline-flex items-center justify-center px-10 py-5 bg-white text-primary rounded-xl font-bold text-xl hover:bg-gray-50 transition-colors shadow-2xl hover:scale-105 duration-300">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-center pb-24 md:pb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-2xl font-bold text-white tracking-tight">Civi<span className="text-primary">Q</span></span>
        </div>
        <p>© 2026 CiviQ Platform. Built for the community.</p>
      </footer>
    </div>
  );
}
