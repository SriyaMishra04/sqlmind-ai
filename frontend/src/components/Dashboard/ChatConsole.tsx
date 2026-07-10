'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Database,
  Terminal,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useSQLMindStore } from '../../hooks/useSQLMindStore';
import { queryDatabase } from '../../lib/api';

interface ChatConsoleProps {
  onSelectTab: (tab: string) => void;
}

export default function ChatConsole({ onSelectTab }: ChatConsoleProps) {
  const {
    dbId,
    messages,
    isQuerying,
    settings,
    suggestedQuestions,
    addMessage,
    setIsQuerying,
    setActiveQueryResult,
    addHistoryItem,
  } = useSQLMindStore();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialPrompt = sessionStorage.getItem('initial_prompt');
      if (initialPrompt && dbId && !isQuerying) {
        sessionStorage.removeItem('initial_prompt');
        handleSend(initialPrompt);
      }
    }
  }, [dbId]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !dbId || isQuerying) return;

    setInput('');
    setIsQuerying(true);

    addMessage({
      role: 'user',
      text: textToSend,
    });

    try {
      const result = await queryDatabase(
        dbId,
        textToSend,
        settings.provider,
        settings.model,
        settings.apiKey
      );

      addMessage({
        role: 'assistant',
        text: result.success
          ? result.summary || 'Query executed successfully.'
          : result.error || 'Failed to complete query.',
        sql: result.sql,
        summary: result.summary,
        explanation: result.explanation,
        error: result.error,
        data: result.data,
        columns: result.columns,
        row_count: result.row_count,
        execution_time_ms: result.execution_time_ms,
        chart_suggestion: result.chart_suggestion,
      });

      setActiveQueryResult(result);

      if (result.sql) {
        addHistoryItem({
          id: Math.random().toString(36).substring(7),
          db_id: dbId,
          question: textToSend,
          sql: result.sql,
          timestamp: Date.now() / 1000,
          execution_time_ms: result.execution_time_ms || 0.0,
          status: result.success ? 'success' : 'error',
          is_favorite: false,
        });
      }

      if (result.success) {
        if (result.chart_suggestion) {
          onSelectTab('charts');
        } else {
          onSelectTab('answer');
        }
      } else {
        onSelectTab('sql');
      }

    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Error executing AI SQL query.';
      addMessage({
        role: 'assistant',
        text: 'An error occurred while generating or running the SQL query.',
        error: errMsg,
      });
      setActiveQueryResult({
        success: false,
        error: errMsg,
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectResult = (msg: any) => {
    setActiveQueryResult({
      success: !msg.error,
      sql: msg.sql,
      summary: msg.summary,
      explanation: msg.explanation,
      data: msg.data,
      columns: msg.columns,
      row_count: msg.row_count,
      execution_time_ms: msg.execution_time_ms,
      chart_suggestion: msg.chart_suggestion,
      error: msg.error,
    });
    if (msg.error) {
      onSelectTab('sql');
    } else if (msg.chart_suggestion) {
      onSelectTab('charts');
    } else {
      onSelectTab('answer');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full relative min-w-0 text-xs text-gray-800">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-gray-800 text-xs tracking-tight">AI Chat Console</span>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-500">
          <span>Active Model: {settings.model}</span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex w-full gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-xs mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
              )}

              <div className="flex flex-col gap-1.5 max-w-[80%] min-w-0">
                <div
                  className={`rounded-2xl p-4 leading-relaxed break-words shadow-xs border ${
                    isUser
                      ? 'bg-indigo-600 border-indigo-600 text-white text-sm font-semibold'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  {isUser ? (
                    msg.text
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* logic text */}
                      <p className="text-gray-800 text-sm whitespace-pre-wrap leading-normal font-sans">
                        {msg.text}
                      </p>

                      {/* SQL Code Block */}
                      {msg.sql && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden mt-1.5 flex flex-col shadow-xs bg-slate-50">
                          <div className="bg-slate-100 border-b border-gray-200 px-3.5 py-2 flex items-center justify-between font-bold text-[10px] text-gray-500">
                            <span className="font-mono">SQL QUERY</span>
                            <button
                              onClick={() => copyToClipboard(msg.sql!, msg.id)}
                              className="hover:text-indigo-600 flex items-center gap-1 transition font-bold"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3.5 overflow-x-auto text-[11px] font-mono text-gray-700 select-all leading-normal">
                            <code>{msg.sql}</code>
                          </pre>
                        </div>
                      )}

                      {/* Metrics Card */}
                      {msg.sql && (
                        <div className="flex flex-wrap gap-2.5 items-center mt-1">
                          {msg.error ? (
                            <div className="flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg font-bold text-[10.5px]">
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                              <span>Execution Failed</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold text-[10.5px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Executed</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 text-gray-500 bg-slate-100 border border-gray-200 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span>{msg.execution_time_ms}ms</span>
                              </div>
                              
                              {msg.row_count !== undefined && (
                                <div className="text-[10.5px] text-gray-500 bg-slate-100 border border-gray-200 px-2.5 py-1 rounded-lg font-semibold">
                                  <span>{msg.row_count} rows</span>
                                </div>
                              )}
                            </>
                          )}
                          
                          <button
                            onClick={() => handleSelectResult(msg)}
                            className="ml-auto py-1 px-2.5 bg-white hover:bg-slate-50 border border-gray-200 text-gray-700 rounded-lg flex items-center gap-1 transition text-[10.5px] font-bold shadow-xs hover:border-gray-300"
                          >
                            <span>Inspect results</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className={`text-[9.5px] text-gray-400 px-1 font-semibold ${isUser ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 border border-gray-300 text-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold shadow-xs">
                  U
                </div>
              )}
            </div>
          );
        })}

        {isQuerying && (
          <div className="flex w-full gap-3 justify-start animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-xs mt-0.5">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-2 max-w-[80%] min-w-[200px]">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span className="text-gray-500 font-bold text-xs">AI is drafting SQL...</span>
                </div>
                <div className="space-y-1.5 mt-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-[90%]" />
                  <div className="h-3.5 bg-slate-100 rounded w-[55%]" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Prompts suggestions cards */}
      {messages.length <= 1 && !isQuerying && (
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Suggested Prompts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="group flex items-center justify-between text-left p-3 rounded-lg bg-slate-50 border border-gray-250/70 hover:border-gray-300 hover:bg-white text-gray-600 hover:text-gray-800 transition shadow-xs"
              >
                <span className="pr-2 leading-relaxed text-[11px] font-bold truncate">{q}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input box bar */}
      <div className="p-4 bg-white border-t border-gray-200 shadow-sm relative">
        <div className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            placeholder={isQuerying ? "AI is processing..." : "Ask your database in plain English..."}
            disabled={isQuerying}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            className="w-full bg-slate-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-3 pl-4 pr-12 outline-none font-bold text-gray-800 placeholder-gray-400 text-xs transition shadow-xs"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isQuerying}
            className="absolute right-3 p-1.5 rounded-lg bg-indigo-600 disabled:bg-gray-100 disabled:text-gray-300 hover:bg-indigo-500 text-white transition shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
