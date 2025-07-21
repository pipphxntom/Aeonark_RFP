import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(() => onComplete?.(), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      return () => clearInterval(timer);
    }
  }, [isLoading, onComplete]);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      <div className="flex flex-col items-center space-y-8">
        {/* Animated Aeonark Logo */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              {/* Outer glow circle */}
              <motion.circle
                cx="60"
                cy="60"
                r="55"
                stroke="url(#glowGradient)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
              />
              
              {/* Chess Knight Path - Based on your logo design */}
              <motion.g>
                {/* Knight Base */}
                <motion.rect
                  x="25"
                  y="80"
                  width="70"
                  height="10"
                  rx="2"
                  fill="url(#logoGradient)"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                
                {/* Knight Body */}
                <motion.path
                  d="M35 80 L35 45 Q35 35, 45 35 L55 35 Q65 35, 65 25 L70 25 Q80 25, 85 35 L85 50 Q85 60, 75 65 L80 70 Q85 75, 80 80 Z"
                  fill="url(#logoGradient)"
                  stroke="url(#strokeGradient)"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ 
                    duration: 2.5, 
                    ease: "easeInOut",
                    delay: 0.2
                  }}
                />
                
                {/* Knight Head Details */}
                <motion.path
                  d="M70 30 Q75 25, 80 30 L85 35 Q80 40, 75 35 L70 30 Z"
                  fill="url(#logoGradient)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.5 }}
                />
                
                {/* Knight Mane */}
                <motion.path
                  d="M75 30 L80 25 L85 30 L90 35 L85 40 L80 35 L75 30 Z"
                  fill="url(#logoGradient)"
                  stroke="url(#strokeGradient)"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ 
                    duration: 1.5, 
                    ease: "easeOut",
                    delay: 1.8
                  }}
                />
              </motion.g>

              {/* Pulsing center dot */}
              <motion.circle
                cx="60"
                cy="60"
                r="3"
                fill="#00FFAA"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  repeatType: "loop" 
                }}
              />

              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FFAA" />
                  <stop offset="50%" stopColor="#00B8FF" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                
                <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FFAA" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00B8FF" stopOpacity="0.8" />
                </linearGradient>

                <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00FFAA" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#00B8FF" stopOpacity="0.3" />
                </radialGradient>
              </defs>
            </svg>
          </motion.div>
        </div>

        {/* Brand Name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00FFAA] to-[#00B8FF] bg-clip-text text-transparent">
            AeonRFP
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-light">
            AI-Powered Proposal Generation
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "200px", opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="relative"
        >
          <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00FFAA] to-[#00B8FF] rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-center mt-3">
            <span className="text-xs text-gray-500">{progress}%</span>
          </div>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex space-x-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-[#00FFAA] rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;