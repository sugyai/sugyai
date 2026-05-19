'use client';

import { useState } from "react";
import TalmudViewer from "@/components/TalmudViewer";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [isCompact, setIsCompact] = useState(false);

  return (
    <main className="h-screen bg-zinc-50 dark:bg-black overflow-hidden flex flex-col">
      <div className="container mx-auto px-2 lg:px-4 flex-1 flex flex-col pt-2 lg:pt-6 pb-2 lg:pb-4 min-h-0">
        <div className={cn(
          "transition-all duration-700 ease-in-out flex flex-col justify-center flex-shrink-0",
          isCompact ? "min-h-10 mb-2 lg:min-h-12 lg:mb-4" : "min-h-[140px] mb-6 lg:mb-10"
        )}>
          <div className={cn(
            "flex flex-col justify-between gap-4 lg:gap-6 max-w-6xl mx-auto w-full transition-all duration-700",
            isCompact ? "lg:flex-row lg:items-center" : "text-center"
          )}>
            <div className="transition-all duration-700 py-0.5 lg:py-1">
              <h1 className={cn(
                "font-black tracking-tighter text-zinc-900 dark:text-zinc-50 transition-all duration-700",
                isCompact ? "text-xl lg:text-3xl" : "text-4xl sm:text-7xl mb-2 lg:mb-4"
              )}>
                Sugy<span className="text-amber-600">AI</span>
              </h1>
              {!isCompact && (
                <p className="text-zinc-500 dark:text-zinc-400 text-sm lg:text-lg animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
                  Modern tools for ancient texts.
                </p>
              )}
            </div>
            
            <div className={cn(
              "flex flex-col md:flex-row gap-2 lg:gap-4 transition-all duration-700",
              isCompact ? "hidden lg:flex opacity-100 scale-100" : "scale-100 lg:scale-105"
            )}>
              <div className={cn(
                "bg-zinc-100 dark:bg-zinc-900/50 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg lg:rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px] lg:text-xs text-zinc-600 dark:text-zinc-400 transition-all",
                isCompact ? "py-1.5" : ""
              )}>
                <span className="font-bold text-zinc-500 uppercase tracking-widest mr-2 block mb-0.5 lg:inline lg:mb-0">Instructions:</span>
                Click Hebrew to sync • Use top nav to browse • ✨ AI Translate for missing text
                </div>

                <div className={cn(
                "bg-amber-50 dark:bg-amber-950/20 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg lg:rounded-xl border border-amber-100 dark:border-amber-900/50 text-[10px] lg:text-xs text-amber-800/80 dark:text-amber-200/60 transition-all",
                isCompact ? "py-1.5" : ""
                )}>
                <span className="font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest mr-2 block mb-0.5 lg:inline lg:mb-0">⚠️ Warning:</span>
                AI results aren&apos;t guaranteed. Verify with an expert.
                </div>            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-xl lg:rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex-1 min-h-0">
          <TalmudViewer initialRef="Berakhot 2a" onInteract={() => setIsCompact(true)} />
        </div>
      </div>
    </main>
  );
}
