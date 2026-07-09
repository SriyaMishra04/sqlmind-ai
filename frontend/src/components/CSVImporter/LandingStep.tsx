'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface LandingStepProps {
  onFileAccepted: (file: File) => void;
}

export const LandingStep: React.FC<LandingStepProps> = ({ onFileAccepted }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      setError('Invalid file type. Please upload a standard CSV file.');
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Only CSV files are supported.');
        return;
      }
      onFileAccepted(file);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mb-4">
          GrowEasy AI CSV Importer
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          Intelligently import, map, and standardize your CRM leads using advanced heuristic parsing and schema matching.
        </p>
      </motion.div>

      <div {...getRootProps()} className="outline-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center min-h-[320px] backdrop-blur-md bg-zinc-950/40
            ${isDragActive ? 'border-violet-500 bg-zinc-900/30 ring-4 ring-violet-500/10' : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/10'}
            ${isDragReject ? 'border-rose-500 bg-rose-950/10' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {/* Glow Effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-violet-600/10 to-indigo-600/10 blur-[80px] pointer-events-none rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div
              animate={isDragActive ? { scale: 1.05, y: -5 } : { scale: 1, y: 0 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl
                ${isDragActive ? 'bg-violet-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}
              `}
            >
              {isDragActive ? (
                <UploadCloud className="w-8 h-8 animate-pulse" />
              ) : (
                <FileSpreadsheet className="w-8 h-8 text-violet-400" />
              )}
            </motion.div>

            <h3 className="text-xl font-semibold text-zinc-100 mb-2">
              {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
            </h3>
            <p className="text-zinc-500 text-sm max-w-xs mb-6">
              Drag your file here, or click to browse. Max size 10MB.
            </p>

            <button
              type="button"
              className="px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-xl transition-all shadow-lg hover:shadow-white/5 active:scale-98"
            >
              Browse File
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-300 text-sm flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 text-center text-xs text-zinc-600">
        Supported format: <span className="text-zinc-500 font-mono">.csv</span> files only
      </div>
    </div>
  );
};

export default LandingStep;
