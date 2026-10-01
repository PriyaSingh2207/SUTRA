import React, { useState } from 'react';
import { X, Printer, ShieldCheck, Copy, Check } from 'lucide-react';

interface LegalDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    freeze_notice: string;
    case_diary: string;
    bsa_certificate: string;
    victim_account: string;
    target_accounts_count: number;
  } | null;
}

export const LegalDocumentsModal: React.FC<LegalDocumentsModalProps> = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState<'notice' | 'diary' | 'bsa'>('notice');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const activeText = activeTab === 'notice' ? data.freeze_notice : activeTab === 'diary' ? data.case_diary : data.bsa_certificate;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">${activeText}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-police-900 border border-police-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-police-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Court-Ready Statutory Documentation (BNSS 2023 & BSA 2023)
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-police-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 bg-police-950 flex items-center justify-between border-b border-police-800">
          <div className="flex gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('notice')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'notice'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-police-900'
              }`}
            >
              Sec 106 & 94 BNSS Bank Freezing Requisition
            </button>
            <button
              onClick={() => setActiveTab('diary')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'diary'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-police-900'
              }`}
            >
              Form IIF-IV Police Case Diary
            </button>
            <button
              onClick={() => setActiveTab('bsa')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'bsa'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-police-900'
              }`}
            >
              Sec 63 BSA Digital Certificate
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded-lg bg-police-800 hover:bg-police-700 text-slate-300 text-xs font-mono flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono flex items-center gap-1 font-bold shadow-md shadow-emerald-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Text Viewport */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
          {activeText}
        </div>
      </div>
    </div>
  );
};
