import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Download, Trash2, Loader2, AlertCircle, Book, X, ArrowLeft, Share2, Plus, Shuffle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { GeminiService } from '../geminiService';
import { SavedImage, BibleBookInfo } from '../types';
import { BIBLE_BOOKS } from '../data/bibleBooks';

export const SacredGallery: React.FC = () => {
  // State Principal
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'GALLERY' | 'NAVIGATING' | 'RESULT'>('GALLERY');
  
  // State de Navegação (Idêntico ao Scriptorium)
  const [navStep, setNavStep] = useState<'TESTAMENT' | 'BOOK' | 'CHAPTER'>('TESTAMENT');
  const [selectedTestament, setSelectedTestament] = useState<'VT' | 'NT' | null>(null);
  const [selectedBook, setSelectedBook] = useState<BibleBookInfo | null>(null);

  // State do Resultado
  const [generatedResult, setGeneratedResult] = useState<{ blob: Blob, prompt: string, verse: string } | null>(null);

  const geminiService = useRef(new GeminiService());

  // Carrega imagens do Dexie
  const savedImages = useLiveQuery(() => db.images.orderBy('timestamp').reverse().toArray(), []);

  // --- HANDLERS ---

  const handleStartCreation = () => {
    setViewMode('NAVIGATING');
    setNavStep('TESTAMENT');
    setError(null);
  };

  const handleRandomCreation = () => {
    // Selecionar Livro Aleatório
    const randomBook = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
    // Selecionar Capítulo Aleatório
    const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
    
    setSelectedBook(randomBook);
    handleChapterSelect(randomChapter, randomBook);
  };

  const handleChapterSelect = async (chapter: number, bookOverride?: BibleBookInfo) => {
    // Use override if provided, otherwise state
    const bookToUse = bookOverride || selectedBook;

    if (!bookToUse) return;
    
    setViewMode('RESULT'); // Vai para tela de loading/resultado
    setIsGenerating(true);
    setGeneratedResult(null); // Limpa anterior

    try {
      const result = await geminiService.current.generateBibleVisualization(bookToUse.name, chapter);
      setGeneratedResult(result);
      
      // Persistência Automática (Pode ser removida depois pelo usuário)
      await db.images.add({
        blob: result.blob,
        prompt: result.prompt, // "Gênesis 1 - Gn 1:1"
        timestamp: Date.now()
      });

    } catch (err) {
      setError("Ocorreu um erro ao manifestar a visão sagrada. Verifique sua conexão e permissões.");
      console.error(err);
      setViewMode('GALLERY'); // Volta em caso de erro
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Deseja destruir esta arte sacra?")) {
        await db.images.delete(id);
        if (viewMode === 'RESULT') setViewMode('GALLERY');
    }
  };

  const handleShare = async (blob: Blob, title: string) => {
    if (navigator.share) {
      const file = new File([blob], `christian-ai-${Date.now()}.jpg`, { type: 'image/jpeg' });
      try {
        await navigator.share({
          title: 'Christian.ai Vision',
          text: title,
          files: [file]
        });
      } catch (e) {
        console.log("Compartilhamento cancelado ou não suportado");
      }
    } else {
      // Fallback download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `christian-ai-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // --- RENDERERS ---

  const NavigationModal = () => (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col animate-fade-in">
        
        {/* Header Nav */}
        <div className="flex items-center justify-between px-6 pt-14 pb-6 border-b border-white/10 bg-black/50 backdrop-blur-md shrink-0">
          <h3 className="text-white font-serif text-xl flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-gold-500" /> 
            <span className="mt-1">Escolha a Inspiração</span>
          </h3>
          <button 
            onClick={() => setViewMode('GALLERY')} 
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
                    onClick={() => { setSelectedBook(book); setNavStep('CHAPTER'); }}
                    className="p-4 text-center border border-zinc-800 bg-zinc-900/30 hover:border-gold-500/50 hover:bg-zinc-800 transition-all aspect-[3/2] flex items-center justify-center"
                  >
                    <span className="block text-zinc-200 font-serif text-lg leading-tight">{book.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {navStep === 'CHAPTER' && selectedBook && (
            <div>
              <button onClick={() => setNavStep('BOOK')} className="mb-6 px-4 py-4 bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:text-white flex items-center gap-2 w-full justify-center">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Livros
              </button>
              <h4 className="text-center text-gold-400 font-serif text-3xl mb-8">{selectedBook.name}</h4>
              <p className="text-center text-zinc-500 text-xs uppercase tracking-widest mb-8">Selecione o capítulo para interpretar</p>
              <div className="grid grid-cols-5 gap-3 pb-20">
                {Array.from({ length: selectedBook.chapters }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleChapterSelect(i + 1)}
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

  const ResultOverlay = () => {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
      if (generatedResult?.blob) {
        const url = URL.createObjectURL(generatedResult.blob);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }, [generatedResult]);

    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
         {/* Header Result */}
         <div className="absolute top-0 left-0 right-0 pt-14 pb-4 px-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/90 to-transparent">
             <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-gold-500" />
                <span className="text-white font-serif text-sm tracking-wider">Visão Manifestada</span>
             </div>
             <button 
               onClick={() => setViewMode('GALLERY')}
               className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur rounded-none text-white border border-white/10"
             >
               <X className="w-5 h-5" />
             </button>
         </div>

         {/* Main Content Area - Centered */}
         <div className="flex-1 flex items-center justify-center bg-zinc-950 relative overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-6 px-8 text-center z-10">
                 <div className="relative">
                    <div className="w-20 h-20 border-4 border-zinc-800 border-t-gold-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Wand2 className="w-8 h-8 text-gold-500 animate-pulse" />
                    </div>
                 </div>
                 <div className="space-y-2 animate-pulse">
                   <h3 className="text-xl font-serif text-white">Interpretando as Escrituras...</h3>
                   <p className="text-zinc-500 text-sm max-w-xs mx-auto">O Christian.ai está lendo o capítulo, selecionando o versículo sagrado e pintando sua visão.</p>
                 </div>
              </div>
            ) : (
              objectUrl && (
                <img 
                  src={objectUrl} 
                  alt="Generated Vision" 
                  className="max-h-full max-w-full object-contain shadow-2xl animate-fade-in"
                />
              )
            )}
         </div>

         {/* Footer Actions */}
         {!isGenerating && generatedResult && (
           <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex flex-col gap-4">
              <div className="flex gap-3">
                <button 
                  onClick={() => handleShare(generatedResult.blob, generatedResult.prompt)}
                  className="flex-1 bg-gold-600 hover:bg-gold-500 text-black font-bold py-4 flex items-center justify-center gap-2 transition-all"
                >
                  <Share2 className="w-5 h-5" /> COMPARTILHAR
                </button>
                {/* Nota: A imagem já está salva no Dexie ao gerar. O botão de "excluir" serve se o user não gostou */}
                <button 
                   onClick={async () => {
                      // Encontrar o ultimo ID salvo (hack simples pois acabamos de salvar)
                      const last = await db.images.orderBy('timestamp').last();
                      if(last?.id) handleDelete(last.id);
                   }}
                   className="px-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900/50 transition-colors"
                >
                   <Trash2 className="w-5 h-5" />
                </button>
              </div>
           </div>
         )}
      </div>
    );
  };

  // Helper para Galeria
  const ImageCard: React.FC<{ record: SavedImage }> = ({ record }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
      const u = URL.createObjectURL(record.blob);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }, [record.blob]);

    if (!url) return <div className="aspect-[9/16] bg-zinc-900 animate-pulse" />;

    return (
      <div 
        className="relative aspect-[9/16] group overflow-hidden border border-zinc-800 bg-black cursor-pointer"
        onClick={() => {
          // Visualização rápida da imagem existente
          setGeneratedResult({ blob: record.blob, prompt: record.prompt, verse: "" });
          setViewMode('RESULT');
        }}
      >
        <img src={url} alt={record.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
           <p className="text-white font-serif text-xs truncate">{record.prompt}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      
      {/* Modais */}
      {viewMode === 'NAVIGATING' && <NavigationModal />}
      {viewMode === 'RESULT' && <ResultOverlay />}

      {/* Header Refatorado - Painel de Controle */}
      <div className="bg-[#0c0c0e] border border-zinc-800 p-6 relative overflow-hidden group shadow-2xl">
         {/* Background Decor */}
         <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
             <Wand2 className="w-48 h-48" />
         </div>
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
             <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gold-500 shadow-inner">
                        <Wand2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif text-white tracking-tight">Ateliê Sacro</h2>
                        <div className="h-0.5 w-12 bg-gold-500/50 mt-1"></div>
                    </div>
                 </div>
                 <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
                    Transforme capítulos bíblicos em visões artísticas no formato Stories. O Christian.ai interpreta, cita e ilustra a Palavra.
                 </p>
             </div>

             <div className="flex flex-col justify-end gap-3 md:w-auto md:min-w-[200px]">
                 <button 
                   onClick={handleStartCreation}
                   className="w-full py-4 bg-gold-600 hover:bg-gold-500 text-black font-bold tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-gold-900/20 transition-all active:scale-[0.98]"
                 >
                    <Plus className="w-4 h-4" />
                    NOVA VISÃO
                 </button>
                 <button 
                   onClick={handleRandomCreation}
                   className="w-full py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-gold-500/30 text-zinc-300 font-bold tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
                 >
                    <Shuffle className="w-4 h-4" />
                    ALEATÓRIO
                 </button>
             </div>
         </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 text-red-200 text-sm animate-fade-in">
           <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* Galeria Grid */}
      {savedImages && savedImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {savedImages.map(img => (
            <ImageCard key={img.id} record={img} />
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 bg-zinc-900/20">
           <Wand2 className="w-12 h-12 mb-4 opacity-20" />
           <p className="font-serif">O ateliê está vazio.</p>
           <button onClick={handleStartCreation} className="mt-4 text-gold-500 hover:text-gold-400 underline text-sm">Criar primeira obra</button>
        </div>
      )}
    </div>
  );
};