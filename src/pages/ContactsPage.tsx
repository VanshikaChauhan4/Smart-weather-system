import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  UserPlus, Trash2, Shield, Phone, Loader2, AlertCircle, 
  CheckCircle2, User, Globe, ArrowLeft, Plus, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get('/api/contacts');
      setContacts(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load contacts.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');

    let cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.length === 10) {
        cleanPhone = '+91' + cleanPhone;
      } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
        cleanPhone = '+' + cleanPhone;
      }
    }

    try {
      const res = await axios.post('/api/contacts', { name, phone: cleanPhone });
      setContacts([...contacts, res.data]);
      setName('');
      setPhone('');
      setSuccess('Responder authorized successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authorize contact.');
    } finally {
      setAdding(false);
    }
  };

  const deleteContact = async (id: number) => {
    try {
      await axios.delete(`/api/contacts/${id}`);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (err) {
      setError('Relay termination failed.');
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
    </div>
  );

  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto min-h-screen">
      <header className="mb-20">
        <Link to="/" className="inline-flex items-center gap-3 text-white/30 hover:text-sky-400 transition-colors mb-8 font-black text-[10px] tracking-[0.4em] uppercase group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> BACK TO DASHBOARD
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-6 neon-glow-emerald">
              <Shield size={12} /> Security Mesh Active
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-[0.85]">
              TRUSTED <br /> RELAYS.
            </h1>
            <p className="text-white/40 mt-6 text-xl font-medium max-w-lg leading-relaxed">
              Define the emergency response nodes for your SOS broadcast network.
            </p>
          </motion.div>
          <div className="glass-card p-6 rounded-[2rem] flex items-center gap-6 border-white/5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl ${contacts.length >= 5 ? 'text-rose-500 bg-rose-500/10' : 'text-sky-400 bg-sky-500/10'}`}>
              {contacts.length}<span className="text-xs opacity-50 ml-1">/ 5</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Network Units</span>
               <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">Authorized Slots</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-10">
        {contacts.length < 5 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-[3.5rem] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
               <UserPlus size={120} />
            </div>
            
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white neon-glow-sky">
                <Plus size={24} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">Sync New Responder</h2>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="flex-1 relative group/input">
                <User size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-sky-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="RELAY NAME" 
                  className="w-full h-16 pl-16 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:border-sky-500/50 outline-none font-black text-white placeholder:text-white/10 tracking-widest"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1 relative group/input">
                <Globe size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-sky-400 transition-colors" />
                <input 
                  type="tel" 
                  placeholder="TEL (e.g. 91..)" 
                  className="w-full h-16 pl-16 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:border-sky-500/50 outline-none font-black text-white placeholder:text-white/10 tracking-widest"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={adding}
                className="px-12 h-16 bg-white text-slate-950 font-black rounded-2xl hover:bg-sky-400 transition-all shadow-xl disabled:opacity-30 flex items-center justify-center gap-3 active:scale-95"
              >
                {adding ? <Loader2 className="animate-spin" /> : <><Zap size={20} /> AUTHORIZE</>}
              </button>
            </form>

            <AnimatePresence>
               {error && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-400 text-sm font-black uppercase tracking-widest">
                   <AlertCircle size={20} /> {error}
                 </motion.div>
               )}
               {success && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-400 text-sm font-black uppercase tracking-widest">
                   <CheckCircle2 size={20} /> {success}
                 </motion.div>
               )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="glass-card p-10 rounded-[3rem] text-center border-white/5">
             <p className="text-white/20 font-black uppercase tracking-[0.4em] text-xs mb-3">Capacity Terminated</p>
             <h3 className="text-2xl font-black text-white opacity-40 italic">Global Mesh Slots Full (5/5)</h3>
          </div>
        )}

        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {contacts.map((contact, i) => (
              <motion.div 
                key={contact.id}
                layout
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.1 }}
                className="group glass-card p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-white/[0.05] transition-all border-white/5"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 transition-colors border border-white/10">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{contact.name}</h3>
                    <div className="flex items-center gap-3 mt-1 opacity-40">
                      <Phone size={14} />
                      <p className="text-sm font-bold tracking-widest">{contact.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Encrypted Tunnel</span>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Ready For SOS Discharge</span>
                  </div>
                  <button 
                    onClick={() => deleteContact(contact.id)}
                    className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {contacts.length === 0 && (
            <div className="py-32 text-center glass-card rounded-[4rem] border-dashed border-2 border-white/5">
              <Globe className="mx-auto text-white/5 mb-8 animate-pulse" size={80} />
              <h3 className="text-3xl font-black text-white opacity-20">Network Isolated</h3>
              <p className="text-white/10 font-bold uppercase tracking-widest mt-2">Zero authorized responders mapped</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
