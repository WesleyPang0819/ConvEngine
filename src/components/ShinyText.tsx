import { motion } from 'motion/react';

interface ShinyTextProps {
  text: string;
  className?: string;
  duration?: number;
  repeatDelay?: number;
  baseColor?: string;
  shineColor?: string;
}

export default function ShinyText({ 
  text, 
  className = "", 
  duration = 2,
  repeatDelay = 3,
  baseColor = "rgba(255,255,255,0.7)",
  shineColor = "rgba(255,255,255,1)"
}: ShinyTextProps) {
  return (
    <motion.span
      className={`inline-block text-transparent bg-clip-text ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, ${baseColor} 0%, ${baseColor} 40%, ${shineColor} 50%, ${baseColor} 60%, ${baseColor} 100%)`,
        backgroundSize: '200% auto',
      }}
      // Sweep from left to right (200% -> -200%)
      animate={{ backgroundPosition: ['200% center', '-200% center'] }}
      transition={{ duration, repeat: Infinity, ease: 'linear', repeatDelay }}
    >
      {text}
    </motion.span>
  );
}
