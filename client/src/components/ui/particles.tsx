import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ParticlesProps {
  className?: string;
  count?: number;
}

export function Particles({ className, count = 50 }: ParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing particles
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle absolute rounded-full opacity-20';
      
      // Random size between 1-3px
      const size = Math.random() * 2 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Random color (white with varying opacity)
      particle.style.backgroundColor = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
      
      // Random animation duration and delay
      const duration = Math.random() * 20 + 15; // 15-35 seconds
      const delay = Math.random() * 8; // 0-8 seconds delay
      
      particle.style.animation = `float ${duration}s linear infinite ${delay}s`;
      
      container.appendChild(particle);
    }
  }, [count]);

  return (
    <div 
      ref={containerRef}
      className={cn("particles pointer-events-none", className)}
    />
  );
}
