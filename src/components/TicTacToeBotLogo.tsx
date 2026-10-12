import React from 'react';

interface TicTacToeBotLogoProps {
  className?: string;
}

export const TicTacToeBotLogo: React.FC<TicTacToeBotLogoProps> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]"
      >
        <defs>
          <linearGradient id="botChassis" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#27272a" />
            <stop offset="1" stopColor="#09090b" />
          </linearGradient>
          <radialGradient id="antennaRadial" cx="0.5" cy="0.5" r="0.5" fx="0.3" fy="0.3">
            <stop stopColor="#38bdf8" />
            <stop offset="1" stopColor="#0284c7" />
          </radialGradient>
        </defs>

        {/* Antenna Pole & Signal Orb */}
        <line x1="20" y1="3" x2="20" y2="9" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="3" r="2.5" fill="url(#antennaRadial)" className="animate-pulse" />

        {/* Ear Bolts / Audio Sensors */}
        <rect x="2" y="17" width="3" height="8" rx="1.5" fill="#52525b" />
        <rect x="35" y="17" width="3" height="8" rx="1.5" fill="#52525b" />

        {/* Robot Head Chassis */}
        <rect
          x="5"
          y="9"
          width="30"
          height="25"
          rx="7"
          fill="url(#botChassis)"
          stroke="#3f3f46"
          strokeWidth="1.5"
        />

        {/* Dark Visor Screen */}
        <rect
          x="8.5"
          y="12.5"
          width="23"
          height="18"
          rx="4.5"
          fill="#000000"
          stroke="#27272a"
          strokeWidth="1"
        />

        {/* Visor Left Eye: Glowing Red X */}
        <path
          d="M12.5 16.5L17.5 21.5M17.5 16.5L12.5 21.5"
          stroke="#ef4444"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]"
        />

        {/* Visor Right Eye: Glowing Sky-Blue O */}
        <circle
          cx="24.5"
          cy="19"
          r="2.8"
          stroke="#38bdf8"
          strokeWidth="2.2"
          className="drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
        />

        {/* Mouth: Cyber Tic-Tac-Toe Grid */}
        <line x1="13.5" y1="26" x2="26.5" y2="26" stroke="#52525b" strokeWidth="1" strokeLinecap="round" />
        <line x1="17.5" y1="24.5" x2="17.5" y2="27.5" stroke="#71717a" strokeWidth="1" strokeLinecap="round" />
        <line x1="22.5" y1="24.5" x2="22.5" y2="27.5" stroke="#71717a" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
};
