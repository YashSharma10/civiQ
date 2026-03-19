import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import api from '../api/axios';
import { MapPin, Clock, MessageSquare, ThumbsUp, Map as MapIcon, List, Flame, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const getCategoryColor = (category) => {
  switch(category) {
    case 'Roads': return '#ef4444'; // Red
    case 'Water': return '#3b82f6'; // Blue
    case 'Electricity': return '#f59e0b'; // Amber
    case 'Garbage': return '#10b981'; // Emerald
    default: return '#8b5cf6'; // Violet
  }
};

const getCategoryIcon = (category) => {
  const color = getCategoryColor(category);
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" width="40px" height="40px" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.4));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    className: "bg-transparent border-none",
    html: svgTemplate,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const { data } = await api.get('/issues');
        setIssues(data);
      } catch (error) {
        console.error('Error fetching issues', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const handleSupport = async (e, issueId) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in or sign up to support an issue!');
      navigate('/login');
      return;
    }
    
    try {
      const { data } = await api.put(`/issues/${issueId}/upvote`);
      setIssues(issues.map(issue => issue._id === issueId ? data : issue));
    } catch (error) {
      console.error('Error upvoting', error);
    }
  };

  const isAdmin = user && user.publicMetadata?.role === 'authority';
  const userDepartment = user && user.publicMetadata?.department;

  const calculatePriority = (issue) => {
    if (issue.status === 'Resolved') return 0;
    
    // Upvote points: 10 per upvote
    const upvotesScore = (issue.upvotes?.length || 0) * 10;
    
    // Time delayed points: 2 per hour since creation
    const hoursDelayed = Math.max(0, (new Date() - new Date(issue.createdAt)) / (1000 * 60 * 60));
    const timeScore = hoursDelayed * 2;
    
    return Math.round(upvotesScore + timeScore);
  };

  const processedIssues = issues.map(issue => ({
    ...issue,
    priorityScore: calculatePriority(issue)
  })).sort((a, b) => {
    if (isAdmin) {
      // Sort by priority descending for authorities
      return b.priorityScore - a.priorityScore;
    }
    // Default sort by newest for citizens
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const effectiveFilter = (isAdmin && userDepartment && userDepartment !== 'All') ? userDepartment : filter;
  const filteredIssues = effectiveFilter === 'All' ? processedIssues : processedIssues.filter(issue => issue.category === effectiveFilter);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          {(isAdmin && userDepartment) ? (
             <>
               <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3 tracking-tight">
                 <ShieldAlert className="w-8 h-8" />
                 {userDepartment} Department Dashboard
               </h1>
               <p className="mt-2 text-gray-600 font-medium">Manage and resolve active '{userDepartment}' civic issues according to priority.</p>
             </>
          ) : (
             <>
               <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Civic Issues Explorer</h1>
               <p className="mt-2 text-gray-600">Discover and track problems reported in your community.</p>
             </>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === 'list' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <List className="w-4 h-4" /> List
              </button>
              <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === 'map' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <MapIcon className="w-4 h-4" /> Map
              </button>
            </div>

            {!(isAdmin && userDepartment) && (
              <div className="flex flex-wrap gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-1.5">
              {['All', 'Roads', 'Water', 'Electricity', 'Garbage', 'Others'].map(cat => (
                <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === cat ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                {cat}
                </button>
              ))}
              </div>
            )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No issues found</h3>
          <p className="text-gray-500">There are no {filter !== 'All' ? filter.toLowerCase() : ''} issues reported yet.</p>
          <Link to="/report" className="mt-6 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary hover:bg-green-600 shadow-md hover:shadow-lg transition-all">Report an issue now</Link>
        </div>
      ) : viewMode === 'map' ? (
        <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative z-0">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full z-0">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {filteredIssues.map((issue, i) => {
              // If issue doesn't have valid coordinates, assign a random offset around default center for display purposes
              const pos = (issue.lat && issue.lng && issue.lat !== 0) 
                 ? [issue.lat, issue.lng] 
                 : [20.5937 + (i * 0.1), 78.9629 + (i * 0.1)]; // simple predictable offset
              return (
              <Marker key={issue._id} position={pos} icon={getCategoryIcon(issue.category)}>
                <Popup>
                  <div className="w-48">
                    <h3 className="font-bold text-gray-900">{issue.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{issue.location}</p>
                    <div className="mt-2 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(issue.status)}`}>{issue.status}</span>
                        <Link to={`/issue/${issue._id}`} className="text-xs text-primary font-bold hover:underline">View Details</Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )})}
          </MapContainer>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIssues.map((issue, index) => (
            <motion.div
              key={issue._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden flex flex-col group"
            >
              <Link to={`/issue/${issue._id}`} className="block h-48 w-full overflow-hidden relative">
                {issue.imageUrl ? (
                  <img src={issue.imageUrl.startsWith('http') ? issue.imageUrl : `http://localhost:5000${issue.imageUrl}`} alt={issue.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <span className="text-gray-400 font-medium">No Image Provided</span>
                  </div>
                )}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${getStatusColor(issue.status)}`}>
                  {issue.status}
                </div>
                {isAdmin && issue.status !== 'Resolved' && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-red-100 text-red-800 border-red-200 flex items-center gap-1.5 z-10 transition-transform hover:scale-105 cursor-help" title={`Priority Score: ${issue.priorityScore}`}>
                    <Flame className="w-3.5 h-3.5" />
                    Urgent {issue.priorityScore > 0 ? `(${issue.priorityScore})` : ''}
                  </div>
                )}
              </Link>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-wider">{issue.category}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                  <Link to={`/issue/${issue._id}`}>{issue.title}</Link>
                </h3>
                <p className="text-gray-600 text-sm flex items-center gap-1 mb-4">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{issue.location}</span>
                </p>
                
                <p className="text-gray-600 text-sm line-clamp-2 mb-6 flex-grow">{issue.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <div className="flex gap-4">
                    <button 
                      onClick={(e) => handleSupport(e, issue._id)}
                      className={`flex items-center gap-1.5 text-sm font-bold transition-colors hover:scale-105 active:scale-95 ${user && issue.upvotes.includes(user.id) ? 'text-secondary' : 'text-gray-500 hover:text-green-600'}`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${user && issue.upvotes.includes(user.id) ? 'fill-secondary' : ''}`} /> {issue.upvotes?.length || 0}
                    </button>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                      <MessageSquare className="w-4 h-4" /> {issue.comments?.length || 0}
                    </div>
                  </div>
                  
                  <Link to={`/issue/${issue._id}`} className="text-sm font-bold text-primary hover:text-green-600 transition-colors">
                    View Details →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
