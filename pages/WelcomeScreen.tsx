import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RPGButton, RPGCard } from '../components/RPGComponents';
import { Play, BookOpen, Star } from 'lucide-react';
import { ASSET_BASE_URL } from '../constants';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [model, setModel] = useState('Gemini 2.5 Flash');
  const [dataEngine, setDataEngine] = useState('Aetheria Vector DB');

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
      </div>

      {/* Main Content - Scrollable Overlay */}
      <div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-8 py-12">
          
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
              <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-xl backdrop-blur-md">
                <div className="space-y-4">
                  <RPGButton onClick={() => navigate('/create')} icon={<Play size={20} fill="currentColor" />} className="w-full shadow-lg">
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
              <RPGCard className="bg-white/80 rotate-2 hover:rotate-0 transition-transform duration-500 shadow-xl">
                <div className="absolute -top-3 -right-3 bg-jrpg-accent text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  Ver 1.0
                </div>
                <h3 className="font-serif font-bold text-jrpg-text mb-4 border-b-2 border-dashed border-jrpg-border pb-2">
                  世界构造
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-jrpg-text/60 mb-2">选择叙事引擎</label>
                    <div className="relative">
                      <select 
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full appearance-none bg-jrpg-bg border-2 border-jrpg-border rounded-xl px-4 py-3 font-sans text-sm focus:border-jrpg-primary outline-none cursor-pointer"
                      >
                        <option>Gemini 2.5 Flash</option>
                        <option>Gemini 2.5 Pro</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-jrpg-text/40">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-jrpg-text/60 mb-2">选择数据引擎</label>
                    <div className="relative">
                      <select 
                        value={dataEngine}
                        onChange={(e) => setDataEngine(e.target.value)}
                        className="w-full appearance-none bg-jrpg-bg border-2 border-jrpg-border rounded-xl px-4 py-3 font-sans text-sm focus:border-jrpg-primary outline-none cursor-pointer"
                      >
                        <option>Aetheria Vector DB</option>
                        <option>Cloud Firestore</option>
                        <option>Local Storage</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-jrpg-text/40">
                        ▼
                      </div>
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