'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  Star,
  Search,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  ArrowRight,
} from 'lucide-react';
import Sidebar from './Sidebar';
import ChatConsole from './ChatConsole';
import RightPanel from './RightPanel';
import SettingsModal from './SettingsModal';
import { useSQLMindStore, HistoryItem } from '../../hooks/useSQLMindStore';
import { deleteHistoryItem, toggleFavoriteHistory, clearDatabaseHistory } from '../../lib/api';

export default function DashboardLayout() {
  const [activeView, setActiveView] = useState<'chat' | 'schema' | 'history'>('chat');
  const [activeTab, setActiveTab] = useState<string>('answer');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  const {
    dbId,
    history,
    schemaInfo,
    setActiveQueryResult,
    deleteHistoryItem: localDeleteHistory,
    toggleFavoriteHistory: localToggleFavorite,
    setHistory,
  } = useSQLMindStore();

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setActiveQueryResult({
      success: item.status === 'success',
      sql: item.sql,
      summary: 'Historical query statement reload.',
      explanation: 'Reloaded query from history database log.',
      data: [],
      columns: [],
      error: item.status === 'error' ? 'Run SQL query inside the SQL Editor to inspect errors.' : undefined,
    });
    setActiveView('chat');
    setActiveTab('sql');
  };

  const handleDeleteHistory = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteHistoryItem(itemId);
      localDeleteHistory(itemId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavoriteHistory(itemId);
      localToggleFavorite(itemId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = async () => {
    if (!dbId) return;
    if (confirm('Are you sure you want to clear all history for this database?')) {
      try {
        await clearDatabaseHistory(dbId);
        setHistory([]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredHistory = history.filter((item) =>
    item.question.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
    item.sql.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-gray-800 font-sans">
      
      {/* 1. Left Sidebar */}
      <Sidebar
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* 2. Middle Panel (Chat, Full Schema blueprint details, or History list) */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full border-r border-gray-200">
        
        {activeView === 'chat' && (
          <ChatConsole onSelectTab={setActiveTab} />
        )}

        {activeView === 'schema' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto w-full text-xs">
            <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 font-sans">Database Schema Blueprint</h2>
                <p className="text-gray-500 mt-1">Detailed documentation of detected relational integrity and tables.</p>
              </div>
            </div>

            {schemaInfo && Object.keys(schemaInfo.tables).length > 0 ? (
              <div className="flex flex-col gap-6 max-w-4xl">
                {/* Relationships card */}
                {schemaInfo.relationships && schemaInfo.relationships.length > 0 && (
                  <div className="border border-gray-200 bg-white rounded-xl p-5 shadow-xs">
                    <h3 className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-3">Detected Table Joins</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {schemaInfo.relationships.map((rel, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-3 bg-slate-50 border border-gray-150 rounded-lg text-gray-700 font-mono text-[11px]"
                        >
                          <span className="text-indigo-650 font-bold">{rel.from_table}</span>
                          <span className="text-gray-400">.{rel.from_column}</span>
                          <span className="text-gray-400 font-bold">→</span>
                          <span className="text-violet-650 font-bold">{rel.to_table}</span>
                          <span className="text-gray-400">.{rel.to_column}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Object.entries(schemaInfo.tables).map(([tableName, details]) => (
                    <div key={tableName} className="border border-gray-200 bg-white rounded-xl p-5 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-gray-150 pb-2.5">
                        <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                          <Database className="w-4.5 h-4.5 text-indigo-500" />
                          {tableName}
                        </span>
                        <span className="text-[10px] text-gray-450 bg-slate-50 border border-gray-200 px-2.5 py-0.5 rounded-full font-bold">
                          {details.row_count} records
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-1">
                        {details.columns.map((c) => (
                          <div
                            key={c.name}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 border border-gray-100 hover:border-gray-200 font-mono text-[11px] transition-all"
                          >
                            <span className="font-bold text-gray-700">{c.name}</span>
                            <span className="text-gray-400 uppercase font-bold text-[9.5px]">{c.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 italic py-10">No tables discovered in schema blueprint.</div>
            )}
          </div>
        )}

        {activeView === 'history' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto w-full text-xs min-h-0">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 font-sans">Query Audit Logs</h2>
                <p className="text-gray-500 mt-1">Browse, rerun, and inspect historical AI-generated queries.</p>
              </div>
              
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-red-600 hover:text-white border border-red-200 hover:border-red-600 bg-red-50/50 hover:bg-red-600 rounded-lg font-bold self-start sm:self-center transition shadow-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear History Logs</span>
                </button>
              )}
            </div>

            {/* Filter Logs Input */}
            {history.length > 0 && (
              <div className="relative mb-5 flex items-center max-w-xl">
                <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Filter logs by keywords or query commands..."
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 outline-none font-bold text-gray-700 placeholder-gray-400 transition text-xs shadow-xs"
                />
              </div>
            )}

            {/* History Logs cards */}
            {filteredHistory.length > 0 ? (
              <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1 max-w-3xl">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className="group bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4.5 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4 transition shadow-xs justify-between"
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        {item.status === 'success' ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                        )}
                        <h4 className="font-bold text-gray-800 text-sm truncate font-sans">{item.question}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <code className="text-indigo-600 font-mono text-[10.5px] truncate">{item.sql}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 justify-end flex-shrink-0">
                      <div className="flex items-center gap-1 text-[10.5px] text-gray-400 font-bold">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.execution_time_ms}ms</span>
                      </div>

                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        className={`p-1.5 rounded-lg border transition ${
                          item.is_favorite
                            ? 'border-amber-250 bg-amber-50 text-amber-600'
                            : 'border-gray-200 bg-white text-gray-400 hover:text-gray-700 shadow-xs'
                        }`}
                        title={item.is_favorite ? 'Remove Favorite' : 'Save to Favorites'}
                      >
                        <Star className="w-3.5 h-3.5" fill={item.is_favorite ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition shadow-xs"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-xs italic text-gray-400 font-medium">
                {history.length > 0 ? 'No matching logs found.' : 'Log list is empty.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Right Output Panel */}
      <RightPanel activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
