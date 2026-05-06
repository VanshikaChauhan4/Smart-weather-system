import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Home, Thermometer, Clock, User, LogOut, Menu, X, Phone } from 'lucide-react';
import { useAuth } from '../App';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'RADAR', path: '/', icon: Home },
    { name: 'SAFETY TIMER', path: '/timer', icon: Clock, protected: true },
    { name: 'RECOMMENDATIONS', path: '/recommendations', icon: Thermometer, protected: true },
    { name: 'CONTACTS', path: '/contacts', icon: Phone, protected: true },
  ];

  const filteredLinks = navLinks.filter(link => !link.protected || user);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-3xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group transition-all">
          <div className="w-10 h-10 bg-sky-600 rounded-xl neon-glow-sky flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-sky-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white leading-none">SKYGUARD</span>
            <span className="text-[8px] font-black tracking-[0.4em] text-sky-400 uppercase">Atmosphere</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10">
          {filteredLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`text-[10px] font-black tracking-[0.2em] transition-all hover:text-sky-400 uppercase ${
                location.pathname === link.path ? 'text-sky-400' : 'text-white/40'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="h-4 w-px bg-white/10 mx-2" />

          {user ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <User className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex flex-col text-left">
                   <span className="text-xs font-black text-white leading-none mb-1">{user.name}</span>
                   <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Verified</span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors">Login</Link>
              <Link to="/signup" className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all neon-glow-sky">
                Initialize
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden p-2 text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-20 left-0 right-0 bg-slate-950/95 backdrop-blur-3xl border-b border-white/5 p-8 space-y-6 shadow-2xl overflow-hidden"
          >
            {filteredLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 text-2xl font-black text-white tracking-tighter"
              >
                <div className="p-4 bg-white/5 rounded-2xl">
                  <link.icon className="w-6 h-6 text-sky-400" />
                </div>
                {link.name}
              </Link>
            ))}
            {!user ? (
              <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                <Link to="/login" onClick={() => setIsOpen(false)} className="text-center py-4 text-white/40 font-black uppercase tracking-widest leading-none">Login</Link>
                <Link to="/signup" onClick={() => setIsOpen(false)} className="text-center py-5 bg-sky-600 text-white rounded-2xl font-black uppercase tracking-widest neon-glow-sky">Initialize</Link>
              </div>
            ) : (
              <button 
                onClick={() => { logout(); setIsOpen(false); }}
                className="w-full text-left py-6 text-rose-500 font-black flex items-center gap-4 border-t border-white/5 uppercase tracking-widest"
              >
                <LogOut className="w-6 h-6" /> Terminate Session
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
