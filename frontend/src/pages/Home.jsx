import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import api from '../api/axios';
import { MapPin, AlertTriangle, CheckCircle, ArrowRight, Shield, Zap, Droplet, Trash2, Users, Activity, Target, X, ThumbsUp } from 'lucide-react';
import logo from '../assets/logo-footer.png';

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
    icon: <AlertTriangle className="w-4 h-4 md:w-8 md:h-8 text-amber-500" />,
    title: 'Report Instantly',
    description: 'See a pothole or broken streetlight? Snap a photo and notify authorities in seconds with our intuitive mobile-friendly tool.',
    color: 'bg-amber-50'
  },
  {
    icon: <MapPin className="w-4 h-4 md:w-8 md:h-8 text-primary" />,
    title: 'Precision Mapping',
    description: 'Pinpoint exactly where the problem is using our integrated interactive mapping system to ensure fast response times.',
    color: 'bg-primary-50'
  },
  {
    icon: <CheckCircle className="w-4 h-4 md:w-8 md:h-8 text-secondary" />,
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
  { label: 'Issues Resolved', value: '15k+', icon: <CheckCircle className="w-3 h-3 md:w-5 md:h-5" /> },
  { label: 'Active Citizens', value: '50k+', icon: <Users className="w-3 h-3 md:w-5 md:h-5" /> },
  { label: 'Avg. Resolution Time', value: '48h', icon: <Activity className="w-3 h-3 md:w-5 md:h-5" /> }
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
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-[center_30%] mix-blend-overlay opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 mix-blend-multiply" />
        </div>

        {/* Floating Abstract Shapes */}
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl z-0" />
        <motion.div animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 right-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center mt-8 sm:mt-16">
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
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-5xl"
          >
            Empowering Citizens to <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] via-white to-[#138808]">Improve Our City</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mt-5 max-w-2xl mx-auto text-base sm:text-xl md:text-2xl text-gray-300 font-light leading-relaxed px-2"
          >
            A transparent, modern platform for reporting and managing civic issues. Together we can build safer, cleaner, and better communities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 w-full sm:w-auto"
          >
            <Link to="/report" className="report-issue-btn !px-4 !py-3 !text-[13px] sm:!px-8 sm:!py-5 sm:!text-[18px]">
              <span className="text whitespace-nowrap">Report an Issue</span>
              <span className="svg">
                <svg xmlns="http://www.w3.org/2000/svg" width={50} height={20} viewBox="0 0 38 15" fill="none">
                  <path fill="white" d="M10 7.519l-.939-.344h0l.939.344zm14.386-1.205l-.981-.192.981.192zm1.276 5.509l.537.843.148-.094.107-.139-.792-.611zm4.819-4.304l-.385-.923h0l.385.923zm7.227.707a1 1 0 0 0 0-1.414L31.343.448a1 1 0 0 0-1.414 0 1 1 0 0 0 0 1.414l5.657 5.657-5.657 5.657a1 1 0 0 0 1.414 1.414l6.364-6.364zM1 7.519l.554.833.029-.019.094-.061.361-.23 1.277-.77c1.054-.609 2.397-1.32 3.629-1.787.617-.234 1.17-.392 1.623-.455.477-.066.707-.008.788.034.025.013.031.021.039.034a.56.56 0 0 1 .058.235c.029.327-.047.906-.39 1.842l1.878.689c.383-1.044.571-1.949.505-2.705-.072-.815-.45-1.493-1.16-1.865-.627-.329-1.358-.332-1.993-.244-.659.092-1.367.305-2.056.566-1.381.523-2.833 1.297-3.921 1.925l-1.341.808-.385.245-.104.068-.028.018c-.011.007-.011.007.543.84zm8.061-.344c-.198.54-.328 1.038-.36 1.484-.032.441.024.94.325 1.364.319.45.786.64 1.21.697.403.054.824-.001 1.21-.09.775-.179 1.694-.566 2.633-1.014l3.023-1.554c2.115-1.122 4.107-2.168 5.476-2.524.329-.086.573-.117.742-.115s.195.038.161.014c-.15-.105.085-.139-.076.685l1.963.384c.192-.98.152-2.083-.74-2.707-.405-.283-.868-.37-1.28-.376s-.849.069-1.274.179c-1.65.43-3.888 1.621-5.909 2.693l-2.948 1.517c-.92.439-1.673.743-2.221.87-.276.064-.429.065-.492.057-.043-.006.066.003.155.127.07.099.024.131.038-.063.014-.187.078-.49.243-.94l-1.878-.689zm14.343-1.053c-.361 1.844-.474 3.185-.413 4.161.059.95.294 1.72.811 2.215.567.544 1.242.546 1.664.459a2.34 2.34 0 0 0 .502-.167l.15-.076.049-.028.018-.011c.013-.008.013-.008-.524-.852l-.536-.844.019-.012c-.038.018-.064.027-.084.032-.037.008.053-.013.125.056.021.02-.151-.135-.198-.895-.046-.734.034-1.887.38-3.652l-1.963-.384zm2.257 5.701l.791.611.024-.031.08-.101.311-.377 1.093-1.213c.922-.954 2.005-1.894 2.904-2.27l-.771-1.846c-1.31.547-2.637 1.758-3.572 2.725l-1.184 1.314-.341.414-.093.117-.025.032c-.01.013-.01.013.781.624zm5.204-3.381c.989-.413 1.791-.42 2.697-.307.871.108 2.083.385 3.437.385v-2c-1.197 0-2.041-.226-3.19-.369-1.114-.139-2.297-.146-3.715.447l.771 1.846z" />
                </svg>
              </span>
            </Link>
            <Link to="/dashboard" className="live-map-btn whitespace-nowrap !px-4 !py-3 !text-[13px] sm:!px-8 sm:!py-5 sm:!text-[18px]">
              Explore Live Map
            </Link>
          </motion.div>
        </div>

        {/* Wave Divider Bottom */}
        <div className="absolute bottom-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-[40px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.83,122.5,193.3,110.51,238.13,101.44,281.33,75.02,321.39,56.44Z" className="fill-gray-50"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 sm:py-24 bg-gray-50 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-20 max-w-3xl mx-auto flex flex-col items-center">
            {/* <h2 className="bg-[#006aff] text-white px-4 py-1.5 rounded-md font-extrabold border-2 border-gray-900 shadow-[2px_2px_0px_#111827] tracking-wide uppercase text-xs mb-4 w-max">Simple Process</h2> */}
            <h3 className="font-['Playfair_Display'] text-3xl sm:text-5xl sm:text-6xl font-extrabold text-gray-900 mb-4">How CiviQ Works</h3>
            <p className="text-base sm:text-xl text-gray-600 font-medium leading-relaxed">Making a difference in your neighborhood has never been easier. Three simple steps to a better community.</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-10"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group relative bg-white rounded-2xl p-6 sm:p-10 transition-all duration-300 border-2 border-gray-900 shadow-[6px_6px_0px_#111827] hover:-translate-y-2 hover:translate-x-1 hover:shadow-[10px_10px_0px_#111827] overflow-hidden"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 ${feature.color} rounded-xl border-2 border-gray-900 shadow-[3px_3px_0px_#111827] flex items-center justify-center mb-5 sm:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700 font-medium leading-relaxed text-base sm:text-lg">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pt-2 pb-12 md:pt-8 md:pb-16 bg-gray-50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl md:rounded-2xl p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center text-center border md:border-2 border-gray-900 shadow-[2px_2px_0px_#111827] md:shadow-[6px_6px_0px_#111827] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_#111827] md:hover:shadow-[8px_8px_0px_#111827] transition-transform"
              >
                <div className="w-6 h-6 md:w-12 md:h-12 bg-white rounded-full border md:border-2 border-gray-900 shadow-[1px_1px_0px_#111827] md:shadow-[2px_2px_0px_#111827] flex items-center justify-center text-gray-900 mb-1 md:mb-3">
                  {stat.icon}
                </div>
                <div className="font-['Playfair_Display'] text-4xl sm:text-5xl font-extrabold text-[#006aff] mb-2">{stat.value}</div>
                <div className="text-gray-800 font-bold uppercase tracking-wider text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-14 sm:py-24 bg-[#006aff]/10 border-y-2 border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">Report Any Issue</h2>
          <p className="text-base sm:text-xl text-gray-700 font-medium max-w-2xl mx-auto mb-8 sm:mb-16">Our platform intelligently categorizes issues to route them to the correct local authorities instantly.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl hover:bg-gray-100 transition-all cursor-pointer border-2 border-gray-900 shadow-[4px_4px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#111827] group"
              >
                <div className={`w-14 h-14 ${cat.color} rounded-full border-2 border-gray-900 shadow-[2px_2px_0px_#111827] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="font-bold text-gray-900 text-sm text-center">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-28 bg-[#006aff] border-b-2 border-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587474260580-589f81d596ea?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-multiply opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-5xl md:text-[70px] leading-tight font-extrabold mb-4">Ready to see a change?</h2>
          <p className="text-base sm:text-xl text-white/90 mb-8 sm:mb-12 font-medium">Join thousands of citizens who are actively making their neighborhoods cleaner, safer, and better for everyone.</p>
          <Link to="/register" className="inline-flex items-center justify-center px-6 py-3 sm:px-10 sm:py-5 bg-[#252525] text-white rounded-2xl font-bold text-base sm:text-xl border-2 border-[#fafafa] shadow-[6px_6px_0px_#fafafa] hover:translate-y-1 hover:shadow-[2px_2px_0px_#fafafa] transition-all">
            CREATE FREE ACCOUNT
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-10 text-center border-t-4 sm:border-t-8 border-[#252525]">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <div className="inline-flex items-center justify-center rounded-2xl px-6 py-3">
            <img src={logo} alt="CiviQ" className="h-10 sm:h-14 w-auto object-contain" />
          </div>
        </div>
        <p className="text-gray-400 text-sm sm:text-base font-medium tracking-wide">© 2026 CiviQ Platform. Built for the community.</p>
      </footer>
    </div>
  );
}
