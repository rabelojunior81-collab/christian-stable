
import React, { useState, useEffect, useRef } from 'react';
import { Book, ChevronLeft, ChevronRight, ChevronDown, X, Loader2, Bookmark, Sparkles, ArrowLeft } from 'lucide-react';
import { GeminiService } from '../geminiService';
import { bibleService } from '../services/bibleService';
import { BIBLE_BOOKS } from '../data/bibleBooks';
import { BibleChapter, BibleBookInfo, BibleVerse } from '../types';

interface ScriptoriumProps {
  targetLocation?: { book: string, chapter: number } | null;
}

export const Scriptorium: React.FC<ScriptoriumProps> = ({ targetLocation }) => {
  // State de Leitura
  const [currentBook, setCurrentBook] = useState<string>('Gênesis');
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State de UI
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [navStep, setNavStep] = useState<'TESTAMENT' | 'BOOK' | 'CHAPTER'>('TESTAMENT');
  const [selectedTestament, setSelectedTestament] = useState<'VT' | 'NT' | null>(null);
  const [selectedBookNav, setSelectedBookNav] = useState<BibleBookInfo | null>(null);
  
  // State de Exegese (AI)
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const geminiService = useRef(new GeminiService());
  const topRef = useRef<HTMLDivElement>(null);

  // Load from props or initial
  useEffect(() => {
    const loadInitial = async () => {
      if (targetLocation) {
         setCurrentBook(targetLocation.book);
         setCurrentChapter(targetLocation.chapter);
         return;
      }

      const lastRead = await bibleService.getLastRead();
      if (lastRead) {
        setCurrentBook(lastRead.book);
        setCurrentChapter(lastRead.chapter);
      } else {
        setCurrentBook('Gênesis');
        setCurrentChapter(1);
      }
    };
    loadInitial();
  }, [targetLocation]);

  // Carrega capítulo quando book/chapter mudar
  useEffect(() => {
    const fetchChapter = async () => {
      setIsLoading(true);
      try {
        const data = await bibleService.getChapter(currentBook, currentChapter);
        setChapterData(data);
        await bibleService.saveProgress(currentBook, currentChapter);
        
        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (error) {
        console.error("Erro ao renderizar capítulo", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [currentBook, currentChapter]);

  // Navegação: Próximo/Anterior
  const handleNavigation = (direction: 'next' | 'prev') => {
    const currentBookInfo = BIBLE_BOOKS.find(b => b.name === currentBook);
    if (!currentBookInfo) return;

    if (direction === 'next') {
      if (currentChapter < currentBookInfo.chapters) {
        setCurrentChapter(c => c + 1);
      } else {
        const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === currentBook);
        if (currentIndex < BIBLE_BOOKS.length - 1) {
          const nextBook = BIBLE_BOOKS[currentIndex + 1];
          setCurrentBook(nextBook.name);
          setCurrentChapter(1);
        }
      }
    } else {
      if (currentChapter > 1) {
        setCurrentChapter(c => c - 1);
      } else {
        const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === currentBook);
        if (currentIndex > 0) {
          const prevBook = BIBLE_BOOKS[currentIndex - 1];
          setCurrentBook(prevBook.name);
          setCurrentChapter(prevBook.chapters);
        }
      }
    }
  };

  // AI Explanation Handler
  const handleExplain = async (verse: BibleVerse) => {
    setSelectedVerse(verse);
    setExplanation(null);
    setIsExplaining(true);

    try {
      // Prompt EXTREMAMENTE SINTÉTICO
      const prompt = `
        Aja como um teólogo católico.
        Explique o versículo "${verse.text}" (${currentBook} ${currentChapter}:${verse.verse}).
        REGRA ABSOLUTA: Responda em APENAS UM PARÁGRAFO curto de no máximo 40 palavras.
        Seja direto, profundo e espiritual. Sem introduções.
      `;
      const result = await geminiService.current.explainVerse(prompt);
      setExplanation(result);
    } catch (error) {
      setExplanation("Não foi possível obter a exegese neste momento.");
    } finally {
      setIsExplaining(false);
    }
  };

  // --- Render Components ---

  const NavigationModal = () => (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col animate-fade-in">
        
        {/* Header do Modal de Navegação - Translucido e Fixo no Topo do Overlay */}
        <div className="flex items-center justify-between px-6 pt-14 pb-6 border-b border-white/10 bg-black/50 backdrop-blur-md shrink-0">
          <h3 className="text-white font-serif text-2xl flex items-center gap-3">
            <Book className="w-6 h-6 text-gold-500" /> 
            <span className="mt-1">Índice Bíblico</span>
          </h3>
          <button 
            onClick={() => { setIsNavOpen(false); setNavStep('TESTAMENT'); }} 
            className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white bg-zinc-900 active:bg-zinc-800 transition-colors rounded-none border border-zinc-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {navStep === 'TESTAMENT' && (
            <div className="grid grid-cols-1 gap-4 content-start pt-4">
              <button 
                onClick={() => { setSelectedTestament('VT'); setNavStep('BOOK'); }}
                className="h-32 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-gold-500/50 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <span className="text-2xl font-serif text-zinc-200 group-hover:text-gold-400 transition-colors">Antigo Testamento</span>
                <span className="text-xs text-zinc-500 uppercase tracking-widest">A Lei e Os Profetas</span>
              </button>
              <button 
                onClick={() => { setSelectedTestament('NT'); setNavStep('BOOK'); }}
                className="h-32 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-gold-500/50 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <span className="text-2xl font-serif text-zinc-200 group-hover:text-gold-400 transition-colors">Novo Testamento</span>
                <span className="text-xs text-zinc-500 uppercase tracking-widest">Evangelhos e Epístolas</span>
              </button>
            </div>
          )}

          {navStep === 'BOOK' && (
            <div>
              <button onClick={() => setNavStep('TESTAMENT')} className="mb-6 px-4 py-4 bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:text-white flex items-center gap-2 w-full justify-center">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Testamentos
              </button>
              <div className="grid grid-cols-2 gap-3 pb-20">
                {BIBLE_BOOKS.filter(b => b.testament === selectedTestament).map(book => (
                  <button
                    key={book.abbrev}
                    onClick={() => { setSelectedBookNav(book); setNavStep('CHAPTER'); }}
                    className="p-4 text-center border border-zinc-800 bg-zinc-900/30 hover:border-gold-500/50 hover:bg-zinc-800 transition-all aspect-[3/2] flex items-center justify-center"
                  >
                    <span className="block text-zinc-200 font-serif text-lg leading-tight">{book.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {navStep === 'CHAPTER' && selectedBookNav && (
            <div>
              <button onClick={() => setNavStep('BOOK')} className="mb-6 px-4 py-4 bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:text-white flex items-center gap-2 w-full justify-center">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Livros
              </button>
              <h4 className="text-center text-gold-400 font-serif text-3xl mb-8">{selectedBookNav.name}</h4>
              <div className="grid grid-cols-5 gap-3 pb-20">
                {Array.from({ length: selectedBookNav.chapters }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentBook(selectedBookNav.name);
                      setCurrentChapter(i + 1);
                      setIsNavOpen(false);
                      setNavStep('TESTAMENT');
                    }}
                    className="aspect-square flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-all font-serif text-lg"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
    </div>
  );

  const ExegesisPanel = () => (
    // CONTAINER EXTERNO RESPONSIVO:
    // Mobile: fixed inset-0 (Tela cheia)
    // Desktop (md+): fixed inset-0 (Para backdrop) + Flex center
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center animate-fade-in">
      
      {/* Backdrop click-to-close para desktop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { setSelectedVerse(null); setExplanation(null); }}
      ></div>
      
      {/* 
         CARD INTERNO:
         Mobile: w-full h-full
         Desktop: max-w-2xl max-h-[85vh] border shadow-2xl
      */}
      <div className="relative w-full h-full md:h-auto md:max-h-[85vh] md:max-w-3xl bg-[#0c0c0e] flex flex-col md:border md:border-zinc-800 md:shadow-2xl shadow-black z-10">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 pt-14 md:pt-6 pb-6 border-b border-white/10 bg-zinc-950/80 shrink-0">
            <div className="flex flex-col">
                <h3 className="text-xl font-serif text-white leading-none">Comentário</h3>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-1 h-1 bg-gold-500 rounded-full"></div>
                   <span className="text-[10px] font-bold text-gold-600 uppercase tracking-[0.2em]">Christian.ai</span>
                </div>
            </div>
            
            <button 
                onClick={() => { setSelectedVerse(null); setExplanation(null); }} 
                className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 active:bg-zinc-800 transition-all rounded-none shadow-lg"
                aria-label="Fechar comentário"
            >
                <X className="w-6 h-6 md:w-4 md:h-4" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
            {/* Verse Card */}
            <div className="mb-10">
                <div className="pl-6 border-l-2 border-gold-600 py-1">
                  <p className="font-serif text-2xl text-white leading-relaxed italic">
                      "{selectedVerse?.text}"
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 text-xs font-mono text-zinc-500">
                    <span className="text-gold-500/80">{currentBook} {currentChapter}:{selectedVerse?.verse}</span>
                </div>
            </div>

            {/* Commentary */}
              {isExplaining ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-4 border-t border-zinc-900">
                    <Loader2 className="w-10 h-10 animate-spin text-gold-500" />
                    <span className="text-xs uppercase tracking-widest animate-pulse">Consultando Teólogos...</span>
                </div>
            ) : (
                <div className="animate-fade-in border-t border-zinc-800 pt-8 pb-12">
                      <p className="font-serif text-xl leading-loose text-zinc-300 text-justify first-letter:text-5xl first-letter:font-bold first-letter:text-gold-500 first-letter:mr-3 first-letter:float-left">
                        {explanation}
                      </p>
                      
                      <div className="mt-12 flex justify-center opacity-30">
                        <Sparkles className="w-6 h-6 text-gold-500" />
                      </div>
                </div>
            )}
        </div>

        {/* Footer Action (Visível apenas mobile ou quando necessário) */}
        <div className="p-4 bg-zinc-950/80 backdrop-blur border-t border-zinc-800 shrink-0 safe-bottom md:hidden">
          <button 
            onClick={() => { setSelectedVerse(null); setExplanation(null); }}
            className="w-full py-5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <ChevronDown className="w-4 h-4 text-gold-500" />
            Retornar à Leitura
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-7rem)] bg-[#050506] border-x border-zinc-800 shadow-2xl relative">
      <div ref={topRef} className="absolute top-0" />
      
      {isNavOpen && <NavigationModal />}

      <div className="flex-1 flex flex-col relative">
        
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur items-center justify-between px-6 z-10 shrink-0">
          <div 
            onClick={() => setIsNavOpen(true)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-2 bg-zinc-950 border border-zinc-800 group-hover:border-gold-500/50 transition-colors">
              <Book className="w-4 h-4 text-zinc-400 group-hover:text-gold-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Navegar</span>
              <span className="text-lg font-serif text-zinc-100 group-hover:text-gold-400 transition-colors">
                {currentBook} <span className="text-gold-600">{currentChapter}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 text-xs text-zinc-600 mr-4">
                <Bookmark className="w-3 h-3" />
                <span>João Ferreira de Almeida</span>
             </div>
          </div>
        </header>

        {/* Mobile Interactive Header - FIXED & TRANSLUCENT */}
        {/* Posicionado top-14 para ficar logo abaixo do header principal do App */}
        <header className="md:hidden fixed top-14 left-0 right-0 h-12 border-b border-white/5 bg-black/60 backdrop-blur-lg flex items-center justify-between px-4 z-30 shadow-sm animate-fade-in transition-all">
             
             {/* Prev Button */}
             <button 
                onClick={() => handleNavigation('prev')}
                disabled={currentBook === 'Gênesis' && currentChapter === 1}
                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white active:text-gold-500 disabled:opacity-30 transition-colors active:bg-white/5 rounded-full"
             >
                <ChevronLeft className="w-6 h-6" />
             </button>

             {/* Title / Modal Trigger */}
             <button 
                onClick={() => setIsNavOpen(true)}
                className="flex items-center gap-2 px-4 py-1 active:bg-white/5 transition-colors rounded-full border border-transparent active:border-white/10"
             >
                 <span className="font-serif text-zinc-100 text-lg tracking-tight drop-shadow-md">{currentBook} <span className="text-gold-500">{currentChapter}</span></span>
                 <ChevronDown className="w-3 h-3 text-gold-500/70" />
             </button>

             {/* Next Button */}
             <button 
                onClick={() => handleNavigation('next')}
                disabled={currentBook === 'Apocalipse' && currentChapter === 22}
                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white active:text-gold-500 disabled:opacity-30 transition-colors active:bg-white/5 rounded-full"
             >
                <ChevronRight className="w-6 h-6" />
             </button>
        </header>

        {/* Reader Content */}
        <div className="flex-1 relative bg-[#050506]">
          {/* Adicionado pt-12 para compensar o novo header fixo secundário */}
          <div className="max-w-3xl mx-auto px-6 pb-24 pt-12 md:pt-16 md:px-12">
            
            {isLoading ? (
              <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
                <p className="font-serif text-zinc-500 animate-pulse">Carregando as Escrituras...</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-10 md:mb-16 pt-4">
                  <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-tight">{currentBook}</h1>
                  <div className="h-1 w-20 bg-gold-600 mx-auto mb-4"></div>
                  <p className="text-gold-500/80 font-mono text-sm">CAPÍTULO {currentChapter}</p>
                </div>

                <div className="space-y-1 font-serif text-xl leading-loose text-zinc-300 text-justify">
                  {chapterData?.verses.map((verse) => (
                    <span 
                      key={verse.verse}
                      onClick={() => handleExplain(verse)}
                      className={`
                        inline hover:bg-zinc-800/50 hover:text-white cursor-pointer transition-colors duration-200 px-1 py-0.5 rounded-none relative group
                        ${selectedVerse?.verse === verse.verse ? 'bg-gold-900/20 text-gold-100 ring-1 ring-gold-900/50' : ''}
                      `}
                    >
                      <sup className="text-[10px] text-zinc-500 mr-1 font-sans font-bold select-none align-top mt-1">{verse.verse}</sup>
                      {verse.text}
                    </span>
                  ))}
                </div>

                {/* Footer Navigation (Hidden on Mobile since moved to Header) */}
                <div className="hidden md:flex mt-16 pt-10 border-t border-zinc-800 justify-between items-center pb-0">
                  <button 
                    onClick={() => handleNavigation('prev')}
                    disabled={currentBook === 'Gênesis' && currentChapter === 1}
                    className="flex items-center gap-3 text-zinc-500 hover:text-gold-400 disabled:opacity-30 disabled:cursor-not-allowed group transition-colors px-4 py-2 border border-transparent hover:border-zinc-800 bg-transparent"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <div className="text-left">
                      <span className="block text-[10px] uppercase tracking-wider font-bold">Anterior</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleNavigation('next')}
                    disabled={currentBook === 'Apocalipse' && currentChapter === 22}
                    className="flex items-center gap-3 text-zinc-500 hover:text-gold-400 disabled:opacity-30 disabled:cursor-not-allowed group transition-colors px-4 py-2 border border-transparent hover:border-zinc-800 bg-transparent"
                  >
                    <div className="text-right">
                      <span className="block text-[10px] uppercase tracking-wider font-bold">Próximo</span>
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {selectedVerse && <ExegesisPanel />}
      
    </div>
  );
};
