import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Save, UserCircle, Briefcase, Heart, Sparkles, CheckCircle2, Eye, ShieldCheck, X, LogOut, ShieldAlert, KeyRound } from 'lucide-react';

// Data Integrity Constraints
const INTEREST_OPTIONS = ['Fitness', 'Travel', 'Books', 'Movies', 'Gaming', 'Cooking', 'Music', 'Art', 'Outdoors'];
const AGE_RANGES = ['18-25', '25-30', '30-35', '35-40', '40+'];
const INTENTS = ['Serious Relationship', 'Casual Dating', 'Friendship'];
const MEDIA_OPTS = ['Music', 'TV Shows', 'Books', 'Podcasts', 'Movies'];
const GENDERS = ['Male', 'Female', 'Non-Binary', 'Other'];
const GENDER_PREFS = ['Men', 'Women', 'Everyone'];
const AVATAR_OPTIONS = ['👻', '👽', '🤖', '👾', '🎃', '😈', '🤠', '😎', '🤓', '🥸', '🦊', '🐱', '🐼', '🐯', '🦁', '🦉', '🦇', '🦋', '🐙', '🦖'];

export default function Profile({ userId, initialData, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [saveError, setSaveError] = useState(''); // Dedicated error state
  const [isPreview, setIsPreview] = useState(false);
  
  // PASSWORD UPDATE STATE
  const [newPassword, setNewPassword] = useState('');
  const [pwUpdating, setPwUpdating] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  
  const [profile, setProfile] = useState({
    username: '', avatar_url: '👻', gender: '', gender_preference: '', age_range: '', occupation: '',
    tagline: '', interests: [], favorite_activity: '', media_preference: '',
    relationship_intent: '', deal_breaker: '', prompt_weekend: '', prompt_two_truths: '', prompt_heart: ''
  });

  // Global Vault Sync
  useEffect(() => {
    if (initialData) {
      setProfile({ ...initialData, interests: initialData.interests || [] });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const toggleInterest = (interest) => {
    const current = profile.interests || [];
    const updated = current.includes(interest) 
      ? current.filter(i => i !== interest)
      : [...current, interest];
    setProfile({ ...profile, interests: updated });
  };

  // 🛡️ THE FIX: Secure UPSERT satisfying the email constraint
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setSaveError('');
    
    // 1. Securely retrieve the active session's email
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Build the strict payload matching the schema
    const payload = {
        id: userId,
        email: user?.email, // Fixes the NOT NULL database rejection
        username: profile.username || null,
        avatar_url: profile.avatar_url || '👻',
        gender: profile.gender || null,
        gender_preference: profile.gender_preference || null,
        age_range: profile.age_range || null,
        occupation: profile.occupation || null,
        tagline: profile.tagline || null,
        interests: profile.interests || [],
        favorite_activity: profile.favorite_activity || null,
        media_preference: profile.media_preference || null,
        relationship_intent: profile.relationship_intent || null,
        deal_breaker: profile.deal_breaker || null,
        prompt_weekend: profile.prompt_weekend || null,
        prompt_two_truths: profile.prompt_two_truths || null,
        prompt_heart: profile.prompt_heart || null,
        updated_at: new Date()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .single();
    
    if (!error) {
      if (data) setProfile(data); // Lock data in UI
      setSuccessMsg('Identity synchronized securely.');
      if (onUpdate) onUpdate(); // Refresh the master vault in App.jsx
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      console.error("Database Save Error:", error);
      setSaveError(`Database Rejection: ${error.message}`); 
    }
    setSaving(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwUpdating(true);
    setPwMessage('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMessage(`Error: ${error.message}`);
    } else {
      setPwMessage('Password updated successfully.');
      setNewPassword('');
    }
    setPwUpdating(false);
    setTimeout(() => setPwMessage(''), 3000);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout Audit Failure:", error.message);
  };

  // --- PUBLIC PROFILE PREVIEW MODE ---
  if (isPreview) {
    return (
      <div className="w-full max-w-md h-[80vh] bg-white rounded-[2.5rem] shadow-2xl overflow-y-auto p-8 text-left animate-in zoom-in-95 duration-300 scrollbar-hide">
        <button onClick={() => setIsPreview(false)} className="mb-6 bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="text-7xl bg-yellow-50 p-4 rounded-[2rem] border border-yellow-100 shadow-inner">
            {profile.avatar_url}
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-2">
              {profile.username || 'Ghost'} <ShieldCheck className="text-blue-500" size={24} />
            </h2>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
              {profile.occupation || 'Active Bee'} • {profile.age_range || '??'}
            </p>
          </div>
        </div>

        <p className="text-lg font-medium italic text-gray-700 mb-8 border-l-4 border-[#FFC629] pl-4">
          "{profile.tagline || 'Searching for a compatible connection...'}"
        </p>

        <div className="space-y-6">
          {profile.prompt_weekend && (
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">My weekend usually looks like...</h4>
              <p className="text-sm font-bold text-gray-800">{profile.prompt_weekend}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {profile.interests.map(i => (
              <span key={i} className="px-3 py-1 bg-[#FFC629]/10 text-[#FFC629] rounded-full text-[10px] font-black uppercase tracking-wider">
                {i}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-6 border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intent</p>
              <p className="text-sm font-bold text-gray-800">{profile.relationship_intent || 'Undisclosed'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deal Breaker</p>
              <p className="text-sm font-bold text-red-500">{profile.deal_breaker || 'None'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD EDIT MODE ---
  return (
    <div className="w-full max-w-md h-[80vh] overflow-y-auto bg-gray-50 pb-32 font-sans rounded-[2rem] shadow-inner scrollbar-hide">
      
      <div className="bg-white p-6 shadow-sm rounded-b-[2rem] mb-6 border-b border-gray-100 text-left">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <UserCircle className="text-[#FFC629]" /> Edit Identity
        </h2>
        <button onClick={() => setIsPreview(true)} className="mt-2 flex items-center gap-2 text-[#FFC629] text-[10px] font-black uppercase tracking-widest hover:underline">
          <Eye size={14}/> What does my public profile look like?
        </button>
      </div>

      <div className="px-4 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2 text-left">
              <Briefcase size={18} className="text-blue-500"/> Essentials
            </h3>
            <div className="space-y-4 text-left">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Anonymous Name</label>
                  <input type="text" name="username" value={profile.username || ''} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none" required />
                </div>
                <div className="w-24">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Avatar</label>
                  <select name="avatar_url" value={profile.avatar_url} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-2.5 text-center text-xl focus:outline-none cursor-pointer">
                    {AVATAR_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">I am a</label>
                  <select name="gender" value={profile.gender || ''} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" required>
                    <option value="">Select...</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Looking For</label>
                  <select name="gender_preference" value={profile.gender_preference || ''} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" required>
                    <option value="">Select...</option>
                    {GENDER_PREFS.map(gp => <option key={gp} value={gp}>{gp}</option>)}
                  </select>
                </div>
              </div>
              
              <input type="text" name="tagline" value={profile.tagline || ''} onChange={handleChange} placeholder="One-line tagline (e.g. Coffee lover & night owl)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 text-left">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
              <Sparkles size={18} className="text-purple-500"/> Personality
            </h3>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(interest => (
                  <button type="button" key={interest} onClick={() => toggleInterest(interest)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${profile.interests?.includes(interest) ? 'bg-[#FFC629] text-white shadow-md' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                    {interest}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Favorite Activity</label>
                  <input type="text" name="favorite_activity" value={profile.favorite_activity || ''} onChange={handleChange} placeholder="Hiking, gaming..." className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Media Choice</label>
                  <select name="media_preference" value={profile.media_preference || ''} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                    <option value="">Pick one...</option>
                    {MEDIA_OPTS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 text-left">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
              <Heart size={18} className="text-red-500"/> Relationship Intent
            </h3>
            <div className="space-y-4">
              <select name="relationship_intent" value={profile.relationship_intent || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none">
                <option value="">What are you looking for?</option>
                {INTENTS.map(intent => <option key={intent} value={intent}>{intent}</option>)}
              </select>
              <input type="text" name="deal_breaker" value={profile.deal_breaker || ''} onChange={handleChange} placeholder="Deal-breaker (e.g. smoker, cat hater)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 text-left">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
              <ShieldCheck size={18} className="text-green-500"/> Engagement Prompts
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">My weekend usually looks like...</label>
                <textarea name="prompt_weekend" value={profile.prompt_weekend || ''} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm h-20 resize-none focus:outline-none" placeholder="Be descriptive!" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Two truths and a lie...</label>
                <textarea name="prompt_two_truths" value={profile.prompt_two_truths || ''} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm h-20 resize-none focus:outline-none" placeholder="Make them guess..." />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quickest way to my heart is...</label>
                <input type="text" name="prompt_heart" value={profile.prompt_heart || ''} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none" placeholder="e.g. Tacos and vintage vinyl" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            {successMsg && (
              <div className="mb-4 text-sm font-bold text-green-600 flex items-center justify-center gap-1 bg-green-50 p-3 rounded-xl border border-green-100 animate-in fade-in duration-300">
                <CheckCircle2 size={16}/> {successMsg}
              </div>
            )}
            {saveError && (
              <div className="mb-4 text-sm font-bold text-red-600 flex items-center justify-center gap-1 bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in duration-300">
                <ShieldAlert size={16}/> {saveError}
              </div>
            )}
            <button type="submit" disabled={saving} className="w-full bg-[#FFC629] text-white font-black py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {saving ? 'SYNCING DATA...' : <><Save size={20} /> SAVE IDENTITY</>}
            </button>
          </div>
        </form>

        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 text-left">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
            <KeyRound size={18} className="text-[#FFC629]"/> Security Settings
          </h3>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={pwUpdating}
              className="w-full bg-gray-900 text-white font-black py-3 rounded-xl shadow-md text-xs tracking-widest disabled:opacity-70"
            >
              {pwUpdating ? 'UPDATING...' : 'CONFIRM NEW PASSWORD'}
            </button>
            {pwMessage && (
              <p className={`text-center text-[10px] font-bold uppercase mt-2 ${pwMessage.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                {pwMessage}
              </p>
            )}
          </form>
        </div>

        <div className="bg-red-50 p-5 rounded-[1.5rem] border border-red-100 text-left mb-12">
          <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2 border-b border-red-200 pb-2">
            <ShieldAlert size={18} className="text-red-500"/> Session Security
          </h3>
          <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-4">Terminate your current ghost session below.</p>
          <button 
            type="button" 
            onClick={handleLogout}
            className="w-full bg-white text-red-600 font-black py-3 rounded-xl border border-red-200 shadow-sm hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> LOGOUT FROM HIVE
          </button>
        </div>
      </div>
    </div>
  );
}