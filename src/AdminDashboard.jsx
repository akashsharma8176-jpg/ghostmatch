import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { ShieldAlert, Trash2, UserX, CheckCircle, Search } from 'lucide-react';

export default function AdminDashboard({ onBack }) {
  const [reports, setReports] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [targetProfile, setTargetProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('incident_reports')
      .select('*, reporter:profiles!incident_reports_reporter_id_fkey(username), reported:profiles!incident_reports_reported_user_id_fkey(username)')
      .order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  const lookupUser = async () => {
    if (!searchId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', searchId).single();
    setTargetProfile(data);
  };

  const handleBanUser = async (userId) => {
    const confirmBan = window.confirm("PERMANENT BAN: Are you sure you want to terminate this user's access?");
    if (!confirmBan) return;

    // 1. Mark profile as banned
    await supabase.from('profiles').update({ is_banned: true }).eq('id', userId);
    
    // 2. Clear their swipes and matches to scrub them from the Hive
    await supabase.from('matches').delete().or(`user_1.eq.${userId},user_2.eq.${userId}`);
    
    alert("User permanently banned and purged from the Hive.");
    if (targetProfile?.id === userId) lookupUser(); // Refresh view
    fetchReports();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <ShieldAlert className="text-red-600" size={32} /> Central Moderation Console
        </h1>
        <button onClick={onBack} className="text-sm font-bold text-gray-500 hover:text-gray-900">Exit Console</button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* LEFT: Incident Feed */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Recent Incident Logs</h2>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {reports.map(report => (
              <div key={report.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-red-500">REPORTED: {report.reported?.username}</span>
                  <span className="text-gray-400">{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 italic mb-2">"{report.reason}"</p>
                <code className="text-[10px] bg-white p-1 rounded block truncate text-gray-400">ID: {report.reported_user_id}</code>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: User Enforcement Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-red-50">
            <h2 className="font-bold text-gray-900 mb-4">Manual Identity Audit</h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Paste User ID from email..." 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <button onClick={lookupUser} className="bg-gray-900 text-white p-2 rounded-xl">
                <Search size={20} />
              </button>
            </div>

            {targetProfile && (
              <div className="mt-6 p-4 border border-gray-100 rounded-2xl bg-white">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{targetProfile.avatar_url}</span>
                  <div>
                    <h3 className="font-bold text-lg">{targetProfile.username}</h3>
                    <p className="text-xs text-gray-400">Status: {targetProfile.is_banned ? '🔴 BANNED' : '🟢 ACTIVE'}</p>
                  </div>
                </div>
                {!targetProfile.is_banned ? (
                  <button 
                    onClick={() => handleBanUser(targetProfile.id)}
                    className="w-full bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700"
                  >
                    <UserX size={18} /> PERMANENT BAN
                  </button>
                ) : (
                  <div className="text-center py-2 text-red-600 font-bold text-sm uppercase">Access Terminated</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}