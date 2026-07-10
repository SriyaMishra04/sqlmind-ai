'use client';

import React, { useState } from 'react';
import {
  Database,
  Table,
  ChevronDown,
  ChevronRight,
  Settings,
  History,
  Key,
  FolderOpen,
  ArrowLeftRight,
  LogOut,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useSQLMindStore } from '../../hooks/useSQLMindStore';

interface SidebarProps {
  onOpenSettings: () => void;
  activeView: 'chat' | 'schema' | 'history';
  setActiveView: (view: 'chat' | 'schema' | 'history') => void;
}

export default function Sidebar({ onOpenSettings, activeView, setActiveView }: SidebarProps) {
  const { filename, schemaInfo, tables, resetDb } = useSQLMindStore();
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const navItems = [
    { id: 'chat', label: 'AI Chat Console', icon: Database },
    { id: 'schema', label: 'Database Schema', icon: ArrowLeftRight },
    { id: 'history', label: 'Query History', icon: History },
  ] as const;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full select-none text-gray-700">
      
      {/* Database connection badge */}
      <div className="p-4 border-b border-gray-200 flex flex-col gap-2 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Active Database</span>
          <button
            onClick={resetDb}
            title="Disconnect database"
            className="p-1 rounded hover:bg-gray-200 hover:text-red-600 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl p-2.5 mt-1 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <FileSpreadsheet className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-800 truncate" title={filename || ''}>
              {filename}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold truncate">
              {tables.length} tables detected
            </div>
          </div>
        </div>
      </div>

      {/* Navigation options */}
      <div className="p-3 border-b border-gray-200 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 font-bold rounded-l-none'
                  : 'hover:bg-slate-50 hover:text-gray-900 text-gray-600'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Database Schema Explorer tree */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
          Schema Explorer
        </span>
        
        {schemaInfo && Object.keys(schemaInfo.tables).length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {Object.entries(schemaInfo.tables).map(([tableName, details]) => {
              const isExpanded = !!expandedTables[tableName];
              return (
                <div key={tableName} className="flex flex-col">
                  <button
                    onClick={() => toggleTable(tableName)}
                    className="w-full flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-50 text-left text-xs font-medium text-gray-700 hover:text-gray-900 transition"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <Table className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="truncate flex-1 font-semibold text-gray-800">{tableName}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-mono font-semibold">
                      {details.row_count}
                    </span>
                  </button>

                  {/* Schema fields tree */}
                  {isExpanded && (
                    <div className="ml-5 mt-1 border-l border-gray-100 pl-2.5 flex flex-col gap-0.5 py-0.5">
                      {details.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between text-[11px] py-1 text-gray-500"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {col.primary_key ? (
                              <Key className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            ) : (
                              <span className="w-2.5 h-2.5 border border-gray-200 rounded-sm flex items-center justify-center text-[7.5px] font-mono text-gray-400 font-bold bg-slate-50 flex-shrink-0">
                                #
                              </span>
                            )}
                            <span className="truncate font-mono text-gray-700" title={col.name}>
                              {col.name}
                            </span>
                          </div>
                          
                          <span className="text-[8.5px] text-gray-400 uppercase font-mono font-bold bg-gray-50 border border-gray-200/60 px-1 rounded-sm">
                            {col.type.split('(')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-gray-400 italic py-4">No schema loaded.</div>
        )}
      </div>

      {/* Settings Modal Toggle */}
      <div className="p-3 border-t border-gray-200 flex flex-col gap-1 bg-slate-50/50">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-gray-200 hover:shadow-xs transition"
        >
          <Settings className="w-4 h-4" />
          <span>LLM API Settings</span>
        </button>
        
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-600 transition"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Documentation</span>
        </a>
      </div>
    </div>
  );
}
