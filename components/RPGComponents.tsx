import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const RPGButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  ...props 
}) => {
  // JRPG Style: Bubbly, Rounded, Soft Shadows
  const baseStyle = "relative overflow-hidden px-8 py-3 rounded-full font-sans font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed group tracking-wide";
  
  const variants = {
    primary: "bg-jrpg-primary text-white hover:brightness-110 active:bg-jrpg-primary",
    secondary: "bg-white text-jrpg-text border-2 border-jrpg-border hover:border-jrpg-primary hover:text-jrpg-primary",
    danger: "bg-red-400 text-white hover:bg-red-500",
    ghost: "bg-transparent text-jrpg-text hover:bg-jrpg-bg/50 shadow-none active:translate-y-0",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Sparkle effect on hover */}
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
      
      {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : icon}
      <span className="z-10 relative">{children}</span>
    </motion.button>
  );
};

export const RPGCard: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ 
  children, 
  className = '',
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      className={`bg-white/90 backdrop-blur-sm border border-jrpg-border shadow-lg rounded-3xl p-6 relative ${className}`}
    >
      {/* Decorative dots */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="w-2 h-2 rounded-full bg-jrpg-border/50"></div>
        <div className="w-2 h-2 rounded-full bg-jrpg-border/50"></div>
        <div className="w-2 h-2 rounded-full bg-jrpg-border/50"></div>
      </div>
      
      {children}
    </motion.div>
  );
};

export const RPGInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-jrpg-text/80 font-bold text-sm ml-2">{label}</label>}
    <input 
      className={`bg-jrpg-bg border-2 border-jrpg-border focus:border-jrpg-secondary rounded-2xl px-5 py-3 outline-none font-sans text-jrpg-text placeholder:text-gray-400 transition-colors shadow-inner ${className}`}
      {...props}
    />
  </div>
);

export const TypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = React.useState('');

  React.useEffect(() => {
    setDisplayedText('');
    const characters = Array.from(text); // Handle unicode (Chinese, Emojis) correctly by splitting into graphemes
    let currentIndex = 0;
    
    const intervalId = setInterval(() => {
      currentIndex++;
      setDisplayedText(characters.slice(0, currentIndex).join(''));

      if (currentIndex >= characters.length) {
        clearInterval(intervalId);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);

  return <span>{displayedText}</span>;
};