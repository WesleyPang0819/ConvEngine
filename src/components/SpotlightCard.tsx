import React, { useRef, useState } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(9, 116, 241, 0.22)'
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative p-[1.5px] rounded-[2rem] overflow-hidden transition-all duration-300 group ${className}`}
      style={{
        background: isHovered
          ? `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, rgba(226, 232, 240, 0.5))`
          : 'rgba(226, 232, 240, 0.6)',
      }}
    >
      <div className="bg-white rounded-[1.92rem] w-full h-full relative z-10 flex flex-col justify-start overflow-hidden p-5 md:p-8">
        {/* Soft internal shine on hover */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{
            background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, rgba(9, 116, 241, 0.04), transparent 80%)`,
          }}
        />
        {children}
      </div>
    </div>
  );
}
