import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, CheckCircle, FileText, ImagePlus, AlertCircle, ThumbsUp, Layers, MousePointerClick, MapPin, LocateFixed } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issue natively in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const categoryMap = {
  'Roads & Transit': ['Potholes', 'Broken Traffic Light', 'Sidewalk Damage', 'Blocked Road', 'Other'],
  'Water & Sanitation': ['Pipe Leak', 'Flooding', 'No Water Supply', 'Sewage Leak', 'Other'],
  'Electricity': ['Power Outage', 'Sparking Wire', 'Broken Streetlight', 'Other'],
  'Waste Management': ['Uncollected Garbage', 'Illegal Dumping', 'Dead Animal', 'Other'],
  'Public Safety': ['Noise Complaint', 'Vandalism', 'Stray Animals', 'Other'],
  'Other Issues': ['Miscellaneous']
};

export default function ReportIssue() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [existingIssues, setExistingIssues] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', description: '', location: '' });
  const [lat, setLat] = useState(20.5937);
  const [lng, setLng] = useState(78.9629);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useUser();
  const navigate = useNavigate();

  // Map components
  const LocationPicker = () => {
    useMapEvents({
      click(e) {
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
        setFormData({ ...formData, location: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}` });
      },
    });
    return lat && lng ? <Marker position={[lat, lng]} /> : null;
  };

  const MapUpdater = () => {
    const map = useMap();
    useEffect(() => {
      map.flyTo([lat, lng], 14, { animate: true, duration: 1.5 });
    }, [lat, lng, map]);
    return null;
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
           setLat(position.coords.latitude);
           setLng(position.coords.longitude);
           setFormData({ ...formData, location: 'Current Location' });
        },
        (err) => {
           console.error(err);
           setError('Unable to retrieve your location natively. Please click on the map below.');
        }
      );
    } else {
       setError("Geolocation is not supported by your browser.");
    }
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setSubCategory('');
  };

  const handleSubCategorySelect = async (sub) => {
    setSubCategory(sub);
    setSearching(true);
    setStep(2); 
    
    try {
      const { data } = await api.get('/issues');
      const matches = data.filter(issue => issue.category === category && issue.subCategory === sub);
      if (matches.length > 0) {
        const sortedMatches = matches.sort((a,b) => b.upvotes.length - a.upvotes.length);
        setExistingIssues(sortedMatches);
      } else {
        setStep(3);
      }
    } catch (err) {
      console.error('Failed to search issues', err);
      setStep(3);
    } finally {
      setSearching(false);
    }
  };

  const handleSupportExisting = async (issueId) => {
    if (!user) {
      alert("Please log in to support issues.");
      navigate('/login');
      return;
    }
    try {
      await api.put(`/issues/${issueId}/upvote`);
      alert("Success! The issue was added to your profile.");
      navigate('/profile');
    } catch(err) {
      setError('Failed to support issue. Try again.');
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let imageUrl = '';
      if (image) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', image);
        const uploadRes = await api.post('/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.imageUrl;
      }

      await api.post('/issues', {
        title: formData.title,
        description: formData.description,
        category,
        subCategory,
        location: formData.location || 'Location Not Specified', // Optional from UI
        lat,
        lng,
        imageUrl,
        authorName: user?.fullName || user?.username || 'Citizen'
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[90vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {step > 1 ? 'Go Back' : 'Back to Dashboard'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: CATEGORY SELECTION */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 mt-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Report a Civic Issue</h1>
            <p className="text-gray-500 mb-8 max-w-2xl text-lg">Help us route your issue to the right authorities by securely selecting a precise category.</p>

            <div className="mb-10">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2"><Layers className="w-4 h-4" /> Select Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(categoryMap).map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-4 text-left rounded-xl border-2 font-bold transition-all
                      ${category === cat ? 'border-primary bg-primary-50 text-primary scale-[1.02]' : 'border-gray-100 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {category && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-6 border-t border-gray-100">
                <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2"><MousePointerClick className="w-4 h-4" /> Select Specific Issue</h2>
                <div className="flex flex-wrap gap-3">
                  {categoryMap[category].map(sub => (
                    <button 
                      key={sub} 
                      onClick={() => handleSubCategorySelect(sub)}
                      className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all border-2
                        ${subCategory === sub ? 'border-secondary bg-secondary text-gray-900 shadow-md' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'}`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STEP 2: DUPLICATE CHECKER CAROUSEL */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 mt-6 max-w-5xl mx-auto overflow-hidden">
             {searching ? (
               <div className="flex flex-col items-center justify-center py-20">
                 <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="text-gray-500 font-bold">Scanning database for similar issues...</p>
               </div>
             ) : (
               <>
                 <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Wait! Is this your issue?</h2>
                 <p className="text-gray-500 mb-8 max-w-xl text-lg">Other citizens have recently reported similar issues. If your issue is listed below, click <strong>Raise Support</strong> to add your voice and instantly save it to your profile instead of creating a duplicate!</p>
                 
                 {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-medium flex items-center gap-2"><AlertCircle className="w-5 h-5"/> {error}</div>}

                 <div className="flex overflow-x-auto gap-5 pb-6 snap-x snap-mandatory pt-2 px-2 -mx-2 hide-scrollbars">
                   {existingIssues.map(issue => (
                      <div key={issue._id} className="min-w-[280px] w-[280px] sm:min-w-[340px] bg-white border border-gray-200 rounded-2xl p-6 snap-center shrink-0 flex flex-col hover:border-primary transition-all hover:shadow-[0_10px_30px_rgba(22,163,74,0.15)] shadow-sm">
                         <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold bg-primary-50 text-primary px-3 py-1.5 rounded-lg uppercase tracking-wider">{issue.category} &gt; {issue.subCategory}</span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md">
                               <ThumbsUp className="w-3.5 h-3.5" /> {issue.upvotes?.length || 0}
                            </div>
                         </div>
                         <h3 className="font-extrabold text-gray-900 text-xl leading-tight mb-3 line-clamp-2">{issue.title}</h3>
                         <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">{issue.description}</p>
                         
                         <button 
                           onClick={() => handleSupportExisting(issue._id)}
                           className="mt-auto w-full bg-primary text-white hover:bg-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 outline-none"
                         >
                           <ThumbsUp className="w-5 h-5" /> Raise Support Instead
                         </button>
                      </div>
                   ))}
                 </div>
                 
                 <div className="mt-8 flex flex-col items-center border-t border-gray-100 pt-8 animate-fade-in delay-300">
                    <p className="text-sm font-medium text-gray-500 mb-4">Didn't find what you're looking for?</p>
                    <button 
                      onClick={() => setStep(3)} 
                      className="px-10 py-4 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto text-lg"
                    >
                      No, my issue is not listed here
                    </button>
                 </div>
               </>
             )}
          </motion.div>
        )}

        {/* STEP 3: FORM CREATION */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 mt-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Provide the details</h2>
            <div className="flex items-center gap-2 mb-8">
               <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-bold">{category}</span>
               <span className="text-gray-300">&gt;</span>
               <span className="bg-primary-50 text-primary px-3 py-1 rounded-md text-xs font-bold">{subCategory}</span>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-200 flex items-center gap-2 font-medium">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Issue Title</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="E.g. Large pothole on Main St."
                    className="block w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Description</label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Provide more context to help authorities locate and fix the issue faster..."
                  className="block w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900 resize-none"
                />
              </div>

              {/* Exact Location & Interactive Map */}
              <div className="bg-gray-50/50 -mx-4 sm:-mx-6 p-4 sm:p-6 border-y border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-gray-700">Exact Location</label>
                  <button type="button" onClick={handleUseMyLocation} className="text-xs font-bold bg-primary-50 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-primary-100 hover:text-green-700 transition-colors shadow-sm outline-none">
                    <LocateFixed className="w-3.5 h-3.5" /> Use My Location
                  </button>
                </div>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. 123 Main St, or click anywhere on the map below"
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900 text-sm"
                  />
                </div>
                <div className="h-64 rounded-xl overflow-hidden border border-gray-200 z-0 relative shadow-inner">
                  <MapContainer center={[lat, lng]} zoom={5} scrollWheelZoom={true} className="h-full w-full relative z-0">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <LocationPicker />
                    <MapUpdater />
                  </MapContainer>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 mt-4">Photographic Evidence</label>
                <div className="w-full relative group">
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label 
                    htmlFor="imageUpload"
                    className={`block w-full h-44 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden relative flex flex-col items-center justify-center
                      ${preview ? 'border-primary' : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
                  >
                    {preview ? (
                       <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                       <div className="flex flex-col items-center text-gray-500 group-hover:text-gray-700 transition-colors">
                          <ImagePlus className="w-10 h-10 mb-3 text-gray-400 group-hover:text-primary transition-colors" />
                          <span className="font-bold">Click to upload image</span>
                          <span className="text-xs mt-1">PNG, JPG up to 5MB</span>
                       </div>
                    )}
                    {preview && (
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <span className="text-white font-bold flex items-center gap-2"><Upload className="w-5 h-5"/> Change Photo</span>
                       </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-md text-lg font-bold text-gray-900 bg-secondary hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:-translate-y-1"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div> 
                       <span>Submitting...</span>
                    </div>
                  ) : (
                     <span className="flex items-center gap-2"><CheckCircle className="w-6 h-6"/> Submit Formal Report</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
