import React from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Search, 
  Database, 
  Wand2, 
  TrendingUp, 
  Clock, 
  FileText, 
  Scale,
  Target,
  Zap,
  Brain,
  Sparkles
} from 'lucide-react';

interface AnimatedIconProps {
  type: 'upload' | 'search' | 'database' | 'wand' | 'trending' | 'clock' | 'filetext' | 'legal' | 'target' | 'zap' | 'brain' | 'sparkles';
  size?: number;
  className?: string;
}

export function AnimatedIcon({ type, size = 32, className = "" }: AnimatedIconProps) {
  const iconVariants = {
    upload: {
      initial: { y: 0, rotate: 0 },
      hover: { 
        y: [-2, -8, -2], 
        rotate: [0, 5, -5, 0],
        transition: { 
          duration: 0.6, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    search: {
      initial: { rotate: 0, scale: 1 },
      hover: { 
        rotate: [0, 15, -15, 0],
        scale: [1, 1.1, 1],
        transition: { 
          duration: 0.8, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    database: {
      initial: { scale: 1, opacity: 1 },
      hover: { 
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        transition: { 
          duration: 1, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    wand: {
      initial: { rotate: 0 },
      hover: { 
        rotate: [0, 10, -10, 15, -15, 0],
        transition: { 
          duration: 0.8, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    trending: {
      initial: { y: 0 },
      hover: { 
        y: [0, -3, 0, -2, 0],
        transition: { 
          duration: 0.6, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    clock: {
      initial: { rotate: 0 },
      hover: { 
        rotate: [0, 90, 180, 270, 360],
        transition: { 
          duration: 2, 
          repeat: Infinity, 
          repeatType: "loop" as const,
          ease: "linear"
        }
      }
    },
    filetext: {
      initial: { scale: 1, y: 0 },
      hover: { 
        scale: [1, 1.02, 1],
        y: [0, -2, 0],
        transition: { 
          duration: 0.5, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    legal: {
      initial: { rotate: 0 },
      hover: { 
        rotate: [0, -10, 10, -5, 5, 0],
        transition: { 
          duration: 1.2, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    target: {
      initial: { scale: 1 },
      hover: { 
        scale: [1, 1.1, 0.9, 1.05, 1],
        transition: { 
          duration: 0.8, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    zap: {
      initial: { opacity: 1, scale: 1 },
      hover: { 
        opacity: [1, 0.7, 1, 0.8, 1],
        scale: [1, 1.1, 1],
        transition: { 
          duration: 0.4, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    brain: {
      initial: { scale: 1 },
      hover: { 
        scale: [1, 1.08, 1.02, 1.05, 1],
        transition: { 
          duration: 1, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    },
    sparkles: {
      initial: { rotate: 0, scale: 1 },
      hover: { 
        rotate: [0, 45, 90, 135, 180, 225, 270, 315, 360],
        scale: [1, 1.1, 1],
        transition: { 
          duration: 2, 
          repeat: Infinity, 
          repeatType: "loop" as const
        }
      }
    }
  };

  const IconComponent = {
    upload: Upload,
    search: Search,
    database: Database,
    wand: Wand2,
    trending: TrendingUp,
    clock: Clock,
    filetext: FileText,
    legal: Scale,
    target: Target,
    zap: Zap,
    brain: Brain,
    sparkles: Sparkles
  }[type];

  return (
    <motion.div
      className={`inline-block ${className}`}
      variants={iconVariants[type]}
      initial="initial"
      whileHover="hover"
      style={{ transformOrigin: 'center' }}
    >
      <IconComponent size={size} />
    </motion.div>
  );
}