import { useState } from 'react';
import { supabase } from './supabaseClient';
import { PrivacyPolicy, TermsAndConditions } from './LegalDocs';
import { ShieldCheck } from 'lucide-react';

export default function LegalModal({ userId, onComplete }) {
  const [step, setStep] = useState('terms'); // 'terms' or 'privacy'

  const handleAccept = async () => {
    const { error } = await supabase.from('profiles')
      .update({ accepted_terms_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (!error) onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="text-[#FFC629]" size={32} />
        <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
          {step === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
        </h2>
      </div>

      <div className="flex-1 bg-gray-50 p-6 rounded-[2rem] border border-gray-100 mb-6">
        {step === 'terms' ? <TermsAndConditions /> : <PrivacyPolicy />}
      </div>

      <div className="space-y-3">
        {step === 'terms' ? (
          <button onClick={() => setStep('privacy')} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg">
            Continue to Privacy Policy
          </button>
        ) : (
          <button onClick={handleAccept} className="w-full bg-[#FFC629] text-white font-black py-4 rounded-2xl shadow-lg">
            I ACCEPT ALL TERMS & PROCEED
          </button>
        )}
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          By clicking accept, you indemnify HiveMatch against all fraud claims.
        </p>
      </div>
    </div>
  );
}