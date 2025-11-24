import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Character, ClassType, CharacterStats } from '../types';
import { CLASS_LABELS, IMAGES, INITIAL_STATS, getCharacterImage } from '../constants';
import { ChevronLeft, Save, Download, Trash2, Clock, MapPin, CheckCircle, AlertCircle, X, ArrowLeft, Coins, Trophy, Target, Gem } from 'lucide-react';
import { RPGButton } from '../components/RPGComponents';
import { useGame, SavePreview } from '../src/contexts/GameContext';
import { DZMMService } from '../src/services/dzmmService';

interface SaveSlot {
  id: number;
  empty: boolean;
  name?: string;
  classType?: ClassType;
  level?: number;
  gold?: number;
  exp?: number;
  location?: string;
  time?: string;
  date?: string;
  avatar?: string;
  messageCount?: number;
  questsCompleted?: number;
  questsActive?: number;
  legendaryPurchased?: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const SAVE_SLOTS = [0, 1, 2, 3]; // Slot 0 is auto-save (read-only)

const SaveScreen: React.FC = () => {
  const { character, saveGame, loadGame, getSavePreview } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const fromGame = location.state?.fromGame;
  
  // State
  const [activeTab, setActiveTab] = useState<'SAVE' | 'LOAD' | 'SETTINGS'>(fromGame ? 'SAVE' : 'LOAD');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [notification, setNotification] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(true);

  // Load save previews on mount
  useEffect(() => {
    loadSavePreviews();
  }, []);

  const loadSavePreviews = async () => {
    setLoading(true);
    const loadedSlots: SaveSlot[] = [];

    for (const slotNumber of SAVE_SLOTS) {
      const preview = await getSavePreview(slotNumber);
      if (preview) {
        loadedSlots.push({
          id: slotNumber,
          empty: false,
          name: preview.characterName,
          classType: preview.classType as ClassType,
          level: preview.level,
          gold: preview.gold,
          exp: preview.exp,
          location: preview.location,
          date: preview.timestamp,
          messageCount: preview.messageCount,
          avatar: preview.avatarUrl,
          questsCompleted: preview.questsCompleted,
          questsActive: preview.questsActive,
          legendaryPurchased: preview.legendaryPurchased,
        });
      } else {
        loadedSlots.push({
          id: slotNumber,
          empty: true,
        });
      }
    }

    setSaves(loadedSlots);
    setLoading(false);
  };

  // Tabs configuration
  const tabs = [
    { id: 'SAVE', label: '记录冒险', icon: <Save size={18} />, disabled: !fromGame },
    { id: 'LOAD', label: '重温回忆', icon: <Download size={18} />, disabled: false },
  ];

  // Helper to determine if the "Right Page" (Detail) should be visible on mobile
  const showDetailPanel = selectedSlot !== null;

  const handleBack = () => {
    if (fromGame) {
        navigate('/game', { replace: true });
    } else {
        navigate('/');
    }
  };

  const closeDetailPanel = () => {
    setSelectedSlot(null);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ id: Date.now(), message, type });
    // Auto dismiss
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSave = async () => {
    if (!selectedSlot || !character) return;

    // Prevent overwriting auto-save slot
    if (selectedSlot === 0) {
      showToast('自动存档为只读，请选择其他槽位', 'error');
      return;
    }

    try {
      await saveGame(selectedSlot);
      showToast(`进度已保存至 档案 ${selectedSlot}`, 'success');

      // Reload previews to reflect new save
      await loadSavePreviews();
    } catch (error) {
      console.error('[SaveScreen] Save failed:', error);
      showToast('保存失败，请重试', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedSlot) return;

    // Prevent deleting auto-save slot
    if (selectedSlot === 0) {
      showToast('自动存档不能删除', 'error');
      return;
    }

    if (!confirm(`确定删除档案 ${selectedSlot}？`)) return;

    try {
      const key = `aetheria_save_slot_${selectedSlot}`;
      await DZMMService.kvDelete(key);
      showToast(`档案 ${selectedSlot} 已删除`, 'info');

      // Reload previews
      await loadSavePreviews();
      setSelectedSlot(null);
    } catch (error) {
      console.error('[SaveScreen] Delete failed:', error);
      showToast('删除失败，请重试', 'error');
    }
  };

  const handleLoad = async () => {
    if (!selectedSlot) return;
    const slot = saves.find(s => s.id === selectedSlot);
    if (!slot || slot.empty) {
      showToast('无法读取空白档案', 'error');
      return;
    }

    showToast('正在读取世界线...', 'success');

    try {
      const success = await loadGame(selectedSlot);
      if (success) {
        setTimeout(() => {
          navigate('/game');
        }, 500);
      } else {
        showToast('读取失败：存档不存在', 'error');
      }
    } catch (error) {
      console.error('[SaveScreen] Load failed:', error);
      showToast('读取失败，请重试', 'error');
    }
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
                   setSelectedSlot(null);
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
           <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar -mx-6 px-6 md:px-0 md:mx-0 pb-20 md:pb-0">
              <div className="space-y-4 pb-4">
              {saves.map((save) => {
                const isAutoSave = save.id === 0;
                return (
                  <motion.button
                    key={save.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSlot(save.id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left relative group ${
                      isAutoSave
                        ? selectedSlot === save.id
                          ? 'border-[#FFD166] bg-[#FFFBF0] ring-2 ring-[#FFD166]/30 shadow-md'
                          : 'border-[#FFD166]/50 bg-[#FFFEF5] hover:border-[#FFD166] hover:shadow-sm'
                        : selectedSlot === save.id
                          ? 'border-[#FF9FAA] bg-[#FFF0F0] ring-2 ring-[#FF9FAA]/30 shadow-md'
                          : 'border-[#E6D7C3] bg-white hover:border-[#D4C5B0] hover:shadow-sm'
                    }`}
                  >
                    <div className="absolute top-2 left-3 flex items-center gap-2">
                      {isAutoSave ? (
                        <span className="text-[10px] font-bold text-[#C27B28] tracking-wide px-2 py-0.5 bg-[#FFD166]/20 rounded-full border border-[#FFD166]/30">
                          🔄 自动存档
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#D4C5B0] tracking-widest">NO.0{save.id}</span>
                      )}
                    </div>
                    
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
                              {(save as any).legendaryPurchased !== undefined && (
                                <span className="text-[10px] text-[#C27B28] font-bold">
                                  传奇宝物 {(save as any).legendaryPurchased}/16
                                </span>
                              )}
                           </div>
                        </div>
                     </div>
                    ) : (
                      <div className="h-16 pl-6 pt-4 flex items-center text-[#D4C5B0] font-bold text-sm">
                         {activeTab === 'SAVE' ? '创建一个新存档...' : '---- 空白页 ----'}
                      </div>
                    )}
                  </motion.button>
                );
              })}
              </div>
           </div>
        </div>

        {/* --- RIGHT PAGE (Details & Settings) --- */}
        {/* On Mobile: Fixed overlay that slides in. On Desktop: Static column. */}
        <div
          className={`
            fixed inset-0 z-50 md:static md:z-auto
            w-full md:w-1/2 h-full
            bg-[#FFFBF0] p-4 pb-6 md:p-12 flex flex-col
            transition-transform duration-300 ease-in-out
            ${showDetailPanel ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}
        >
           {/* Mobile Header for Right Page */}
           <div className="md:hidden flex items-center mb-4 pb-3 border-b border-[#E6D7C3]">
              <button onClick={closeDetailPanel} className="p-2 -ml-2 text-[#5D4037]">
                 <ArrowLeft size={24} />
              </button>
              <h2 className="text-xl font-bold ml-2 text-[#5D4037]">档案详情</h2>
           </div>

           {/* Bookmark (Desktop Only) */}
           <div className="hidden md:flex absolute -top-4 right-12 w-8 h-24 bg-[#FF9FAA] rounded-b-lg shadow-md z-20 items-end justify-center pb-2 transition-transform hover:translate-y-2 cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-white/30" />
           </div>

           <AnimatePresence mode="wait">
               {selectedSlot ? (
                 <motion.div
                   key="details"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="h-full flex flex-col"
                 >
                    {/* Detail View with scroll container */}
                    <div className="flex-1 border-4 border-double border-[#E6D7C3] rounded-xl p-4 md:p-6 relative bg-white/50 overflow-y-auto custom-scrollbar">
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
                           <div className="space-y-4 md:space-y-6 pb-4">
                              <div className="flex gap-4 md:gap-6 items-center border-b border-[#E6D7C3] pb-4 md:pb-6">
                                 <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-200 rounded-xl shadow-inner overflow-hidden border-2 border-white shrink-0">
                                    <img src={dataToShow.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                 </div>
                                 <div className="min-w-0">
                                   <div className="text-xl md:text-3xl font-bold text-[#5D4037] truncate">{dataToShow.name}</div>
                                   <div className="text-[#FF9FAA] font-bold text-base md:text-lg">{CLASS_LABELS[dataToShow.classType as ClassType]} <span className="text-[#8B7355] text-sm ml-2">Lv.{dataToShow.level}</span></div>
                                 </div>
                              </div>

                              <div className="space-y-3 bg-[#FFF9F0] p-3 md:p-4 rounded-xl text-sm">
                                 <div className="flex items-center gap-2 text-[#5D4037]">
                                    <MapPin size={18} className="text-[#FF9FAA] shrink-0" />
                                    <span className="font-bold truncate">{dataToShow.location}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-[#5D4037]">
                                    <Clock size={18} className="text-[#FF9FAA] shrink-0" />
                                    <span className="font-bold text-xs md:text-sm">{dataToShow.date}</span>
                                 </div>
                              </div>

                              {/* Stats Grid - Compact for mobile */}
                              <div className="grid grid-cols-2 gap-2 md:gap-3">
                                 <div className="bg-white p-2.5 md:p-3 rounded-lg md:rounded-xl border-2 border-[#FFD166]/30 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-1">
                                       <Coins size={14} className="text-[#FFD166]" />
                                       <span className="text-[10px] md:text-xs font-bold text-[#8B7355] uppercase">Gold</span>
                                    </div>
                                    <div className="text-lg md:text-2xl font-black text-[#5D4037]">
                                       {dataToShow.gold || 0}
                                       <span className="text-[10px] md:text-xs text-[#8B7355] ml-1">G</span>
                                    </div>
                                 </div>

                                 <div className="bg-white p-2.5 md:p-3 rounded-lg md:rounded-xl border-2 border-[#89CFF0]/30 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-1">
                                       <Trophy size={14} className="text-[#89CFF0]" />
                                       <span className="text-[10px] md:text-xs font-bold text-[#8B7355] uppercase">EXP</span>
                                    </div>
                                    <div className="text-lg md:text-2xl font-black text-[#5D4037]">
                                       {dataToShow.exp || 0}
                                       <span className="text-[10px] md:text-xs text-[#8B7355] ml-1">/ 100</span>
                                    </div>
                                 </div>

                                 <div className="bg-white p-2.5 md:p-3 rounded-lg md:rounded-xl border-2 border-[#B5EAD7]/30 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-1">
                                       <CheckCircle size={14} className="text-green-500" />
                                       <span className="text-[10px] md:text-xs font-bold text-[#8B7355] uppercase">完成</span>
                                    </div>
                                    <div className="text-lg md:text-2xl font-black text-[#5D4037]">
                                       {dataToShow.questsCompleted || 0}
                                       <span className="text-[10px] md:text-xs text-[#8B7355] ml-1">任务</span>
                                    </div>
                                 </div>

                                 <div className="bg-white p-2.5 md:p-3 rounded-lg md:rounded-xl border-2 border-[#E6D7C3] shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-1">
                                       <Target size={14} className="text-[#FF9FAA]" />
                                       <span className="text-[10px] md:text-xs font-bold text-[#8B7355] uppercase">进行中</span>
                                    </div>
                                    <div className="text-lg md:text-2xl font-black text-[#5D4037]">
                                       {dataToShow.questsActive || 0}
                                       <span className="text-[10px] md:text-xs text-[#8B7355] ml-1">任务</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="bg-white p-2.5 md:p-3 rounded-lg md:rounded-xl border-2 border-[#E6D7C3] shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                   <Gem size={14} className="text-[#C27B28]" />
                                   <span className="text-[10px] md:text-xs font-bold text-[#8B7355] uppercase">传奇宝物</span>
                                </div>
                                <div className="text-lg md:text-2xl font-black text-[#5D4037]">
                                   {(dataToShow as any).legendaryPurchased || 0}
                                   <span className="text-[10px] md:text-xs text-[#8B7355] ml-1">/ 16</span>
                                </div>
                              </div>

                              <div className="hidden md:block text-sm text-[#8B7355] italic text-center opacity-70 col-span-2">
                                 "冒险的足迹，是通往未来的路标。"
                              </div>
                           </div>
                         );
                       })()}
                    </div>

                    {/* Actions - Fixed spacing */}
                    <div className="mt-4 md:mt-8 flex gap-3 md:gap-4 flex-none">
                       {activeTab === 'SAVE' ? (
                         <RPGButton onClick={handleSave} icon={<Save size={18} />} className="flex-1 text-sm md:text-base py-2.5 md:py-3">
                           覆盖保存
                         </RPGButton>
                       ) : (
                         <RPGButton onClick={handleLoad} icon={<Download size={18} />} className="flex-1 text-sm md:text-base py-2.5 md:py-3" disabled={!saves.find(s => s.id === selectedSlot && !s.empty)}>
                           读取进度
                         </RPGButton>
                       )}

                       <button
                        onClick={handleDelete}
                        disabled={!saves.find(s => s.id === selectedSlot && !s.empty)}
                        className="p-2.5 md:p-3 text-[#E6D7C3] hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#E6D7C3]"
                       >
                          <Trash2 size={20} className="md:w-6 md:h-6" />
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

export default SaveScreen;
