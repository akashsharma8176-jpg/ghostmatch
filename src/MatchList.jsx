import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Search, ShieldCheck } from 'lucide-react';

export default function MatchList({ userId, onSelectChat }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      // 1. Audit the matches table for records involving the current user
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          user_1,
          user_2,
          profiles_1:profiles!matches_user_1_fkey(id, username, avatar_url),
          profiles_2:profiles!matches_user_2_fkey(id, username, avatar_url)
        `)
        .or(`user_1.eq.${userId},user_2.eq.${userId}`);

      if (!error && data) {
        // 2. Identify and isolate the 'Peer Node' (the other user)
        const formatted = data.map(m => {
          const otherProfile = m.user_1 === userId ? m.profiles_2 : m.profiles_1;
          return { matchId: m.id, ...otherProfile };
        });
        setMatches(formatted);
      }
      setLoading(false);
    };
    fetchMatches();
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-gray-400">Verifying secure connections...</div>;

  return (
    <div className="w-full max-w-md bg-white min-h-[70vh] rounded-[2.5rem] p-6 shadow-xl border border-gray-100">
      <h2 className="text-2xl font-black text-gray-900 mb-6 px-2">Conversations</h2>
      
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-gray-300" size={18} />
        <input 
          placeholder="Search matches..." 
          className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 text-sm focus:ring-2 focus:ring-[#FFC629]/50"
        />
      </div>

      <div className="space-y-4">
        {matches.length === 0 ? (
          <p className="text-center text-gray-400 mt-10 font-medium">No active connections found.</p>
        ) : (
          matches.map((match) => (
            <button 
              key={match.matchId}
              onClick={() => onSelectChat(match.matchId)}
              className="w-full flex items-center gap-4 p-3 hover:bg-yellow-50/50 rounded-3xl transition-all group border border-transparent hover:border-yellow-100"
            >
              <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center text-2xl border border-yellow-100 shadow-sm">
                {match.avatar_url || '👻'}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  {match.username}
                  <ShieldCheck size={14} className="text-blue-500" />
                </h4>
                <p className="text-xs text-gray-400 font-medium">Tap to manifest a message...</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}