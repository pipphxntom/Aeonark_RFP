import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  X, 
  Brain, 
  RefreshCw, 
  Edit, 
  Download, 
  Save,
  Loader2,
  FileText,
  DollarSign,
  Calendar,
  Scale
} from "lucide-react";

interface AIGenerationProps {
  rfpId: number;
  onClose: () => void;
}

interface ProposalSection {
  id: string;
  title: string;
  content: string;
  icon: any;
  isEditing: boolean;
}

export function AIGeneration({ rfpId, onClose }: AIGenerationProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [showSections, setShowSections] = useState(false);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [proposalId, setProposalId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch RFP details
  const { data: rfp } = useQuery({
    queryKey: ['/api/rfps', rfpId],
  });

  // Generate proposal mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/rfps/${rfpId}/generate-proposal`);
      return response.json();
    },
    onSuccess: (proposal) => {
      setProposalId(proposal.id);
      
      // Initialize sections with proposal content
      const initialSections: ProposalSection[] = [
        {
          id: 'executiveSummary',
          title: 'Executive Summary',
          content: proposal.executiveSummary || '',
          icon: FileText,
          isEditing: false
        },
        {
          id: 'scopeOfWork',
          title: 'Scope of Work',
          content: proposal.scopeOfWork || '',
          icon: Edit,
          isEditing: false
        },
        {
          id: 'pricing',
          title: 'Investment Overview',
          content: formatPricingContent(proposal.pricing),
          icon: DollarSign,
          isEditing: false
        },
        {
          id: 'timeline',
          title: 'Project Timeline',
          content: proposal.timeline || '',
          icon: Calendar,
          isEditing: false
        }
      ];

      setSections(initialSections);
      
      // Start the reveal animation
      setTimeout(() => {
        setIsProcessing(false);
        setShowSections(true);
      }, 3000);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  // Update proposal mutation
  const updateMutation = useMutation({
    mutationFn: async ({ sectionId, content }: { sectionId: string, content: string }) => {
      if (!proposalId) throw new Error("No proposal ID");
      
      const updateData = { [sectionId]: content };
      const response = await apiRequest('PUT', `/api/proposals/${proposalId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Section Updated",
        description: "Your changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Regenerate section mutation (placeholder - would need backend endpoint)
  const regenerateMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      // This would call a backend endpoint to regenerate a specific section
      // For now, we'll just return the existing content
      return { content: sections.find(s => s.id === sectionId)?.content || '' };
    },
    onSuccess: (data, sectionId) => {
      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, content: data.content }
          : section
      ));
      toast({
        title: "Section Regenerated",
        description: "New content has been generated for this section.",
      });
    },
    onError: (error) => {
      toast({
        title: "Regeneration Failed", 
        description: "Failed to regenerate section content.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!generateMutation.data) {
      generateMutation.mutate();
    }
  }, []);

  const formatPricingContent = (pricing: any) => {
    if (!pricing || !pricing.items) return 'Pricing information not available';
    
    let content = 'Investment Breakdown:\n\n';
    pricing.items.forEach((item: any) => {
      content += `• ${item.description}\n`;
      content += `  Duration: ${item.duration}\n`;
      content += `  Investment: $${item.amount?.toLocaleString() || 'TBD'}\n\n`;
    });
    
    if (pricing.total) {
      content += `Total Investment: $${pricing.total.toLocaleString()} ${pricing.currency || 'USD'}`;
    }
    
    return content;
  };

  const handleEdit = (sectionId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, isEditing: true }
        : section
    ));
  };

  const handleSave = (sectionId: string, newContent: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, content: newContent, isEditing: false }
        : section
    ));
    
    updateMutation.mutate({ sectionId, content: newContent });
  };

  const handleCancel = (sectionId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, isEditing: false }
        : section
    ));
  };

  const handleExport = () => {
    toast({
      title: "Export Feature",
      description: "Export functionality will be available soon.",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-deep-black overflow-y-auto">
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">AI Proposal Generation</h1>
              <p className="text-gray-400">
                {rfp?.title ? `Generating proposal for: ${rfp.title}` : 'Creating your optimized proposal'}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mb-12"
              >
                {/* AI Processing Animation */}
                <div className="relative inline-block mb-8">
                  <motion.div 
                    className="w-32 h-32 mx-auto perspective-1000"
                    animate={{ rotateX: 360, rotateY: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-full h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-lg shadow-2xl" />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>
                
                <motion.h2 
                  className="text-3xl font-bold mb-4"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Forging Proposal with AeonRFP...
                </motion.h2>
                <p className="text-gray-400">
                  Analyzing requirements and generating optimized content
                </p>
                
                {generateMutation.isPending && (
                  <div className="mt-6 flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-neon-green" />
                    <span className="text-neon-green">Processing...</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="sections"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <h1 className="text-4xl font-bold text-center mb-8">
                  AI-Generated Proposal Draft
                </h1>
                
                {/* Generated Sections */}
                <div className="space-y-8">
                  {sections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                      <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.8, duration: 0.5 }}
                      >
                        <Card className="glass-morphism">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-2xl font-bold flex items-center">
                                <Icon className="mr-2 h-6 w-6 text-neon-cyan" />
                                {section.title}
                              </h3>
                              
                              <div className="space-x-2">
                                <Button
                                  onClick={() => regenerateMutation.mutate(section.id)}
                                  disabled={regenerateMutation.isPending}
                                  className="bg-neon-cyan text-black hover:bg-neon-cyan/80"
                                  size="sm"
                                >
                                  <RefreshCw className={`mr-1 h-4 w-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                                  Regenerate
                                </Button>
                                
                                {!section.isEditing ? (
                                  <Button
                                    onClick={() => handleEdit(section.id)}
                                    variant="outline"
                                    className="border-gray-600 hover:border-gray-500"
                                    size="sm"
                                  >
                                    <Edit className="mr-1 h-4 w-4" />
                                    Edit
                                  </Button>
                                ) : (
                                  <div className="space-x-2">
                                    <Button
                                      onClick={() => {
                                        const textarea = document.querySelector(`#${section.id}-textarea`) as HTMLTextAreaElement;
                                        if (textarea) {
                                          handleSave(section.id, textarea.value);
                                        }
                                      }}
                                      disabled={updateMutation.isPending}
                                      className="bg-neon-green text-black hover:bg-neon-green/80"
                                      size="sm"
                                    >
                                      <Save className="mr-1 h-4 w-4" />
                                      Save
                                    </Button>
                                    <Button
                                      onClick={() => handleCancel(section.id)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="typing-container">
                              {section.isEditing ? (
                                <Textarea
                                  id={`${section.id}-textarea`}
                                  defaultValue={section.content}
                                  className="min-h-[200px] bg-gray-800 border-gray-600 text-gray-300 focus:border-neon-green"
                                  placeholder="Edit section content..."
                                />
                              ) : (
                                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {section.content}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Action Buttons */}
                <motion.div 
                  className="text-center space-x-4 pt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: sections.length * 0.8 + 0.5 }}
                >
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                  >
                    Back to Dashboard
                  </Button>
                  
                  <Button
                    onClick={handleExport}
                    className="bg-neon-green text-black px-8 py-3 rounded-lg font-bold hover:animate-glow transition-all duration-300 transform hover:scale-105"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Export Proposal
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
