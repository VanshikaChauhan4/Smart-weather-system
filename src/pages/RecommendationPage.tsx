import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Cloud, Umbrella, Wind, Thermometer, 
  Loader2, CheckCircle2, AlertTriangle, ArrowLeft, 
  MapPin, Shield, Zap, Satellite, Droplets, Footprints, Shirt, CupSoda
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecommendationPage() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getInitialData = async () => {
      const cached = localStorage.getItem('skyguard_weather_cache');
      if (cached) {
        setWeather(JSON.parse(cached));
        setLoading(false);
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const res = await axios.get('/api/weather', { 
                params: { lat: pos.coords.latitude, lon: pos.coords.longitude } 
              });
              setWeather(res.data);
              localStorage.setItem('skyguard_weather_cache', JSON.stringify(res.data));
            } catch (err) {
              console.error(err);
              if (!cached) setError('Lookup failed.');
            } finally {
              setLoading(false);
            }
          },
          () => fetchWeather('London'),
          { timeout: 5000 }
        );
      } else {
        fetchWeather('London');
      }
    };

    getInitialData();
  }, []);

  const fetchWeather = async (city: string) => {
    try {
      const res = await axios.get('/api/weather', { params: { city } });
      setWeather(res.data);
    } catch (err) {
      setError('Weather lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const recommendations = useMemo(() => {
    if (!weather) return [];
    
    const currentData = weather.current || weather;
    if (!currentData || !currentData.main) return [];

    const temp = currentData.main.temp;
    const cond = currentData.weather[0].main.toLowerCase();
    const humidity = currentData.main.humidity;
    const recs = [];

    if (temp < 15) {
      recs.push({ icon: Shirt, title: 'Thermal Layering', desc: 'Cold front active. Suggest thermal base with weather-proof shell.', color: 'text-blue-400', bg: 'bg-blue-500/10' });
    } else if (temp > 28) {
      recs.push({ icon: Shirt, title: 'Heat Shield', desc: 'Solar intensity is high. UV-resistant breathable fabrics required.', color: 'text-orange-400', bg: 'bg-orange-500/10' });
    } else {
      recs.push({ icon: Shirt, title: 'Modular Loadout', desc: 'Moderate system conditions. Standard technical apparel sufficient.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' });
    }

    if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('storm')) {
      recs.push({ icon: Umbrella, title: 'Hydro Protocol', desc: 'Precipitation imminent. Deploy waterproof exterior shield.', color: 'text-sky-400', bg: 'bg-sky-500/10' });
    }

    if (temp > 26 || humidity > 70) {
      recs.push({ icon: CupSoda, title: 'Bio-Hydration', desc: 'High metabolic drain detected. Supplement with electrolytes.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' });
    }

    if (recs.length < 2) {
      recs.push({ icon: CheckCircle2, title: 'Nominal Sync', desc: 'Atmospheric stability verified. Proceed with standard op-params.', color: 'text-white/40', bg: 'bg-white/5' });
    }

    return recs;
  }, [weather]);

  if (loading && !weather) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/5 border-t-sky-500 rounded-full animate-spin" />
          <Satellite className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-400" size={24} />
        </div>
        <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em]">Establishing Uplink</p>
      </div>
    </div>
  );

  const cityName = weather?.current?.name || weather?.name || 'Local Sector';
  const currentTemp = weather?.current?.main?.temp || weather?.main?.temp;
  const weatherIcon = weather?.current?.weather?.[0]?.icon || weather?.weather?.[0]?.icon;

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
      <header className="mb-20 flex flex-col lg:flex-row lg:items-end justify-between gap-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center gap-3 text-white/30 hover:text-sky-400 transition-colors mb-10 font-black text-[10px] tracking-[0.4em] uppercase group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> BACK TO DASHBOARD
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-[10px] font-black tracking-widest uppercase mb-6 neon-glow-sky">
            <Satellite size={12} /> Strategic Intel
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-[0.85]">
            GEAR <br /> ANALYTICS.
          </h1>
          <p className="text-white/40 mt-6 text-xl font-medium max-w-xl leading-relaxed">
            Predictive loadout optimization based on current atmospheric telemetry data.
          </p>
        </motion.div>

        {weather && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 rounded-[3rem] flex items-center gap-10"
          >
            <div className="text-right">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">{cityName}</p>
              <p className="text-5xl font-black text-white tracking-tighter">{Math.round(currentTemp)}°C</p>
            </div>
            <div className="w-px h-16 bg-white/10" />
            <img 
              src={`https://openweathermap.org/img/wn/${weatherIcon}@4x.png`} 
              alt="weather state"
              className="w-24 h-24 filter brightness-110"
            />
          </motion.div>
        )}
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
              <Footprints size={18} className="text-sky-500" /> RECOMMENDED CONFIGURATION
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {recommendations.map((rec, i) => (
                  <motion.div 
                    key={rec.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-10 rounded-[3rem] group hover:bg-white/[0.05] transition-all flex flex-col h-full border-white/5"
                  >
                    <div className={`w-16 h-16 ${rec.bg} rounded-2xl flex items-center justify-center ${rec.color} mb-8 neon-glow-sky group-hover:scale-110 transition-transform`}>
                      <rec.icon size={32} />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-4 tracking-tight">{rec.title}</h3>
                    <p className="text-white/40 font-medium leading-relaxed flex-1 italic text-lg opacity-80 group-hover:opacity-100 transition-opacity">
                      {rec.desc}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          <section className="glass-card p-10 rounded-[3.5rem] flex flex-col md:flex-row gap-10 items-center border-rose-500/10">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/5 shrink-0 animate-pulse">
               <AlertTriangle size={36} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-white mb-3">Protocol Caution</h4>
              <p className="text-white/30 font-medium leading-relaxed text-lg">
                Atmospheric states transition rapidly. System intel is secondary to 
                physical environmental awareness. Verify visibility before departure.
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-10">
          <div className="glass-card p-12 bg-sky-600 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group border-none">
            <Zap className="absolute -right-12 -top-12 w-64 h-64 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-1000" />
            <Shield className="mb-12 text-sky-200" size={48} />
            <h3 className="text-5xl font-black mb-8 tracking-tighter leading-[0.85]">Safety First.</h3>
            <p className="text-sky-100 mb-12 text-xl font-medium leading-relaxed opacity-90">
              Pattern analysis suggests initializing an emergency beacon for 
              this environment.
            </p>
            <Link to="/timer" className="w-full block py-7 bg-white text-sky-600 rounded-[2rem] text-center font-black text-2xl shadow-2xl hover:bg-sky-50 active:scale-95 transition-all">
              INITIALIZE SOS
            </Link>
          </div>

          <div className="glass-card p-10 rounded-[4rem] border-white/5">
            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-10">Sensory Payload</h4>
            <div className="space-y-6">
              {[
                { label: 'Cloud Density', val: `${weather?.current?.clouds?.all || weather?.clouds?.all || 0}%`, icon: Cloud },
                { label: 'Wind Velocity', val: `${weather?.current?.wind?.speed || weather?.wind?.speed} m/s`, icon: Wind },
                { label: 'Saturation', val: `${weather?.current?.main?.humidity || weather?.main?.humidity}%`, icon: Droplets }
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl group">
                  <div className="flex items-center gap-5">
                    <stat.icon size={20} className="text-sky-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="text-xs font-bold text-white/30 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <span className="text-lg font-black text-white">{stat.val}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
