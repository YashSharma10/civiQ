import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser, useAuth } from '@clerk/clerk-react';
import { Home, Map as MapIcon, PlusCircle, LogIn, UserPlus, LogOut, Menu, X, HelpCircle, Shield, LayoutDashboard, Plus, Bell, User } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const isHome = isActive('/');
  const textColor = isHome ? 'text-white' : 'text-gray-900';
  const textMuted = isHome ? 'text-white/80' : 'text-gray-600';
  const borderColor = isHome ? 'border-white' : 'border-gray-900';
  const hoverColor = isHome ? 'hover:text-white' : 'hover:text-gray-900';

  return (
    <>
      {/* Top Navbar */}
      <nav className={`w-full z-50 transition-all duration-300 ${isHome ? 'absolute top-0 left-0 bg-transparent py-4' : 'sticky top-0 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center group">
              <img src={logo} alt="CiviQ" className="h-24 w-auto group-hover:opacity-80 transition-opacity" />
            </Link>

            {/* Desktop Navigation & Actions */}
            <div className="hidden md:flex items-center space-x-10 ml-auto">
              {/* Links */}
              <div className="flex items-center space-x-8">
                <Link to="/" className={`text-[15px] font-medium transition-colors ${isActive('/') ? textColor : `${textMuted} hover:text-gray-900`}`}>Home</Link>
                <Link to="/feed" className={`text-[15px] font-medium transition-colors ${isActive('/feed') ? textColor : `${textMuted} hover:text-gray-900`}`}>Feed</Link>
                <Link to="/dashboard" className={`text-[15px] font-medium transition-colors ${isActive('/dashboard') ? textColor : `${textMuted} hover:text-gray-900`}`}>Dashboard</Link>
                <SignedIn>
                    <Link to="/report" className={`text-[15px] font-medium transition-colors ${isActive('/report') ? textColor : `${textMuted} hover:text-gray-900`}`}>Report Issue</Link>
                </SignedIn>
              </div>

              {/* Actions */}
              <div className={`flex items-center pl-6 border-l ${isHome ? 'border-white/30' : 'border-gray-200'}`}>
                <SignedIn>
                    <UserButton />
                </SignedIn>
                <SignedOut>
                    <div className="flex items-center space-x-6">
                      <Link to="/login" className={`text-[13px] font-medium tracking-wide ${textColor} ${hoverColor} transition-colors uppercase`}>Login</Link>
                      <Link to="/register" className={`text-[13px] font-bold tracking-wide uppercase border-b-2 ${borderColor} ${textColor} pb-0.5 ${hoverColor} transition-colors`}>Sign Up</Link>
                    </div>
                </SignedOut>
              </div>
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
          <Link to="/feed" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/feed') ? 'text-primary' : 'text-gray-500 active:text-gray-900'}`}>
            <Bell className={`w-6 h-6 ${isActive('/feed') ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-medium">Feed</span>
          </Link>
          
          <div className="w-full flex justify-center -translate-y-6">
            <Link to="/report" className="flex flex-col items-center justify-center relative">
              <div className={`text-white p-3 rounded-full shadow-[0_4px_10px_rgba(234,179,8,0.5)] border-4 border-white transition-transform active:scale-95 ${isActive('/report') ? 'bg-secondary scale-105' : 'bg-primary'}`}>
                <PlusCircle className="w-7 h-7" />
              </div>
              <span className={`text-[10px] font-bold mt-1 ${isActive('/report') ? 'text-secondary' : 'text-gray-800'}`}>Report</span>
            </Link>
          </div>
          
          <Link to={isSignedIn ? "/dashboard" : "/login"} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/dashboard') ? 'text-primary' : 'text-gray-500 active:text-gray-900'}`}>
             <LayoutDashboard className={`w-6 h-6 ${isActive('/dashboard') ? 'fill-primary/20' : ''}`} />
             <span className="text-[10px] font-medium">{isSignedIn ? "Dashboard" : "Login"}</span>
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
