import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TypewriterText } from '../components/RPGComponents';
import { Character, LogEntry, Item } from '../types';
import { MOCK_ITEMS, STARTING_LOGS, CLASS_LABELS, IMAGES } from '../constants';
import { 
  Backpack, 
  User, 
  Map as MapIcon, 
  Settings, 
  Send,
  X,
  Star,
  ShieldCheck,
  Menu,
  Sparkles,
  Feather,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface GameInterfaceProps {
  character: Character | null;
}

type SheetType = 'INVENTORY' | 'STATUS' | 'GUILD' | null;

const GameInterface: React.FC<GameInterfaceProps> = ({ character }) => {
  const navigate = useNavigate();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [showMobileCharCard, setShowMobileCharCard] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!character) {
      navigate('/create');
    } else {
      if (logs.length === 0) {
        setLogs(STARTING_LOGS(character.name).map((l, i) => ({ ...l, id: `init-${i}` })));
      }
    }
  }, [character, navigate]);

  useEffect(() => {
    if (logsContainerRef.current) {
      const container = logsContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, activeSheet]);

  const handleAction = (action: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      speaker: character?.name || '我',
      text: action,
      type: 'dialogue'
    };
    setLogs(prev => [...prev, newLog]);
    
    setTimeout(() => {
      const aiResponse: LogEntry = {
        id: (Date.now() + 1).toString(),
        speaker: '地下城主',
        text: `你尝试"${action}"。世界似乎对此反应平平，但风中传来了些许变化的气息。`,
        type: 'narration'
      };
      const npcResponse: LogEntry = {
        id: (Date.now() + 2).toString(),
        speaker: '神秘少女',
        text: '看起来你很有干劲呢！',
        type: 'dialogue'
      };
      setLogs(prev => [...prev, aiResponse, npcResponse]);
    }, 800);
    setInput('');
  };

  const handleSystemClick = () => {
    navigate('/save', { state: { fromGame: true } });
  };

  if (!character) return null;

  return (
    <div className="h-screen relative w-full bg-[#FFF9F0] overflow-hidden flex flex-col md:flex-row p-4 md:p-6 gap-6 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <img 
           src={IMAGES.bg.plaza} 
           alt="Background" 
           className="absolute inset-0 w-full h-full object-cover opacity-100"
         />
         <div className="absolute inset-0 bg-[#FFF9F0]/40 backdrop-blur-[1px]" />
         <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-yellow-200/20 rounded-full blur-[120px] mix-blend-overlay" />
      </div>

      {/* MOBILE: Side Toggle for Character Card */}
      <motion.button 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="lg:hidden fixed left-0 top-32 z-40 group"
        onClick={() => setShowMobileCharCard(true)}
      >
        <div className="bg-white/50 hover:bg-white/70 backdrop-blur-md border border-l-0 border-white/50 rounded-r-xl py-3 pl-1.5 pr-1 shadow-sm flex flex-col items-center gap-1 transition-all active:scale-95 active:translate-x-1">
            <span className="[writing-mode:vertical-rl] text-[10px] font-bold text-[#5D4037] tracking-[0.2em] opacity-80 group-hover:opacity-100 transition-opacity">
                立绘
            </span>
            <ChevronRight size={12} className="text-[#5D4037]/50" />
        </div>
      </motion.button>

      {/* LEFT COLUMN: Character Card (Desktop) */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:block w-[380px] xl:w-[420px] relative z-10 h-full flex-none"
      >
         <CharacterCardView character={character} />
      </motion.div>

      {/* RIGHT COLUMN: Interaction Terminal */}
      <div className="flex-1 flex flex-col relative z-10 h-full min-w-0">
          
          {/* Header Navigation - Adapted for Mobile */}
          <header className="flex-none flex justify-between items-center mb-4 px-1 z-50 h-14 gap-2">
              <div className="flex items-center gap-2 md:gap-3 bg-white/60 backdrop-blur-md px-2 md:px-4 py-2 rounded-full border border-white shadow-sm flex-shrink min-w-0 max-w-[50%] md:max-w-none transition-all">
                 <div className="bg-[#FFD166] p-1.5 rounded-full text-white shadow-sm shrink-0">
                    <MapIcon size={16} />
                 </div>
                 <div className="min-w-0 flex flex-col justify-center">
                    <div className="hidden md:block text-[10px] font-bold text-[#8B7355] uppercase tracking-wider truncate">Current Location</div>
                    <div className="text-xs md:text-sm font-bold text-[#5D4037] truncate">王都阿斯拉 - 中央广场</div>
                 </div>
              </div>

              {/* Scrollable Nav Container for Mobile */}
              <div className="flex gap-2 flex-shrink-0 ml-auto overflow-x-auto no-scrollbar pb-1 -mb-1 pl-2 mask-fade-left">
                  <NavButton icon={<Backpack size={18} />} label="背包" onClick={() => setActiveSheet('INVENTORY')} />
                  <NavButton icon={<User size={18} />} label="状态" onClick={() => setActiveSheet('STATUS')} />
                  <NavButton icon={<ShieldCheck size={18} />} label="公会" onClick={() => setActiveSheet('GUILD')} />
                  <div className="w-px h-8 bg-[#E6D7C3] mx-1 shrink-0" />
                  <NavButton icon={<Menu size={18} />} label="系统" onClick={handleSystemClick} />
                  
                  <button 
                    onClick={() => navigate('/')}
                    className="group bg-white/80 hover:bg-red-50 text-[#5D4037] hover:text-red-500 p-2.5 rounded-xl border border-white hover:border-red-200 shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0 ml-1"
                    title="返回标题"
                  >
                    <LogOut size={18} />
                    <span className="hidden xl:inline text-xs font-bold">退出</span>
                  </button>
              </div>
          </header>

          {/* Main Chat Area */}
          <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl overflow-hidden flex flex-col relative ring-1 ring-gray-100">
              <div 
                ref={logsContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar scroll-smooth"
              >
                 <AnimatePresence initial={false}>
                 {logs.map((log) => (
                   <motion.div 
                     key={log.id}
                     initial={{ opacity: 0, y: 10, scale: 0.98 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     className={`flex w-full ${
                        log.speaker === character.name ? 'justify-end' : 
                        log.type === 'narration' ? 'justify-center' : 'justify-start'
                     }`}
                   >
                      {log.type === 'narration' ? (
                        <div className="max-w-[90%] md:max-w-[80%] text-center my-4 group">
                           <div className="relative py-4 px-12">
                              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E6D7C3] to-transparent" />
                              <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[#E6D7C3] opacity-50"><Star size={8} /></div>
                              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E6D7C3] to-transparent" />
                              <span className="inline-block text-[#8B7355] text-base md:text-lg font-serif italic leading-relaxed relative z-10">"{log.text}"</span>
                           </div>
                        </div>
                      ) : (
                        <div className={`flex max-w-[90%] md:max-w-[80%] gap-4 ${log.speaker === character.name ? 'flex-row-reverse' : 'flex-row'}`}>
                           <div className="shrink-0 mt-2 relative z-10">
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-[3px] shadow-sm overflow-hidden bg-gray-100 ${
                                log.speaker === character.name ? 'border-[#FF9FAA]' : 'border-white'
                              }`}>
                                <img src={`https://picsum.photos/seed/${log.speaker}/100`} alt="avatar" className="w-full h-full object-cover" />
                              </div>
                           </div>
                           <div className={`flex flex-col min-w-0 ${log.speaker === character.name ? 'items-end' : 'items-start'}`}>
                              {log.speaker !== character.name && (
                                <span className="text-[11px] font-black text-[#8B7355] uppercase tracking-wider mb-1 ml-2 bg-[#E6D7C3]/30 px-2 py-0.5 rounded-md border border-[#E6D7C3]/50">
                                  {log.speaker}
                                </span>
                              )}
                              <div className={`relative px-5 py-3 md:px-6 md:py-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] text-sm md:text-[15px] leading-relaxed group transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] break-words whitespace-pre-wrap max-w-full ${
                                log.speaker === character.name 
                                 ? 'bg-gradient-to-br from-[#FF9FAA] to-[#FF8A9B] text-white rounded-[22px] rounded-tr-sm min-w-[40px] border-2 border-white/20 shadow-[0_4px_10px_rgba(255,159,170,0.4)]' 
                                 : 'bg-[#FFFDF7] text-[#5D4037] rounded-[20px] rounded-tl-none border border-[#F0EAE0] min-w-[40px]'
                              }`}>
                                {log.speaker !== character.name && (
                                   <>
                                     <CornerDecor className="top-0 left-0 -rotate-0 text-[#E6D7C3]" />
                                     <CornerDecor className="bottom-0 right-0 rotate-180 text-[#E6D7C3]" />
                                   </>
                                )}
                                {log.speaker === character.name && (
                                  <>
                                    <div className="absolute -top-3 -left-3 bg-white text-[#FF9FAA] rounded-full p-1 shadow-sm border border-[#FF9FAA]/20">
                                        <Star size={12} fill="currentColor" />
                                    </div>
                                    <div className="absolute inset-[1px] rounded-[20px] rounded-tr-sm border border-white/30 pointer-events-none" />
                                  </>
                                )}
                                
                                {log.speaker === character.name ? (
                                  <span>{log.text}</span>
                                ) : (
                                  <TypewriterText text={log.text} speed={10} />
                                )}
                              </div>
                           </div>
                        </div>
                      )}
                   </motion.div>
                 ))}
                 </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="flex-none p-4 md:p-6 pb-6 md:pb-6 bg-white border-t border-[#F0EAE0] relative z-20">
                  <div className="flex items-center gap-3 bg-[#FDFBF7] p-2 pr-2 pl-5 rounded-2xl border-2 border-[#E6D7C3] focus-within:border-[#FF9FAA] focus-within:ring-4 focus-within:ring-[#FF9FAA]/10 transition-all shadow-inner">
                     <Feather className="text-[#D4C5B0] shrink-0" size={18} />
                     <input 
                       className="flex-1 bg-transparent border-none outline-none text-[#5D4037] font-medium placeholder:text-[#D4C5B0] text-sm md:text-base"
                       placeholder="描述你的行动..."
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAction(input)}
                     />
                     <button 
                       onClick={() => input && handleAction(input)}
                       disabled={!input}
                       className="bg-[#FF9FAA] hover:bg-[#FF8A9B] disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 md:p-3 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2 font-bold"
                     >
                        <span className="hidden md:inline">发送</span>
                        <Send size={18} fill="currentColor" />
                     </button>
                  </div>
              </div>
          </div>
      </div>

      {/* MOBILE OVERLAY: Character Card */}
      <AnimatePresence>
        {showMobileCharCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 lg:hidden"
            onClick={() => setShowMobileCharCard(false)}
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="w-full max-w-[360px] aspect-[3/5] relative"
               onClick={(e) => e.stopPropagation()}
             >
                {/* Close Button */}
                <button 
                  onClick={() => setShowMobileCharCard(false)}
                  className="absolute -top-12 right-0 md:-right-12 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-white/30"
                >
                    <X size={20} />
                </button>
                
                <CharacterCardView character={character} />
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popups / Sheets */}
      <AnimatePresence>
        {activeSheet && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] bg-[#5D4037]/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
            onClick={() => setActiveSheet(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl h-[80vh] bg-[#FFFBF0] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative border-4 border-white"
              onClick={(e) => e.stopPropagation()}
            >
               <button 
                  onClick={() => setActiveSheet(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-[#E6D7C3] hover:bg-[#FF9FAA] text-white rounded-full flex items-center justify-center transition-colors z-20 shadow-sm"
               >
                  <X size={20} />
               </button>

               {activeSheet === 'INVENTORY' && <InventorySheet items={MOCK_ITEMS} />}
               {activeSheet === 'STATUS' && <StatusSheet character={character} />}
               {activeSheet === 'GUILD' && <GuildSheet />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Reusable Character Card View ---
const CharacterCardView = ({ character, className = "" }: { character: Character, className?: string }) => (
    <div className={`relative h-full w-full bg-[#2C241F] rounded-[2.5rem] shadow-2xl overflow-hidden border-[6px] border-white ring-1 ring-gray-200 group ${className}`}>
        
        {/* Full Height Character Image - Immersive Style */}
        <motion.img 
          src={character.avatarUrl || IMAGES.char.test} 
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 z-0" 
          alt="Character"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C241F] via-[#2C241F]/30 to-transparent opacity-90 z-10" />

        {/* Sparkles */}
        <div className="absolute top-10 right-8 animate-pulse z-20">
           <Sparkles className="text-[#FFD166]" size={24} fill="currentColor" />
        </div>
        
        {/* Bottom Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
           <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-3xl font-black text-white leading-none mb-2 drop-shadow-md">{character.name}</h2>
                <span className="bg-white/20 backdrop-blur-md text-[#FFD166] text-xs px-3 py-1 rounded-full font-bold tracking-wider border border-white/10 shadow-sm">
                  {CLASS_LABELS[character.classType]}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Level</span>
                <span className="text-4xl font-black text-white leading-none drop-shadow-sm">{character.level}</span>
              </div>
           </div>

           {/* Bars */}
           <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-white/90">
                 <span className="w-6 text-shadow-sm">HP</span>
                 <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
                    <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} className="h-full bg-[#FF9FAA] rounded-full shadow-[0_0_10px_rgba(255,159,170,0.5)]" />
                 </div>
                 <span className="w-12 text-right font-mono">450</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-white/90">
                 <span className="w-6 text-shadow-sm">MP</span>
                 <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
                    <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-[#89CFF0] rounded-full shadow-[0_0_10px_rgba(137,207,240,0.5)]" />
                 </div>
                 <span className="w-12 text-right font-mono">120</span>
              </div>
           </div>
        </div>
     </div>
);

// --- Sub-Components ---

const CornerDecor = ({ className }: { className?: string }) => (
  <svg className={`absolute w-3 h-3 pointer-events-none ${className}`} viewBox="0 0 10 10" fill="currentColor">
    <path d="M0 0 H10 V2 H2 V10 H0 Z" />
  </svg>
);

const NavButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="group bg-white/80 hover:bg-white text-[#5D4037] hover:text-[#FF9FAA] p-2 md:p-2.5 rounded-xl border border-white shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0"
    title={label}
  >
    {icon}
    <span className="hidden xl:inline text-xs font-bold">{label}</span>
  </button>
);

const InventorySheet = ({ items }: { items: Item[] }) => (
  <div className="flex flex-col h-full bg-[#FFFBF0]">
     <div className="p-8 pb-4 border-b border-[#E6D7C3] flex items-center gap-4">
        <div className="bg-[#FFD166] text-white p-3 rounded-2xl shadow-md">
           <Backpack size={32} />
        </div>
        <div>
           <h2 className="text-3xl font-serif font-black text-[#5D4037]">行囊</h2>
           <p className="text-[#8B7355] font-bold text-sm">Inventory</p>
        </div>
     </div>
     <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
           {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border-2 border-[#F0EAE0] hover:border-[#FF9FAA] hover:shadow-lg transition-all group cursor-pointer text-center relative overflow-hidden flex flex-col items-center justify-between h-[160px]">
                 <div className="flex-1 flex items-center justify-center w-full relative">
                    <div className="relative w-16 h-16 group-hover:scale-110 transition-transform duration-300">
                      <img 
                        src={item.icon} 
                        alt={item.name} 
                        className="w-full h-full object-contain drop-shadow-sm" 
                      />
                    </div>
                 </div>
                 
                 <div className="w-full mt-2">
                    <div className="text-sm font-bold text-[#5D4037] truncate w-full">{item.name}</div>
                    <div className="text-[10px] text-[#8B7355] mt-0.5">{item.type}</div>
                 </div>

                 <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                    item.rarity === 'Legendary' ? 'bg-purple-400' :
                    item.rarity === 'Rare' ? 'bg-blue-400' : 'bg-gray-300'
                 }`} />
              </div>
           ))}
        </div>
     </div>
  </div>
);

const StatusSheet = ({ character }: { character: Character }) => {
    const statsData = Object.keys(character.stats).map(key => ({
    subject: key,
    A: character.stats[key as keyof typeof character.stats],
    fullMark: 15,
  }));

  return (
    <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
       <div className="w-full md:w-5/12 bg-[#F7F2E8] p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-[#E6D7C3] relative shrink-0">
          <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-xl overflow-hidden mb-6 relative z-10">
             <img src={character.avatarUrl || IMAGES.char.test} className="w-full h-full object-cover" alt="Portrait"/>
          </div>
          <h2 className="text-3xl font-serif font-black text-[#5D4037] mb-1 text-center">{character.name}</h2>
          <div className="text-[#FF9FAA] font-bold mb-8 uppercase tracking-widest text-xs bg-[#5D4037] px-3 py-1 rounded-full">
             {CLASS_LABELS[character.classType]}
          </div>
          
          <div className="w-full space-y-4">
             <div className="bg-white p-3 rounded-xl border border-[#E6D7C3] shadow-sm flex items-center justify-between">
                <span className="font-bold text-[#8B7355] text-xs uppercase">Level</span>
                <span className="font-black text-2xl text-[#5D4037]">{character.level}</span>
             </div>
             <div className="bg-white p-3 rounded-xl border border-[#E6D7C3] shadow-sm flex items-center justify-between">
                <span className="font-bold text-[#8B7355] text-xs uppercase">Gold</span>
                <span className="font-black text-xl text-[#FFD166] flex items-center gap-1">
                   {character.gold} <span className="text-xs text-[#8B7355]">G</span>
                </span>
             </div>
          </div>
       </div>

       <div className="flex-1 p-8 bg-white flex flex-col">
           <h3 className="text-xl font-bold text-[#5D4037] mb-6 flex items-center gap-2">
             <Star className="text-[#FFD166] fill-current" /> 战斗参数
           </h3>
           <div className="flex-1 min-h-[300px] bg-[#FFFBF0] rounded-3xl p-4 border border-[#F0EAE0]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={statsData}>
                  <PolarGrid stroke="#E6D7C3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B7355', fontSize: 12, fontWeight: 'bold' }} />
                  <Radar name="Stats" dataKey="A" stroke="#FF9FAA" strokeWidth={3} fill="#FF9FAA" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
           </div>
       </div>
    </div>
  )
};

const GuildSheet = () => (
  <div className="h-full flex flex-col bg-[#FFFBF0]">
    <div className="p-8 pb-4 border-b border-[#E6D7C3] flex items-center justify-between">
       <div className="flex items-center gap-4">
          <div className="bg-[#89CFF0] text-white p-3 rounded-2xl shadow-md">
             <ShieldCheck size={32} />
          </div>
          <div>
             <h2 className="text-3xl font-serif font-black text-[#5D4037]">公会委托</h2>
             <p className="text-[#8B7355] font-bold text-sm">Quests</p>
          </div>
       </div>
       <div className="text-right hidden md:block">
          <div className="text-xs font-bold text-[#8B7355] uppercase">Rank</div>
          <div className="text-2xl font-black text-[#5D4037]">B-Rank</div>
       </div>
    </div>

    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
       <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border-l-8 border-[#FF9FAA] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center">
             <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                   <span className="bg-[#FF9FAA]/10 text-[#FF9FAA] text-[10px] font-bold px-2 py-1 rounded-full border border-[#FF9FAA]/20">URGENT</span>
                   <h3 className="font-bold text-lg text-[#5D4037]">讨伐：变异史莱姆</h3>
                </div>
                <p className="text-sm text-[#8B7355] leading-relaxed">
                   西边森林的史莱姆似乎受到了某种魔力的影响变得巨大化了，请前往讨伐。
                </p>
             </div>
             <div className="flex flex-row md:flex-col items-center gap-4 md:gap-1 min-w-[100px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between">
                <div className="text-[#5D4037] font-black text-lg">500 G</div>
                <button className="bg-[#5D4037] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#FF9FAA] transition-colors">
                   接受
                </button>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-l-8 border-gray-300 shadow-sm opacity-60">
             <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-lg text-[#5D4037] line-through">采集：月光草</h3>
                 <span className="text-green-500 font-bold text-sm flex items-center gap-1">
                    <CheckCircleIcon /> 已完成
                 </span>
             </div>
             <p className="text-sm text-[#8B7355]">
                采集5株月光草交给药剂师。
             </p>
          </div>
       </div>
    </div>
  </div>
);

const CheckCircleIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

export default GameInterface;