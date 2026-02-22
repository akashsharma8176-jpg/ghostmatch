import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Send, ChevronLeft, Flame, ShieldCheck } from 'lucide-react';

export default function Chat({ matchId, userId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // Real-time and Presence (Typing Indicator)
    const channel = supabase.channel(`chat:${matchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (p) => setMessages(prev => [...prev, p.new]))
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUsersTyping = Object.values(state).flat().filter(p => p.user_id !== userId && p.isTyping);
        setIsTyping(otherUsersTyping.length > 0);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ user_id: userId, isTyping: false });
      });

    return () => supabase.removeChannel(channel);
  }, [matchId, userId]);

  const handleTyping = async (val) => {
    setInput(val);
    const channel = supabase.channel(`chat:${matchId}`);
    await channel.track({ user_id: userId, isTyping: val.length > 0 });
  };

  const handleBurn = async () => {
    if (window.confirm("SECURITY ALERT: This will permanently delete this match and all chat history. Proceed?")) {
      await supabase.from('matches').delete().eq('id', matchId);
      onBack();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const { error } = await supabase.from('messages').insert([{ match_id: matchId, sender_id: userId, content: input }]);
    if (!error) {
      setInput('');
      const channel = supabase.channel(`chat:${matchId}`);
      await channel.track({ user_id: userId, isTyping: false });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 w-full max-w-md mx-auto font-sans shadow-2xl">
      <header className="px-2 py-4 flex items-center justify-between border-b border-gray-50 z-20">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 text-gray-400"><ChevronLeft size={28} /></button>
          <div className="flex flex-col">
            <h2 className="font-bold text-sm tracking-tight flex items-center gap-1">Secure Channel <ShieldCheck size={14} className="text-blue-500" /></h2>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Ghost Encryption Active</p>
          </div>
        </div>
        <button onClick={handleBurn} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Burn (Security Wipe)">
          <Flame size={24} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 flex flex-col bg-gray-50/30">
        {messages.map((m) => {
          const isMe = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-5 py-3 max-w-[75%] text-[14px] shadow-sm ${isMe ? 'bg-[#FFC629] text-black rounded-2xl rounded-tr-sm' : 'bg-white border border-gray-100 rounded-2xl rounded-tl-sm'}`}>
                {m.content}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-gray-200 px-4 py-2 rounded-full text-[10px] font-bold text-gray-500">GHOST IS TYPING...</div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 pb-8">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input value={input} onChange={(e) => handleTyping(e.target.value)} placeholder="Type a message..." className="flex-grow bg-gray-100 rounded-full px-5 py-3 text-sm focus:outline-none" />
          <button type="submit" className="text-[#FFC629] p-2 hover:scale-110 transition-transform"><Send size={24} fill={input.trim() ? "currentColor" : "none"} /></button>
        </form>
      </div>
    </div>
  );
}