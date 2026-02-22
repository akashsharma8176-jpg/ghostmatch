import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function ProfileSetup({ userId, onComplete }) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Fetch your actual email from the secure session
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("No authenticated user session found.");

      // 2. Perform the Upsert (Update or Insert)
      // This includes the 'email' field to satisfy the database constraint
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          username: username, 
          bio: bio, 
          avatar_url: '👻', 
          email: user.email // THIS FIXES THE 'NULL EMAIL' ERROR
        });

      if (error) throw error;

      // 3. Move to the Swipe Deck
      onComplete();
    } catch (error) {
      console.error("Setup error:", error.message);
      alert("Audit Alert: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl">
        <h2 className="text-3xl font-black mb-2 text-purple-500 uppercase tracking-tighter text-center">
          Manifest Your Ghost
        </h2>
        <p className="text-gray-400 text-center text-sm mb-8 font-medium">Every ghost needs a name and a haunt.</p>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-gray-500 ml-1">Ghostly Username</label>
            <input 
              placeholder="e.g. NeonPhantom" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-900 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500 transition-all"
              required 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-gray-500 ml-1">Haunting Bio</label>
            <textarea 
              placeholder="Tell us about your vibes..." 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 bg-gray-900 rounded-lg border border-gray-700 h-32 focus:outline-none focus:border-purple-500 transition-all resize-none"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 p-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Manifesting...' : 'Start Matching'}
          </button>
        </form>
      </div>
    </div>
  );
}