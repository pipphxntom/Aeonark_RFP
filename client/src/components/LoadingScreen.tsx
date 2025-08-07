import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrollComplete, setIsScrollComplete] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Transform scroll progress with custom easing
  const pathProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Chess Knight SVG Path - Traced from your logo
  const knightPath = `
    M 150 380 
    L 450 380 
    L 450 350 
    L 420 350 
    L 420 320 
    L 400 320 
    L 400 280 
    L 380 280 
    L 380 240 
    L 360 240 
    L 360 200 
    L 340 200 
    L 340 160 
    L 320 160 
    L 320 120 
    L 300 120 
    L 300 100 
    L 280 100 
    L 280 80 
    L 260 80 
    L 260 60 
    L 240 60 
    L 240 40 
    L 220 40 
    L 220 20 
    L 200 20 
    L 200 40 
    L 180 40 
    L 180 60 
    L 160 60 
    L 160 80 
    L 140 80 
    L 140 100 
    L 120 100 
    L 120 120 
    L 100 120 
    L 100 140 
    L 80 140 
    L 80 160 
    L 60 160 
    L 60 180 
    L 80 180 
    L 80 200 
    L 100 200 
    L 100 220 
    L 120 220 
    L 120 240 
    L 140 240 
    L 140 260 
    L 160 260 
    L 160 280 
    L 180 280 
    L 180 300 
    L 200 300 
    L 200 320 
    L 180 320 
    L 180 340 
    L 160 340 
    L 160 360 
    L 150 360 
    Z
  `;

  // Knight base path
  const basePath = `
    M 120 380
    L 480 380
    L 480 420
    L 120 420
    Z
  `;

  // Techno ring segments (circular pattern around knight)
  const ringSegments = [
    `M 300,50 A 200,200 0 0,1 450,150`,
    `M 450,150 A 200,200 0 0,1 550,300`,
    `M 550,300 A 200,200 0 0,1 450,450`,
    `M 450,450 A 200,200 0 0,1 300,550`,
    `M 300,550 A 200,200 0 0,1 150,450`,
    `M 150,450 A 200,200 0 0,1 50,300`,
    `M 50,300 A 200,200 0 0,1 150,150`,
    `M 150,150 A 200,200 0 0,1 300,50`
  ];

  useEffect(() => {
    if (isLoading) {
      // Auto-scroll to trigger animation
      const autoScroll = () => {
        if (containerRef.current) {
          const totalHeight = containerRef.current.scrollHeight - window.innerHeight;
          let currentScroll = 0;
          
          const scrollStep = () => {
            currentScroll += totalHeight / 100; // 100 steps for smooth animation
            window.scrollTo(0, currentScroll);
            
            if (currentScroll >= totalHeight) {
              setIsScrollComplete(true);
              setTimeout(() => onComplete?.(), 1000);
            } else {
              requestAnimationFrame(scrollStep);
            }
          };
          
          setTimeout(scrollStep, 500); // Start after 500ms
        }
      };
      
      autoScroll();
    }
  }, [isLoading, onComplete]);

  if (!isLoading) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 overflow-y-auto">
      {/* Scroll trigger container with padding */}
      <div className="scroll-trigger" style={{ height: '400vh', paddingTop: '200vh', paddingBottom: '200vh' }}>
        {/* Sticky SVG container */}
        <div className="sticky top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <svg
            width="300"
            height="300"
            viewBox="0 0 600 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="max-w-[300px] w-full h-auto"
          >
            {/* Techno Ring Segments */}
            {ringSegments.map((segment, index) => (
              <motion.path
                key={`ring-${index}`}
                d={segment}
                stroke="#00FFAA"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  pathLength: pathProgress,
                  strokeDasharray: 1,
                  strokeDashoffset: useTransform(pathProgress, [0, 1], [1, 0])
                }}
                initial={{ pathLength: 0 }}
                transition={{
                  duration: 0,
                  ease: [0.4, 0.0, 0.2, 1] // Custom cubic bezier easing
                }}
              />
            ))}
            
            {/* Knight Base */}
            <motion.path
              d={basePath}
              stroke="#00FFAA"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                pathLength: pathProgress,
                strokeDasharray: 1,
                strokeDashoffset: useTransform(pathProgress, [0, 1], [1, 0])
              }}
              initial={{ pathLength: 0 }}
              transition={{
                duration: 0,
                ease: [0.4, 0.0, 0.2, 1]
              }}
            />
            
            {/* Main Knight Path */}
            <motion.path
              d={knightPath}
              stroke="#00FFAA"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                pathLength: pathProgress,
                strokeDasharray: 1,
                strokeDashoffset: useTransform(pathProgress, [0, 1], [1, 0])
              }}
              initial={{ pathLength: 0 }}
              transition={{
                duration: 0,
                ease: [0.4, 0.0, 0.2, 1] // inOut(3) equivalent
              }}
            />
          </svg>
        </div>
        
        {/* Brand Name - Appears after animation */}
        {isScrollComplete && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 text-center"
          >
            <h1 className="text-4xl font-bold text-[#00FFAA] font-mono tracking-wider">
              AEONARK
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-light tracking-wide">
              LABS
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;