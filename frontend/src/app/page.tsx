'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingStep from '../components/CSVImporter/LandingStep';
import PreviewStep from '../components/CSVImporter/PreviewStep';
import LoadingStep from '../components/CSVImporter/LoadingStep';
import ResultStep from '../components/CSVImporter/ResultStep';
import { importCSVFile } from '../lib/api';
import { ImportResponse } from '../types/crm';
import { FileSpreadsheet, Sparkles, Layers, AlertCircle, RefreshCw } from 'lucide-react';

type Step = 'upload' | 'preview' | 'loading' | 'result';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState<number>(50);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setCurrentStep('preview');
  };

  const handleCancelPreview = () => {
    setFile(null);
    setCurrentStep('upload');
  };

  const handleConfirmImport = async (fileToImport: File) => {
    setError(null);
    setCurrentStep('loading');

    try {
      const response = await importCSVFile(fileToImport, batchSize);
      if (response.status === 'success' && response.data) {
        setImportResult(response.data);
        setCurrentStep('result');
      } else {
        throw new Error(response.message || 'Failed to process CSV file.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'An error occurred during file ingestion.';
      setError(errMsg);
      setCurrentStep('preview'); // Return to preview so they can try again
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setError(null);
    setCurrentStep('upload');
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-x-hidden selection:bg-violet-500/30 selection:text-violet-200">
      
      {/* Background Decorative Grids and Light Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f11_1px,transparent_1px),linear-gradient(to_bottom,#0f0f11_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-12 right-1/4 w-96 h-96 bg-indigo-600/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleReset}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-zinc-100 tracking-tight text-sm md:text-base flex items-center gap-1.5">
                GrowEasy
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-violet-950 border border-violet-900/30 px-1.5 py-0.5 rounded-full text-violet-300">
                  AI Importer
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentStep === 'preview' && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-semibold uppercase">Batch Size:</span>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 font-medium"
                >
                  <option value={10}>10 records</option>
                  <option value={50}>50 records (default)</option>
                  <option value={100}>100 records</option>
                </select>
              </div>
            )}
            
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
            >
              Docs
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-16 relative z-10 flex flex-col justify-center">
        
        {/* API Error Toast Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-300 text-sm flex items-center gap-3 w-full max-w-2xl mx-auto"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold">Import Error:</span> {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-xs font-semibold hover:underline text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Routing Switch */}
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <LandingStep onFileAccepted={handleFileAccepted} />
            </motion.div>
          )}

          {currentStep === 'preview' && file && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PreviewStep
                file={file}
                onCancel={handleCancelPreview}
                onConfirm={handleConfirmImport}
              />
            </motion.div>
          )}

          {currentStep === 'loading' && file && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LoadingStep fileName={file.name} />
            </motion.div>
          )}

          {currentStep === 'result' && importResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ResultStep result={importResult} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-650 bg-zinc-950/40 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-550 font-medium">
          <span>© 2026 GrowEasy AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
              Powered by Advanced Heuristic Parsing
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
