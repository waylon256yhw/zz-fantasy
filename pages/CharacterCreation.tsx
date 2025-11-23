import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RPGCard, RPGInput } from '../components/RPGComponents';
import { ClassType, CharacterStats, Character } from '../types';
import { INITIAL_STATS, CLASS_DESCRIPTIONS, CLASS_LABELS, IMAGES, getCharacterImage } from '../constants';
import { ChevronLeft, Sparkles, CheckCircle, Wand2, Palette, ArrowRight, ArrowLeft } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface CharacterCreationProps {
  onComplete: (char: Character) => void;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassType>(ClassType.ALCHEMIST);
  const [gender, setGender] = useState<'Male'|'Female'>('Female');
  
  // Mobile Stepper State: 0 = Form/Details, 1 = Class/Visuals, 2 = Summary/Stats
  const [mobileStep, setMobileStep] = useState(0);
  
  const stats = INITIAL_STATS[selectedClass];

  const handleStart = () => {
    if (!name) return;
    const newChar: Character = {
      name,
      classType: selectedClass,
      gender,
      stats,
      level: 1,
      gold: 100,
      avatarUrl: getCharacterImage(selectedClass, gender),
      appearance
    };
    onComplete(newChar);
    navigate('/game');
  };

  const data = Object.keys(stats).map(key => ({
    subject: key,
    A: stats[key as keyof CharacterStats],
    fullMark: 15,
  }));

  const genderMap: Record<string, string> = {
    'Male': '男性',
    'Female': '女性'
  };

  const nextStep = () => setMobileStep(prev => Math.min(2, prev + 1));
  const prevStep = () => setMobileStep(prev => Math.max(0, prev - 1));

  // --- Render Functions ---

  const renderVisualsSection = () => (
    <div className="h-full flex flex-col gap-3 lg:gap-4">
        {/* Immersive Card - Matches GameInterface Style */}
        <div className="relative flex-1 min-h-[240px] lg:min-h-0 bg-[#2C241F] rounded-[2rem] lg:rounded-[2.5rem] shadow-xl overflow-hidden border-[4px] lg:border-[6px] border-white ring-1 ring-[#E6D7C3] group hover:shadow-[0_0_50px_rgba(255,209,102,0.5)] transition-all duration-500">
            {/* Main Character Image */}
            <img
              src={getCharacterImage(selectedClass, gender)}
              alt="Character Preview"
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-[#FFD166]/0 group-hover:bg-[#FFD166]/10 transition-all duration-500 rounded-[2rem] lg:rounded-[2.5rem]" />

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2C241F] via-[#2C241F]/30 to-transparent opacity-90" />
            
            {/* Sparkles Decoration */}
            <div className="absolute top-6 right-6 lg:top-8 lg:right-8 animate-pulse text-[#FFD166] drop-shadow-md">
               <Sparkles size={24} fill="currentColor" />
            </div>

            {/* Immersive Text Overlay (No Box) */}
            <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-8 flex flex-col items-start z-10">
               <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-0.5 lg:px-3 lg:py-1 mb-2 lg:mb-3 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFD166] shadow-[0_0_5px_#FFD166]" />
                  <span className="text-[10px] font-bold text-white tracking-widest uppercase">Class Select</span>
               </div>
               
               <h2 className="text-3xl lg:text-4xl font-black text-white mb-1 drop-shadow-md tracking-tight">
                 {CLASS_LABELS[selectedClass]}
               </h2>
               
               <p className="text-white/60 font-bold text-sm tracking-[0.2em] uppercase font-mono">
                 {selectedClass}
               </p>
            </div>
        </div>
        
        {/* Class Selection Grid */}
        <div className="grid grid-cols-2 gap-2 lg:gap-3 shrink-0">
            {Object.values(ClassType).map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`relative px-2 py-2 lg:px-4 lg:py-3 rounded-xl lg:rounded-2xl font-bold text-xs lg:text-sm transition-all duration-200 border-2 shadow-sm flex items-center justify-center gap-2 overflow-hidden group/btn ${
                  selectedClass === c 
                  ? 'bg-[#5D4037] border-[#5D4037] text-white shadow-md translate-y-[-2px]' 
                  : 'bg-white border-[#E6D7C3] text-[#8B7355] hover:border-[#5D4037]/50 hover:bg-[#FFF9F0]'
                }`}
              >
                {/* Active Indicator Background */}
                {selectedClass === c && (
                   <motion.div layoutId="activeClass" className="absolute inset-0 bg-white/10" />
                )}
                
                {selectedClass === c && <Sparkles size={12} className="text-[#FFD166] lg:w-[14px] lg:h-[14px]" fill="currentColor" />}
                <span className="relative z-10">{CLASS_LABELS[c]}</span>
              </button>
            ))}
        </div>
    </div>
  );

  const renderFormSection = () => (
    <RPGCard className="lg:h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 lg:mb-6">
          <div className="w-8 h-8 rounded-full bg-jrpg-accent flex items-center justify-center text-white font-bold shrink-0">1</div>
          <h3 className="text-xl font-bold text-jrpg-text">基本信息</h3>
      </div>
      
      <div className="space-y-4 lg:space-y-6 flex-1">
        <RPGInput 
          label="冒险者姓名" 
          placeholder="例如：莱莎、克劳德..." 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="py-2.5 lg:py-3"
        />
        
        <div>
          <label className="text-jrpg-text/80 font-bold text-sm ml-2 mb-1.5 lg:mb-2 block">性别</label>
          <div className="flex gap-2 lg:gap-4 bg-jrpg-bg p-1.5 lg:p-2 rounded-2xl border-2 border-jrpg-border w-full lg:w-fit overflow-x-auto">
            {['Male', 'Female'].map((g) => (
              <label key={g} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 lg:px-4 py-2 rounded-xl cursor-pointer transition-all whitespace-nowrap ${gender === g ? 'bg-white shadow-sm text-jrpg-secondary' : 'text-jrpg-text/50 hover:text-jrpg-text'}`}>
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={gender === g}
                  onChange={() => setGender(g as 'Male'|'Female')}
                  className="hidden"
                />
                <span className="font-bold text-sm">{genderMap[g]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-jrpg-secondary/10 p-3 lg:p-4 rounded-2xl border border-jrpg-secondary/20">
          <h4 className="font-bold text-jrpg-secondary mb-1 lg:mb-2 flex items-center gap-2 text-sm lg:text-base">
              <Wand2 size={16} /> 职业特性
          </h4>
          <p className="text-xs lg:text-sm text-jrpg-text/80 leading-relaxed">
            {CLASS_DESCRIPTIONS[selectedClass]}
          </p>
        </div>

        {/* Appearance Section */}
        <div>
          <label className="text-jrpg-text/80 font-bold text-sm ml-2 mb-1.5 lg:mb-2 block flex items-center gap-2">
              <Palette size={16} /> 外貌特征 <span className="text-jrpg-text/40 font-normal text-xs">(可选)</span>
          </label>
          <textarea
            className="w-full bg-jrpg-bg border-2 border-jrpg-border focus:border-jrpg-secondary rounded-2xl px-4 py-2.5 lg:px-5 lg:py-3 outline-none font-sans text-jrpg-text placeholder:text-gray-400 transition-colors shadow-inner min-h-[80px] lg:min-h-[100px] resize-none text-sm lg:text-base"
            placeholder="例如：银色长发，瞳孔异色，总是戴着防风镜..."
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
          />
        </div>
      </div>
    </RPGCard>
  );

  const renderSummarySection = () => (
    <div className="flex flex-col space-y-6 h-full">
      {/* Radar Chart */}
      {/* Fixed height on mobile (h-64) to ensure Recharts renders correctly. Flex-1 on desktop to fill column. */}
      <div className="bg-white rounded-3xl p-6 border border-jrpg-border shadow-sm h-64 lg:h-auto lg:flex-1 lg:min-h-[300px] flex flex-col relative overflow-hidden">
        <h3 className="text-sm font-bold text-jrpg-text/50 absolute top-4 left-6 z-10">能力雷达图</h3>
        <div className="flex-1 w-full -ml-2 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#E6D7C3" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#5D4037', fontSize: 12, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 15]} tick={false} axisLine={false} />
              <Radar
                name={selectedClass}
                dataKey="A"
                stroke="#FFD166"
                strokeWidth={3}
                fill="#FFD166"
                fillOpacity={0.5}
                animationDuration={1200}
                animationBegin={0}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gradient-to-br from-jrpg-accent to-orange-300 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden shrink-0">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        
        <h3 className="font-serif font-bold text-xl mb-2 relative z-10">准备好了吗？</h3>
        <p className="text-sm text-white/90 mb-6 relative z-10 leading-relaxed">
          一旦踏出这扇门，世界将因你而改变。请确认你的冒险执照信息无误。
        </p>
        <button 
          className="w-full bg-white text-jrpg-accent font-bold py-3 rounded-xl shadow-md hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!name}
          onClick={handleStart}
        >
          <CheckCircle size={20}/>
          <span>开启旅程</span>
        </button>
      </div>
      
      <div className="text-center shrink-0">
        <span className="text-[10px] text-jrpg-text/40 font-bold uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full">World Seed: {Math.floor(Math.random() * 999999)}</span>
      </div>
    </div>
  );

  return (
    <div className="h-screen relative w-full overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-center font-sans bg-[#FFF9F0]">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src={IMAGES.bg.guild} 
          alt="Guild Hall" 
          className="w-full h-full object-cover"
        />
        {/* Reduced overlay opacity (40%) */}
        <div className="absolute inset-0 bg-[#FFF9F0]/40 backdrop-blur-[1px]" />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full h-full lg:h-auto flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
          
        {/* Header - Sticky on Mobile */}
        <div className="flex-none flex justify-between items-center mb-4 lg:mb-8 z-50">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-jrpg-text/60 hover:text-jrpg-primary font-bold transition-colors bg-white/80 px-4 py-2 rounded-full shadow-sm backdrop-blur-md">
            <ChevronLeft size={18} /> <span className="hidden sm:inline">返回标题</span>
          </button>
          <div className="flex items-center gap-2 text-jrpg-primary bg-white/80 px-6 py-2 rounded-full shadow-sm backdrop-blur-md">
            <Sparkles size={24} />
            <h2 className="text-xl md:text-2xl font-serif font-bold text-jrpg-text">创建你的角色</h2>
          </div>
        </div>

        {/* --- DESKTOP LAYOUT (Grid) --- */}
        <div className="hidden lg:grid grid-cols-12 gap-6 xl:gap-8 items-stretch">
          {/* Column 1: Form Section (Basic Info) */}
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="col-span-5 flex flex-col h-full">
             {renderFormSection()}
          </motion.div>

          {/* Column 2: Visuals Section (Portrait & Class) */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="col-span-3 flex flex-col h-full">
             {renderVisualsSection()}
          </motion.div>

          {/* Column 3: Summary Section */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="col-span-4 flex flex-col h-full">
             {renderSummarySection()}
          </motion.div>
        </div>

        {/* --- MOBILE LAYOUT (Carousel/Stepper) --- */}
        <div className="lg:hidden flex-1 flex flex-col relative overflow-hidden rounded-3xl bg-white/30 backdrop-blur-sm border border-white/50 shadow-inner">
           <AnimatePresence mode="wait">
             <motion.div
                key={mobileStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-32" 
             >
                {/* Step 0: Form / Basic Info */}
                {mobileStep === 0 && renderFormSection()}
                {/* Step 1: Visuals / Class Select */}
                {mobileStep === 1 && renderVisualsSection()}
                {/* Step 2: Summary */}
                {mobileStep === 2 && renderSummarySection()}
             </motion.div>
           </AnimatePresence>

           {/* Mobile Bottom Navigation Bar */}
           <div className="absolute bottom-0 left-0 right-0 bg-white/50 backdrop-blur-md border-t border-white/40 p-4 pb-8 flex justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <button 
                onClick={prevStep} 
                disabled={mobileStep === 0}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-[#F7F2E8]/80 text-[#5D4037] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E6D7C3] transition-colors shadow-sm"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="flex gap-2">
                 {[0, 1, 2].map(step => (
                   <div
                     key={step}
                     className={`relative w-2.5 h-2.5 rounded-full transition-all duration-300 ${mobileStep === step ? 'bg-[#FFD166] scale-125' : 'bg-[#E6D7C3]/80'}`}
                   >
                     {mobileStep === step && (
                       <div className="absolute inset-0 rounded-full bg-[#FFD166] animate-ping opacity-75" />
                     )}
                   </div>
                 ))}
              </div>

              {mobileStep < 2 ? (
                <button 
                  onClick={nextStep}
                  className="px-6 py-3 rounded-xl bg-[#5D4037] text-white font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <span>下一步</span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                // Placeholder to keep the flex layout balanced (dots centered)
                <div className="w-[88px]" />
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default CharacterCreation;