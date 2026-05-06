import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Search, MapPin, Wind, Droplets, Thermometer, 
  ArrowRight, Shield, Zap, Satellite, Globe, Activity, Navigation, Eye, AlertCircle, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface WeatherUpdateProps {
  onWeatherUpdate?: (mode: 'CLEAR' | 'RAIN' | 'STORM' | 'NIGHT' | 'CLOUDY') => void;
}

export default function LandingPage({ onWeatherUpdate }: WeatherUpdateProps) {
  const [weather, setWeather] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mapWeatherToMode = (main: string, description: string): any => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 19;
    
    if (isNight) return 'NIGHT';
    if (main === 'Thunderstorm') return 'STORM';
    if (main === 'Rain' || main === 'Drizzle') return 'RAIN';
    if (main === 'Clouds') return 'CLOUDY';
    return 'CLEAR';
  };

  const fetchWeather = async (lat: number | null, lon: number | null, city?: string) => {
    setLoading(true);
    try {
      const params: any = city ? { city } : { lat, lon };
      const res = await axios.get('/api/weather', { params });
      setWeather(res.data);
      
      const mode = mapWeatherToMode(res.data.current.weather[0].main, res.data.current.weather[0].description);
      onWeatherUpdate?.(mode);
    } catch (err) {
      setError('Communication sync failure.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(null, null, 'London')
      );
    } else {
      fetchWeather(null, null, 'London');
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) fetchWeather(null, null, query);
  };

  return (
    <div className="min-h-screen py-32 px-6">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12">
        
        {/* Module 1: Atmospheric Telemetry */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-4 flex flex-col gap-8"
        >
          <div className="glass-card p-10 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
               <Satellite size={120} />
            </div>
            
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center neon-glow-sky">
                <Activity size={24} className="text-white animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] leading-none mb-1">Surveillance</p>
                <h3 className="text-xs font-bold text-white/50 uppercase">Active Orbital Link</h3>
              </div>
            </div>

            <h1 className="text-6xl font-black tracking-tighter leading-[0.85] mb-8 text-white">
              LIVING <br /> 
              <span className="text-sky-400">ATMOSPHERE.</span>
            </h1>

            <p className="text-slate-400 font-medium mb-10 leading-relaxed text-lg italic">
              "The sky is no longer a backdrop, but a living dataset."
            </p>

            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Target city scan..."
                className="w-full h-16 pl-14 pr-6 bg-white/[0.05] border border-white/10 rounded-2xl focus:border-sky-500/50 outline-none transition-all font-bold text-white placeholder:text-white/20 text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-sky-500 rounded-xl text-white shadow-lg shadow-sky-500/20">
                <RefreshCw size={18} />
              </button>
            </form>
          </div>

          <Link to="/timer" className="glass-card p-10 rounded-[3rem] flex items-center justify-between hover:bg-white/[0.08] transition-all group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="relative z-10">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-2">Protocol Override</p>
                <h3 className="text-2xl font-black text-white tracking-tight">Deploy SOS Beacon</h3>
             </div>
             <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white group-hover:bg-rose-500 group-hover:neon-glow-rose transition-all relative z-10">
                <Zap size={28} />
             </div>
          </Link>
        </motion.div>

        {/* Module 2: The Core Visualization */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, 0]
            }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            className="w-full aspect-square relative flex items-center justify-center"
          >
             {/* HUD Circles */}
             <div className="absolute w-[120%] h-[120%] border border-white/5 rounded-full animate-spin-slow radial-mask-fade" />
             <div className="absolute w-[90%] h-[90%] border border-white/10 rounded-full animate-reverse-spin radial-mask-fade" style={{ animationDuration: '15s' }} />
             
             {/* Virtual Globe / Interactive Center */}
             <div className="w-64 h-64 bg-sky-500/10 rounded-full blur-3xl neon-glow-sky opacity-20" />
             <Globe className="absolute text-white/5 w-96 h-96" />
          </motion.div>
        </div>

        {/* Module 3: Environment Analysis */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-3 flex flex-col gap-8"
        >
          {loading ? (
            <div className="flex-1 glass-card rounded-[3rem] flex flex-col items-center justify-center gap-4 py-20">
               <div className="w-16 h-16 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
               <p className="text-[10px] font-black tracking-widest text-white/30 uppercase">Analyzing Atmosphere</p>
            </div>
          ) : weather && (
            <div className="flex-1 glass-card p-10 rounded-[4rem] relative flex flex-col justify-between group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50" />
              
              <div className="space-y-12">
                <div className="flex justify-between items-start">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">Local Scan</p>
                      <h2 className="text-4xl font-black text-white tracking-tighter leading-none">
                        {weather.current.name}
                      </h2>
                      <span className="text-xs font-bold text-white/40">{weather.current.sys.country} / Station {weather.current.id.toString().slice(-4)}</span>
                   </div>
                   <MapPin className="text-sky-400 neon-glow-sky" size={24} />
                </div>

                <div className="grid gap-8">
                  {[
                    { icon: Thermometer, label: 'Temp', value: `${Math.round(weather.current.main.temp)}°`, color: 'text-orange-400' },
                    { icon: Wind, label: 'Velocity', value: `${weather.current.wind.speed}m/s`, color: 'text-sky-400' },
                    { icon: Droplets, label: 'Density', value: `${weather.current.main.humidity}%`, color: 'text-blue-400' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between group/item">
                       <div className="flex items-center gap-4">
                          <div className={`p-3 bg-white/5 rounded-xl ${item.color} group-hover/item:bg-white/10 transition-colors`}>
                             <item.icon size={20} />
                          </div>
                          <span className="text-sm font-bold text-white/40 uppercase tracking-widest">{item.label}</span>
                       </div>
                       <span className="text-3xl font-black text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-4">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse neon-glow-emerald" />
                 <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Environment Nominal</p>
              </div>
            </div>
          )}

          <div className="p-8 glass-card rounded-[2.5rem] flex items-center justify-around">
             <button className="p-4 hover:bg-white/5 rounded-2xl transition-all text-white/30 hover:text-sky-400"><Navigation size={24} /></button>
             <div className="h-8 w-px bg-white/5" />
             <button className="p-4 hover:bg-white/5 rounded-2xl transition-all text-white/30 hover:text-sky-400"><Eye size={24} /></button>
             <div className="h-8 w-px bg-white/5" />
             <button className="p-4 hover:bg-white/5 rounded-2xl transition-all text-white/30 hover:text-sky-400"><AlertCircle size={24} /></button>
          </div>
        </motion.div>
      </div>

      {/* Persistent Flight Metrics */}
      <div className="max-w-7xl mx-auto w-full mt-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Orbital Depth', value: '+42km', color: 'text-sky-500' },
            { label: 'Sensor Link', value: 'Synced', color: 'text-emerald-500' },
            { label: 'Threat Level', value: 'Zero', color: 'text-white' },
            { label: 'Latency', value: '2.4ms', color: 'text-sky-500' }
          ].map((stat, i) => (
            <div key={i} className="glass-card p-8 rounded-[2rem] border-l-4" style={{ borderColor: i === 0 || i === 3 ? '#0ea5e9' : i === 1 ? '#10b981' : 'rgba(255,255,255,0.1)' }}>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
              <span className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
