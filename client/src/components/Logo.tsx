import { motion } from "framer-motion";

export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };
  
  const textSizes = {
    sm: "text-lg",
    md: "text-xl", 
    lg: "text-2xl"
  };

  return (
    <motion.div 
      className={`flex items-center space-x-3 ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {/* Logo Icon - Document with green accent */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 flex items-center justify-center relative overflow-hidden`}>
        {/* Document base */}
        <div className="w-4 h-5 bg-gray-600 rounded-sm relative">
          {/* Document corner fold */}
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gray-700 transform rotate-45 origin-bottom-left"></div>
          {/* Green accent lines */}
          <div className="absolute top-2 left-0.5 right-0.5 space-y-0.5">
            <div className="h-0.5 bg-[#00FFA3] rounded"></div>
            <div className="h-0.5 bg-[#00FFA3] rounded w-3/4"></div>
            <div className="h-0.5 bg-[#00FFA3] rounded w-1/2"></div>
          </div>
        </div>
      </div>
      
      {/* Logo Text */}
      <span className={`${textSizes[size]} font-bold text-white tracking-tight`}>
        <span className="text-white">Aeon</span>
        <span className="bg-gradient-to-r from-[#00FFA3] to-[#00B8FF] bg-clip-text text-transparent">RFP</span>
      </span>
    </motion.div>
  );
}