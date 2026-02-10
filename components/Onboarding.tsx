import React, { useState } from 'react';
import { ChevronRight, User } from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 0) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              A Paz esteja <br/> convosco.
            </h2>
            <p className="text-zinc-400 font-light leading-relaxed">
              Sou Christian, seu guia espiritual.<br/>
              Como devo chamá-lo nesta jornada?
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="relative group">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold-500 transition-colors">
                <User className="w-5 h-5" />
             </div>
             <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-zinc-900/50 border-b border-zinc-700 focus:border-gold-500 text-white pl-12 pr-4 py-4 text-lg outline-none transition-all text-center font-serif placeholder-zinc-700 rounded-none"
                autoFocus
             />
           </div>

           <button 
             type="submit"
             disabled={name.trim().length === 0}
             className="w-full py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
           >
             Iniciar Jornada
             <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-gold-500" />
           </button>
        </form>
      </div>
    </div>
  );
};