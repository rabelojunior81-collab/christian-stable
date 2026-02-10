import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, RotateCcw, Sparkles, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { GeminiService } from '../geminiService';
import { ChatMessage } from '../types';

export const Confessional: React.FC = () => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Carrega mensagens do Dexie
  const history = useLiveQuery(() => db.messages.orderBy('timestamp').toArray(), []);

  const geminiService = useRef(new GeminiService());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userText = input;
    setInput('');
    
    // 1. Salva mensagem do usuário
    await db.messages.add({
      role: 'user',
      content: userText,
      timestamp: Date.now()
    });

    setIsStreaming(true);

    try {
      // Prepara histórico para a API
      const apiHistory = (history || []).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // 2. Placeholder da resposta
      const responseId = await db.messages.add({
        role: 'model',
        content: '', // Começa vazio
        timestamp: Date.now() + 1
      });

      let fullResponse = '';
      
      // 3. Stream da resposta
      const stream = geminiService.current.streamChat(apiHistory, userText);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        // Atualiza DB incrementalmente
        await db.messages.update(responseId, { content: fullResponse });
      }

    } catch (error) {
      console.error("Erro no Chat:", error);
      await db.messages.add({
        role: 'model',
        content: "Perdoe-me, encontrei uma perturbação espiritual (erro de rede). Por favor, tente novamente.",
        timestamp: Date.now()
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = async () => {
    if (window.confirm("Tem certeza de que deseja absolver este histórico de conversa?")) {
      await db.messages.clear();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] glass-panel overflow-hidden shadow-2xl rounded-none">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] rounded-none"></div>
          <h2 className="text-gold-400 font-serif tracking-wide text-lg">Confessionário AI</h2>
        </div>
        <button onClick={clearChat} className="p-2 text-zinc-500 hover:text-white transition-colors hover:bg-zinc-800 rounded-none" title="Limpar Histórico">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        {!history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-70">
                <div className="p-6 bg-zinc-900/50 mb-6 border border-zinc-800 rounded-none">
                    <Sparkles className="w-10 h-10 text-gold-500/40" />
                </div>
                <p className="font-serif text-base tracking-wide text-center max-w-md">
                  "Fala, Senhor, que teu servo escuta."<br/>
                  <span className="text-xs text-zinc-700 mt-2 block font-sans not-italic">Inicie sua direção espiritual.</span>
                </p>
            </div>
        ) : (
            history.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] p-5 text-sm md:text-base leading-relaxed shadow-md rounded-none ${
                msg.role === 'user' 
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80' 
                    : 'bg-royal-900/20 text-zinc-200 border border-royal-900/30 backdrop-blur-md'
                }`}>
                <div className="flex items-center gap-2 mb-3 opacity-60 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-gold-500" />}
                    {msg.role === 'user' ? 'Penitente' : 'Mentor'}
                </div>
                <div className="markdown-body font-light">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                </div>
            </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input */}
      <div className="p-5 bg-zinc-950 border-t border-zinc-800">
        <div className="relative flex items-center max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 focus-within:border-gold-500/30 focus-within:ring-1 focus-within:ring-gold-500/20 transition-all shadow-lg rounded-none">
          <button className="absolute left-4 text-zinc-500 hover:text-gold-400 transition-colors p-2 rounded-none">
            <Mic className="w-5 h-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Faça uma pergunta ou confesse um fardo..."
            disabled={isStreaming}
            className="w-full bg-transparent text-white pl-14 pr-14 py-4 outline-none resize-none h-[64px] custom-scrollbar placeholder-zinc-600 font-sans text-sm md:text-base rounded-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gold-600 hover:bg-gold-500 text-black p-2.5 disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all rounded-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center mt-3">
           <p className="text-[10px] text-zinc-600 font-medium tracking-wide uppercase">IA pode cometer erros. Consulte um sacerdote para confissão sacramental.</p>
        </div>
      </div>
    </div>
  );
};