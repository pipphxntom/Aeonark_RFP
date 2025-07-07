import { motion } from "framer-motion";

const companies = [
  {
    name: "CloudNest",
    logo: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none" className="h-8">
        <path 
          d="M8 20C8 15.58 11.58 12 16 12C18.33 12 20.42 13.08 21.83 14.75C23.24 11.67 26.33 9.5 30 9.5C35.25 9.5 39.5 13.75 39.5 19C39.5 19.33 39.47 19.65 39.42 19.97C42.25 20.92 44.17 23.58 44 26.5C43.83 29.67 41.17 32 38 32H14C10.69 32 8 29.31 8 26V20Z" 
          fill="#FF5722"
        />
        <text x="50" y="25" fontSize="16" fontWeight="600" fill="#D4D4D8" fontFamily="SF Pro Display, system-ui, sans-serif">
          CloudNest
        </text>
      </svg>
    ),
    color: "text-orange-500"
  },
  {
    name: "DataSphere",
    logo: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none" className="h-8">
        <circle cx="18" cy="20" r="12" fill="#FF9B00"/>
        <circle cx="18" cy="20" r="8" fill="none" stroke="#FFB84D" strokeWidth="2" opacity="0.7"/>
        <circle cx="18" cy="20" r="4" fill="#FFD700"/>
        <text x="38" y="25" fontSize="16" fontWeight="600" fill="#FF9B00" fontFamily="SF Pro Display, system-ui, sans-serif">
          DataSphere
        </text>
      </svg>
    ),
    color: "text-orange-400"
  },
  {
    name: "StellarWave",
    logo: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none" className="h-8">
        <path 
          d="M8 25L13 15L18 25L23 10L28 25L33 20L38 25" 
          stroke="#EF4444" 
          strokeWidth="3" 
          strokeLinecap="round"
          fill="none"
        />
        <text x="45" y="25" fontSize="16" fontWeight="600" fill="#EF4444" fontFamily="SF Pro Display, system-ui, sans-serif">
          StellarWave
        </text>
      </svg>
    ),
    color: "text-red-400"
  },
  {
    name: "Sttarketing",
    logo: (
      <svg width="150" height="40" viewBox="0 0 150 40" fill="none" className="h-8">
        <text x="8" y="15" fontSize="12" fontWeight="700" fill="#8B5CF6" fontFamily="SF Pro Display, system-ui, sans-serif">Stt</text>
        <text x="28" y="15" fontSize="12" fontWeight="700" fill="#F59E0B" fontFamily="SF Pro Display, system-ui, sans-serif">ar</text>
        <text x="40" y="15" fontSize="12" fontWeight="700" fill="#EF4444" fontFamily="SF Pro Display, system-ui, sans-serif">ke</text>
        <text x="52" y="15" fontSize="12" fontWeight="700" fill="#10B981" fontFamily="SF Pro Display, system-ui, sans-serif">ti</text>
        <text x="60" y="15" fontSize="12" fontWeight="700" fill="#3B82F6" fontFamily="SF Pro Display, system-ui, sans-serif">ng</text>
        <text x="8" y="30" fontSize="16" fontWeight="600" fill="#D4D4D8" fontFamily="SF Pro Display, system-ui, sans-serif">Sttarketing</text>
      </svg>
    ),
    color: "text-purple-400"
  }
];

export function CompanyLogos() {
  // Duplicate the companies array to create seamless scrolling
  const duplicatedCompanies = [...companies, ...companies, ...companies];

  return (
    <div className="overflow-hidden">
      <motion.div 
        className="flex items-center space-x-16"
        animate={{ x: [0, -100 * companies.length * 16] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ width: `${duplicatedCompanies.length * 160}px` }}
      >
        {duplicatedCompanies.map((company, index) => (
          <motion.div
            key={`${company.name}-${index}`}
            className="flex-shrink-0 mx-8 p-4 neon-border rounded-lg hover:bg-gray-800 transition-all duration-300 cursor-pointer group"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 20px rgba(0, 255, 136, 0.5)"
            }}
            onHoverStart={() => {
              // Slow down animation on hover (magnetic drag effect)
            }}
          >
            <div className={`${company.color} group-hover:text-neon-green transition-colors duration-300`}>
              {company.logo}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
