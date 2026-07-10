'use client';

import React, { useState, useEffect } from 'react';
import {
  Table as TableIcon,
  Terminal,
  FileText,
  BarChart3,
  Copy,
  Check,
  Play,
  Download,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { useSQLMindStore } from '../../hooks/useSQLMindStore';
import { executeDirectSQL } from '../../lib/api';
import AutoChart from '../Visualizations/AutoChart';

interface RightPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function RightPanel({ activeTab, setActiveTab }: RightPanelProps) {
  const { dbId, activeQueryResult, setActiveQueryResult, schemaInfo } = useSQLMindStore();
  const [sqlText, setSqlText] = useState('');
  const [copiedId, setCopiedId] = useState<'sql' | 'results' | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'area' | 'pie' | 'scatter' | null>(null);

  useEffect(() => {
    if (activeQueryResult?.sql) {
      setSqlText(activeQueryResult.sql);
      setExecError(null);
      setSelectedChartType(null);
    }
  }, [activeQueryResult]);

  const handleExecuteEditedSQL = async () => {
    if (!sqlText.trim() || !dbId || isExecuting) return;

    setIsExecuting(true);
    setExecError(null);

    try {
      const result = await executeDirectSQL(dbId, sqlText, 'SQL Editor Manual execution');
      setActiveQueryResult(result);
      if (!result.success) {
        setExecError(result.error || 'Execution failed.');
      } else {
        setActiveTab('answer');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Error executing custom SQL.';
      setExecError(errMsg);
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text: string, id: 'sql' | 'results') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (!activeQueryResult?.data || activeQueryResult.data.length === 0) return;

    const data = activeQueryResult.data;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const value = row[fieldName];
            const valStr = value !== null && value !== undefined ? String(value) : '';
            const escaped = valStr.replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
          })
          .join(',')
      ),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sqlmind_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartSuggestion = activeQueryResult?.chart_suggestion;
  const currentChartType = selectedChartType || chartSuggestion?.type;
  const resolvedChartSuggestion = chartSuggestion && currentChartType
    ? { ...chartSuggestion, type: currentChartType }
    : null;

  return (
    <div className="w-full lg:w-[480px] xl:w-[580px] bg-slate-50 border-l border-gray-200 flex flex-col h-full select-none text-gray-700 min-w-0">
      
      {/* Tab Row */}
      <div className="flex border-b border-gray-200 bg-white">
        {[
          { id: 'answer', label: 'Answer Table', icon: TableIcon },
          { id: 'sql', label: 'SQL Editor', icon: Terminal },
          { id: 'explanation', label: 'Logic', icon: FileText },
          { id: 'charts', label: 'Charts', icon: BarChart3 },
          { id: 'schema', label: 'Blueprint', icon: Database },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 border-b-2 text-xs font-bold tracking-tight transition ${
                isActive
                  ? 'border-indigo-600 text-indigo-650 bg-indigo-50/10'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-slate-50/50'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0 text-xs">
        
        {/* ANSWER GRID TAB */}
        {activeTab === 'answer' && (
          <div className="h-full flex flex-col gap-4">
            {activeQueryResult?.success && activeQueryResult.data && activeQueryResult.data.length > 0 ? (
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Query Results ({activeQueryResult.row_count} rows)
                  </span>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1 py-1.5 px-3 bg-white border border-gray-200 hover:border-gray-300 text-[10.5px] font-bold text-gray-700 rounded-lg shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-500" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Spreadsheet Table */}
                <div className="flex-1 border border-gray-200 rounded-xl overflow-auto bg-white shadow-xs min-h-0">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 z-10">
                      <tr>
                        {activeQueryResult.columns?.map((col) => (
                          <th
                            key={col}
                            className="p-3 font-mono text-[10px] text-gray-500 font-bold tracking-tight bg-slate-50 uppercase border-r border-gray-200/60 last:border-0"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 font-mono text-[11px] text-gray-700">
                      {activeQueryResult.data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 odd:bg-white even:bg-slate-50/20">
                          {activeQueryResult.columns?.map((col) => {
                            const val = row[col];
                            return (
                              <td
                                key={col}
                                className="p-3 truncate max-w-xs border-r border-gray-200/60 last:border-0"
                                title={val !== null ? String(val) : 'NULL'}
                              >
                                {val === null ? (
                                  <span className="text-gray-400 italic">NULL</span>
                                ) : typeof val === 'boolean' ? (
                                  val ? 'TRUE' : 'FALSE'
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeQueryResult && !activeQueryResult.success ? (
              <div className="h-full flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl bg-white text-center shadow-xs">
                <AlertTriangle className="w-8 h-8 text-red-500 mb-3 animate-pulse" />
                <h4 className="font-bold text-sm text-gray-900">Query Failed to Execute</h4>
                <p className="text-gray-500 mt-1.5 max-w-sm leading-normal">
                  SQLite engine raised an error. Click on the <strong>SQL Editor</strong> tab to adjust the statement.
                </p>
                <div className="mt-4 p-3.5 bg-red-50 border border-red-150 text-red-700 rounded-lg font-mono text-left max-w-sm overflow-x-auto text-[10.5px] leading-relaxed shadow-xs">
                  {activeQueryResult.error}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center py-16 bg-white border border-gray-200 rounded-xl shadow-xs">
                <TableIcon className="w-10 h-10 text-gray-300 mb-3.5" />
                <h4 className="font-bold text-gray-700 text-xs">No Active Result</h4>
                <p className="text-gray-400 mt-1 max-w-xs leading-normal">
                  Write a prompt in the chat console to generate and inspect data.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SQL EDITOR TAB */}
        {activeTab === 'sql' && (
          <div className="h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                SQL Query Statement
              </span>
              {activeQueryResult?.sql && (
                <button
                  onClick={() => copyToClipboard(sqlText, 'sql')}
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-white border border-gray-200 hover:border-gray-300 text-[10.5px] font-bold text-gray-700 rounded-lg shadow-xs transition"
                >
                  {copiedId === 'sql' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* SQL edit text container */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <textarea
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                placeholder="SELECT * FROM table LIMIT 10;"
                className="w-full flex-1 bg-white border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-xl p-4 font-mono text-[11.5px] text-indigo-750 outline-none resize-none leading-relaxed shadow-xs"
              />

              {execError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 font-mono text-[10.5px] shadow-xs">
                  <strong>Error:</strong> {execError}
                </div>
              )}

              <button
                onClick={handleExecuteEditedSQL}
                disabled={isExecuting || !sqlText.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-sm transition text-xs"
              >
                {isExecuting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                    <span>Executing SQL Statement...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4.5 h-4.5" fill="white" />
                    <span>Run SQL Statement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* LOGIC EXPLANATION TAB */}
        {activeTab === 'explanation' && (
          <div className="h-full flex flex-col gap-4">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              AI Query Logic
            </span>
            {activeQueryResult?.explanation ? (
              <div className="flex flex-col gap-4 bg-white border border-gray-200 rounded-xl p-5 text-gray-700 leading-relaxed shadow-xs font-sans text-xs">
                <div>
                  <h4 className="font-bold text-gray-800 text-[10.5px] uppercase mb-1.5 text-indigo-600 tracking-wider">Retrieved Concept</h4>
                  <p className="font-semibold text-gray-800">{activeQueryResult.summary}</p>
                </div>
                <div className="border-t border-gray-150 pt-3.5">
                  <h4 className="font-bold text-gray-800 text-[10.5px] uppercase mb-2.5 text-indigo-600 tracking-wider">Step-by-step logic</h4>
                  <div className="whitespace-pre-wrap leading-relaxed text-gray-600 font-medium">{activeQueryResult.explanation}</div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center py-16 bg-white border border-gray-200 rounded-xl shadow-xs">
                <FileText className="w-8 h-8 text-gray-300 mb-2" />
                <span>No logic description found.</span>
              </div>
            )}
          </div>
        )}

        {/* CHARTS TAB */}
        {activeTab === 'charts' && (
          <div className="h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Visual Analytics Chart
              </span>
              
              {resolvedChartSuggestion && (
                <div className="flex gap-1">
                  {['bar', 'line', 'area', 'pie', 'scatter'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedChartType(t as any)}
                      className={`text-[9.5px] px-2 py-1 rounded-md border font-bold uppercase transition ${
                        currentChartType === t
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700 shadow-xs'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeQueryResult?.success && activeQueryResult.data && resolvedChartSuggestion ? (
              <div className="flex-1 min-h-[350px] bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <AutoChart data={activeQueryResult.data} suggestion={resolvedChartSuggestion as any} />
              </div>
            ) : activeQueryResult?.success && activeQueryResult.data ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center p-6 border border-gray-200 rounded-xl bg-white shadow-xs">
                <BarChart3 className="w-10 h-10 text-gray-300 mb-3.5" />
                <h4 className="font-bold text-gray-700 text-xs">Visuals Unavailable</h4>
                <p className="text-gray-450 mt-1 max-w-xs leading-normal">
                  The query result dataset does not contain columns or values suitable for auto charting.
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center py-16 bg-white border border-gray-200 rounded-xl shadow-xs">
                <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
                <span>Execute a query to view chart suggestions.</span>
              </div>
            )}
          </div>
        )}

        {/* BLUEPRINT SCHEMA TAB */}
        {activeTab === 'schema' && (
          <div className="h-full flex flex-col gap-4">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Database Blueprint Schema
            </span>
            {schemaInfo && Object.keys(schemaInfo.tables).length > 0 ? (
              <div className="flex flex-col gap-4 overflow-y-auto">
                {Object.entries(schemaInfo.tables).map(([tableName, details]) => (
                  <div key={tableName} className="border border-gray-200 rounded-xl bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-150 pb-2">
                      <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                        <TableIcon className="w-3.5 h-3.5 text-indigo-500" />
                        {tableName}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">{details.row_count} rows</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {details.columns.map((c) => (
                        <div key={c.name} className="flex justify-between p-2 rounded bg-slate-50 border border-gray-150/60 text-gray-600 font-mono">
                          <span className="text-gray-850 font-bold">{c.name}</span>
                          <span className="text-gray-400 text-[9.5px] uppercase font-bold">{c.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center py-16 bg-white border border-gray-200 rounded-xl shadow-xs">
                <TableIcon className="w-8 h-8 text-gray-300 mb-2" />
                <span>No schema blueprints found.</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
