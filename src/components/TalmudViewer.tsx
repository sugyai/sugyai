'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getTalmudText, SefariaTextResponse, SefariaCommentary, deTransliterate, extractDivreiHamaschil, getHebrewBooksUrl } from '@/lib/sefaria';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Popular tractates for the picker
const POPULAR_TRACTATES = [
  { id: 'Berakhot', en: 'Berakhot', he: 'ברכות' },
  { id: 'Shabbat', en: 'Shabbat', he: 'שבת' },
  { id: 'Eruvin', en: 'Eruvin', he: 'עירובין' },
  { id: 'Pesachim', en: 'Pesachim', he: 'פסחים' },
  { id: 'Yoma', en: 'Yoma', he: 'יומא' },
  { id: 'Sukkah', en: 'Sukkah', he: 'סוכה' },
  { id: 'Beitzah', en: 'Beitzah', he: 'ביצה' },
  { id: 'Rosh_Hashanah', en: 'Rosh Hashanah', he: 'ראש השנה' },
  { id: 'Taanit', en: 'Taanit', he: 'תענית' },
  { id: 'Megillah', en: 'Megillah', he: 'מגילה' },
  { id: 'Ketubot', en: 'Ketubot', he: 'כתובות' },
  { id: 'Gittin', en: 'Gittin', he: 'גיטין' },
  { id: 'Kiddushin', en: 'Kiddushin', he: 'קידושין' },
  { id: 'Bava_Kamma', en: 'Bava Kamma', he: 'בבא קמא' },
  { id: 'Bava_Metzia', en: 'Bava Metzia', he: 'בבא מציעא' },
  { id: 'Bava_Batra', en: 'Bava Batra', he: 'בבא בתרא' },
  { id: 'Sanhedrin', en: 'Sanhedrin', he: 'סנהדרין' },
  { id: 'Avodah_Zarah', en: 'Avodah Zarah', he: 'עבודה זרה' },
  { id: 'Chullin', en: 'Chullin', he: 'חולין' },
  { id: 'Niddah', en: 'Niddah', he: 'נידה' },
];

interface TalmudViewerProps {
  initialRef?: string;
}

export default function TalmudViewer({ initialRef = 'Berakhot 2a' }: TalmudViewerProps) {
  const [currentRef, setCurrentRef] = useState(initialRef);
  const [data, setData] = useState<SefariaTextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  
  // AI Feature states
  const [aiTranslations, setAiTranslations] = useState<Record<string, string>>({});
  const [translatingRefs, setTranslatingRefs] = useState<Record<string, boolean>>({});
  const [expandedCommentary, setExpandedCommentary] = useState<string | null>(null);

  // Picker states
  const [showPicker, setShowPicker] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pickerTractate, setPickerTractate] = useState('Berakhot');
  const [pickerDaf, setPickerDaf] = useState('2');
  const [pickerSide, setPickerSide] = useState<'a' | 'b'>('a');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getTalmudText(currentRef);
        setData(result);
        setError(null);
        setSelectedIndex(0); 
        
        // Update picker states to match new ref
        const match = currentRef.match(/^(.*?)\s(\d+)([ab])$/);
        if (match) {
            setPickerTractate(match[1]);
            setPickerDaf(match[2]);
            setPickerSide(match[3] as 'a' | 'b');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch Talmud text. Please check the reference and try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentRef]);

  // Processed translations to handle transliterations
  const processedEnglish = useMemo(() => {
    if (!data?.text) return [];
    return data.text.map(line => deTransliterate(line));
  }, [data]);

  const handleAiTranslate = async (comm: SefariaCommentary) => {
    if (aiTranslations[comm.ref]) return;

    setTranslatingRefs(prev => ({ ...prev, [comm.ref]: true }));
    try {
      const response = await fetch('/api/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate', text: comm.he, context: comm.index_title })
      });
      const data = await response.json();
      if (data.result) {
        setAiTranslations(prev => ({ ...prev, [comm.ref]: data.result }));
      }
    } catch (err) {
      console.error('AI Translation failed:', err);
    } finally {
      setTranslatingRefs(prev => ({ ...prev, [comm.ref]: false }));
    }
  };

  const getCommentariesForSegment = (index: number) => {
    if (!data?.commentary) return [];
    
    const segmentNum = index + 1;
    const normalizedRef = data.ref.replace(/\./g, ' ');
    const segmentRef = `${normalizedRef}:${segmentNum}`;
    
    return data.commentary.filter(c => {
      const matchesAnchorRef = c.anchorRef === segmentRef;
      const matchesExpanded = c.anchorRefExpanded?.includes(segmentRef);
      const matchesAnchor = c.anchor === segmentRef || c.anchor?.startsWith(segmentRef);
      return matchesAnchorRef || matchesExpanded || matchesAnchor;
    });
  };

  const navigateToRef = () => {
    const newRef = `${pickerTractate} ${pickerDaf}${pickerSide}`;
    setCurrentRef(newRef);
    setShowPicker(false);
  };

  const hbPdfUrl = useMemo(() => {
    if (!data) return null;
    return getHebrewBooksUrl(data.ref);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-24 bg-white dark:bg-black h-[calc(100vh-160px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const segmentCommentaries = getCommentariesForSegment(selectedIndex);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full bg-white dark:bg-black overflow-hidden relative">
      {/* Sleek Header / Navigation */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between z-40 shadow-sm">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 rounded-lg transition-all border border-transparent hover:border-amber-400/50 group"
            >
                <span className="text-amber-600 dark:text-amber-400 font-bold font-serif text-lg">
                    {data?.ref || currentRef}
                </span>
                <span className={cn("text-zinc-400 transition-transform", showPicker ? "rotate-180" : "")}>▼</span>
            </button>
            
            <div className="hidden lg:flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <span>Bavli</span>
                <span>•</span>
                <span>{data?.ref.split(' ')[0]}</span>
            </div>
            
            <div className="hidden xl:flex items-center gap-3 ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-800">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight max-w-[200px]">
                    Translations and hosting aren't free. Help support the token costs.
                </p>
                <a 
                    href="https://www.paypal.com/donate/?hosted_button_id=ELNJNFRAVUPQY" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-black uppercase tracking-widest transition-all shadow-sm shadow-emerald-500/20 active:scale-[0.98]"
                >
                    <span>☕</span> Donate
                </a>
            </div>
        </div>

        <div className="flex items-center gap-3">
            {hbPdfUrl && (
                <button 
                    onClick={() => setShowPdfModal(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 transition-all border border-zinc-200 dark:border-zinc-700 hover:border-amber-500/50"
                >
                    <span className="text-amber-600">📄</span> View Vilna Layout
                </button>
            )}
            
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

            <button 
                onClick={() => {
                    const match = currentRef.match(/^(.*?)\s(\d+)([ab])$/);
                    if (match) {
                        const daf = parseInt(match[2]);
                        const side = match[3];
                        if (side === 'b') setCurrentRef(`${match[1]} ${daf}a`);
                        else if (daf > 2) setCurrentRef(`${match[1]} ${daf-1}b`);
                    }
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-amber-600 transition-colors"
                title="Previous Daf"
            >
                ◀
            </button>
            <button 
                onClick={() => {
                    const match = currentRef.match(/^(.*?)\s(\d+)([ab])$/);
                    if (match) {
                        const daf = parseInt(match[2]);
                        const side = match[3];
                        if (side === 'a') setCurrentRef(`${match[1]} ${daf}b`);
                        else setCurrentRef(`${match[1]} ${daf+1}a`);
                    }
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-amber-600 transition-colors"
                title="Next Daf"
            >
                ▶
            </button>
        </div>
      </div>

      {/* Slick Picker Overlay */}
      {showPicker && (
        <>
            <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-30 animate-in fade-in duration-300" onClick={() => setShowPicker(false)} />
            <div className="absolute top-16 left-6 w-[400px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-40 p-6 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-6">
                    <section>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Tractate</label>
                        <select 
                            value={pickerTractate}
                            onChange={(e) => setPickerTractate(e.target.value)}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                            {POPULAR_TRACTATES.map(t => (
                                <option key={t.id} value={t.id.replace(/_/g, ' ')}>{t.en} ({t.he})</option>
                            ))}
                        </select>
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                        <section>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Daf</label>
                            <input 
                                type="number" 
                                value={pickerDaf}
                                onChange={(e) => setPickerDaf(e.target.value)}
                                min="2"
                                className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </section>
                        <section>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Side</label>
                            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                                <button 
                                    onClick={() => setPickerSide('a')}
                                    className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", pickerSide === 'a' ? "bg-white dark:bg-zinc-700 shadow-sm text-amber-600" : "text-zinc-500")}
                                >a (א)</button>
                                <button 
                                    onClick={() => setPickerSide('b')}
                                    className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", pickerSide === 'b' ? "bg-white dark:bg-zinc-700 shadow-sm text-amber-600" : "text-zinc-500")}
                                >b (ב)</button>
                            </div>
                        </section>
                    </div>

                    <button 
                        onClick={navigateToRef}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                    >
                        Go to Text
                    </button>
                </div>
            </div>
        </>
      )}

      {error && (
        <div className="m-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 flex justify-between items-center">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-xs font-bold uppercase tracking-widest">Dismiss</button>
        </div>
      )}

      {/* Main Study Interface */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Main Text (Gemara) */}
        <div className="w-1/3 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 relative text-right" dir="rtl">
          <div className="p-4 space-y-2">
            {data?.he.map((heLine, index) => (
              <div 
                key={index}
                className={cn(
                  "p-4 rounded-xl transition-all border-2 cursor-pointer relative group",
                  selectedIndex === index 
                    ? "bg-amber-100/40 border-amber-400 dark:bg-amber-900/30 dark:border-amber-600 shadow-md scale-[1.02] z-10" 
                    : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900"
                )}
                onClick={() => {
                  setSelectedIndex(index);
                  setExpandedCommentary(null);
                }}
              >
                <div 
                  className="leading-relaxed text-2xl font-serif dark:text-zinc-100"
                  dangerouslySetInnerHTML={{ __html: heLine }}
                />
                {selectedIndex === index && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-full" />
                )}
              </div>
            ))}
          </div>
          {loading && (
             <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center backdrop-blur-[1px] z-50">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
             </div>
          )}
        </div>

        {/* Middle Pane: Parallel Translation */}
        <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 sticky top-0 z-20 h-[53px] flex items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Translation: Segment {selectedIndex + 1}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section className="animate-in fade-in slide-in-from-top-2 duration-500">
              <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Sefaria Translation
              </h4>
              <div 
                className="leading-relaxed text-xl text-zinc-800 dark:text-zinc-200 font-medium"
                dangerouslySetInnerHTML={{ __html: processedEnglish[selectedIndex] || 'No translation available for this segment.' }}
              />
            </section>

            {aiTranslations[`explain-${selectedIndex}`] && (
              <section className="animate-in zoom-in-95 duration-300">
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  AI Deep Insight
                </h4>
                <div className="text-lg text-zinc-700 dark:text-zinc-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 leading-relaxed shadow-inner">
                  {aiTranslations[`explain-${selectedIndex}`]}
                </div>
              </section>
            )}

            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-900 mt-auto">
               <p className="text-[10px] text-zinc-400 text-center italic uppercase tracking-tighter">Select segment on left to sync</p>
            </div>
          </div>
        </div>

        {/* Right Pane: Persistent Commentary List */}
        <div className="w-1/3 bg-zinc-50/50 dark:bg-zinc-950 flex flex-col">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20 h-[53px] flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Commentaries ({segmentCommentaries.length})</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {segmentCommentaries.length > 0 ? (
                segmentCommentaries.map((comm, i) => {
                  const isExpanded = expandedCommentary === comm.ref;
                  const dh = extractDivreiHamaschil(comm.he);
                  
                  // Get a cleaner title (e.g., "Rashi" instead of "Rashi on Berakhot")
                  let title = comm.index_title;
                  if (comm.collectiveTitle) {
                      title = typeof comm.collectiveTitle === 'string' 
                          ? comm.collectiveTitle 
                          : comm.collectiveTitle.en;
                  } else {
                      // Fallback: strip " on [Tractate]"
                      title = title.split(' on ')[0];
                  }

                  return (
                    <div key={i} className={cn(
                      "border rounded-xl transition-all duration-300 relative bg-white dark:bg-zinc-900 shadow-sm",
                      isExpanded 
                        ? "border-amber-300 dark:border-amber-700 shadow-lg ring-1 ring-amber-200/50 dark:ring-amber-900/50" 
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-sm overflow-hidden"
                    )}>
                      <button 
                        onClick={() => setExpandedCommentary(isExpanded ? null : comm.ref)}
                        className={cn(
                          "w-full p-4 flex flex-col items-start gap-2 text-left transition-colors z-20",
                          isExpanded ? "sticky top-0 bg-white dark:bg-zinc-900 border-b border-amber-100 dark:border-amber-800/50 rounded-none" : "rounded-xl"
                        )}
                      >
                        <div className="flex w-full justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-1 h-5 rounded-full transition-colors",
                                    isExpanded ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-700"
                                )} />
                                <span className="text-[10px] font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest">{title}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "text-zinc-400 transition-transform duration-300 text-[10px]",
                                    isExpanded ? "rotate-180" : ""
                                )}>▼</span>
                                
                                {(!comm.text || comm.text.length === 0) && !aiTranslations[comm.ref] && (
                                    <button 
                                      onClick={(e) => { 
                                          e.stopPropagation(); 
                                          handleAiTranslate(comm); 
                                      }}
                                      disabled={translatingRefs[comm.ref]}
                                      className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all border disabled:opacity-80",
                                        translatingRefs[comm.ref]
                                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50 animate-pulse"
                                          : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                                      )}
                                    >
                                      <span className="text-[10px] leading-none">
                                        {translatingRefs[comm.ref] ? '⏳' : '✨'}
                                      </span>
                                      <span className="text-[9px] font-black uppercase tracking-tighter">
                                          {translatingRefs[comm.ref] ? 'Translating...' : 'AI Translate'}
                                      </span>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {dh && (
                            <div className={cn(
                                "font-serif text-sm font-bold text-zinc-700 dark:text-zinc-200 transition-opacity",
                                isExpanded ? "opacity-100" : "opacity-60"
                            )} dir="rtl">
                                {dh}
                            </div>
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-4 space-y-5 animate-in slide-in-from-top-4 duration-300">
                          <div dir="rtl" className="text-xl font-serif leading-loose dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-4" dangerouslySetInnerHTML={{ __html: comm.he }} />
                          
                          {comm.text && (
                            <div className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: deTransliterate(comm.text) }} />
                          )}

                          {aiTranslations[comm.ref] && (
                            <div className="text-lg text-amber-950 dark:text-amber-200 bg-amber-50/50 dark:bg-amber-950/30 p-5 rounded-xl border border-amber-200/50 dark:border-amber-800/50 italic leading-relaxed shadow-inner">
                              {aiTranslations[comm.ref]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-zinc-400 dark:text-zinc-500 italic py-20 text-center flex flex-col items-center gap-3">
                    <span className="text-2xl opacity-20">📜</span>
                    <p className="text-[10px] uppercase tracking-widest font-bold">No commentaries</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Original Layout Modal */}
      {showPdfModal && hbPdfUrl && (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" onClick={() => setShowPdfModal(false)} />
            <div className="fixed inset-4 md:inset-10 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-zinc-800">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                            <h3 className="text-sm font-bold dark:text-zinc-100">Vilna Layout: {data?.ref}</h3>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Source: HebrewBooks.org</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a 
                            href={hbPdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 transition-all"
                        >
                            Open in New Tab
                        </a>
                        <button 
                            onClick={() => setShowPdfModal(false)}
                            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                        >
                            <span className="text-xl">✕</span>
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-zinc-100 dark:bg-black/40">
                    <iframe 
                        src={hbPdfUrl} 
                        className="w-full h-full border-none"
                        title="Original Vilna Layout"
                    />
                </div>
            </div>
        </>
      )}
    </div>
  );
}
