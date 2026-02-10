
import React, { useState, useEffect, useRef } from 'react';
import { ViewSection } from './types';
import { Sanctuary } from './components/Sanctuary';
import { Christian } from './components/Christian';
import { Scriptorium } from './components/Scriptorium';
import { SacredGallery } from './components/SacredGallery';
import { Splash } from './components/Splash';
import { Onboarding } from './components/Onboarding';
import { LayoutGrid, MessageSquare, BookOpen, Image as ImageIcon, Flame } from 'lucide-react';
import { bibleService } from './services/bibleService';
import { userService } from './services/userService';
import { UserProfile } from './types';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentSection, setCurrentSection] = useState<ViewSection>(ViewSection.SANCTUARY);
  const [showMobileNav, setShowMobileNav] = useState(true);
  
  // Navigation State for Scriptorium Shortcut
  const [bibleTarget, setBibleTarget] = useState<{book: string, chapter: number} | null>(null);
  
  const lastScrollY = useRef(0);

  // App Initialization (Priming)
  useEffect(() => {
    const init = async () => {
       // 1. Check User
       const existingUser = await userService.getUser();
       if (existingUser) {
         setUser(existingUser as UserProfile);
         // Update Streak if user exists
         await userService.updateStreak();
       }

       // 2. Preload Bible
       bibleService.preloadGenesis();

       // 3. Simulate Splash Delay (12 seconds as requested)
       setTimeout(() => {
         setIsLoading(false);
       }, 12000);
    };
    
    init();
  }, []);

  // Handle Onboarding Completion
  const handleOnboardingComplete = async (name: string) => {
     await userService.setUser(name);
     const newUser = await userService.getUser();
     if (newUser) {
        setUser(newUser as UserProfile);
        await userService.updateStreak(); // Start streak
     }
  };

  // Handle Shortcut from Sanctuary to Bible
  const handleNavigateToBible = (book: string, chapter: number) => {
    setBibleTarget({ book, chapter });
    setCurrentSection(ViewSection.SCRIPTORIUM);
  };

  // Scroll Handler for Retractable Nav
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    const diff = currentScrollY - lastScrollY.current;

    if (diff > 10 && currentScrollY > 50) {
      setShowMobileNav(false);
    } else if (diff < -10) {
      setShowMobileNav(true);
    }
    lastScrollY.current = currentScrollY;
  };

  // Ícone Rabelus
  const RabelusIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M8 7H5L12 2L19 7H16" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M8 17H5L12 22L19 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );

  // Logo Component
  const RabelusLogo = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex ${mobile ? 'flex-row items-center gap-3' : 'flex-col items-center justify-center w-full py-10'} select-none`}>
      <div className={`
        relative flex items-center justify-center 
        bg-[#0c0c0e] rounded-none
        border-t border-l border-white/10 
        border-b border-r border-black/80
        shadow-2xl
        ${mobile ? 'w-8 h-8' : 'w-20 h-20 mb-5'}
      `}>
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none mix-blend-overlay"></div>
         <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/40 pointer-events-none"></div>
         <RabelusIcon className={`${mobile ? 'w-5 h-5' : 'w-10 h-10'} text-gold-500 drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]`} />
      </div>

      <div className={`flex flex-col ${mobile ? 'items-start justify-center' : 'items-center text-center'}`}>
        <h1 className={`font-serif font-bold text-zinc-100 leading-none tracking-tight ${mobile ? 'text-lg' : 'text-2xl'}`}>
          christian.ai
        </h1>
        {mobile ? (
           <span className="text-[0.65rem] text-zinc-500 font-sans tracking-wide -mt-0.5">
             by Rabelus
           </span>
        ) : (
          <div className="flex items-center gap-2 mt-1 opacity-60">
            <div className="h-[1px] bg-gold-600/50 w-6"></div>
            <span className="font-bold text-gold-500 uppercase tracking-[0.15em] whitespace-nowrap font-sans text-[0.6rem]">
              By Rabelus.org
            </span>
            <div className="h-[1px] bg-gold-600/50 w-6"></div>
          </div>
        )}
      </div>
    </div>
  );

  // Sidebar Nav Item
  const NavItem = ({ section, icon: Icon, label }: { section: ViewSection, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentSection(section)}
      className={`flex items-center gap-4 px-8 py-5 transition-all w-full text-left group relative overflow-hidden rounded-none ${
        currentSection === section 
          ? 'text-gold-400 bg-zinc-900/60 border-r-2 border-gold-500' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
      }`}
    >
      <Icon className={`w-4 h-4 z-10 transition-all duration-300 ${currentSection === section ? 'text-gold-500' : 'group-hover:text-zinc-300'}`} />
      <span className="tracking-[0.15em] uppercase text-[10px] font-bold z-10 font-sans">
        {label}
      </span>
    </button>
  );

  // Mobile Bottom Nav Item
  const MobileNavItem = ({ section, icon: Icon, label }: { section: ViewSection, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentSection(section)}
      className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all relative ${
        currentSection === section ? 'text-gold-400' : 'text-zinc-600 hover:text-zinc-400'
      }`}
    >
      <Icon className={`w-5 h-5 ${currentSection === section ? 'drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : ''}`} />
      <span className="text-[8px] uppercase tracking-widest font-bold">{label}</span>
      {currentSection === section && (
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
      )}
    </button>
  );

  // --- MAIN RENDER ---

  // 1. Splash Screen
  if (isLoading) return <Splash />;

  // 2. Onboarding (if no user)
  if (!user) return <Onboarding onComplete={handleOnboardingComplete} />;

  // 3. Main Application
  return (
    <div className="h-screen bg-[#09090b] text-zinc-100 font-sans flex overflow-hidden selection:bg-gold-500/30 selection:text-gold-200">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-80 bg-[#050506] border-r border-zinc-900 z-30 relative shadow-[5px_0_30px_rgba(0,0,0,0.5)] shrink-0">
        <div className="border-b border-zinc-900 bg-[#050506]">
          <RabelusLogo />
        </div>
        <nav className="flex-1 py-8 space-y-1">
          <NavItem section={ViewSection.SANCTUARY} icon={LayoutGrid} label="Santuário" />
          <NavItem section={ViewSection.CHRISTIAN} icon={Flame} label="Christian" />
          <NavItem section={ViewSection.SCRIPTORIUM} icon={BookOpen} label="Bíblia Sagrada" />
          <NavItem section={ViewSection.GALLERY} icon={ImageIcon} label="Galeria Sacra" />
        </nav>
        <div className="p-8 border-t border-zinc-900/50 bg-gradient-to-t from-black to-transparent">
            <div className="flex flex-col items-center gap-2">
                 <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gold-500 font-serif text-xl">
                     {user.name.charAt(0).toUpperCase()}
                 </div>
                 <p className="text-zinc-500 text-xs uppercase tracking-widest">{user.name}</p>
            </div>
            <p className="text-[9px] text-zinc-800 text-center font-bold tracking-[0.3em] uppercase opacity-50 cursor-default mt-6">
                Ad Maiorem Dei Gloriam
            </p>
        </div>
      </aside>

      {/* Mobile Header (Static Branding) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-center z-40 transition-transform duration-300">
        <RabelusLogo mobile />
      </div>

      {/* Mobile Bottom Footer Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0c0c0e]/80 backdrop-blur-xl border-t border-zinc-800 z-50 transition-transform duration-500 ease-in-out ${showMobileNav ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex h-full items-center justify-around px-2 pb-2">
          <MobileNavItem section={ViewSection.SANCTUARY} icon={LayoutGrid} label="Santuário" />
          <MobileNavItem section={ViewSection.CHRISTIAN} icon={Flame} label="Christian" />
          <MobileNavItem section={ViewSection.SCRIPTORIUM} icon={BookOpen} label="Bíblia" />
          <MobileNavItem section={ViewSection.GALLERY} icon={ImageIcon} label="Galeria" />
        </div>
      </div>

      {/* Main Content */}
      <main 
        className="flex-1 h-full overflow-y-auto relative scroll-smooth"
        onScroll={handleScroll}
      >
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,_#1e1b4b_0%,_transparent_40%)] opacity-10 mix-blend-screen"></div>
        <div className="fixed inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto min-h-full pt-20 pb-24 md:pt-12 md:pb-12 md:px-12 relative z-10">
          {currentSection === ViewSection.SANCTUARY && <Sanctuary onNavigateToBible={handleNavigateToBible} />}
          {currentSection === ViewSection.CHRISTIAN && <Christian />}
          {currentSection === ViewSection.SCRIPTORIUM && <Scriptorium targetLocation={bibleTarget} />}
          {currentSection === ViewSection.GALLERY && <SacredGallery />}
        </div>
      </main>
    </div>
  );
};

export default App;
