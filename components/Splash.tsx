
import React, { useState, useEffect } from 'react';

export const Splash: React.FC = () => {
  const [tributeText, setTributeText] = useState('');
  const fullMessage = "Descanse em Paz, ao lado do Pai, Vyvian... Até logo, 'Mate'.";

  useEffect(() => {
    // Start typing after 4 seconds (allowing the user to focus on the logo first)
    const startDelay = setTimeout(() => {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullMessage.length) {
          setTributeText(fullMessage.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 100); // 100ms per character for a slow, respectful pace (~6 seconds total typing time)

      return () => clearInterval(typingInterval);
    }, 4000);

    return () => clearTimeout(startDelay);
  }, []);

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center overflow-hidden select-none cursor-wait">
      <style>
        {`
          @keyframes slow-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes deep-breathe {
            0% { transform: scale(0.85); opacity: 0.3; filter: brightness(0.8); }
            50% { transform: scale(1.15); opacity: 0.7; filter: brightness(1.3); }
            100% { transform: scale(0.85); opacity: 0.3; filter: brightness(0.8); }
          }
          @keyframes shockwave {
            0% { transform: scale(1); opacity: 0; border-width: 2px; }
            20% { opacity: 0.5; }
            100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
          }
          @keyframes text-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes tribute-pulse {
            0%, 100% { opacity: 0.6; text-shadow: 0 0 5px rgba(234,179,8,0.3); }
            50% { opacity: 1; text-shadow: 0 0 15px rgba(234,179,8,0.8); }
          }
          .animate-spin-slow {
            animation: slow-spin 60s linear infinite;
          }
          .animate-breath-core {
            animation: deep-breathe 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          .animate-shockwave {
            animation: shockwave 4s cubic-bezier(0.1, 0, 0.3, 1) infinite;
          }
          .shimmer-text {
            background: linear-gradient(90deg, #71717a 0%, #eab308 50%, #71717a 100%);
            background-size: 200% auto;
            color: transparent;
            -webkit-background-clip: text;
            background-clip: text;
            animation: text-shimmer 6s ease-in-out infinite;
          }
          .tribute-glow {
             animation: tribute-pulse 3s ease-in-out infinite;
             color: #fde047; /* gold-300 */
          }
        `}
      </style>

      {/* Ambient Background - Subtle Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(30,27,75,0.2)_0%,_rgba(0,0,0,1)_70%)]"></div>

      {/* Layer 1: Rotating God Rays (Cinematic Texture) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
         <div className="w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0deg,_rgba(234,179,8,0.1)_20deg,_transparent_40deg,_rgba(234,179,8,0.1)_60deg,_transparent_80deg,_rgba(234,179,8,0.1)_100deg,_transparent_120deg)] animate-spin-slow mask-image-radial"></div>
      </div>

      <div className="relative flex flex-col items-center justify-center">
        
        {/* VISUAL CORE COMPOSITION */}
        <div className="relative w-64 h-64 flex items-center justify-center">
            
            {/* Layer 2: The Shockwave (Expanding Ring) */}
            <div className="absolute inset-0 border border-gold-500/30 rounded-full animate-shockwave"></div>
            <div className="absolute inset-0 border border-gold-500/20 rounded-full animate-shockwave" style={{ animationDelay: '1.5s' }}></div>

            {/* Layer 3: The Breathing Aura (Soft Glow) */}
            <div className="absolute inset-12 bg-gradient-to-tr from-gold-600/30 to-gold-900/10 rounded-full blur-2xl animate-breath-core"></div>
            
            {/* Layer 4: The Intense Core (Sharp Glow) */}
            <div className="absolute inset-20 bg-gold-500/20 rounded-full blur-xl animate-breath-core" style={{ animationDelay: '0.2s' }}></div>

            {/* Layer 5: The Logo Geometry (Sharp & Foreground) */}
            <div className="relative z-10">
                <div className="p-6 bg-black/50 backdrop-blur-sm border border-gold-500/20 rounded-none shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-gold-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">
                        <path d="M12 2L12 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                        <path d="M4 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                        <path d="M8 7H5L12 2L19 7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
                        <path d="M8 17H5L12 22L19 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
                    </svg>
                </div>
            </div>
        </div>
        
        {/* Typography Section */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDuration: '3s' }}>
          <h1 className="font-serif text-4xl tracking-tight font-bold text-white drop-shadow-2xl mb-4">
            christian.ai
          </h1>
          
          <div className="flex items-center justify-center gap-4">
             <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-zinc-700"></div>
             <p className="text-[10px] uppercase tracking-[0.4em] font-bold shimmer-text">
               By Rabelus
             </p>
             <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-zinc-700"></div>
          </div>
        </div>

      </div>

      {/* Tribute Section - Bottom Typewriter */}
      <div className="absolute bottom-16 md:bottom-12 text-center w-full px-8">
         <p className="font-serif text-xs italic tracking-[0.15em] h-6 tribute-glow">
           {tributeText}
           <span className={`ml-1 w-1 h-3 bg-gold-400 inline-block align-middle ${tributeText.length === fullMessage.length ? 'opacity-0' : 'animate-pulse'}`}></span>
         </p>
      </div>
    </div>
  );
};
