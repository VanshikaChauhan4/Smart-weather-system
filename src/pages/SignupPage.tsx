import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, UserPlus, Shield, AlertCircle, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../App';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/api/auth/signup', { name, email, password });
      login(res.data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registry entry failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl glass-card p-16 rounded-[4rem] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
        
        <div className="text-center mb-16">
          <div className="inline-flex p-5 bg-sky-600 rounded-[2rem] mb-10 shadow-2xl neon-glow-sky">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4">NEW UPLINK.</h1>
          <p className="text-white/30 font-medium tracking-wide">Register your biometrics into the SkyGuard mesh.</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-10 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4 text-rose-400 text-sm font-black uppercase tracking-widest"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Full Identity</label>
            <div className="relative group">
              <User className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-sky-400 transition-colors" />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="OPERATOR NAME"
                className="w-full h-20 pl-16 pr-6 bg-white/5 border border-white/10 rounded-[2rem] focus:border-sky-500/50 outline-none font-black text-white placeholder:text-white/5 tracking-widest"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Uplink ID (Email)</label>
            <div className="relative group">
              <Mail className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-sky-400 transition-colors" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL@NETWORK.NET"
                className="w-full h-20 pl-16 pr-6 bg-white/5 border border-white/10 rounded-[2rem] focus:border-sky-500/50 outline-none font-black text-white placeholder:text-white/5 tracking-widest"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Security Key</label>
            <div className="relative group">
              <Lock className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-sky-400 transition-colors" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-20 pl-16 pr-6 bg-white/5 border border-white/10 rounded-[2rem] focus:border-sky-500/50 outline-none font-black text-white placeholder:text-white/5 tracking-widest"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full h-20 bg-white text-slate-950 font-black rounded-[2rem] hover:bg-sky-400 transition-all flex items-center justify-center gap-4 text-xl shadow-2xl active:scale-[0.98] mt-12"
          >
            {loading ? <Loader2 className="animate-spin w-8 h-8" /> : <><UserPlus size={24} /> ACTIVATE PROTOCOL</>}
          </button>
        </form>

        <div className="mt-12 text-center">
            <p className="text-white/30 text-sm font-bold uppercase tracking-widest">
              Already Registered? <Link to="/login" className="text-sky-400 hover:text-sky-300 font-black decoration-sky-500/30 underline-offset-8 underline">Access Station</Link>
            </p>
        </div>
      </motion.div>
    </div>
  );
}
