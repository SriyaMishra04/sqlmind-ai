'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CRMLead, ImportResponse } from '../../types/crm';
import { Download, RefreshCw, AlertCircle, CheckCircle2, Info, Clock, AlertTriangle, FileJson } from 'lucide-react';

interface ResultStepProps {
  result: ImportResponse;
  onReset: () => void;
}

export const ResultStep: React.FC<ResultStepProps> = ({ result, onReset }) => {
  const { records, skipped, stats } = result;
  const [activeTab, setActiveTab] = useState<'imported' | 'skipped'>('imported');

  const downloadJSON = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm_import_result_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-5xl mx-auto"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Import Summary</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Review mapped CRM fields, skip logs, and pipeline execution metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadJSON}
            className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-300 hover:text-white rounded-xl transition flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl transition font-medium flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Import Another
          </button>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* Total Imported Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden border border-zinc-800/80 rounded-2xl p-6 bg-zinc-950/40 backdrop-blur-md"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[40px] pointer-events-none rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Imported</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.totalImported}</div>
          <p className="text-xs text-zinc-400">Successfully mapped to CRM Leads</p>
        </motion.div>

        {/* Total Skipped Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden border border-zinc-800/80 rounded-2xl p-6 bg-zinc-950/40 backdrop-blur-md"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[40px] pointer-events-none rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Skipped</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.totalSkipped}</div>
          <p className="text-xs text-zinc-400">Invalid records/validation failures</p>
        </motion.div>

        {/* Processing Time Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden border border-zinc-800/80 rounded-2xl p-6 bg-zinc-950/40 backdrop-blur-md"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] pointer-events-none rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Processing Time</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {(stats.processingTimeMs / 1000).toFixed(2)}s
          </div>
          <p className="text-xs text-zinc-400">Total pipeline execution time</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-850 mb-6">
        <button
          onClick={() => setActiveTab('imported')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'imported'
              ? 'border-violet-500 text-white bg-zinc-900/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Imported Leads ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('skipped')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'skipped'
              ? 'border-violet-500 text-white bg-zinc-900/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Skipped Rows ({skipped.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'imported' && (
          <div className="space-y-4">
            {records.length > 0 ? (
              <div className="border border-zinc-800 rounded-2xl bg-zinc-950/40 overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-850 bg-zinc-900/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Company</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3">Country</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {records.map((lead, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/15 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-zinc-200">{lead.name}</td>
                          <td className="px-6 py-4 text-sm text-zinc-450 font-mono font-medium">{lead.email}</td>
                          <td className="px-6 py-4 text-sm text-zinc-400">{lead.company || '-'}</td>
                          <td className="px-6 py-4 text-sm text-zinc-400 font-mono">
                            {lead.country_code ? `${lead.country_code} ${lead.mobile_without_country_code}` : lead.mobile_without_country_code || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-450">{lead.country || lead.city || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-950/35 border border-violet-900/30 text-violet-300">
                              {lead.crm_status || 'New'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="border border-zinc-800/80 rounded-2xl p-12 text-center text-zinc-500 bg-zinc-950/40 backdrop-blur-md">
                <Info className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="font-semibold text-zinc-400 mb-1">No leads imported</p>
                <p className="text-xs max-w-xs mx-auto">Verify that the CSV columns map successfully to CRM Lead specifications.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'skipped' && (
          <div className="space-y-4">
            {skipped.length > 0 ? (
              <div className="space-y-3">
                {skipped.map((skip, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border border-rose-950/40 rounded-xl p-5 bg-rose-950/5 hover:bg-rose-950/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono font-semibold">
                          Row {skip.rowNumber}
                        </span>
                        <span className="text-sm font-semibold text-rose-300">
                          {skip.reason}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 font-medium">
                        Raw CSV Data: <span className="font-mono bg-zinc-950/60 px-1.5 py-0.5 rounded text-zinc-400">{JSON.stringify(skip.originalData)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-rose-400/80 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Validation Failed
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="border border-zinc-800/80 rounded-2xl p-12 text-center text-zinc-500 bg-zinc-950/40 backdrop-blur-md animate-pulse">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-4" />
                <p className="font-semibold text-zinc-400 mb-1">Clean Import!</p>
                <p className="text-xs max-w-xs mx-auto">Zero rows were skipped. Every row compiled and validated perfectly.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ResultStep;
