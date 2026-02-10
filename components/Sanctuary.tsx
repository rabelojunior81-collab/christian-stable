import React, { useEffect, useState } from 'react';
import { Calendar, BookOpen, Award, Sun, ChevronRight, ChevronLeft, Loader2, Flame, ExternalLink } from 'lucide-react';
import { DailySaint, Liturgy, UserStats } from '../types';
import { userService } from '../services/userService';
import { GeminiService } from '../geminiService';
import { BIBLE_BOOKS } from '../data/bibleBooks';

interface SanctuaryProps {
  onNavigateToBible: (book: string, chapter: number) => void;
}

export const Sanctuary: React.FC<SanctuaryProps> = ({ onNavigateToBible }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [liturgy, setLiturgy] = useState<Liturgy | null>(null);
  const [isLoadingLiturgy, setIsLoadingLiturgy] = useState(true);
  const [dateOffset, setDateOffset] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      // Load Streak Stats (only once)
      if (!stats) {
        const userStats = await userService.getStats();
        setStats(userStats);
      }

      // Load Liturgy based on dateOffset
      setIsLoadingLiturgy(true);
      setLiturgy(null); // Clear previous to show loading
      
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dateOffset);
      const dateStr = targetDate.toISOString().split('T')[0];

      const gemini = new GeminiService();
      
      try {
        const dailyLiturgy = await gemini.getDailyLiturgy(dateStr);
        setLiturgy(dailyLiturgy);
      } catch (err) {
        console.error("Failed to load liturgy");
      } finally {
        setIsLoadingLiturgy(false);
      }
    };

    loadData();
  }, [dateOffset]);

  const handleDateChange = (change: number) => {
    setDateOffset(prev => prev + change);
  };

  // Parse Reference (e.g., "Jo 18,33" -> Book: "João", Chapter: 18)
  const handleShortcutClick = () => {
    if (!liturgy || !liturgy.gospelReference) return;
    
    const ref = liturgy.gospelReference.trim();
    // Attempt to find book match
    // Sort by length desc to match "1 Jo" before "Jo"
    const sortedBooks = [...BIBLE_BOOKS].sort((a, b) => b.abbrev.length - a.abbrev.length);
    
    // Simple parsing logic: Look for matching abbreviation at start of string
    // Example: "Mt 5,1" -> starts with "mt" (from data) check against "Mt"
    const foundBook = sortedBooks.find(b => ref.toLowerCase().startsWith(b.abbrev.toLowerCase()) || ref.toLowerCase().startsWith(b.name.toLowerCase().substring(0, 3)));

    if (foundBook) {
        // Extract chapter
        // Remove book part
        let remaining = ref.substring(foundBook.abbrev.length).trim();
        // If reference used full name or slight variation, we might need regex, but let's try simple digit extraction
        const match = ref.match(/(\d+)[,:]/); // Find first number followed by comma or colon
        
        if (match && match[1]) {
            const chapter = parseInt(match[1]);
            onNavigateToBible(foundBook.name, chapter);
        } else {
             // Fallback: if logic fails, go to book chapter 1
             onNavigateToBible(foundBook.name, 1);
        }
    } else {
        // Fallback generic
        console.warn("Could not parse book from reference:", ref);
    }
  };

  if (!stats) return null;

  return (
    <div className="animate-fade-in pb-24 md:pb-12 -mt-6 md:-mt-12 md:-mx-12">
      
      {/* Hero Header Section */}
      <div className="relative h-64 w-full bg-zinc-950 overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=2741&auto=format&fit=crop')] bg-cover bg-[center_30%] opacity-30 grayscale mix-blend-luminosity"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/40 to-[#09090b]"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 flex flex-col justify-end h-full">
             <div className="flex items-center gap-2 text-gold-500 mb-3 opacity-90">
                <Sun className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold">Liturgia Diária</span>
             </div>
             <h1 className="text-3xl md:text-5xl font-serif text-white tracking-tight drop-shadow-lg">
               Santuário
             </h1>
             <p className="text-zinc-400 text-xs md:text-sm mt-3 font-light max-w-md leading-relaxed border-l-2 border-gold-600 pl-4">
               "Tarde te amei, ó beleza tão antiga e tão nova! Tarde te amei!"
             </p>
          </div>
      </div>

      {/* Date Bar (ATALHO) */}
      <div className="bg-[#0c0c0e] border-b border-zinc-800 py-3 px-4 md:px-12 flex items-center justify-between shadow-lg relative z-10">
         <div className="flex items-center gap-4">
             {/* Navigation Controls */}
             <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-none">
                 <button 
                    onClick={() => handleDateChange(-1)} 
                    disabled={isLoadingLiturgy}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30"
                    title="Dia Anterior"
                 >
                    <ChevronLeft className="w-4 h-4" />
                 </button>
                 <div className="w-[1px] h-4 bg-zinc-800"></div>
                 <button 
                    onClick={() => handleDateChange(1)} 
                    disabled={isLoadingLiturgy}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30"
                    title="Próximo Dia"
                 >
                    <ChevronRight className="w-4 h-4" />
                 </button>
             </div>

             <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold-600" />
                <span className="text-[10px] md:text-xs font-bold text-zinc-300 uppercase tracking-[0.15em] line-clamp-1">
                    {liturgy ? liturgy.formattedDate : <span className="animate-pulse w-32 h-2 bg-zinc-800 block rounded"></span>}
                </span>
             </div>
         </div>
         
         {liturgy?.liturgicalColor && (
             <div className="hidden md:flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${liturgy.liturgicalColor.toLowerCase().includes('verde') ? 'bg-green-600' : liturgy.liturgicalColor.toLowerCase().includes('vermelho') ? 'bg-red-600' : liturgy.liturgicalColor.toLowerCase().includes('roxo') ? 'bg-purple-600' : 'bg-white'}`}></div>
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{liturgy.liturgicalColor}</span>
             </div>
         )}
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-12 space-y-16">
        
        {/* Liturgy Card - Real Data with Pertinent Generated Image */}
        <div className="relative bg-[#0c0c0e] border border-zinc-800 overflow-hidden group shadow-2xl shadow-black/50 flex flex-col">
           
           {isLoadingLiturgy ? (
               <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                  <span className="text-xs text-zinc-500 uppercase tracking-widest animate-pulse text-center">
                    Consultando o Missal e<br/>Manifestando a Visão...
                  </span>
               </div>
           ) : (
               <>
                   {/* Generated Image Header with SHORTCUT CLICK */}
                   {/* Strategy: Mobile stays h-48 (Banner). Desktop uses h-96 to achieve ~16:9 Aspect Ratio on max-w-2xl */}
                   <div 
                     onClick={handleShortcutClick}
                     className="relative h-48 md:h-96 w-full overflow-hidden bg-zinc-900 cursor-pointer group/img"
                     title={`Ir para o Evangelho: ${liturgy?.gospelReference}`}
                   >
                        <div className="absolute inset-0 bg-black/30 z-10 group-hover/img:bg-black/10 transition-colors"></div>
                        
                        {/* Visual Hint for Interaction */}
                        <div className="absolute top-4 right-4 z-30 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 backdrop-blur px-3 py-1 border border-white/10 rounded-none">
                             <span className="text-[10px] text-white uppercase tracking-wider font-bold flex items-center gap-2">
                                <ExternalLink className="w-3 h-3" /> Abrir na Bíblia
                             </span>
                        </div>

                        {liturgy?.generatedImage ? (
                             <img 
                                src={liturgy.generatedImage} 
                                alt="Liturgical Vision" 
                                className="w-full h-full object-cover transition-transform duration-[20s] group-hover/img:scale-110 animate-fade-in"
                             />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                <BookOpen className="w-12 h-12 text-zinc-800" />
                            </div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-[#0c0c0e] to-transparent">
                            <div className="flex items-center gap-3 mb-1">
                                <BookOpen className="w-5 h-5 text-gold-500" />
                                <h2 className="text-2xl font-serif text-gold-100 tracking-wide">Liturgia da Palavra</h2>
                            </div>
                            {liturgy?.liturgicalTime && (
                                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold pl-8">{liturgy.liturgicalTime}</span>
                            )}
                        </div>
                   </div>

                   <div className="p-8 md:p-10 space-y-12 relative bg-[#0c0c0e]">
                     {/* Reading 1 */}
                     <div className="group/item relative">
                        <div className="absolute -left-4 top-1 w-0.5 h-full bg-zinc-800 group-hover/item:bg-gold-500/50 transition-colors"></div>
                        <div className="flex justify-between items-baseline mb-3">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] group-hover/item:text-gold-500 transition-colors">Primeira Leitura</h3>
                            <span className="text-[10px] font-mono text-zinc-600">{liturgy?.reading1Reference}</span>
                        </div>
                        <p className="text-sm md:text-base font-serif text-zinc-300 leading-relaxed text-justify">{liturgy?.reading1}</p>
                     </div>

                     {/* Psalm */}
                     <div className="group/item relative">
                        <div className="absolute -left-4 top-1 w-0.5 h-full bg-zinc-800 group-hover/item:bg-gold-500/50 transition-colors"></div>
                        <div className="flex justify-between items-baseline mb-3">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] group-hover/item:text-gold-500 transition-colors">Salmo Responsorial</h3>
                            <span className="text-[10px] font-mono text-zinc-600">{liturgy?.psalmReference}</span>
                        </div>
                        <p className="text-lg md:text-xl font-serif text-zinc-400 italic leading-relaxed text-center px-4 border-l-2 border-zinc-800 pl-6">{liturgy?.psalm}</p>
                     </div>

                     {/* Gospel */}
                     <div className="group/item relative">
                        <div className="absolute -left-4 top-1 w-0.5 h-full bg-zinc-800 group-hover/item:bg-gold-500/50 transition-colors"></div>
                        <div className="flex justify-between items-baseline mb-3">
                            <h3 className="text-[10px] font-bold text-gold-700 uppercase tracking-[0.2em] group-hover/item:text-gold-500 transition-colors">Evangelho</h3>
                            <span className="text-[10px] font-mono text-zinc-600">{liturgy?.gospelReference}</span>
                        </div>
                        <p className="text-base md:text-lg font-serif text-white leading-relaxed text-justify border-l-2 border-gold-900/30 pl-4">{liturgy?.gospel}</p>
                     </div>
                  </div>
                  
                  <div className="bg-[#0c0c0e] px-10 pb-8 flex justify-end">
                     <button 
                        onClick={handleShortcutClick}
                        className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-[0.15em] font-bold group/btn"
                     >
                        Ler na Bíblia <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                     </button>
                  </div>
               </>
           )}
        </div>

        {/* Streak Section - Gamified & Motivational */}
        <div className="flex flex-col items-center justify-center text-center pb-12 border-b border-zinc-900">
            <div className="relative mb-6 group cursor-help">
               {/* Outer Glow based on streak */}
               <div className={`absolute inset-0 bg-gold-500 blur-2xl rounded-full transition-opacity duration-1000 ${stats.currentStreak > 1 ? 'opacity-20' : 'opacity-5'}`}></div>
               
               <div className="w-24 h-24 bg-[#0c0c0e] border border-zinc-800 flex items-center justify-center relative z-10 shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                   <div className="absolute inset-0 border border-gold-500/10 rotate-45 group-hover:rotate-90 transition-transform duration-700"></div>
                   <Flame className={`w-8 h-8 ${stats.currentStreak > 0 ? 'text-gold-500 fill-gold-500/20' : 'text-zinc-700'}`} />
               </div>
               
               {/* Badge de Recorde */}
               {stats.currentStreak >= stats.maxStreak && stats.maxStreak > 1 && (
                   <div className="absolute -top-2 -right-2 bg-gold-600 text-black text-[9px] font-bold px-2 py-1 uppercase tracking-wider shadow-lg animate-bounce">
                       Recorde!
                   </div>
               )}
            </div>

            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Perseverança Espiritual</span>
               <div className="flex items-baseline gap-2">
                  <span className="font-serif text-6xl text-transparent bg-clip-text bg-gradient-to-b from-gold-100 to-gold-600">{stats.currentStreak}</span>
                  <span className="text-sm text-zinc-500 font-light uppercase tracking-widest">Dias</span>
               </div>
               <p className="text-[10px] text-zinc-600 mt-2 max-w-xs">
                  {stats.currentStreak > 1 
                     ? "Sua constância é um farol. Continue a jornada." 
                     : "O caminho se faz caminhando. Comece hoje."}
               </p>
               {stats.maxStreak > 1 && (
                   <div className="mt-4 text-[9px] text-zinc-700 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
                       Melhor sequência: <span className="text-zinc-400">{stats.maxStreak} dias</span>
                   </div>
               )}
            </div>
        </div>

        {/* Saint of the Day - Dynamic with Generated Image */}
        {liturgy?.saint && (
          <div className="flex flex-col md:flex-row gap-8 items-center bg-zinc-900/30 border border-zinc-800/50 p-8 hover:bg-zinc-900/50 transition-colors group">
              <div className="w-24 h-24 shrink-0 bg-zinc-800 overflow-hidden grayscale relative group-hover:grayscale-0 transition-all duration-700 shadow-lg">
                   {liturgy.saint.imageUrl && (
                       <img 
                          src={liturgy.saint.imageUrl} 
                          alt={liturgy.saint.name} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                       />
                   )}
              </div>
              <div className="flex flex-col text-center md:text-left">
                   <span className="text-[10px] font-bold text-gold-600 uppercase tracking-[0.2em] mb-2">Santo do Dia</span>
                   <h3 className="text-2xl font-serif text-zinc-200 mb-2 group-hover:text-white transition-colors">{liturgy.saint.name}</h3>
                   {liturgy.saint.title && <span className="text-xs text-zinc-500 font-bold uppercase tracking-wide mb-3">{liturgy.saint.title}</span>}
                   <p className="text-zinc-500 text-sm leading-relaxed max-w-md">{liturgy.saint.description}</p>
              </div>
          </div>
        )}

      </div>
    </div>
  );
};