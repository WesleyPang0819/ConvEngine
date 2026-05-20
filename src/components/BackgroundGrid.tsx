import { motion } from 'motion/react';

export default function BackgroundGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 静态底层网格 */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)', 
          backgroundSize: '30px 30px' 
        }}
      ></div>
      
      {/* 动态高亮扫描网格 */}
      <motion.div 
        className="absolute inset-0 z-10" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', 
          backgroundSize: '30px 30px',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 40%, black 50%, transparent 60%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 40%, black 50%, transparent 60%, transparent 100%)',
          WebkitMaskSize: '100% 200%',
          maskSize: '100% 200%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
        animate={{ 
          WebkitMaskPosition: ['center -200%', 'center 200%'],
          maskPosition: ['center -200%', 'center 200%']
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      ></motion.div>
    </div>
  );
}
