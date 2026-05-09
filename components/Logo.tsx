import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'icon';
}

/**
 * Logo component faithful to the Venda Fácil branding.
 * Consists of a dark blue shopping cart and a light blue lightning bolt.
 */
const Logo: React.FC<LogoProps> = ({ size = 40, className = "", variant = 'icon' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Cart Main Body (Dark Blue) */}
        <path 
          d="M80 120H130L180 340H400L450 180H165" 
          stroke="currentColor" 
          strokeWidth="32" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-slate-900 dark:text-white"
        />
        
        {/* Wheels */}
        <circle cx="210" cy="410" r="30" fill="currentColor" className="text-slate-900 dark:text-white" />
        <circle cx="370" cy="410" r="30" fill="currentColor" className="text-slate-900 dark:text-white" />
        
        {/* Lightning Bolt (Light Blue) */}
        <path 
          d="M300 60L210 240H280L240 440L360 200H280L330 60H300Z" 
          fill="#3b82f6" 
          stroke="white" 
          strokeWidth="8" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
