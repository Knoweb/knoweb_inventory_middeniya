import { useState } from 'react';
import ManufacturingProductForm from '../components/ManufacturingProductForm';
import { Factory, Play, CheckCircle2, ChevronRight, Terminal, Braces, Layers } from 'lucide-react';

function ManufacturingProductFormDemo() {
  const [showForm, setShowForm] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const handleSubmit = (formData) => {
    console.log('Form submitted:', formData);
    setSubmittedData(formData);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-12 overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
              <Factory size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">System Simulator</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-2 ml-1">Manufacturing Interface Component Lab</p>
            </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-slate-200 via-transparent to-transparent" />
        </header>

        <section className="bg-white rounded-[2.5rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 group">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment Ready</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Test Industrial<br />Resource Registration.
            </h2>
            <p className="text-slate-500 font-medium italic leading-relaxed max-w-sm">
              Validate the data serialization and UI responsiveness of the Manufacturing Item definition layer in a controlled sandbox.
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl shadow-slate-300 hover:shadow-indigo-200 hover:bg-indigo-600 transition-all active:scale-95 group relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-4">
              <span className="text-xs font-black uppercase tracking-[0.3em]">Initialize Form</span>
              <Play size={18} fill="currentColor" />
            </div>
            {/* Hover effect decorative element */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent -translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
        </section>

        {submittedData && (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-300 border border-slate-800 relative overflow-hidden group">
              {/* Result background effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />

              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-6 w-full">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-widest">Protocol Committed</h3>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Data Serialization Successful</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center text-[10px] text-white/40 font-black">{i}</div>)}
                      </div>
                      <ChevronRight className="text-white/20" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                      <Layers size={16} className="text-indigo-400 mb-4" />
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Part Entity</p>
                      <p className="text-sm font-black text-white mt-1 uppercase truncate">{submittedData.partNumber}</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                      <Braces size={16} className="text-emerald-400 mb-4" />
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Resource Name</p>
                      <p className="text-sm font-black text-white mt-1 uppercase truncate">{submittedData.itemName}</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                      <Terminal size={16} className="text-amber-400 mb-4" />
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Op Mode</p>
                      <p className="text-sm font-black text-white mt-1 uppercase truncate">{submittedData.itemType}</p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Terminal size={12} className="text-white/20" />
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Raw Object Data</span>
                    </div>
                    <div className="bg-black/40 rounded-3xl p-8 border border-white/5 font-mono text-xs text-emerald-400 overflow-x-auto scrollbar-hide">
                      <pre className="opacity-80">
                        {JSON.stringify(submittedData, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <ManufacturingProductForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        <footer className="pt-20 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Authorized Sandbox Environment • Version 2026.4.1</p>
        </footer>
      </div>
    </div>
  );
}

export default ManufacturingProductFormDemo;
