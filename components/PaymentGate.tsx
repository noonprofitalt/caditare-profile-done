import React, { useState } from 'react';
import { ShieldAlert, CreditCard, CheckCircle, Copy, AlertTriangle, ArrowRight, Activity, Zap } from 'lucide-react';

/**
 * PaymentGate — Temporary service hold screen.
 * Matches Suhara ERP CORE design system.
 */

const PAYMENT_HOLD_ACTIVE = true; // SYSTEM IS HARD-LOCKED // import.meta.env.VITE_PAYMENT_HOLD !== 'false';

const BANK_INFO = {
  accountHolder: 'R. T. N. Gunathilaka',
  bank: 'Sampath Bank PLC',
  branch: 'Kurunegala Super Branch',
  accountNumber: '100652887589',
  currency: 'LKR',
};

const ADMIN_PHONE = '+94 71 515 1578';

const PaymentGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [copied, setCopied] = useState(false);

  if (!PAYMENT_HOLD_ACTIVE) {
    return <>{children}</>;
  }

  const handleCopy = () => {
    const details = [
      `Suhara ERP CORE - License Payment`,
      `Outstanding Amount: LKR 375,000.00`,
      ``,
      `Account Holder: ${BANK_INFO.accountHolder}`,
      `Bank: ${BANK_INFO.bank}`,
      `Branch: ${BANK_INFO.branch}`,
      `Account Number: ${BANK_INFO.accountNumber}`,
      `Currency: ${BANK_INFO.currency}`,
      ``,
      `Admin: ${ADMIN_PHONE}`
    ].join('\n');

    navigator.clipboard.writeText(details).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 w-full font-sans overflow-x-hidden">
      
      {/* Branding Header */}
      <div className="mb-6 md:mb-8 text-center animate-float">
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/20 mb-3 md:mb-4 border border-slate-700">
          <ShieldAlert className="text-red-500 w-6 h-6 md:w-8 md:h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight px-4">Suhara ERP CORE</h1>
        <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Systems On Hold</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl md:rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Warning Banner */}
        <div className="bg-red-50 border-b border-red-100 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <AlertTriangle className="text-red-600 shrink-0 hidden sm:block" size={20} />
          <div>
            <h3 className="font-bold text-red-900 text-xs sm:text-sm uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="text-red-600 shrink-0 sm:hidden" size={14} /> Action Required
            </h3>
            <p className="text-red-700 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
              Your enterprise license access has been paused due to an outstanding invoice. 
              Service will be restored fully once payment is verified.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col gap-6 md:gap-8">
          
          {/* Amount Box */}
          <div className="bg-slate-900 rounded-xl p-5 md:p-8 text-center text-white border border-slate-800 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
            <div className="relative z-10">
               <p className="text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5 md:mb-2 flex items-center justify-center gap-2">
                <CreditCard size={14} /> Outstanding Balance
              </p>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-1.5 md:mb-2 flex flex-wrap justify-center items-baseline gap-1">
                LKR 375,000<span className="text-xl sm:text-2xl text-slate-400 font-bold">.00</span>
              </div>
              <p className="text-slate-400 text-[10px] sm:text-sm font-medium">One-Time Perpetual License Fee</p>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Zap size={140} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            
            {/* Left: Bank Details */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-[11px] sm:text-xs uppercase tracking-widest flex items-center gap-2 mb-3 md:mb-4">
                <Activity className="text-blue-500" size={16} /> Bank Transfer Details
              </h3>
              
              <div className="space-y-2 md:space-y-3 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 overflow-x-hidden">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b border-slate-200/60 pb-2 gap-0.5">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Bank</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">{BANK_INFO.bank}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b border-slate-200/60 pb-2 gap-0.5">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 text-left sm:text-right">{BANK_INFO.branch}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b border-slate-200/60 pb-2 gap-0.5">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Account name</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 text-left sm:text-right">{BANK_INFO.accountHolder}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center pt-1 gap-1 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider">Account Number</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono">{BANK_INFO.accountNumber}</span>
                </div>
              </div>

              <button 
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-widest transition-all ${
                  copied 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copied ? 'Details Copied!' : 'Copy Info'}
              </button>
            </div>

            {/* Right: What You Get */}
            <div className="border-t border-slate-100 pt-6 md:border-t-0 md:pt-0">
              <h3 className="font-black text-slate-900 text-[11px] sm:text-xs uppercase tracking-widest flex items-center gap-2 mb-3 md:mb-4">
                <CheckCircle className="text-emerald-500" size={16} /> Instant Reactivation
              </h3>
              
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-1 sm:mb-2 text-balance">
                  Send your transfer receipt to the admin to immediately unlock your entire system:
                </p>
                
                <ul className="space-y-2.5 sm:space-y-3">
                  {[
                    "Full ERP Dashboard & Analytics",
                    "Candidate Pipeline & CV Engine",
                    "Client Job Order Management",
                    "Financial Ledger System"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start sm:items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 sm:mt-0 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle className="text-emerald-600" size={10} strokeWidth={3} />
                      </div>
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl flex sm:block flex-col gap-1 sm:gap-0">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1">Verify Payment With</p>
                  <p className="font-semibold text-slate-900 text-xs sm:text-sm flex flex-wrap items-center gap-1.5 sm:gap-2">
                    System Admin <ArrowRight size={12} className="text-slate-400 hidden sm:block"/>
                    <ArrowRight size={12} className="text-slate-400 sm:hidden translate-y-px"/> 
                    <span className="whitespace-nowrap">{ADMIN_PHONE}</span>
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Footer text */}
      <p className="mt-6 sm:mt-8 text-[10px] sm:text-xs font-medium text-slate-400 text-center max-w-xs sm:max-w-sm text-balance">
        All your business data is securely backed up and stored. 
        It will be perfectly retained upon reactivation.
      </p>

    </div>
  );
};

export default PaymentGate;
