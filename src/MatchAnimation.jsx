import { MessageCircle, FastForward } from 'lucide-react';

export default function MatchAnimation({ user2, onChat, onKeepSwiping }) {
  return (
    <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 rounded-[2.5rem] text-center border-4 border-[#FFC629] shadow-2xl animate-in zoom-in-95 duration-300">
      
      <div className="flex items-center justify-center gap-4 mb-6">
        <span className="text-6xl drop-shadow-md">👻</span>
        <span className="text-4xl font-black text-gray-300">+</span>
        <span className="text-6xl drop-shadow-md">{user2.avatar || '👻'}</span>
      </div>
      
      <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
        ITS A HAUNTING!
      </h2>
      
      <p className="text-gray-500 font-medium mb-10 leading-relaxed">
        You and <span className="text-[#FFC629] font-black">{user2.username}</span> have manifested a connection.
      </p>

      {/* The Two Navigation Choices */}
      <div className="flex flex-col gap-4 w-full">
        <button 
          onClick={onChat}
          className="w-full bg-[#FFC629] text-white font-black py-4 rounded-2xl shadow-lg shadow-yellow-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle size={22} fill="currentColor" />
          SEND A MESSAGE
        </button>
        
        <button 
          onClick={onKeepSwiping}
          className="w-full bg-gray-50 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <FastForward size={20} />
          KEEP SWIPING
        </button>
      </div>

    </div>
  );
}