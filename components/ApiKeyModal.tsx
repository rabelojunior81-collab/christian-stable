import React, { useState } from 'react';
import { Key, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().length > 10) {
      onSave(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl px-6 animate-fade-in">
      <div className="w-full max-w-md glass-panel p-8 shadow-2xl shadow-gold-500/10 border-zinc-800 rounded-none">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-zinc-900 border border-gold-500/20 shadow-inner rounded-none">
            <Key className="w-8 h-8 text-gold-400" />
          </div>
        </div>
        
        <h2 className="text-3xl font-serif text-center text-white mb-3 font-light tracking-tight">
          Acesso ao Santuário
        </h2>
        <p className="text-zinc-400 text-center mb-8 text-sm leading-relaxed">
          Para acessar o Christian.ai, forneça sua chave de API do Google Gemini. 
          Ela será armazenada localmente no seu navegador e nunca enviada aos nossos servidores.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative group">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-zinc-950/50 border border-zinc-800 text-white px-5 py-4 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 outline-none transition-all font-mono text-sm placeholder-zinc-600 group-hover:border-zinc-700 rounded-none"
            />
          </div>
          
          <button 
            type="submit"
            disabled={inputKey.length < 10}
            className="w-full bg-gradient-to-br from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold py-4 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gold-900/20 rounded-none"
          >
            <ShieldCheck className="w-5 h-5" />
            Iniciar Jornada Espiritual
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-gold-400 underline decoration-zinc-700 underline-offset-4 transition-colors">
            Obter Chave de API Gemini
          </a>
        </div>
      </div>
    </div>
  );
};