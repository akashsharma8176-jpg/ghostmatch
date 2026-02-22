import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { ArrowLeft, SendHorizontal, ShieldAlert, X } from 'lucide-react';

export default function ChatInterface({ matchId, currentUserId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [matchedUser, setMatchedUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Incident Reporting States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatData = async () => {
      setLoading(true);
      try {
        const { data: matchData } = await supabase.from('matches').select('*').eq('id', matchId).single();

        if (matchData) {
          const targetUserId = matchData.user_1 === currentUserId ? matchData.user_2 : matchData.user_1;
          
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
          setMatchedUser(profileData);

          const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', currentUserId).single();
          setCurrentUserProfile(myProfile);
        }

        const { data: messageHistory, error } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });
          
        if (!error && messageHistory) {
          setMessages(messageHistory);
        }
      } catch (err) {
        console.error("Connection error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [matchId, currentUserId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messagePayload = {
      match_id: matchId,
      sender_id: currentUserId,
      content: newMessage.trim(),
    };

    setMessages(prev => [...prev, { ...messagePayload, id: Date.now(), created_at: new Date().toISOString() }]);
    setNewMessage('');

    await supabase.from('messages').insert([messagePayload]);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) return;
    setIsSubmittingReport(true);

    try {
      // 1. Log the incident
      await supabase.from('incident_reports').insert([{
        reporter_id: currentUserId,
        reported_user_id: matchedUser.id,
        match_id: matchId,
        reason: reportReason
      }]);

      // 2. Terminate the connection (Delete the match to block future contact)
      await supabase.from('matches').delete().eq('id', matchId);

      // 3. Return to safety
      onBack();
    } catch (error) {
      console.error("Failed to log incident:", error.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (loading || !matchedUser) {
    return <div className="w-full min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#6f6b97]"></div></div>;
  }

  return (
    <div className="w-full h-screen max-h-[85vh] max-w-md mx-auto bg-white flex flex-col shadow-2xl overflow-hidden font-sans sm:border sm:border-gray-200 sm:rounded-[2rem] relative">
      
      {/* INCIDENT REPORTING OVERLAY */}
      {showReportModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-red-600 flex items-center gap-2">
                <ShieldAlert size={20} /> Report & Block
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-800">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 font-medium leading-relaxed">
              If {matchedUser.username} is harassing you or violating platform guidelines, describe the behavior below. <strong className="text-gray-900">This will permanently delete the match and send a secure log to moderation.</strong>
            </p>

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Provide details about the incident..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none h-24 mb-4"
            />

            <button
              onClick={handleSubmitReport}
              disabled={!reportReason.trim() || isSubmittingReport}
              className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 transition-all hover:bg-red-700"
            >
              {isSubmittingReport ? 'LOGGING INCIDENT...' : 'SUBMIT REPORT & SEVER CONNECTION'}
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-white shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-900 text-lg tracking-tight">
              {matchedUser.username}
            </h2>
          </div>
        </div>
        
        {/* REPORT THREAT BUTTON */}
        <button 
          onClick={() => setShowReportModal(true)} 
          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
          title="Report User"
        >
          <ShieldAlert size={22} />
        </button>
      </div>

      {/* MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto p-4 bg-white flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 text-sm">Send a message to start chatting.</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const avatar = isMe ? (currentUserProfile?.avatar_url || '👤') : (matchedUser?.avatar_url || '👻');
            
            return (
              <div key={msg.id} className={`flex w-full gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg shadow-sm border border-gray-200 overflow-hidden">
                    {avatar}
                  </div>
                )}
                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`px-5 py-3 text-[14px] leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-[#6f6b97] text-white rounded-[1.5rem] rounded-tr-sm' 
                        : 'bg-[#f4f4f8] text-gray-800 rounded-[1.5rem] rounded-tl-sm' 
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                {isMe && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg shadow-sm border border-gray-200 overflow-hidden">
                    {avatar}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white shrink-0 border-t border-gray-50">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message"
              className="w-full bg-[#f4f4f8] border-none rounded-full px-5 py-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-10 h-10 text-[#6f6b97] flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105"
          >
            <SendHorizontal size={24} strokeWidth={2} />
          </button>
        </form>
      </div>

    </div>
  );
}