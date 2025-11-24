import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RPGButton, RPGCard } from '../components/RPGComponents';
import { Play, BookOpen, Star } from 'lucide-react';
import { ASSET_BASE_URL } from '../constants';
import { useGame } from '../src/contexts/GameContext';

// DZMM Nalang Model Options
const MODEL_OPTIONS = [
  {
    value: 'nalang-turbo-0826',
    label: 'Turbo',
    description: '32K · 轻量快速',
    badge: '轻量'
  },
  {
    value: 'nalang-medium-0826',
    label: 'Medium',
    description: '32K · 均衡通用',
    badge: '均衡'
  },
  {
    value: 'nalang-max-0826',
    label: 'Max',
    description: '32K · 叙事推荐',
    badge: '默认'
  },
  {
    value: 'nalang-xl-0826',
    label: 'XL',
    description: '32K · 长篇细节',
    badge: '长篇'
  },
  {
    value: 'nalang-max-0826-16k',
    label: 'Max · 16K',
    description: '16K · 更快的 Max',
    badge: '快速'
  },
  {
    value: 'nalang-xl-0826-16k',
    label: 'XL · 16K',
    description: '16K · 更快的 XL',
    badge: '快速'
  },
];

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedModel, setSelectedModel, resetGameState } = useGame();

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#E6F3F5]">
      {/* Background Layer - Fixed */}
      <div className="absolute inset-0 z-0">
         {/* Custom Image Background */}
         <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1.0 }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            className="w-full h-full"
         >
            <img 
              src={`${ASSET_BASE_URL}/valley.jpeg`} 
              alt="Valley Background" 
              className="w-full h-full object-cover"
            />
         </motion.div>

         {/* Overlay to ensure text readability and maintain cozy aesthetic */}
         <div className="absolute inset-0 bg-[#FFF9F0]/30 mix-blend-overlay" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F0] via-[#FFF9F0]/60 to-transparent" />
         
         {/* Pattern Overlay for texture */}
         <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#5D4037 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

         {/* Floating Magic Particles */}
         {[...Array(5)].map((_, i) => (
           <motion.div
             key={i}
             className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-[#FFD166] to-[#FF9FAA] blur-[2px]"
             style={{
               left: `${15 + i * 18}%`,
               top: `${20 + (i % 3) * 20}%`,
               boxShadow: '0 0 20px rgba(255, 209, 102, 0.6)'
             }}
             animate={{
               y: [0, -30, 0],
               x: [0, Math.sin(i) * 20, 0],
               opacity: [0.4, 0.8, 0.4],
               scale: [1, 1.2, 1]
             }}
             transition={{
               duration: 4 + i * 0.5,
               repeat: Infinity,
               ease: "easeInOut",
               delay: i * 0.3
             }}
           />
         ))}
      </div>

      {/* Main Content - Overlay (lock scroll on mobile) */}
      <div className="absolute inset-0 z-10 overflow-hidden md:overflow-y-auto md:overflow-x-hidden">
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 pt-8 md:pt-12">
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center mb-10 md:mb-16 relative shrink-0"
          >
            {/* Decorative Stars */}
            <Star className="absolute -top-8 -left-12 text-jrpg-accent w-12 h-12 animate-spin-slow drop-shadow-md hidden md:block" fill="#FFD166" />
            <Star className="absolute -bottom-4 -right-12 text-jrpg-primary w-8 h-8 animate-bounce drop-shadow-md hidden md:block" fill="#FF9FAA" />

            <h2 className="text-lg md:text-2xl font-bold text-jrpg-secondary mb-2 tracking-[0.3em] uppercase drop-shadow-sm">
              Project Aetheria
            </h2>
            <h1 className="text-5xl md:text-8xl font-serif font-black text-jrpg-text drop-shadow-md tracking-wide">
              艾瑟瑞亚
            </h1>
            <h3 className="text-xl md:text-3xl font-serif text-jrpg-text/80 mt-2 font-bold drop-shadow-sm">
              ~ 编年史 ~
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full max-w-4xl items-center">
            
            {/* Menu Actions */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-4 w-full max-w-xs mx-auto md:mx-0 order-2 md:order-1"
            >
              <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-xl backdrop-blur-md hover:shadow-[0_0_40px_rgba(255,159,170,0.3)] transition-all duration-500 hover:bg-white/70">
                <div className="space-y-4">
                  <RPGButton
                    onClick={() => {
                      resetGameState();
                      navigate('/create');
                    }}
                    icon={<Play size={20} fill="currentColor" />}
                    className="w-full shadow-lg"
                  >
                    开始新冒险
                  </RPGButton>
                  <RPGButton variant="secondary" onClick={() => navigate('/save')} icon={<BookOpen size={20} />} className="w-full">
                    读取存档
                  </RPGButton>
                </div>
              </div>
            </motion.div>

            {/* Model Selector / Info Card */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="order-1 md:order-2 w-full max-w-xs mx-auto md:max-w-none"
            >
              <RPGCard className="bg-white/80 rotate-2 hover:rotate-0 transition-all duration-500 shadow-xl hover:shadow-[0_0_40px_rgba(255,209,102,0.4)] hover:scale-105">
                <div className="absolute -top-3 -right-3 bg-jrpg-accent text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  DZMM API
                </div>
                <h3 className="font-serif font-bold text-jrpg-text mb-4 border-b-2 border-dashed border-jrpg-border pb-2 flex items-center justify-between">
                  <span>AI 叙事引擎</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-jrpg-text/60 mb-2 flex items-center gap-2 justify-between">
                      <span>选择 AI 模型</span>
                      {MODEL_OPTIONS.find(m => m.value === selectedModel) && (
                        <span className="text-[10px] bg-jrpg-primary/15 text-jrpg-primary px-2 py-0.5 rounded-full">
                          {MODEL_OPTIONS.find(m => m.value === selectedModel)?.badge}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full appearance-none bg-white border-2 border-jrpg-border rounded-xl px-4 py-2.5 pr-10 font-sans text-sm focus:border-jrpg-primary outline-none cursor-pointer transition-colors hover:border-jrpg-primary/50 shadow-inner"
                      >
                        {MODEL_OPTIONS.map((model) => (
                          <option key={model.value} value={model.value}>
                            {model.label} - {model.description}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-jrpg-text/40">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Model Info Card */}
                  <div className="bg-jrpg-bg/60 rounded-xl p-3 border border-jrpg-border/40 shadow-sm">
                    <div className="text-[10px] text-jrpg-text/70 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">当前模型：</span>
                        <span className="text-jrpg-text font-semibold">
                          {MODEL_OPTIONS.find(m => m.value === selectedModel)?.label}
                        </span>
                      </div>
                      <div className="text-jrpg-text/60">
                        {MODEL_OPTIONS.find(m => m.value === selectedModel)?.description}
                      </div>
                      <div className="pt-1 border-t border-jrpg-border/30 text-jrpg-text/50" />
                    </div>
                  </div>
                </div>
              </RPGCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
