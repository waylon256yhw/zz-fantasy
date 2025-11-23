import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Character, ClassType, CharacterStats } from '../types';
import { CLASS_LABELS, IMAGES, INITIAL_STATS, getCharacterImage } from '../constants';
import { ChevronLeft, Save, Download, Trash2, Clock, MapPin, Settings, Music, Volume2, Monitor, CheckCircle, AlertCircle, X, ArrowLeft } from 'lucide-react';
import { RPGButton } from '../components/RPGComponents';

// Initial Mock Data
const INITIAL_SAVES = [
  // Ryza -> Alchemist (Mage visuals) Female
  { id: 1, name: '莱莎', classType: ClassType.ALCHEMIST, level: 12, location: '王都阿斯拉', time: '04:23:12', date: '2023/10/24', empty: false, avatar: getCharacterImage(ClassType.ALCHEMIST, 'Female') },
  // Cloud -> Knight (Warrior visuals) Male
  { id: 2, name: '克劳德', classType: ClassType.KNIGHT, level: 35, location: '古代遗迹深层', time: '12:45:00', date: '2023/10/20', empty: false, avatar: getCharacterImage(ClassType.KNIGHT, 'Male') },
  { id: 3, empty: true },
  { id: 4, empty: true },
];

interface SaveScreenProps {
  currentCharacter: Character | null;
  onLoadCharacter: (char: Character) => void;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const SaveScreen: React.FC<SaveScreenProps> = ({ currentCharacter, onLoadCharacter }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromGame = location.state?.fromGame;
  
  // State
  const [activeTab, setActiveTab] = useState<'SAVE' | 'LOAD' | 'SETTINGS'>(fromGame ? 'SAVE' : 'LOAD');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [saves, setSaves] = useState(INITIAL_SAVES);
  const [notification, setNotification] = useState<Toast | null>(null);

  // Tabs configuration
  const tabs = [
    { id: 'SAVE', label: '记录冒险', icon: <Save size={18} />, disabled: !fromGame },
    { id: 'LOAD', label: '重温回忆', icon: <Download size={18} />, disabled: false },
    { id: 'SETTINGS', label: '环境设置', icon: <Settings size={18} />, disabled: false },
  ];

  // Helper to determine if the "Right Page" (Detail/Settings) should be visible on mobile
  const showDetailPanel = selectedSlot !== null || activeTab === 'SETTINGS';

  const handleBack = () => {
    if (fromGame) {
        navigate('/game', { replace: true });
    } else {
        navigate('/');
    }
  };

  const closeDetailPanel = () => {
    setSelectedSlot(null);
    if (activeTab === 'SETTINGS') {
      // Revert to default tab for context
      setActiveTab(fromGame ? 'SAVE' : 'LOAD');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ id: Date.now(), message, type });
    // Auto dismiss
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSave = () => {
    if (!selectedSlot || !currentCharacter) return;

    // Simulate saving delay
    const newSaves = saves.map(slot => {
      if (slot.id === selectedSlot) {
        return {
          ...slot,
          name: currentCharacter.name,
          classType: currentCharacter.classType,
          level: currentCharacter.level,
          location: '当前位置', // In a real app, pass this via props
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          date: new Date().toLocaleDateString(),
          empty: false,
          avatar: currentCharacter.avatarUrl || getCharacterImage(currentCharacter.classType, currentCharacter.gender)
        };
      }
      return slot;
    });

    setSaves(newSaves);
    showToast(`进度已保存至 档案 ${selectedSlot}`, 'success');
  };

  const handleDelete = () => {
    if (!selectedSlot) return;
    
    const newSaves = saves.map(slot => {
      if (slot.id === selectedSlot) {
        return { id: slot.id, empty: true };
      }
      return slot;
    });

    setSaves(newSaves as any); // Cast for simplicity in this mockup
    showToast(`档案 ${selectedSlot} 已删除`, 'info');
    // On mobile, maybe close the panel after delete? Or stay to show it's empty.
    // staying is better UX usually.
  };

  const handleLoad = () => {
    if (!selectedSlot) return;
    const slot = saves.find(s => s.id === selectedSlot);
    if (!slot || slot.empty) {
      showToast("无法读取空白档案", "error");
      return;
    }
    
    showToast("正在读取世界线...", "success");
    
    // Construct a full Character object from the save slot
    // NOTE: In a real app, the save slot would contain full JSON data. 
    // Here we reconstruct minimal data for the mock.
    const loadedCharacter: Character = {
        name: slot.name!,
        classType: slot.classType!,
        gender: 'Female', // Default, as mock save doesn't have it
        stats: INITIAL_STATS[slot.classType!] || { STR: 5, DEX: 5, INT: 5, CHA: 5, LUCK: 5 },
        level: slot.level!,
        gold: 1250, // Mock gold
        avatarUrl: (slot as any).avatar || getCharacterImage(slot.classType!, 'Female'),
        appearance: "A weary traveler returned from the archives of time."
    };

    setTimeout(() => {
      onLoadCharacter(loadedCharacter);
      navigate('/game');
    }, 1000);
  };

  return (
    <div className="h-screen relative w-full bg-[#2C241F] flex items-center justify-center font-sans overflow-hidden md:p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/wood-pattern.png)' }} />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Main Book Container */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full h-full md:max-w-6xl md:h-auto md:max-h-[90vh] md:aspect-[16/10] bg-[#FDFBF7] md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative border-0 md:border-8 border-[#4A3728]"
      >
        {/* Book Spine (Visual) - Hidden on Mobile */}
        <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 w-8 bg-[#E6D7C3] -translate-x-1/2 z-10 shadow-inner flex-col items-center py-4 border-x border-[#D4C5B0]">
           <div className="w-[1px] h-full bg-[#B09F8D]" />
        </div>

        {/* --- LEFT PAGE (List & Tabs) --- */}
        <div className="w-full md:w-1/2 h-full bg-[#FFFBF0] p-6 md:p-12 flex flex-col relative border-r border-[#E6D7C3]">
           {/* Back Button (Global) */}
           <button 
             onClick={handleBack}
             className="flex items-center gap-2 text-[#8B7355] font-bold hover:text-[#5D4037] transition-colors z-20 mb-6 md:absolute md:top-8 md:left-8 md:mb-0"
           >
             <ChevronLeft size={20} />
             <span>{fromGame ? '返回冒险' : '返回标题'}</span>
           </button>

           <div className="mt-0 md:mt-12 mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#5D4037] mb-2">冒险日志</h1>
              <p className="text-[#8B7355] text-sm">Chronicle of Aetheria</p>
           </div>

           {/* Tabs */}
           <div className="flex gap-2 mb-6 md:mb-8 shrink-0">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 disabled={tab.disabled}
                 onClick={() => {
                   setActiveTab(tab.id as any);
                   if (tab.id !== 'SETTINGS') {
                      setSelectedSlot(null);
                   }
                 }}
                 className={`flex-1 py-3 rounded-t-xl font-bold flex items-center justify-center gap-2 transition-all ${
                   activeTab === tab.id 
                    ? 'bg-[#5D4037] text-[#FFF9F0] shadow-md translate-y-1' 
                    : tab.disabled 
                      ? 'opacity-30 cursor-not-allowed bg-transparent text-[#8B7355]'
                      : 'bg-[#E6D7C3]/30 text-[#8B7355] hover:bg-[#E6D7C3]/50'
                 }`}
               >
                 {tab.icon}
                 <span className="text-sm">{tab.label}</span>
               </button>
             ))}
           </div>

           {/* Slot List */}
           <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6 md:px-0 md:mx-0 pb-20 md:pb-0">
              <div className="space-y-4 pb-4">
              {saves.map((save) => (
                  <motion.button
                    key={save.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSlot(save.id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left relative group ${
                      selectedSlot === save.id 
                        ? 'border-[#FF9FAA] bg-[#FFF0F0] ring-2 ring-[#FF9FAA]/30 shadow-md' 
                        : 'border-[#E6D7C3] bg-white hover:border-[#D4C5B0] hover:shadow-sm'
                    }`}
                  >
                    <div className="absolute top-2 left-3 text-[10px] font-bold text-[#D4C5B0] tracking-widest">NO.0{save.id}</div>
                    
                    {!save.empty ? (
                      <div className="pl-6 pt-4 flex items-center gap-4">
                         {/* Avatar Image for Save Slot */}
                         <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden shrink-0">
                            <img src={(save as any).avatar} alt="char" className="w-full h-full object-cover" />
                         </div>
                         
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="font-bold text-[#5D4037] text-lg truncate">{save.name}</h3>
                              <span className="text-xs font-bold text-[#8B7355] shrink-0">Lv.{(save as any).level}</span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-xs text-[#9C8C74]">
                               <span className="truncate">{(save as any).location}</span>
                               <span className="opacity-70">{(save as any).date}</span>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="h-16 pl-6 pt-4 flex items-center text-[#D4C5B0] font-bold text-sm">
                         {activeTab === 'SAVE' ? '创建一个新存档...' : '---- 空白页 ----'}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
           </div>
        </div>

        {/* --- RIGHT PAGE (Details & Settings) --- */}
        {/* On Mobile: Fixed overlay that slides in. On Desktop: Static column. */}
        <div 
          className={`
            fixed inset-0 z-50 md:static md:z-auto
            w-full md:w-1/2 h-full 
            bg-[#FFFBF0] p-6 md:p-12 flex flex-col
            transition-transform duration-300 ease-in-out
            ${showDetailPanel ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}
        >
           {/* Mobile Header for Right Page */}
           <div className="md:hidden flex items-center mb-6 pb-4 border-b border-[#E6D7C3]">
              <button onClick={closeDetailPanel} className="p-2 -ml-2 text-[#5D4037]">
                 <ArrowLeft size={24} />
              </button>
              <h2 className="text-xl font-bold ml-2 text-[#5D4037]">
                {activeTab === 'SETTINGS' ? '环境设置' : '档案详情'}
              </h2>
           </div>

           {/* Bookmark (Desktop Only) */}
           <div className="hidden md:flex absolute -top-4 right-12 w-8 h-24 bg-[#FF9FAA] rounded-b-lg shadow-md z-20 items-end justify-center pb-2 transition-transform hover:translate-y-2 cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-white/30" />
           </div>

           {activeTab === 'SETTINGS' ? (
             <SettingsPanel />
           ) : (
             <AnimatePresence mode="wait">
               {selectedSlot ? (
                 <motion.div 
                   key="details"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="h-full flex flex-col"
                 >
                    {/* Detail View */}
                    <div className="flex-1 border-4 border-double border-[#E6D7C3] rounded-xl p-6 relative bg-white/50">
                       <h2 className="hidden md:flex text-2xl font-serif font-bold text-[#5D4037] mb-6 items-center gap-3">
                         <span className="w-8 h-8 rounded-full bg-[#5D4037] text-[#FFFBF0] flex items-center justify-center text-sm font-sans">{selectedSlot}</span>
                         档案详情
                       </h2>

                       {/* Determine which data to show */}
                       {(() => {
                         const slotData = saves.find(s => s.id === selectedSlot);
                         
                         if (!slotData || slotData.empty) return (
                           <div className="h-full flex flex-col items-center justify-center text-[#D4C5B0]">
                             <div className="w-24 h-24 rounded-full border-4 border-dashed border-[#E6D7C3] mb-4 flex items-center justify-center">
                               <Save className="opacity-20" size={32} />
                             </div>
                             <p>这里是一片空白...</p>
                             {activeTab === 'SAVE' && <p className="text-sm mt-2 text-[#FF9FAA]">点击下方按钮记录当前冒险</p>}
                           </div>
                         );

                         const dataToShow = slotData as any;
                         return (
                           <div className="space-y-6">
                              <div className="flex gap-6 items-center border-b border-[#E6D7C3] pb-6">
                                 <div className="w-24 h-24 bg-gray-200 rounded-xl shadow-inner overflow-hidden border-2 border-white shrink-0">
                                    <img src={dataToShow.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                 </div>
                                 <div className="min-w-0">
                                   <div className="text-2xl md:text-3xl font-bold text-[#5D4037] truncate">{dataToShow.name}</div>
                                   <div className="text-[#FF9FAA] font-bold text-lg">{CLASS_LABELS[dataToShow.classType as ClassType]} <span className="text-[#8B7355] text-sm ml-2">Lv.{dataToShow.level}</span></div>
                                 </div>
                              </div>

                              <div className="space-y-4 bg-[#FFF9F0] p-4 rounded-xl">
                                 <div className="flex items-center gap-3 text-[#5D4037]">
                                    <MapPin size={20} className="text-[#FF9FAA]" />
                                    <span className="font-bold">{dataToShow.location}</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-[#5D4037]">
                                    <Clock size={20} className="text-[#FF9FAA]" />
                                    <span className="font-bold font-mono text-lg">{dataToShow.time}</span>
                                 </div>
                              </div>

                              <div className="mt-auto text-sm text-[#8B7355] italic text-center opacity-70">
                                 "冒险的足迹，是通往未来的路标。"
                              </div>
                           </div>
                         );
                       })()}
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-4">
                       {activeTab === 'SAVE' ? (
                         <RPGButton onClick={handleSave} icon={<Save size={20} />} className="flex-1">
                           覆盖保存
                         </RPGButton>
                       ) : (
                         <RPGButton onClick={handleLoad} icon={<Download size={20} />} className="flex-1" disabled={!saves.find(s => s.id === selectedSlot && !s.empty)}>
                           读取进度
                         </RPGButton>
                       )}
                       
                       <button 
                        onClick={handleDelete}
                        disabled={!saves.find(s => s.id === selectedSlot && !s.empty)}
                        className="p-3 text-[#E6D7C3] hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#E6D7C3]"
                       >
                          <Trash2 size={24} />
                       </button>
                    </div>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="empty"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="hidden md:flex h-full flex-col items-center justify-center text-[#D4C5B0] font-bold text-lg"
                 >
                   <Download size={48} className="mb-4 opacity-20" />
                   <p>请选择左侧的一个记录...</p>
                 </motion.div>
               )}
             </AnimatePresence>
           )}
        </div>
      </motion.div>

      {/* JRPG Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className="fixed bottom-12 md:absolute md:bottom-12 z-[60] pointer-events-none"
          >
            <div className={`
              flex items-center gap-3 px-8 py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 backdrop-blur-md
              ${notification.type === 'success' ? 'bg-[#FFF9F0]/95 border-[#B5EAD7] text-[#5D4037]' : ''}
              ${notification.type === 'error' ? 'bg-[#FFF0F0]/95 border-red-200 text-red-800' : ''}
              ${notification.type === 'info' ? 'bg-white/95 border-[#E6D7C3] text-[#8B7355]' : ''}
            `}>
              {notification.type === 'success' && <div className="bg-[#B5EAD7] p-1 rounded-full"><CheckCircle size={20} className="text-green-700" /></div>}
              {notification.type === 'error' && <AlertCircle size={20} />}
              {notification.type === 'info' && <div className="bg-[#E6D7C3] p-1 rounded-full"><Trash2 size={16} className="text-[#5D4037]" /></div>}
              
              <span className="font-bold text-sm tracking-wide">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingsPanel = () => (
  <div className="h-full flex flex-col p-2 md:p-4">
    <h2 className="hidden md:block text-2xl font-serif font-bold text-[#5D4037] mb-8 border-b border-[#E6D7C3] pb-4">系统环境</h2>
    
    <div className="space-y-8">
      <div className="space-y-3">
         <label className="flex items-center gap-2 font-bold text-[#5D4037]">
            <Music size={20} /> 背景音乐
         </label>
         <input type="range" className="w-full accent-[#5D4037] bg-gray-200 h-2 rounded-lg appearance-none cursor-pointer" />
      </div>

      <div className="space-y-3">
         <label className="flex items-center gap-2 font-bold text-[#5D4037]">
            <Volume2 size={20} /> 音效音量
         </label>
         <input type="range" className="w-full accent-[#5D4037] bg-gray-200 h-2 rounded-lg appearance-none cursor-pointer" />
      </div>

      <div className="space-y-3">
         <label className="flex items-center gap-2 font-bold text-[#5D4037]">
            <Monitor size={20} /> 画面显示
         </label>
         <div className="flex gap-4">
            <button className="flex-1 py-2 border-2 border-[#5D4037] rounded-lg font-bold bg-[#5D4037] text-white transition-transform active:scale-95">窗口模式</button>
            <button className="flex-1 py-2 border-2 border-[#E6D7C3] rounded-lg font-bold text-[#8B7355] hover:border-[#5D4037] hover:text-[#5D4037] transition-all active:scale-95">全屏显示</button>
         </div>
      </div>
    </div>
    
    <div className="mt-auto text-center text-xs text-[#D4C5B0]">
       Version 1.0.2-alpha
    </div>
  </div>
);

export default SaveScreen;