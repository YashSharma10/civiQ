import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import IssueDetails from './pages/IssueDetails';
import Profile from './pages/Profile';
import Feed from './pages/Feed';
import Navbar from './components/Navbar';

// Guard: redirects authority users to /dashboard for any citizen-only route
function CitizenRoute({ children }) {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  if (user?.publicMetadata?.role === 'authority') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow w-full">
          <Routes>
            {/* Citizen-only routes — authorities redirected to /dashboard */}
            <Route path="/" element={<CitizenRoute><Home /></CitizenRoute>} />
            <Route path="/feed" element={<CitizenRoute><Feed /></CitizenRoute>} />
            <Route path="/profile" element={<CitizenRoute><Profile /></CitizenRoute>} />
            <Route path="/report" element={
              <CitizenRoute>
                <>
                  <SignedIn><ReportIssue /></SignedIn>
                  <SignedOut><Navigate to="/login" replace /></SignedOut>
                </>
              </CitizenRoute>
            } />

            {/* Shared routes */}
            <Route path="/login/*" element={<Login />} />
            <Route path="/register/*" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/issue/:id" element={<IssueDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
