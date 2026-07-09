'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Database, FileSpreadsheet } from 'lucide-react';

interface LoadingStepProps {
  fileName: string;
}

export const LoadingStep: React.FC<LoadingStepProps> = ({ fileName }) => {
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    { text: 'Uploading CSV file to backend...', icon: <FileSpreadsheet className="w-5 h-5 text-indigo-400" /> },
    { text: 'Parsing columns and matching fields...', icon: <Database className="w-5 h-5 text-violet-400" /> },
    { text: 'Validating CRM compliance and schema...', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
    { text: 'Formatting results and compiling response...', icon: <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" /> }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIndex((prev) => (prev < statuses.length - 1 ? prev + 1 : prev));
    }, 2000);

    return () => clearInterval(timer);
  }, [statuses.length]);

  return (
    <div className="w-full max-w-md mx-auto py-12 flex flex-col items-center justify-center text-center">
      {/* Visual Loader Ring */}
      <div className="relative mb-8 w-24 h-24 flex items-center justify-center">
        {/* Glowing aura */}
        <div className="absolute inset-0 bg-violet-600/20 blur-[30px] rounded-full animate-pulse" />
        <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="absolute inset-0 border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
        />
        <Database className="w-8 h-8 text-violet-400" />
      </div>

      <h3 className="text-xl font-bold text-zinc-100 mb-2">Importing leads...</h3>
      <p className="text-zinc-500 text-xs font-mono mb-8 max-w-xs truncate">{fileName}</p>

      {/* Progress status indicators */}
      <div className="w-full border border-zinc-850 bg-zinc-950/40 rounded-2xl p-5 backdrop-blur-md text-left space-y-4">
        {statuses.map((status, idx) => {
          const isActive = idx === statusIndex;
          const isCompleted = idx < statusIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                isActive ? 'opacity-100' : isCompleted ? 'opacity-40' : 'opacity-20'
              }`}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    ✓
                  </div>
                ) : (
                  status.icon
                )}
              </div>
              <span className={`text-sm ${isActive ? 'font-semibold text-zinc-200' : 'text-zinc-400'}`}>
                {status.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LoadingStep;
