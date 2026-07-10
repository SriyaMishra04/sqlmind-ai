'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Key, Cpu, HelpCircle } from 'lucide-react';
import { useSQLMindStore } from '../../hooks/useSQLMindStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSQLMindStore();
  const [provider, setProvider] = useState<'gemini' | 'openai'>(settings.provider);
  const [model, setModel] = useState(settings.model);
  const [apiKey, setApiKey] = useState(settings.apiKey);

  useEffect(() => {
    if (isOpen) {
      setProvider(settings.provider);
      setModel(settings.model);
      setApiKey(settings.apiKey);
    }
  }, [isOpen, settings]);

  const handleSave = () => {
    updateSettings({
      provider,
      model,
      apiKey,
    });
    onClose();
  };

  const handleProviderChange = (newProvider: 'gemini' | 'openai') => {
    setProvider(newProvider);
    if (newProvider === 'gemini') {
      setModel('gemini-2.5-flash');
    } else {
      setModel('gpt-4o');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Soft Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60"
        />

        {/* Modal content card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.15 }}
          className="bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-lg relative z-10 overflow-hidden text-gray-800"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-sm text-gray-900">LLM Provider Configuration</h3>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5 flex flex-col gap-4 text-xs">
            {/* Provider Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-gray-600 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-gray-400" />
                API Provider
              </label>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => handleProviderChange('gemini')}
                  className={`py-2.5 px-3 rounded-lg border text-center font-bold transition ${
                    provider === 'gemini'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-500 hover:text-gray-700 shadow-xs'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  onClick={() => handleProviderChange('openai')}
                  className={`py-2.5 px-3 rounded-lg border text-center font-bold transition ${
                    provider === 'openai'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-500 hover:text-gray-700 shadow-xs'
                  }`}
                >
                  OpenAI GPT
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-gray-600">Model Version</label>
              {provider === 'gemini' ? (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-white border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-lg p-2.5 outline-none font-bold text-gray-800 shadow-xs transition"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Recommended)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (Accurate)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Speedy)</option>
                </select>
              ) : (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-white border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-lg p-2.5 outline-none font-bold text-gray-800 shadow-xs transition"
                >
                  <option value="gpt-4o">gpt-4o (Smartest & Recommended)</option>
                  <option value="gpt-4-turbo">gpt-4-turbo (Developer Model)</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo (Fast & Lightweight)</option>
                </select>
              )}
            </div>

            {/* API Key input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-gray-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-gray-400" />
                  Custom API Key
                </span>
                <span className="text-[10px] text-gray-400 font-normal italic">
                  Stored inside your browser
                </span>
              </label>
              
              <input
                type="password"
                placeholder={
                  provider === 'gemini'
                    ? 'Gemini API Key (starts with AQ... or AIza...)'
                    : 'OpenAI API Key (starts with sk-...)'
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-white border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-lg p-2.5 outline-none font-mono text-gray-800 shadow-xs transition"
              />
            </div>

            {/* Help Disclaimer */}
            <div className="mt-1 p-3 bg-slate-50 border border-gray-150 rounded-lg text-[10.5px] text-gray-500 flex gap-2 leading-relaxed">
              <HelpCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                Leave this key input blank to fallback to the default global key configured in the server's `.env` setup.
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-5 border-t border-gray-150 bg-slate-50/50 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition text-xs font-bold text-gray-500 bg-white shadow-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-sm text-white text-xs font-bold transition"
            >
              Save Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
