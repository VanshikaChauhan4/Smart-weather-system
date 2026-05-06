import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Sun, CloudRain, Shield, Clock, LogOut, User, 
  Menu, X, Home, Thermometer, MapPin, AlertTriangle, Settings, Phone
} from 'lucide-react';

// Components & Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TimerPage from './pages/TimerPage';
import RecommendationPage from './pages/RecommendationPage';
import ContactsPage from './pages/ContactsPage';
import Navbar from './components/Navbar';
import ThreeBackground from './components/ThreeBackground';

// Auth Context
const AuthContext = createContext<any>(null);

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weatherTheme, setWeatherTheme] = useState<'CLEAR' | 'RAIN' | 'STORM' | 'NIGHT' | 'CLOUDY'>('CLEAR');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: any) => setUser(userData);
  const logout = async () => {
    await axios.post('/api/auth/logout');
    setUser(null);
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Cloud className="w-12 h-12 text-sky-400" />
      </motion.div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, checkAuth }}>
      <Router>
        <div className="min-h-screen text-slate-100 font-sans selection:bg-sky-500/20 bg-slate-950">
          <ThreeBackground weather={weatherTheme} />
          <Navbar />
          
          <main className="relative z-10">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<LandingPage onWeatherUpdate={setWeatherTheme} />} />
                <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
                <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
                
                {/* Protected Routes */}
                <Route path="/timer" element={user ? <TimerPage /> : <Navigate to="/login" />} />
                <Route path="/recommendations" element={user ? <RecommendationPage /> : <Navigate to="/login" />} />
                <Route path="/contacts" element={user ? <ContactsPage /> : <Navigate to="/login" />} />
              </Routes>
            </AnimatePresence>
          </main>
          
          <footer className="relative z-10 py-24 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-16">
              <div className="col-span-2">
                <div className="flex items-center gap-3 text-3xl font-black mb-8">
                  <Shield className="text-sky-500 w-8 h-8" />
                  <span className="tracking-tighter">SKYGUARD</span>
                </div>
                <p className="text-slate-400 max-w-sm font-medium leading-relaxed text-lg">
                  Advanced atmospheric synchronization protocol. Protecting 
                  expeditions through predictive orbital telemetry.
                </p>
              </div>
              <div>
                <h4 className="font-black text-white mb-8 uppercase tracking-widest text-xs opacity-50">Navigation</h4>
                <ul className="space-y-4 text-slate-400 font-bold">
                  <li><Link to="/" className="hover:text-sky-400 transition-colors">Surface Radar</Link></li>
                  <li><Link to="/timer" className="hover:text-sky-400 transition-colors">Mission Clock</Link></li>
                  <li><Link to="/recommendations" className="hover:text-sky-400 transition-colors">Strategic Link</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-black text-white mb-8 uppercase tracking-widest text-xs opacity-50">Protocol</h4>
                <ul className="space-y-4 text-slate-400 font-bold">
                  <li><Link to="/contacts" className="hover:text-sky-400 transition-colors">SOS Relay</Link></li>
                  <li><a href="#" className="hover:text-sky-400 transition-colors">Technical Logs</a></li>
                  <li><a href="#" className="hover:text-sky-400 transition-colors">Encryption Dept</a></li>
                </ul>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
              &copy; 2026 SkyGuard Aerospace Systems. Connection Secured.
            </div>
          </footer>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
