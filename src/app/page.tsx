import TalmudViewer from "@/components/TalmudViewer";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black py-12">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 sm:text-7xl mb-6">
            Sugy<span className="text-amber-600">AI</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Instructions</h2>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
                <li>Click a Hebrew segment to sync translation and commentaries.</li>
                <li>Use the top navigation to browse tractates and pages.</li>
                <li>Click <span className="text-amber-600 font-bold">✨ AI Translate</span> for missing commentary texts.</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-500 mb-2 flex items-center gap-2">
                <span>⚠️</span> Accuracy Warning
              </h2>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/60 leading-relaxed">
                AI translations and explanations are <span className="font-bold">not guaranteed to be correct</span>. They may contain errors or misinterpretations. <span className="underline decoration-amber-500/30">Always verify insights with an expert</span> or traditional sources.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <TalmudViewer initialRef="Berakhot 2a" />
        </div>
      </div>
    </main>
  );
}
