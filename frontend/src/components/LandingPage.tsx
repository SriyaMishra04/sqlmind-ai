'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  FileSpreadsheet,
  FileCode2,
  Sparkles,
  UploadCloud,
  FileWarning,
  Flame,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Workflow,
  Search,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { uploadFile } from '../lib/api';
import { useSQLMindStore } from '../hooks/useSQLMindStore';

export default function LandingPage() {
  const { setDbInfo, isUploading, setIsUploading } = useSQLMindStore();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleTryDemo = async (initialQuery?: string) => {
    setIsUploading(true);
    setError(null);
    setProgress(15);

    if (initialQuery) {
      sessionStorage.setItem('initial_prompt', initialQuery);
    }

    const demoCSV = `id,name,department,salary,hire_date,sales_amount,product,city
1,Alice Smith,Engineering,125000,2022-03-15,15000,Cloud Migrator,Odisha
2,Bob Jones,Sales,85000,2023-01-10,25000,Enterprise Suite,Odisha
3,Charlie Brown,Engineering,115000,2021-06-01,0,None,Delhi
4,Diana Prince,Marketing,90000,2023-08-20,9500,SEO Pack,Mumbai
5,Evan Wright,Sales,78000,2024-02-11,12000,Basic Subscription,Bangalore
6,Fiona Gallagher,HR,65000,2020-05-18,0,None,Kolkata
7,George Costanza,Sales,55000,2019-11-04,3000,Basic Subscription,Chennai
8,Harriet Tubman,Operations,95000,2018-04-12,0,None,Odisha
9,Ian Malcolm,Engineering,140000,2021-09-30,45000,Data Engine,Mumbai
10,Julia Roberts,Marketing,105000,2022-07-22,18000,Ad Campaign,Odisha`;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 15;
      });
    }, 100);

    try {
      const file = new File([demoCSV], "demo_dataset.csv", { type: "text/csv" });
      const response = await uploadFile(file);
      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setDbInfo(
          response.db_id,
          response.filename,
          response.tables,
          response.schema_info,
          response.suggested_questions
        );
        setIsUploading(false);
        setProgress(0);
      }, 350);

    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      setProgress(0);
      const errMsg = err.response?.data?.detail || err.message || 'Error Ingesting demo dataset.';
      setError(errMsg);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setIsUploading(true);
      setError(null);
      setProgress(10);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(interval);
            return 85;
          }
          return prev + 15;
        });
      }, 120);

      try {
        const response = await uploadFile(file);
        clearInterval(interval);
        setProgress(100);
        
        setTimeout(() => {
          setDbInfo(
            response.db_id,
            response.filename,
            response.tables,
            response.schema_info,
            response.suggested_questions
          );
          setIsUploading(false);
          setProgress(0);
        }, 400);

      } catch (err: any) {
        clearInterval(interval);
        setIsUploading(false);
        setProgress(0);
        const errMsg = err.response?.data?.detail || err.message || 'Error processing database upload.';
        setError(errMsg);
      }
    },
    [setDbInfo, setIsUploading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/x-sqlite3': ['.db', '.sqlite'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/sql': ['.sql'],
      'text/plain': ['.sql'],
    },
  });

  const questionChips = [
    { label: 'Show monthly revenue', query: 'Group by product or date and calculate the sum of sales amounts' },
    { label: 'Top 10 customers', query: 'Show the top 10 rows sorted by sales_amount descending' },
    { label: 'Highest paid employees', query: 'Show employees with the highest salary' },
    { label: 'Products low in stock', query: 'Select products that need restocking' },
    { label: 'Average order value', query: 'Select average of sales_amount' },
    { label: 'Best selling category', query: 'Show count of products sold grouped by department' },
    { label: 'Recent orders', query: 'Show recent records sorted by hire_date descending' },
    { label: 'Customers from Odisha', query: 'Select all columns where city equals Odisha' },
  ];

  const coreFeatures = [
    {
      title: 'Natural Language to SQL',
      desc: 'Ask questions in plain English and watch optimized SQL queries generate instantly.',
      icon: Sparkles,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Automatic Schema Detection',
      desc: 'Instantly indexes keys, tables, types, and constraints of uploaded datasets.',
      icon: Workflow,
      color: 'bg-violet-50 text-violet-600',
    },
    {
      title: 'Read-only Database Access',
      desc: 'Connects to SQLite files in native read-only modes to guarantee security.',
      icon: Lock,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Multiformat Support',
      desc: 'Upload CSV spreadsheets, Excel worksheets, SQLite databases, or SQL scripts.',
      icon: Database,
      color: 'bg-cyan-50 text-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-[#111827] flex flex-col font-sans select-none antialiased">
      
      {/* 1. Sticky Navbar */}
      <header className="sticky top-0 z-50 h-[72px] border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center shadow-xs">
              <Database className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-gray-900">
              SQLMind AI
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#6B7280]">
            <a href="#features" className="hover:text-gray-900 transition">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition">How It Works</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition">GitHub</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="text-xs font-bold text-gray-500 hover:text-gray-900 transition px-3 py-2">
              Sign In
            </button>
            <button
              onClick={() => handleTryDemo()}
              className="text-xs font-bold bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-xl transition shadow-xs"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center">
        
        {/* 2. Hero Section */}
        <section className="w-full max-w-4xl px-6 pt-12 pb-6 text-center flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl md:text-[60px] font-black tracking-tight text-gray-900 leading-[1.08] max-w-3xl">
            Query Your Database with AI <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] via-violet-500 to-indigo-600">
              using Plain English
            </span>
          </h1>
          
          <p className="mt-4 text-sm sm:text-base text-[#6B7280] max-w-xl leading-relaxed font-medium">
            Upload CSV, Excel, SQLite, or SQL Dump files and instantly generate accurate SQL queries using natural language.
          </p>
        </section>

        {/* 3. Upload Section */}
        <section className="w-full max-w-xl px-6 pb-12 flex flex-col items-center">
          
          {/* Upload Card */}
          <div className="w-full bg-white border border-[#E5E7EB] rounded-[24px] p-8 shadow-xs hover:shadow-md transition-all flex flex-col items-center">
            
            <div
              {...getRootProps()}
              className={`w-full relative group cursor-pointer border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-slate-50/50 hover:bg-white hover:border-[#6366F1]/50 ${
                isDragActive ? 'border-[#6366F1] bg-indigo-50/20' : 'border-gray-250'
              }`}
            >
              <input {...getInputProps()} />

              <AnimatePresence mode="wait">
                {isUploading ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center w-full py-4 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4 text-[#6366F1] animate-pulse">
                      <UploadCloud className="w-6 h-6 animate-bounce" />
                    </div>
                    <h3 className="font-bold text-xs text-gray-800">Analyzing schema structures...</h3>
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold">Creating sandboxed session</p>
                    
                    {/* Progress */}
                    <div className="w-full max-w-xs bg-gray-100 border border-gray-150 rounded-full h-1.5 mt-6 overflow-hidden">
                      <motion.div 
                        className="bg-[#6366F1] h-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'easeInOut' }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-250/70 flex items-center justify-center mb-4 text-gray-450 group-hover:text-[#6366F1] group-hover:border-[#6366F1]/20 transition-all shadow-xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-xs text-gray-800 group-hover:text-gray-900">
                      {isDragActive ? 'Drop your database file...' : 'Upload your dataset'}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-semibold">
                      Drag & drop files, or click to browse
                    </p>
                    
                    {/* File chips */}
                    <div className="flex flex-wrap gap-2 items-center justify-center mt-6">
                      {['CSV', 'Excel', 'SQLite', 'SQL Dump'].map((ext) => (
                        <span key={ext} className="text-[9.5px] font-bold text-gray-400 bg-white border border-gray-200/80 px-2 py-0.5 rounded-md">
                          {ext}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="mt-4 w-full p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2.5 text-left font-medium">
                <FileWarning className="w-4.5 h-4.5 flex-shrink-0 text-red-500" />
                <div className="flex-1 leading-normal">
                  <span className="font-bold">Error:</span> {error}
                </div>
              </div>
            )}

            {/* Ingestion assurances */}
            <div className="flex gap-4 items-center justify-center mt-6 text-[10.5px] text-gray-400 font-semibold select-none border-t border-gray-100 w-full pt-5">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Read-only</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Secure</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fast AI</span>
            </div>

            {/* Try demo secondary action */}
            <button
              onClick={() => handleTryDemo()}
              disabled={isUploading}
              className="mt-4 w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-gray-200 text-[#111827] hover:text-gray-900 rounded-xl font-bold transition shadow-xs text-xs flex items-center justify-center gap-1.5"
            >
              <span>Try Demo Dataset</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

          </div>

        </section>

        {/* 4. Example Questions Chips */}
        <section className="w-full max-w-3xl px-6 pb-16 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-4 select-none">
            Click to Ingest & Query Example Questions
          </span>
          
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
            {questionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleTryDemo(chip.query)}
                className="py-1.5 px-3 bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-[11px] font-bold text-gray-600 hover:text-indigo-700 rounded-lg shadow-xs transition"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        {/* 5. How It Works Section */}
        <section id="how-it-works" className="w-full bg-white border-y border-[#E5E7EB] py-16 flex flex-col items-center scroll-mt-10">
          <div className="max-w-4xl w-full px-6 flex flex-col items-center">
            
            <h3 className="text-[10px] uppercase font-black tracking-wider text-[#6366F1] mb-2 select-none">
              HOW IT WORKS
            </h3>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-10 text-center">
              Generate SQL in 4 Simple Steps
            </h2>

            {/* Timeline Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full relative">
              {[
                { step: '①', title: 'Upload Dataset', desc: 'Drag and drop your CSV, Excel, SQLite, or SQL file.' },
                { step: '②', title: 'Schema Indexing', desc: 'The engine automatically maps tables, fields, and constraints.' },
                { step: '③', title: 'Ask in English', desc: 'Query your data using natural, conversation language.' },
                { step: '④', title: 'Get SQL Statement', desc: 'AI delivers and safely executes your optimized SQL.' },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-3 relative group">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-bold text-[#6366F1] mb-4 group-hover:scale-105 transition-all shadow-xs">
                    {step.step}
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-800 mb-1">{step.title}</h4>
                  <p className="text-[10.5px] text-gray-400 font-semibold leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 6. Core Features Section */}
        <section id="features" className="w-full py-16 flex flex-col items-center scroll-mt-10">
          <div className="max-w-4xl w-full px-6 flex flex-col items-center">
            
            <h3 className="text-[10px] uppercase font-black tracking-wider text-[#6366F1] mb-2 select-none">
              CORE FEATURES
            </h3>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-10 text-center">
              Handcrafted for Safety and Speed
            </h2>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
              {coreFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-xl p-5 flex gap-4 text-left shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${feat.color}`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-gray-800 mb-1">{feat.title}</h4>
                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

      </main>

      {/* 7. Minimal Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-8 text-center text-xs text-[#6B7280]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold">
          <span className="flex items-center gap-1">
            SQLMind AI
            <span className="text-gray-400 font-normal">|</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-gray-900">GitHub</a>
          </span>
          
          <span className="text-[10.5px]">Made with ❤️ for SQL Teams</span>
        </div>
      </footer>

    </div>
  );
}
