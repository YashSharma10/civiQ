import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser, useAuth } from '@clerk/clerk-react';
import { Home, Map as MapIcon, PlusCircle, LogIn, UserPlus, LogOut, Menu, X, HelpCircle, Shield } from 'lucide-react';

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <Shield className="w-8 h-8 text-primary group-hover:text-secondary transition-colors" />
              <span className="font-bold text-xl tracking-tight text-gray-900">Civi<span className="text-primary">Q</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className={`font-medium text-sm transition-colors ${isActive('/') ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}>Home</Link>
              <Link to="/dashboard" className={`font-medium text-sm transition-colors ${isActive('/dashboard') ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}>Dashboard</Link>
              <SignedIn>
                  <Link to="/report" className={`font-medium text-sm transition-colors ${isActive('/report') ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}>Report Issue</Link>
                  {/* <Link to="/profile" className={`font-medium text-sm transition-colors ${isActive('/profile') ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}>Profile</Link> */}
                  <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                    <UserButton />
                  </div>
              </SignedIn>
              <SignedOut>
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                  <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Login</Link>
                  <Link to="/register" className="text-sm font-bold bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm">Sign Up</Link>
                </div>
              </SignedOut>
            </div>

            {/* Mobile Top Actions (Logout/Login) */}
            <div className="md:hidden flex items-center gap-3">
               <SignedIn>
                 <UserButton />
               </SignedIn>
               <SignedOut>
                 <div className="flex gap-2">
                   <Link to="/login" className="text-xs font-bold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm border border-gray-200">Log In</Link>
                   <Link to="/register" className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm">Sign Up</Link>
                 </div>
               </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[99] pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2 relative">
          <Link to="/" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/') ? 'text-primary' : 'text-gray-500 active:text-gray-900'}`}>
            <Home className={`w-6 h-6 ${isActive('/') ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/dashboard" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/dashboard') ? 'text-primary' : 'text-gray-500 active:text-gray-900'}`}>
            <MapIcon className={`w-6 h-6 ${isActive('/dashboard') ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-medium">Map</span>
          </Link>
          
          <div className="w-full flex justify-center -translate-y-6">
            <Link to="/report" className="flex flex-col items-center justify-center relative">
              <div className={`text-white p-3 rounded-full shadow-[0_4px_10px_rgba(234,179,8,0.5)] border-4 border-white transition-transform active:scale-95 ${isActive('/report') ? 'bg-secondary scale-105' : 'bg-primary'}`}>
                <PlusCircle className="w-7 h-7" />
              </div>
              <span className={`text-[10px] font-bold mt-1 ${isActive('/report') ? 'text-secondary' : 'text-gray-800'}`}>Report</span>
            </Link>
          </div>
          
          <Link to={isSignedIn ? "/profile" : "/login"} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/profile') ? 'text-primary' : 'text-gray-500 active:text-gray-900'}`}>
             <UserPlus className={`w-6 h-6 ${isActive('/profile') ? 'fill-primary/20' : ''}`} />
             <span className="text-[10px] font-medium">{isSignedIn ? "Profile" : "Login"}</span>
          </Link>
          <button onClick={() => {}} className="w-full h-full flex flex-col gap-1 items-center justify-center text-gray-500 active:text-gray-900">
             <Menu className="w-6 h-6" />
             <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </div>
    </>
  );
}
