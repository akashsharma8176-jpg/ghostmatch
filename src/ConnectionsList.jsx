import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { HeartHandshake, Clock, MessageSquare, ShieldCheck, Hexagon } from 'lucide-react';

export default function ConnectionsList({ userId, onSelectMatch }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectionsAudit();
  }, [userId]);

  const fetchConnectionsAudit = async () => {
    setLoading(true);
    try {
      // 1. AUDIT TRAIL: Fetch all profiles you swiped right on
      const { data: mySwipes, error: swipeError } = await supabase
        .from('swipes')
        .select('swiped_user_id, created_at')
        .eq('user_id', userId)
        .eq('direction', 'right')
        .order('created_at', { ascending: false });

      if (swipeError) throw swipeError;
      
      if (!mySwipes || mySwipes.length === 0) {
        setConnections([]);
        return;
      }

      const swipedIds = mySwipes.map(s => s.swiped_user_id);

      // 2. IDENTITY FETCH: Get profile details for those specific users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, tagline, occupation')
        .in('id', swipedIds);

      if (profileError) throw profileError;

      // 3. VERIFICATION: Check which of these are mutual matches
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id, user_1, user_2')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`);

      if (matchError) throw matchError;

      // 4. DATA RECONCILIATION: Combine the data streams
      const combinedData = mySwipes.map(swipe => {
        const profileInfo = profiles.find(p => p.id === swipe.swiped_user_id);
        if (!profileInfo) return null;

        // Check if a mutual match exists
        const mutualMatch = matches.find(m => m.user_1 === profileInfo.id || m.user_2 === profileInfo.id);

        return {
          ...profileInfo,
          swipeDate: new Date(swipe.created_at),
          isMutual: !!mutualMatch,
          matchId: mutualMatch ? mutualMatch.id : null
        };
      }).filter(Boolean); // Remove nulls

      setConnections(combinedData);
    } catch (error) {
      console.error("Connections Audit Failure:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#FFC629]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md h-[80vh] overflow-y-auto bg-gray-50 pb-32 font-sans rounded-[2rem] shadow-inner scrollbar-hide">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 shadow-sm rounded-b-[2rem] mb-6 border-b border-gray-100 text-left sticky top-0 z-10">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <HeartHandshake className="text-[#FFC629]" size={28} /> Connections
        </h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
          Audit Log of Outgoing Likes & Mutual Matches
        </p>
      </div>

      <div className="px-4 space-y-4">
        {connections.length === 0 ? (
          <div className="text-center py-12 px-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <Hexagon size={40} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-gray-900 mb-1">No Connections Yet</h3>
            <p className="text-xs text-gray-500 font-bold">Profiles you swipe right on will appear here in your audit log.</p>
          </div>
        ) : (
          connections.map((conn) => (
            <div key={conn.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:border-[#FFC629]/50">
              
              {/* AVATAR */}
              <div className="w-16 h-16 bg-yellow-50 rounded-[1.2rem] flex items-center justify-center text-3xl border border-yellow-100 shrink-0">
                {conn.avatar_url}
              </div>
              
              {/* DETAILS */}
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-1 truncate">
                  {conn.username} <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">
                  {conn.occupation || 'Active Bee'}
                </p>
                
                {/* STATUS BADGE */}
                <div className="mt-2">
                  {conn.isMutual ? (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 border border-green-200 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                      <HeartHandshake size={10} /> Mutual Match
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 border border-gray-200 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                      <Clock size={10} /> Pending Response
                    </span>
                  )}
                </div>
              </div>

              {/* ACTION BUTTON */}
              {conn.isMutual && (
                <button 
                  onClick={() => onSelectMatch(conn.matchId)}
                  className="w-12 h-12 bg-[#FFC629] text-white rounded-2xl flex items-center justify-center shadow-md hover:scale-105 transition-transform shrink-0"
                  aria-label="Open Chat"
                >
                  <MessageSquare size={20} fill="currentColor" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
