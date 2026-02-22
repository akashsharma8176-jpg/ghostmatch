import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Mail, Lock, AlertCircle, ArrowLeft, Send, ShieldQuestion } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login', 'signup', or 'forgot'
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Messaging
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // --- ANTI-BOT SECURITY STATE ---
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaOp, setCaptchaOp] = useState('+');
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');

  // Generate a new math challenge
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10);
    const n2 = Math.floor(Math.random() * 10);
    const isAdd = Math.random() > 0.5; // 50% chance for + or -
    
    if (isAdd) {
      setCaptchaOp('+');
      setCaptchaNum1(n1);
      setCaptchaNum2(n2);
      setCaptchaAnswer(n1 + n2);
    } else {
      setCaptchaOp('-');
      // Ensure no negative answers for better UX
      setCaptchaNum1(Math.max(n1, n2));
      setCaptchaNum2(Math.min(n1, n2));
      setCaptchaAnswer(Math.max(n1, n2) - Math.min(n1, n2));
    }
    setCaptchaInput('');
  };

  // Refresh captcha when user switches to signup mode
  useEffect(() => {
    if (mode === 'signup') {
      generateCaptcha();
    }
  }, [mode]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    // --- SECURITY GATE: Verify Captcha BEFORE hitting Supabase API ---
    if (mode === 'signup') {
      if (parseInt(captchaInput, 10) !== captchaAnswer) {
        setError('Incorrect security answer. Are you a bot? Try again.');
        generateCaptcha(); // Refresh the challenge so they can't brute force it
        setIsLoading(false);
        return;
      }
    }

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Identity created successfully! Welcome to the Hive.');
        
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });
        if (error) throw error;
        setMessage('A secure recovery link has been sent to your hive email.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mt-2 font-sans">
      <form onSubmit={handleAuth} className="space-y-4 bg-white p-6 rounded-3xl shadow-lg border border-gray-100 text-left">
        
        {/* MESSAGING ALERTS */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100 animate-in fade-in zoom-in duration-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-xl text-xs font-bold border border-green-100 animate-in fade-in zoom-in duration-300">
            {message}
          </div>
        )}
        
        {/* MODE TITLE */}
        <div className="pb-2">
           <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
             {mode === 'forgot' ? 'Identity Recovery' : mode === 'login' ? 'Secure Log In' : 'Join the Hive'}
           </h2>
        </div>

        {/* EMAIL INPUT */}
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC629]/50 transition-all" 
              placeholder="ghost@hive.com"
              required 
            />
          </div>
        </div>

        {/* PASSWORD INPUT */}
        {mode !== 'forgot' && (
          <div>
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
              {mode === 'login' && (
                <button 
                  type="button" 
                  onClick={() => setMode('forgot')}
                  className="text-[9px] font-black text-[#FFC629] uppercase tracking-widest hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC629]/50 transition-all" 
                placeholder="••••••••"
                required={mode !== 'forgot'} 
                minLength={6}
              />
            </div>
          </div>
        )}

        {/* HUMAN VERIFICATION CHALLENGE (SIGNUP ONLY) */}
        {mode === 'signup' && (
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mt-4 animate-in slide-in-from-top-2 duration-300">
            <label className="text-[10px] font-black text-yellow-800 uppercase tracking-widest flex items-center gap-1 mb-2">
              <ShieldQuestion size={12} /> Security Check
            </label>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-gray-900 w-16 text-center bg-white py-2 rounded-lg border border-yellow-200 shadow-sm">
                {captchaNum1} {captchaOp} {captchaNum2}
              </span>
              <span className="font-black text-gray-400">=</span>
              <input 
                type="number" 
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC629]/50 transition-all font-bold" 
                placeholder="Answer?"
                required 
              />
            </div>
          </div>
        )}

        {/* ACTION BUTTON */}
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-[#FFC629] text-white font-black py-3.5 rounded-xl shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 mt-4 flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
          ) : (
            mode === 'forgot' ? <><Send size={18}/> SEND RECOVERY LINK</> : mode === 'login' ? 'SECURE LOG IN' : 'CREATE IDENTITY'
          )}
        </button>
      </form>

      {/* NAVIGATION FOOTER */}
      <div className="mt-8 text-center">
        {mode === 'forgot' ? (
          <button 
            onClick={() => { setMode('login'); setError(null); }}
            className="flex items-center gap-2 mx-auto text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-[#FFC629] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Login
          </button>
        ) : (
          <>
            <p className="text-sm text-gray-500 font-medium">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button 
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }}
              className="mt-2 text-[#FFC629] font-black uppercase tracking-widest text-xs hover:underline"
            >
              {mode === 'login' ? 'Sign Up for HiveMatch' : 'Log In Instead'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}