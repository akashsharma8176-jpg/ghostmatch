import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import SwipeDeck from './SwipeDeck';
import ChatInterface from './ChatInterface';
import MatchList from './MatchList';
import Profile from './Profile';
import ConnectionsList from './ConnectionsList'; // Injects your new audit component
import AdminDashboard from './AdminDashboard';
import LegalModal from './LegalModal';
import Auth from './Auth';
import { Hexagon, MessageSquare, User, ShieldAlert, HeartHandshake } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('swipe'); 
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [needsConsent, setNeedsConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // REAL-TIME ALERTS STATE
  const [newMatchCount, setNewMatchCount] = useState(0);

  const fetchGlobalProfile = useCallback(async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setUserProfile(data);
      if (!data.accepted_terms_at) setNeedsConsent(true);
    } else {
      setUserProfile({ id: userId, username: '', avatar_url: '👻' });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchGlobalProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setView('profile');
      if (s) fetchGlobalProfile(s.user.id);
      else setUserProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchGlobalProfile]);

  // --- REAL-TIME MATCH LISTENER ---
  useEffect(() => {
    if (!session?.user?.id) return;

    const matchChannel = supabase
      .channel('realtime_matches')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'matches' 
      }, (payload) => {
        // Increment badge if the current user is involved in the new match
        if (payload.new.user_1 === session.user.id || payload.new.user_2 === session.user.id) {
          setNewMatchCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(matchChannel);
  }, [session]);

  const isAdmin = session?.user?.email === 'akash.sharma.manup8700@gmail.com';

  const openChat = (matchId) => {
    setActiveMatchId(matchId);
    setView('chat');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#FFC629]"></div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 bg-yellow-100 p-5 rounded-full border border-yellow-200">
        <Hexagon className="text-[#FFC629]" fill="currentColor" size={56} />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">hivematch</h1>
      <p className="text-gray-600 font-bold mb-6">Find your compatible Bee 🐝❤️</p>
      <Auth />
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      {needsConsent && <LegalModal userId={session.user.id} onComplete={() => setNeedsConsent(false)} />}

      <div className="w-full max-w-md flex flex-col items-center">
        {/* HEADER */}
        {['swipe', 'connections', 'matches', 'profile'].includes(view) && (
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 justify-center">
              <Hexagon className="text-[#FFC629]" fill="currentColor" size={28} />
              hivematch
            </h1>
          </div>
        )}

        {/* VIEW ROUTING */}
        {view === 'swipe' && <SwipeDeck userId={session.user.id} userProfile={userProfile} onMatchOpen={openChat} />}
        
        {/* NEW FOLDER ACTIVATION */}
        {view === 'connections' && <ConnectionsList userId={session.user.id} onSelectMatch={openChat} />}

        {view === 'matches' && <MatchList userId={session.user.id} onSelectChat={openChat} />}

        {view === 'chat' && <ChatInterface matchId={activeMatchId} currentUserId={session.user.id} onBack={() => setView('matches')} />}

        {view === 'profile' && (
          <div className="w-full flex flex-col items-center">
            <Profile userId={session.user.id} initialData={userProfile} onUpdate={() => fetchGlobalProfile(session.user.id)} />
            {isAdmin && (
              <button onClick={() => setView('admin')} className="mt-6 flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest pb-10">
                <ShieldAlert size={14} /> Open Moderation Console
              </button>
            )}
          </div>
        )}

        {view === 'admin' && isAdmin && <AdminDashboard onBack={() => setView('profile')} />}
      </div>

      {/* UPDATED GLOBAL NAVIGATION FOOTER */}
      {view !== 'chat' && view !== 'admin' && !needsConsent && (
        <nav className="fixed bottom-10 bg-white border border-gray-100 px-6 py-4 rounded-full shadow-2xl flex gap-8 text-gray-300 z-50">
          <button onClick={() => setView('swipe')} className={view === 'swipe' ? 'text-[#FFC629]' : 'hover:text-gray-400'}>
            <Hexagon size={28} fill={view === 'swipe' ? 'currentColor' : 'none'} />
          </button>

          {/* THE NEW CONNECTIONS BUTTON */}
          <div className="relative">
            <button 
              onClick={() => { setView('connections'); setNewMatchCount(0); }} 
              className={view === 'connections' ? 'text-[#FFC629]' : 'hover:text-gray-400'}
            >
              <HeartHandshake size={28} fill={view === 'connections' ? 'currentColor' : 'none'} />
            </button>
            {/* NOTIFICATION BADGE */}
            {newMatchCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce shadow-sm">
                {newMatchCount}
              </span>
            )}
          </div>

          <button onClick={() => setView('matches')} className={view === 'matches' ? 'text-[#FFC629]' : 'hover:text-gray-400'}>
            <MessageSquare size={28} fill={view === 'matches' ? 'currentColor' : 'none'} />
          </button>
          
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-[#FFC629]' : 'hover:text-gray-400'}>
            <User size={28} fill={view === 'profile' ? 'currentColor' : 'none'} />
          </button>
        </nav>
      )}
    </main>
  );
}