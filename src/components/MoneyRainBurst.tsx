import React, { useEffect, useState } from 'react';

interface MoneyRainBurstProps {
  durationMs?: number;
}

interface MoneyParticle {
  id: number;
  symbol: string;
  left: number; // percentage 0 - 100
  size: number; // px font size
  duration: number; // seconds
  delay: number; // seconds
  rotation: number; // degrees
}

const MONEY_SYMBOLS = ['💵', '💰', '💸', '💵', '🤑', '💵', '💰', '💸'];

export const MoneyRainBurst: React.FC<MoneyRainBurstProps> = ({ durationMs = 5000 }) => {
  const [particles, setParticles] = useState<MoneyParticle[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Generate 40 falling money particles
    const generated: MoneyParticle[] = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      symbol: MONEY_SYMBOLS[Math.floor(Math.random() * MONEY_SYMBOLS.length)],
      left: Math.random() * 95,
      size: Math.floor(20 + Math.random() * 26), // 20px to 46px
      duration: 2 + Math.random() * 2.5, // 2s to 4.5s
      delay: Math.random() * 1.5, // 0s to 1.5s
      rotation: Math.floor(Math.random() * 360)
    }));

    setParticles(generated);

    const timer = setTimeout(() => {
      setVisible(false);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-moneyFall select-none"
          style={{
            left: `${p.left}%`,
            top: '-50px',
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`
          }}
        >
          {p.symbol}
        </div>
      ))}
      <style>{`
        @keyframes moneyFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          80% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-moneyFall {
          animation-name: moneyFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};
