import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Zap, Brain, Shield, Settings, Clock, Globe } from "lucide-react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";

// Import company logos
import cosmatrendsLogo from "@assets/Screenshot 2025-07-08 001128_1751914852574.png";
import stellarwaveLogo from "@assets/Screenshot 2025-07-08 001151_1751914852589.png";
import starketingLogo from "@assets/Screenshot 2025-07-08 001213_1751914852591.png";
import cloudnestLogo from "@assets/Screenshot 2025-07-08 001235_1751914852591.png";
import musebubblelLogo from "@assets/Screenshot 2025-07-08 001316_1751914863917.png";
import darkpulseLogo from "@assets/Screenshot 2025-07-08 001337_1751914863937.png";
import skybaseLogo from "@assets/Screenshot 2025-07-08 001401_1751914863938.png";

// Import feature images
import organizedMemoryImg from "@assets/image_1751913580102.png";
import lightningSpeedImg from "@assets/image_1751913590937.png";
import aiPoweredImg from "@assets/image_1751913600312.png";
import securePrivateImg from "@assets/image_1751913611208.png";
import seamlessIntegrationImg from "@assets/image_1751913622767.png";

export default function Landing() {
  const [, setLocation] = useLocation();

  const companyLogos = [
    { name: "CosmaTrends", src: cosmatrendsLogo },
    { name: "StellarWave", src: stellarwaveLogo },
    { name: "Starketing", src: starketingLogo },
    { name: "CloudNest", src: cloudnestLogo },
    { name: "MuseBubble", src: musebubblelLogo },
    { name: "DarkPulse", src: darkpulseLogo },
    { name: "SkyBase", src: skybaseLogo }
  ];

  const features = [
    {
      title: "Organized Proposal Memory",
      subtitle: "Your team never repeats answers again",
      image: organizedMemoryImg,
      description: "AI-powered memory system that learns from every proposal, creating a knowledge base that grows smarter with each submission."
    },
    {
      title: "Lightning Speed",
      subtitle: "Respond in hours, not weeks",
      image: lightningSpeedImg,
      description: "Transform weeks of manual work into hours of AI-assisted creation. Generate comprehensive proposals 10x faster than traditional methods."
    },
    {
      title: "AI-Powered Responses",
      subtitle: "Custom LLMs understand your exact voice and language",
      image: aiPoweredImg,
      description: "Advanced language models trained on your company's style and expertise, ensuring every proposal maintains your unique voice and quality standards."
    },
    {
      title: "Private & Secure",
      subtitle: "Enterprise-grade encryption and access control",
      image: securePrivateImg,
      description: "Bank-level security with end-to-end encryption, role-based access controls, and compliance with SOC 2 and GDPR requirements."
    },
    {
      title: "Seamless Integration",
      subtitle: "Plug into Google Drive, Notion, Slack, Salesforce, etc.",
      image: seamlessIntegrationImg,
      description: "Connect with your existing workflow. One-click integrations with 50+ popular business tools and platforms you already use."
    }
  ];

  const blogPosts = [
    {
      title: "The Future of AI and RFPs",
      date: "December 2024",
      description: "How artificial intelligence is revolutionizing the proposal process and what it means for your business."
    },
    {
      title: "Ingest from AeonRFP",
      date: "November 2024", 
      description: "Deep dive into our advanced document processing capabilities and AI extraction techniques."
    },
    {
      title: "Introducing AeonBot Integrations",
      date: "October 2024",
      description: "Seamlessly connect AeonRFP with your favorite tools through our new bot integration system."
    }
  ];

  useEffect(() => {
    // Initialize AOS for scroll animations
    import('aos').then((AOS) => {
      AOS.init({
        duration: 800,
        once: true,
        offset: 100,
        easing: 'ease-out-cubic'
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white overflow-hidden">
      {/* Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0B]/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Logo size="md" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3]/10 via-transparent to-[#00B8FF]/10 animate-pulse" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:40px_40px]" />

        <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 leading-tight font-['Inter',sans-serif]">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AI that Wins RFPs.
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#00FFA3] to-[#00B8FF] bg-clip-text text-transparent">
                At 10x Speed.
              </span>
            </h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed font-['Poppins',sans-serif]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              Transform RFP responses from weeks to hours with AI-powered proposal automation
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/auth'}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-11 from-[#00FFC6] to-[#00C0FF] text-white px-7 py-3 text-base rounded-xl hover:shadow-[0_0_20px_rgba(0,255,198,0.3)] transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 font-normal bg-[#3b3838]"
                style={{ 
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  fontSize: '16px'
                }}
              >
                Sign Up to Write with AeonRFP
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Floating Company Logos */}
          <motion.div
            className="mt-20 overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <p className="text-gray-500 mb-8 text-lg font-['Poppins',sans-serif]">Used by forward-thinking teams in stealth, growth, and scale</p>
            <div className="relative">
              <div className="flex animate-scroll space-x-12 items-center">
                {[...companyLogos, ...companyLogos].map((logo, index) => (
                  <motion.div
                    key={index}
                    className="flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                    whileHover={{ scale: 1.1, y: -5 }}
                    style={{
                      animation: `float ${3 + (index % 3)}s ease-in-out infinite ${index * 0.5}s`
                    }}
                  >
                    <img 
                      src={logo.src} 
                      alt={logo.name}
                      className="h-8 md:h-12 w-auto object-contain"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Win More Than Just Business Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 font-['Inter',sans-serif]">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Win More Than Just Business
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-['Poppins',sans-serif]">
              Revolutionize your proposal process with cutting-edge AI technology
            </p>
          </motion.div>

          <div className="space-y-32">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16`}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="flex-1 space-y-6"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-4xl font-bold text-white mb-4 font-['Inter',sans-serif]">
                    {feature.title}
                  </h3>
                  <p className="text-xl text-[#00FFA3] mb-6 font-['Poppins',sans-serif]">
                    {feature.subtitle}
                  </p>
                  <p className="text-gray-400 text-lg leading-relaxed font-['Poppins',sans-serif]">
                    {feature.description}
                  </p>
                </motion.div>
                
                <motion.div
                  className="flex-1 max-w-lg"
                  initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#00FFA3]/20 to-[#00B8FF]/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <motion.img 
                      src={feature.image}
                      alt={feature.title}
                      className="relative w-full h-auto rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                      whileHover={{ scale: 1.05 }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Parallax divider */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-[#00FFA3]/5 to-transparent transform skew-y-1" />
        </div>
      </section>

      {/* Latest from AeonRFP Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 font-['Inter',sans-serif]">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Latest from AeonRFP
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-['Poppins',sans-serif]">
              Insights, updates, and deep dives into the future of AI-powered proposals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 hover:border-[#00FFA3]/30 transition-all duration-500 cursor-pointer group h-full backdrop-blur-sm hover:shadow-[0_10px_40px_rgba(0,255,163,0.2)]">
                  <CardHeader className="p-8">
                    <Badge className="w-fit mb-4 bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20">
                      {post.date}
                    </Badge>
                    <CardTitle className="text-2xl font-bold text-white group-hover:text-[#00FFA3] transition-colors duration-300 font-['Inter',sans-serif]">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <CardDescription className="text-gray-400 text-lg leading-relaxed font-['Poppins',sans-serif]">
                      {post.description}
                    </CardDescription>
                    <motion.div 
                      className="mt-6 flex items-center text-[#00FFA3] font-semibold group-hover:text-[#00B8FF] transition-colors duration-300"
                      whileHover={{ x: 5 }}
                    >
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3]/10 via-transparent to-[#00B8FF]/10" />
        
        <div className="relative max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8 font-['Inter',sans-serif]">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ready to Transform Your RFP Game?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-['Poppins',sans-serif]">
              Join thousands of companies already winning more business with AI-powered automation
            </p>
            
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/auth'}
              className="bg-gradient-to-r from-[#00FFC6] to-[#00C0FF] text-white font-semibold px-7 py-3 text-base rounded-xl hover:shadow-[0_0_20px_rgba(0,255,198,0.3)] transition-all duration-300 transform hover:-translate-y-0.5"
              style={{ 
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                fontSize: '16px'
              }}
            >
              Get Started Free
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}