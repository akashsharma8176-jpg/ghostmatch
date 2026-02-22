import { X } from 'lucide-react';

export const PrivacyPolicy = () => (
  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
    <h3 className="font-black text-gray-900 uppercase">1. Data Collection</h3>
    <p>HiveMatch collects identity data (username, age, interests) to facilitate ghost matches. Your data is stored securely via Supabase encryption.</p>
    <h3 className="font-black text-gray-900 uppercase">2. Security Audit</h3>
    <p>We log reported incidents of harassment to maintain a safe environment. Banned users have their data scrubbed from the active feed.</p>
  </div>
);

export const TermsAndConditions = () => (
  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
    <h3 className="font-black text-gray-900 uppercase">1. User Responsibility</h3>
    <p>Users are responsible for their own interactions. HiveMatch is an anonymous platform; identity verification is self-reported.</p>
    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
      <h3 className="font-black text-red-700 uppercase">🚨 2. NO LIABILITY FOR FRAUD</h3>
      <p className="text-red-600 font-bold">The HiveMatch creator, team, and affiliates are NOT responsible for any financial loss, emotional distress, or fraud perpetrated by users on this platform. Users interact at their own risk.</p>
    </div>
    <h3 className="font-black text-gray-900 uppercase">3. Conduct</h3>
    <p>Harassment or malicious behavior will result in an immediate and permanent ban from the Hive.</p>
  </div>
);