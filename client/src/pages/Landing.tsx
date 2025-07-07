import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Particles } from "@/components/ui/particles";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { CompanyLogos } from "@/components/CompanyLogos";
import { Rocket, Mail } from "lucide-react";

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Show CTA button after typing animation completes
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (provider: string) => {
    if (provider === 'email') {
      // For demo, redirect to Replit auth
      window.location.href = '/api/login';
    } else {
      // Redirect to Replit auth for OAuth
      window.location.href = '/api/login';
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-deep-black text-white overflow-hidden">
      {/* Animated Background Particles */}
      <Particles className="absolute inset-0" />
      
      {/* Hero Section */}
      <motion.div 
        className="text-center z-10 max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold mb-4 font-sf-mono">
            AI that Wins RFPs. At 10x Speed.
          </h1>
          <motion.p 
            className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 1 }}
          >
            Transform RFP responses from weeks to hours with AI-powered proposal automation
          </motion.p>
        </div>
        
        {/* CTA Button */}
        <div className="mt-8">
          <Button
            onClick={() => setShowLoginModal(true)}
            className="bg-gradient-to-r from-neon-green to-neon-cyan text-black px-8 py-6 rounded-lg text-xl font-bold hover:opacity-90 transition-all duration-300"
            size="lg"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Sign Up Free – Automate Proposals with AI
          </Button>
        </div>
      </motion.div>
      
      {/* Company Logo Carousel */}
      <motion.div 
        className="absolute bottom-20 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4, duration: 1 }}
      >
        <CompanyLogos />
      </motion.div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="glass-morphism neon-border border-neon-cyan max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center mb-2">
              Welcome to the Future
            </DialogTitle>
            <p className="text-gray-400 text-center">
              Choose your authentication method
            </p>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            <Button
              onClick={() => handleLogin('gmail')}
              className="w-full bg-white text-black py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              variant="outline"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Gmail
            </Button>
            
            <Button
              onClick={() => handleLogin('outlook')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 19h10V5H7v14zm2-13h6v12H9V6z"/>
                <path d="M5 3v18l2-1V4l-2-1z"/>
                <path d="M19 3l-2 1v16l2 1V3z"/>
              </svg>
              Continue with Outlook
            </Button>
            
            <Button
              onClick={() => handleLogin('email')}
              className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
            >
              <Mail className="mr-3 h-5 w-5" />
              Sign up with Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
