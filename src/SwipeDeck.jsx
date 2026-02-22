import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { X, Heart, ShieldCheck, Hexagon, RotateCcw, ChevronDown, Sparkles, HeartHandshake, AlertTriangle } from 'lucide-react';
import MatchAnimation from './MatchAnimation';

export default function SwipeDeck({ userId, userProfile, onMatchOpen }) {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDossier, setShowDossier] = useState(false);

  // FETCH DISCOVERY FEED
  useEffect(() => {
    // Audit Check: Wait until the global vault provides the user's preferences
    if (userProfile) {
      fetchAvailableProfiles();
    }
  }, [userId, userProfile]);

  const fetchAvailableProfiles = async () => {
    setLoading(true);
    try {
      // 1. Security Check: Banned users cannot access the discovery feed
      if (userProfile?.is_banned) {
        setProfiles([]);
        return;
      }

      // 2. Fetch Exclusion List: Users you've already interacted with
      const { data: mySwipes } = await supabase.from('swipes').select('swiped_user_id').eq('user_id', userId);
      const swipedIds = mySwipes?.map(s => s.swiped_user_id) || [];

      // 3. STRICT PREFERENCE FILTER LOGIC
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', userId) // Don't show yourself
        .eq('is_banned', false); // Don't show banned users
      
      const pref = userProfile?.gender_preference;
      
      // Route matching based on exact database strings
      if (pref === 'Men') {
        query = query.eq('gender', 'Male');
      } else if (pref === 'Women') {
        query = query.eq('gender', 'Female');
      } 
      // If 'Everyone', it skips the gender filter and pulls all valid users

      // Filter out previously swiped users
      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }

      const { data, error } = await query;
      
      if (!error) {
        setProfiles(data || []);
        setCurrentIndex(0); 
      } else {
        console.error("Discovery Audit Failure:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile || showMatch) return;

    setShowDossier(false); // Close dossier for the next ghost

    try {
      // Record the interaction
      const { error: swipeError } = await supabase.from('swipes').upsert([
        { user_id: userId, swiped_user_id: currentProfile.id, direction }
      ], { onConflict: 'user_id, swiped_user_id' });

      if (swipeError) throw swipeError;

      // Check for mutual match if swiped right
      if (direction === 'right') {
        const { data: mutual } = await supabase.from('swipes').select('*')
          .eq('user_id', currentProfile.id)
          .eq('swiped_user_id', userId)
          .eq('direction', 'right')
          .maybeSingle(); 

        if (mutual) {
          const { data: existing } = await supabase.from('matches').select('id')
            .or(`and(user_1.eq.${userId},user_2.eq.${currentProfile.id}),and(user_1.eq.${currentProfile.id},user_2.eq.${userId})`)
            .maybeSingle();

          let matchId = existing?.id;

          if (!matchId) {
            const { data: newM, error: mErr } = await supabase.from('matches').insert([{ user_1: userId, user_2: currentProfile.id }]).select().single();
            if (!mErr) matchId = newM.id;
          }

          if (matchId) {
            setShowMatch({ ...currentProfile, matchId });
            return; 
          }
        }
      }
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error("Interaction record failure:", err.message);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRewind = async () => {
    if (currentIndex === 0) return;
    setShowDossier(false);
    const prevIndex = currentIndex - 1;
    const target = profiles[prevIndex];

    await supabase.from('swipes').delete().eq('user_id', userId).eq('swiped_user_id', target.id);
    await supabase.from('matches').delete().or(`and(user_1.eq.${userId},user_2.eq.${target.id}),and(user_1.eq.${target.id},user_2.eq.${userId})`);
    setCurrentIndex(prevIndex);
  };

  if (loading || !userProfile) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#FFC629]"></div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-10 pb-24">
        <Hexagon size={48} className="text-[#FFC629] mb-4" fill="currentColor" />
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Empty Hive</h2>
        <p className="text-gray-500 mt-2 text-sm font-medium">No active profiles match your strict filters.</p>
        <button onClick={fetchAvailableProfiles} className="mt-6 text-[#FFC629] font-bold uppercase tracking-widest text-xs hover:underline">
          Rescan Sector
        </button>
      </div>
    );
  }

  const profile = profiles[currentIndex];

  return (
    <div className="w-full flex flex-col items-center max-w-sm pb-24 relative">
      
      {showMatch && (
        <MatchAnimation 
          user2={{ avatar: profile.avatar_url, username: profile.username }} 
          onChat={() => {
            const mId = showMatch.matchId;
            setShowMatch(null);
            setCurrentIndex(prev => prev + 1);
            onMatchOpen(mId); 
          }} 
          onKeepSwiping={() => {
            setShowMatch(null);
            setCurrentIndex(prev => prev + 1);
          }}
        />
      )}

      <div className="w-full h-[65vh] bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col relative border border-gray-100">
        
        {/* --- FULL DOSSIER OVERLAY --- */}
        {showDossier ? (
          <div className="absolute inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom-8 duration-300 scrollbar-hide">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md p-6 border-b border-gray-100 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-2">
                  {profile.username || 'Ghost'} <ShieldCheck size={20} className="text-blue-500" />
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Full Identity Dossier</p>
              </div>
              <button onClick={() => setShowDossier(false)} className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
                <ChevronDown size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8 pb-10">
              
              {/* Profile Header */}
              <div className="flex gap-4 border-b border-gray-100 pb-6">
                <div className="w-24 h-24 bg-yellow-50 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner border border-yellow-100 shrink-0">
                  {profile.avatar_url || '👻'}
                </div>
                <div className="flex flex-col justify-center space-y-1 text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Age Range</p>
                  <p className="text-sm font-bold text-gray-900 mb-2">{profile.age_range || 'Unknown'}</p>
                  
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Occupation</p>
                  <p className="text-sm font-bold text-gray-900">{profile.occupation || 'Undisclosed'}</p>
                </div>
              </div>

              {/* Tagline */}
              {profile.tagline && (
                <p className="text-lg font-medium italic text-gray-700 border-l-4 border-[#FFC629] pl-4">
                  "{profile.tagline}"
                </p>
              )}

              {/* Relationship Intent & Deal Breakers */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-[10px] flex items-center gap-1 font-black text-gray-400 uppercase tracking-widest mb-1"><HeartHandshake size={12}/> Intent</p>
                  <p className="text-sm font-bold text-gray-800">{profile.relationship_intent || 'Exploring'}</p>
                </div>
                <div>
                  <p className="text-[10px] flex items-center gap-1 font-black text-gray-400 uppercase tracking-widest mb-1"><AlertTriangle size={12}/> Deal Breaker</p>
                  <p className="text-sm font-bold text-red-500">{profile.deal_breaker || 'None'}</p>
                </div>
              </div>

              {/* Interests & Hobbies */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Sparkles size={12}/> Interests & Media</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.interests.map((interest, i) => (
                      <span key={i} className="bg-[#FFC629]/10 text-[#FFC629] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-4">
                    {profile.favorite_activity && (
                       <div className="flex-1">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Activity</p>
                         <p className="text-xs font-bold text-gray-800">{profile.favorite_activity}</p>
                       </div>
                    )}
                    {profile.media_preference && (
                       <div className="flex-1">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Media Choice</p>
                         <p className="text-xs font-bold text-gray-800">{profile.media_preference}</p>
                       </div>
                    )}
                  </div>
                </div>
              )}

              {/* Engaging Prompts */}
              <div className="space-y-4 text-left">
                {profile.prompt_weekend && (
                  <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100">
                    <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">My weekend usually looks like...</h4>
                    <p className="text-sm text-gray-800 font-bold leading-relaxed">{profile.prompt_weekend}</p>
                  </div>
                )}
                
                {profile.prompt_two_truths && (
                  <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Two truths and a lie...</h4>
                    <p className="text-sm text-gray-800 font-bold leading-relaxed">{profile.prompt_two_truths}</p>
                  </div>
                )}

                {profile.prompt_heart && (
                  <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">The quickest way to my heart...</h4>
                    <p className="text-sm text-gray-800 font-bold leading-relaxed">{profile.prompt_heart}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          
          /* --- QUICK CARD VIEW --- */
          <>
            <div className="h-[65%] w-full bg-yellow-50 flex items-center justify-center relative">
              <span className="text-[9rem] drop-shadow-2xl">{profile.avatar_url || '👻'}</span>
              
              <div className="absolute top-6 left-6 bg-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-gray-100 shadow-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active Hive
              </div>
              
              {profile.age_range && (
                <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100">
                  {profile.age_range}
                </div>
              )}
            </div>
            
            <div className="p-8 h-[35%] bg-white flex flex-col text-left">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter truncate">{profile.username || 'Ghost'}</h2>
                <ShieldCheck size={24} className="text-blue-500 shrink-0" />
              </div>
              
              <p className="text-gray-500 font-bold text-sm line-clamp-2">
                {profile.tagline || "Searching for an encrypted connection."}
              </p>
              
              <div className="mt-auto pt-4 text-center border-t border-gray-50">
                 <button onClick={() => setShowDossier(true)} className="text-[#FFC629] text-xs font-black uppercase tracking-widest py-2 w-full hover:underline">
                   Inspect Full Dossier
                 </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* SWIPE CONTROLS */}
      <div className="flex justify-center items-center gap-6 mt-8 w-full z-10">
        <button onClick={handleRewind} disabled={currentIndex === 0} className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md text-[#FFC629] disabled:opacity-30 transition-transform hover:scale-110">
          <RotateCcw size={22} strokeWidth={3} />
        </button>
        <button onClick={() => handleSwipe('left')} className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-xl text-gray-300 hover:text-red-400 transition-transform hover:scale-110">
          <X size={32} strokeWidth={3} />
        </button>
        <button onClick={() => handleSwipe('right')} className="w-16 h-16 bg-[#FFC629] rounded-full flex items-center justify-center shadow-lg text-white transition-transform hover:scale-110">
          <Heart size={32} fill="currentColor" />
        </button>
      </div>

    </div>
  );
}