import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { SmartMatch } from "@/components/SmartMatch";
import { AIGeneration } from "@/components/AIGeneration";
import { Sidebar } from "@/components/ui/sidebar";
import { SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { 
  Upload, 
  Search, 
  Database, 
  Wand2, 
  TrendingUp, 
  Clock, 
  FileText,
  BarChart3,
  Home as HomeIcon,
  LogOut,
  Settings,
  Edit,
  Mail,
  Brain
} from "lucide-react";
import { AnimatedIcon } from "@/components/AnimatedIcon";
import { ProposalEditor } from "@/components/ProposalEditor";
import { EmailIntegration } from "@/components/EmailIntegration";
import { IndustryAI } from "@/components/IndustryAI";
import { MemoryBank } from "@/components/MemoryBank";

export default function Home() {
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSmartMatch, setShowSmartMatch] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [showEmailIntegration, setShowEmailIntegration] = useState(false);
  const [selectedRfpId, setSelectedRfpId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'industry-ai' | 'memory-bank'>('dashboard');
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);

  const { data: rfps = [] } = useQuery({
    queryKey: ['/api/rfps'],
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['/api/proposals'],
  });

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Refetch RFPs after upload
    window.location.reload();
  };

  const handleSmartMatchComplete = (rfpId: number) => {
    setSelectedRfpId(rfpId);
    setShowSmartMatch(false);
    setShowAIGeneration(true);
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleEditProposal = (proposalId: number) => {
    setSelectedProposalId(proposalId);
    setCurrentView('editor');
  };

  const handleCloseEditor = () => {
    setCurrentView('dashboard');
    setSelectedProposalId(null);
  };

  const sidebarItems = [
    { 
      icon: HomeIcon, 
      label: "Dashboard", 
      active: currentView === 'dashboard',
      onClick: () => setCurrentView('dashboard')
    },
    { 
      icon: Upload, 
      label: "Upload RFP", 
      onClick: () => setShowUploadModal(true) 
    },
    { 
      icon: Search, 
      label: "SmartMatch", 
      onClick: () => setShowSmartMatch(true) 
    },
    { 
      icon: Brain, 
      label: "Industry AI", 
      active: currentView === 'industry-ai',
      onClick: () => setCurrentView('industry-ai') 
    },
    { 
      icon: Database, 
      label: "Memory Bank", 
      active: currentView === 'memory-bank',
      onClick: () => setCurrentView('memory-bank') 
    },
    { 
      icon: Mail, 
      label: "Integrations", 
      onClick: () => setShowEmailIntegration(true) 
    },
    { 
      icon: FileText, 
      label: "Drafts" 
    },
    { 
      icon: Settings, 
      label: "Settings" 
    },
    { 
      icon: LogOut, 
      label: "Logout", 
      onClick: handleLogout 
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-deep-black text-white flex">
        {/* Sidebar */}
        <Sidebar className="glass-morphism border-r border-gray-700">
          <SidebarContent>
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 flex items-center justify-center relative overflow-hidden">
                  <div className="w-4 h-5 bg-gray-600 rounded-sm relative">
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gray-700 transform rotate-45 origin-bottom-left"></div>
                    <div className="absolute top-2 left-0.5 right-0.5 space-y-0.5">
                      <div className="h-0.5 bg-[#00FFA3] rounded"></div>
                      <div className="h-0.5 bg-[#00FFA3] rounded w-3/4"></div>
                      <div className="h-0.5 bg-[#00FFA3] rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-bold">
                  <span className="text-white">Aeon</span>
                  <span className="bg-gradient-to-r from-[#00FFA3] to-[#00B8FF] bg-clip-text text-transparent">RFP</span>
                </h2>
              </div>
              <p className="text-gray-400 text-sm">AI Proposal Center</p>
            </div>
            
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton 
                        onClick={item.onClick}
                        className={`flex items-center p-3 rounded-lg transition-colors duration-300 ${
                          item.active 
                            ? 'bg-gray-800 text-neon-green border-l-4 border-neon-green' 
                            : 'hover:bg-gray-800'
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1">
          {currentView === 'editor' && selectedProposalId ? (
            <ProposalEditor 
              proposalId={selectedProposalId} 
              onClose={handleCloseEditor} 
            />
          ) : currentView === 'industry-ai' ? (
            <IndustryAI onClose={() => setCurrentView('dashboard')} />
          ) : currentView === 'memory-bank' ? (
            <MemoryBank onClose={() => setCurrentView('dashboard')} />
          ) : (
            <div className="p-8">
          {/* Hero Card */}
          <motion.div 
            className="glass-morphism neon-border rounded-2xl p-8 mb-8 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 opacity-10 space-grid"></div>
            
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-4">
                Welcome back, {user?.firstName || 'there'}! 👋
              </h1>
              <h2 className="text-3xl font-bold mb-2">Your AI Proposal Command Center</h2>
              <p className="text-gray-400 mb-8">Transform RFPs into winning proposals with intelligent automation</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className="glass-morphism hover:neon-border transition-all duration-300 cursor-pointer"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <CardContent className="p-6 text-center">
                      <AnimatedIcon type="upload" size={32} className="h-8 w-8 text-neon-cyan mx-auto mb-3" />
                      <h3 className="font-bold mb-2">Upload RFP</h3>
                      <p className="text-sm text-gray-400">Start new proposal</p>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className="glass-morphism hover:neon-border transition-all duration-300 cursor-pointer"
                    onClick={() => setShowSmartMatch(true)}
                  >
                    <CardContent className="p-6 text-center">
                      <AnimatedIcon type="search" size={32} className="h-8 w-8 text-neon-green mx-auto mb-3" />
                      <h3 className="font-bold mb-2">SmartMatch</h3>
                      <p className="text-sm text-gray-400">Analyze compatibility</p>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className="glass-morphism hover:neon-border transition-all duration-300 cursor-pointer"
                    onClick={() => setCurrentView('memory-bank')}
                  >
                    <CardContent className="p-6 text-center">
                      <AnimatedIcon type="database" size={32} className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                      <h3 className="font-bold mb-2">Memory Bank</h3>
                      <p className="text-sm text-gray-400">Past proposals</p>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className="glass-morphism hover:neon-border transition-all duration-300 cursor-pointer"
                    onClick={() => setShowAIGeneration(true)}
                  >
                    <CardContent className="p-6 text-center">
                      <AnimatedIcon type="wand" size={32} className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                      <h3 className="font-bold mb-2">AI Draft</h3>
                      <p className="text-sm text-gray-400">Generate proposal</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Analytics Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-neon-cyan" />
              Performance Analytics
            </h2>
            
            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glass-morphism neon-border">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-cyan-500/20 rounded-lg">
                      <FileText className="w-6 h-6 text-cyan-400" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold mb-1">{proposals.length}</p>
                    <p className="text-sm text-gray-400">Proposals Created</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism neon-border">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold mb-1">{rfps.length}</p>
                    <p className="text-sm text-gray-400">RFPs Analyzed</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism neon-border">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-purple-400" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold mb-1">{rfps.length * 2.5}h</p>
                    <p className="text-sm text-gray-400">Time Saved</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism neon-border">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-yellow-400" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold mb-1">85%</p>
                    <p className="text-sm text-gray-400">Avg Score</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent RFPs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Recent RFPs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rfps.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No RFPs uploaded yet</p>
                      <Button 
                        onClick={() => setShowUploadModal(true)}
                        className="mt-4 bg-neon-green text-black hover:bg-neon-green/90"
                        size="sm"
                      >
                        Upload Your First RFP
                      </Button>
                    </div>
                  ) : (
                    rfps.slice(0, 3).map((rfp: any) => (
                      <div key={rfp.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{rfp.title}</h4>
                          <p className="text-sm text-gray-400">
                            Uploaded: {new Date(rfp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          rfp.status === 'generated' ? 'bg-neon-green text-black' :
                          rfp.status === 'analyzed' ? 'bg-yellow-400 text-black' :
                          'bg-gray-600 text-white'
                        }`}>
                          {rfp.status}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Recent Proposals */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Edit className="mr-2 h-5 w-5" />
                    Recent Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proposals.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No proposals generated yet</p>
                      <Button 
                        onClick={() => setShowSmartMatch(true)}
                        className="mt-4 bg-neon-cyan text-black hover:bg-neon-cyan/90"
                        size="sm"
                      >
                        Generate Your First Proposal
                      </Button>
                    </div>
                  ) : (
                    proposals.slice(0, 3).map((proposal: any) => (
                      <div key={proposal.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{proposal.title}</h4>
                          <p className="text-sm text-gray-400">
                            Created: {new Date(proposal.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            proposal.status === 'final' ? 'bg-neon-green text-black' :
                            proposal.status === 'review' ? 'bg-yellow-400 text-black' :
                            'bg-gray-600 text-white'
                          }`}>
                            {proposal.status}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProposal(proposal.id)}
                            className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8"
          >
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-neon-green mr-2" />
                      <span>Win Rate</span>
                    </div>
                    <span className="text-neon-green font-bold">
                      {proposals.length > 0 ? '87%' : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-neon-cyan mr-2" />
                      <span>Avg. Response Time</span>
                    </div>
                    <span className="text-neon-cyan font-bold">
                      {proposals.length > 0 ? '2.3 days' : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-yellow-400 mr-2" />
                      <span>Proposals Generated</span>
                    </div>
                    <span className="text-yellow-400 font-bold">{proposals.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Upload className="h-5 w-5 text-purple-400 mr-2" />
                      <span>RFPs Processed</span>
                    </div>
                    <span className="text-purple-400 font-bold">{rfps.length}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="glass-morphism neon-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center mb-6">
              Upload RFP Document
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Upload your RFP or RFQ document to start generating winning proposals
            </DialogDescription>
          </DialogHeader>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </DialogContent>
      </Dialog>

      {/* SmartMatch Modal */}
      {showSmartMatch && (
        <SmartMatch 
          onClose={() => setShowSmartMatch(false)}
          onAnalysisComplete={handleSmartMatchComplete}
          rfps={rfps}
        />
      )}

      {/* AI Generation Modal */}
      {showAIGeneration && selectedRfpId && (
        <AIGeneration 
          rfpId={selectedRfpId}
          onClose={() => {
            setShowAIGeneration(false);
            setSelectedRfpId(null);
          }}
        />
      )}

      {/* Email Integration Modal */}
      {showEmailIntegration && (
        <EmailIntegration 
          onClose={() => setShowEmailIntegration(false)}
        />
      )}
    </SidebarProvider>
  );
}
