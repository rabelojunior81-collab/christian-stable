import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Sparkles, Bot, Flame, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { GeminiService } from '../geminiService';
import { userService } from '../services/userService';
import { UserProfile } from '../types';

export const Christian: React.FC = () => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Carrega mensagens
  const history = useLiveQuery(() => db.messages.orderBy('timestamp').toArray(), []);

  const geminiService = useRef(new GeminiService());

  useEffect(() => {
    userService.getUser().then(setUser);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, isStreaming]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userText = input;
    setInput('');
    
    await db.messages.add({
      role: 'user',
      content: userText,
      timestamp: Date.now()
    });

    setIsStreaming(true);

    try {
      const apiHistory = (history || []).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const responseId = await db.messages.add({
        role: 'model',
        content: '',
        timestamp: Date.now() + 1
      });

      let fullResponse = '';
      const stream = geminiService.current.streamChat(apiHistory, userText, user?.name || "Alma devota");
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        await db.messages.update(responseId, { content: fullResponse });
      }

    } catch (error) {
      console.error("Erro no Chat:", error);
      await db.messages.add({
        role: 'model',
        content: "Sinto uma desconexão momentânea. Por favor, compartilhe seu pensamento novamente.",
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
    if (window.confirm("Deseja iniciar uma nova jornada de conversa?")) {
      await db.messages.clear();
    }
  };

  const handleChangeUser = async () => {
      if (window.confirm("Deseja trocar de usuário? Isso reiniciará a jornada.")) {
          await userService.clearUser();
          window.location.reload(); // Simples reload para voltar ao onboarding
      }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] glass-panel overflow-hidden shadow-2xl rounded-none border-gold-500/10">
      
      {/* Cabeçalho - Christian Branding */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center rounded-none shadow-inner">
             <Flame className="w-5 h-5 text-gold-500" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-zinc-100 font-serif tracking-wide text-lg font-bold">Christian</h2>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold-600 font-bold">Guia Espiritual</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button onClick={handleChangeUser} className="p-3 text-zinc-500 hover:text-white transition-colors hover:bg-zinc-800/50 rounded-none" title="Trocar Usuário">
                <Settings className="w-4 h-4" />
            </button>
            <button onClick={clearChat} className="p-3 text-zinc-500 hover:text-white transition-colors hover:bg-zinc-800/50 rounded-none" title="Nova Conversa">
                <RotateCcw className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-[#0c0c0e]">
        {!history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                <div className="w-24 h-24 mb-8 relative">
                    <div className="absolute inset-0 bg-gold-500/20 blur-3xl rounded-full animate-pulse-slow"></div>
                    <div className="relative w-full h-full border border-zinc-800 bg-black/50 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-gold-500" />
                    </div>
                </div>
                <h3 className="font-serif text-2xl text-zinc-300 mb-3">A Paz esteja convosco, {user?.name}.</h3>
                <p className="text-sm md:text-base text-zinc-500 text-center max-w-md leading-relaxed font-light">
                  Sou Christian, seu mentor nesta jornada. <br/>
                  Podemos conversar sobre teologia, dilemas morais,<br/> história da Igreja ou aprofundar sua fé.
                </p>
                
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                   <button onClick={() => setInput("Como posso melhorar minha vida de oração?")} className="p-4 border border-zinc-800 hover:border-gold-500/30 hover:bg-zinc-900 text-xs text-zinc-400 hover:text-gold-100 text-left transition-all">
                      "Como posso melhorar minha vida de oração?"
                   </button>
                   <button onClick={() => setInput("Qual o sentido cristão do sofrimento?")} className="p-4 border border-zinc-800 hover:border-gold-500/30 hover:bg-zinc-900 text-xs text-zinc-400 hover:text-gold-100 text-left transition-all">
                      "Qual o sentido cristão do sofrimento?"
                   </button>
                </div>
            </div>
        ) : (
            history.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
                <div className={`max-w-[90%] md:max-w-[80%] relative ${msg.role === 'user' ? '' : 'pl-4'}`}>
                    
                    {msg.role === 'model' && (
                        <div className="absolute -left-8 top-0 w-6 h-6 flex items-center justify-center">
                             <Flame className="w-4 h-4 text-gold-600/50" />
                        </div>
                    )}

                    <div className={`p-6 text-sm md:text-base shadow-sm rounded-none border-l-2 ${
                    msg.role === 'user' 
                        ? 'bg-zinc-900 text-zinc-200 border-zinc-700 border-l-0 border-r-2' 
                        : 'bg-transparent text-zinc-300 border-gold-500/50'
                    }`}>
                        <div className="font-serif">
                            {/* Tipografia Refatorada para o Chat */}
                            <ReactMarkdown components={{
                                p: ({node, ...props}) => <p className="mb-4 leading-loose text-zinc-300 text-justify last:mb-0" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-gold-400" {...props} />,
                                em: ({node, ...props}) => <em className="italic text-zinc-400 font-light" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 text-zinc-400 marker:text-gold-600" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-zinc-400 marker:text-gold-600" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-gold-600/50 pl-4 py-2 my-4 italic text-zinc-500 bg-zinc-900/30" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gold-100 mt-6 mb-3 border-b border-zinc-800 pb-2" {...props} />
                            }}>
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                    
                    <span className="text-[9px] text-zinc-700 mt-2 block uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        {msg.role === 'user' ? 'Você' : 'Christian'}
                    </span>
                </div>
            </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input */}
      <div className="p-5 bg-black border-t border-zinc-800">
        <div className="relative flex items-end max-w-4xl mx-auto bg-zinc-900/30 border border-zinc-800 focus-within:border-gold-500/30 focus-within:bg-zinc-900/50 transition-all shadow-lg rounded-none">
          <div className="pl-4 py-4 text-zinc-600">
             <Sparkles className="w-5 h-5" />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva sua dúvida ou reflexão..."
            disabled={isStreaming}
            className="w-full bg-transparent text-white px-4 py-4 outline-none resize-none h-[60px] max-h-[120px] custom-scrollbar placeholder-zinc-600 font-sans text-sm md:text-base rounded-none"
          />
          <div className="pr-3 py-3">
            <button 
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="bg-zinc-100 hover:bg-white text-black p-2 disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all rounded-none"
            >
                <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-center mt-3 flex items-center justify-center gap-2">
           <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
           <p className="text-[9px] text-zinc-600 font-bold tracking-[0.2em] uppercase">Online • Guia via Gemini 2.5</p>
        </div>
      </div>
    </div>
  );
};