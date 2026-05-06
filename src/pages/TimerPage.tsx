import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Shield, Clock, Loader2, AlertTriangle, ShieldCheck, 
  MapPin, ArrowLeft, Satellite, Zap, Globe, Gauge
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TimerPage() {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [customDuration, setCustomDuration] = useState('30');
  const [error, setError] = useState('');
  const [sosTriggered, setSosTriggered] = useState(false);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: any;
    if (activeSession && (activeSession.status === 'active' || activeSession.status === 'expired')) {
      const calculateTimeLeft = () => {
        const start = new Date(activeSession.start_time).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((start + (activeSession.duration * 1000) - now) / 1000));
        setTimeLeft(diff);
        
        if (diff === 0 && activeSession.status !== 'expired') {
          setSosTriggered(true);
          setActiveSession((prev: any) => prev ? { ...prev, status: 'expired' } : null);
        }
      };

      calculateTimeLeft();
      timer = setInterval(calculateTimeLeft, 1000);
    } else {
      setTimeLeft(null);
      setSosTriggered(false);
    }
    return () => clearInterval(timer);
  }, [activeSession]);

  const checkStatus = async () => {
    try {
      const res = await axios.get('/api/session/active');
      if (res.data) {
        if (!activeSession || activeSession.id !== res.data.id || activeSession.status !== res.data.status) {
          setActiveSession(res.data);
        }
      } else {
         if (activeSession) setActiveSession(null);
      }
    } catch (err) {
      console.error('Status check failed');
    } finally {
      if (loading) setLoading(false);
    }
  };

  const [starting, setStarting] = useState(false);
  const [startStep, setStartStep] = useState('');

  const startTimer = async (durationMinutes: number) => {
    if (!durationMinutes || isNaN(durationMinutes)) {
      setError('Invalid duration input.');
      return;
    }

    setStarting(true);
    setStartStep('Locking GPS Coordinates...');
    setError('');
    
    try {
      const pos: any = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Atmospheric tracking not supported by this unit.'));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(resolve, (err) => {
          let msg = 'Encryption Protocol Error';
          if (err.code === 1) msg = 'Location Access Required. Please enable permissions in your browser URL bar (Lock icon).';
          if (err.code === 2) msg = 'Atmospheric interference. Satellite link failed.';
          if (err.code === 3) msg = 'Sync timeout. Retrying link...';
          reject(new Error(msg));
        }, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        });
      });

      setStartStep('Uploading SOS Beacon to Mesh...');
      const res = await axios.post('/api/session/start', {
        duration: durationMinutes * 60,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
      setActiveSession({ ...res.data, status: 'active' });
      setSosTriggered(false);
    } catch (err: any) {
      setError(err.message || 'GPS Authorization Required.');
    } finally {
      setStarting(false);
      setStartStep('');
    }
  };

  const checkIn = async () => {
    try {
      await axios.post('/api/session/checkin');
      setActiveSession(null);
      setTimeLeft(null);
      setSosTriggered(false);
    } catch (err) {
      setError('Check-in failed. Communication relay interrupted.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    if (!activeSession || timeLeft === null) return 100;
    return (timeLeft / activeSession.duration) * 100;
  };

  if (loading && !activeSession) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
    </div>
  );

  return (
    <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto min-h-screen">
      <header className="mb-20">
        <Link to="/" className="inline-flex items-center gap-3 text-white/30 hover:text-sky-400 transition-colors mb-8 font-black text-[10px] tracking-[0.4em] uppercase group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Surface Telemetry</span>
        </Link>
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-[9px] font-black tracking-[0.3em] uppercase mb-6 neon-glow-rose">
              <Zap size={10} className="animate-pulse" /> Safety Protocol [V4-S]
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-[0.85]">
              MISSION <br /> MONITOR.
            </h1>
            <p className="text-white/40 mt-6 text-xl font-medium max-w-xl leading-relaxed">
              Real-time atmospheric watchdog. Expiration triggers emergency 
              SOS telemetry to your orbital contacts via encrypted satellite relay.
            </p>
          </motion.div>
          
          <div className="flex flex-col gap-3">
             <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
                <Satellite size={22} className="text-sky-400" />
                <div className="h-6 w-px bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Orbital Status</span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em] animate-pulse leading-none mt-1">Connection Active</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {activeSession ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-8 glass-card p-16 rounded-[4rem] relative overflow-hidden flex flex-col items-center text-center group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
            
            {/* Timer Visualization */}
            <div className="relative w-80 h-80 md:w-[28rem] md:h-[28rem] flex items-center justify-center mb-20">
              <div className="absolute inset-0 border border-white/5 rounded-full animate-spin-slow opacity-20" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-4 border border-white/5 rounded-full animate-reverse-spin opacity-10" style={{ animationDuration: '30s' }} />
              
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="46%" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="16" />
                <motion.circle
                  cx="50%" cy="50%" r="46%" fill="none"
                  stroke="currentColor" strokeWidth="16"
                  strokeDasharray="100 100" pathLength="100"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ 
                    strokeDashoffset: 100 - calculateProgress(),
                    color: timeLeft && timeLeft < 60 ? '#f43f5e' : '#38bdf8'
                  }}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-6">Beacon Expiry</p>
                <div className={`text-[10rem] font-black tracking-tighter tabular-nums leading-none ${timeLeft && timeLeft < 60 ? 'text-rose-500 neon-glow-rose' : 'text-white'}`}>
                  {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                </div>
                {sosTriggered && (
                  <div className="mt-8 flex items-center gap-3 px-4 py-2 bg-rose-500 rounded-xl neon-glow-rose">
                     <AlertTriangle size={18} className="text-white animate-bounce" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">SOS DEPLOYED</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={checkIn}
              className="group relative px-24 py-8 bg-sky-600 hover:bg-sky-500 text-white font-black text-2xl rounded-[2.5rem] shadow-2xl transition-all active:scale-95 flex items-center gap-5 neon-glow-sky overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <ShieldCheck size={32} /> 
              I AM SECURE
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 glass-card p-16 rounded-[4rem] relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-4xl font-black text-white mb-12 tracking-tight">Deploy Parameters</h2>
              
              <div className="space-y-16">
                 <div>
                    <div className="flex items-center justify-between mb-8 px-2">
                       <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Mission Presets</p>
                       <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">Satellite Link: Ready</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      {[15, 30, 45, 60, 120].map(m => (
                        <button 
                          key={m}
                          onClick={() => startTimer(m)}
                          disabled={starting}
                          className="py-10 bg-white/5 border border-white/10 rounded-[2rem] font-black text-2xl text-white hover:border-sky-500/50 hover:bg-white/[0.08] transition-all disabled:opacity-30 group"
                        >
                          <span className="group-hover:scale-110 transition-transform block">{m}</span>
                          <span className="text-[9px] font-bold text-white/20 block tracking-widest mt-1">MIN</span>
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="pt-8 border-t border-white/5">
                    <div className="flex flex-col md:flex-row gap-8 items-end">
                       <div className="flex-1 w-full">
                         <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-6 px-1">Custom Orbit Duration</p>
                         <div className="relative">
                           <Gauge className="absolute left-7 top-1/2 -translate-y-1/2 text-white/20" size={24} />
                           <input 
                             type="number" 
                             placeholder="MINUTES"
                             className="w-full h-20 pl-16 pr-8 bg-white/5 border border-white/10 rounded-[2rem] outline-none focus:border-sky-500/50 font-black text-2xl text-white placeholder:text-white/10 tracking-widest"
                             value={customDuration}
                             onChange={(e) => setCustomDuration(e.target.value)}
                             disabled={starting}
                           />
                         </div>
                       </div>
                       <button 
                         onClick={() => startTimer(parseInt(customDuration))}
                         disabled={starting || !customDuration}
                         className="w-full md:w-auto h-20 px-16 bg-white text-slate-950 font-black text-xl rounded-[2rem] hover:bg-sky-400 transition-all flex items-center justify-center gap-4 active:scale-95"
                       >
                         {starting ? <Loader2 className="animate-spin" /> : <><Zap size={24} /> DEPLOY SCAN</>}
                       </button>
                    </div>
                 </div>
              </div>

              <AnimatePresence>
                {starting && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-12 p-8 bg-sky-500/10 border border-sky-500/20 rounded-[2.5rem] flex items-center gap-5 text-sky-400 font-black text-sm uppercase tracking-widest"
                  >
                    <Satellite className="animate-spin-slow w-8 h-8" /> 
                    <div className="flex flex-col">
                       <span className="leading-none">{startStep}</span>
                       <span className="text-[9px] opacity-50 mt-1">Encrypted Tunnel Active</span>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-12 p-8 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] flex flex-col gap-4 text-rose-400"
                  >
                    <div className="flex items-center gap-4 font-black uppercase text-sm tracking-widest">
                       <AlertTriangle size={24} /> MISSION INTERRUPTED
                    </div>
                    <p className="text-sm font-medium opacity-80 leading-relaxed pl-10">
                       {error}
                    </p>
                    <div className="pl-10 mt-2">
                       <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4">Location Troubleshooting:</div>
                       <ul className="text-[10px] font-bold text-white/30 space-y-2 list-disc pl-4">
                          <li>Click the **Lock Icon** in the browser URL bar to allow Location access.</li>
                          <li>Satellite links require clear visibility of your device's GPS hardware.</li>
                       </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        <aside className="lg:col-span-4 flex flex-col gap-8">
           <div className="glass-card p-10 rounded-[3.5rem] relative overflow-hidden group border-sky-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Shield className="absolute -right-12 -bottom-12 w-56 h-56 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
              <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 mb-8">
                <Zap size={32} />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight mb-6 leading-tight">Server-Side <br /> Redundancy.</h3>
              <p className="text-white/40 font-medium leading-relaxed">
                The countdown runs on our isolated orbital grid. SOS protocols will
                deploy even if your device enters silent mode or loses its data uplink.
              </p>
           </div>
        </aside>
      </div>
    </div>
  );
}
