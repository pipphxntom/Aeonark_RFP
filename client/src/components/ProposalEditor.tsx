import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { 
  FileText, 
  Edit3, 
  Save, 
  Trash2, 
  RotateCcw, 
  Download, 
  Share2, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Brain,
  Copy,
  PlusCircle
} from "lucide-react";

interface ProposalSection {
  id: string;
  title: string;
  content: string;
  status: "done" | "editing" | "pending" | "saved" | "needs_action";
  icon: typeof FileText;
}

interface MemoryClause {
  id: number;
  title: string;
  content: string;
  type: string;
  usageCount: number;
  winRate: number;
  projectContext?: string;
}

interface ProposalEditorProps {
  proposalId: number;
  onClose: () => void;
}

export function ProposalEditor({ proposalId, onClose }: ProposalEditorProps) {
  const [selectedSection, setSelectedSection] = useState<string>("executive-summary");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch proposal data
  const { data: proposal, isLoading } = useQuery({
    queryKey: ["/api/proposals", proposalId],
    enabled: !!proposalId,
  });

  // Fetch memory clauses
  const { data: memoryClauses = [] } = useQuery<MemoryClause[]>({
    queryKey: ["/api/memory-clauses"],
  });

  const sections: ProposalSection[] = [
    {
      id: "executive-summary",
      title: "Executive Summary",
      content: (proposal as any)?.executiveSummary || "",
      status: (proposal as any)?.executiveSummary ? "done" : "pending",
      icon: FileText,
    },
    {
      id: "scope-of-work",
      title: "Scope of Work",
      content: (proposal as any)?.scopeOfWork || "",
      status: (proposal as any)?.scopeOfWork ? "done" : "pending",
      icon: Edit3,
    },
    {
      id: "timeline",
      title: "Timeline",
      content: (proposal as any)?.timeline || "",
      status: (proposal as any)?.timeline ? "done" : "pending",
      icon: Clock,
    },
    {
      id: "pricing",
      title: "Pricing Table",
      content: JSON.stringify((proposal as any)?.pricing || {}, null, 2),
      status: (proposal as any)?.pricing ? "done" : "pending",
      icon: CheckCircle,
    },
    {
      id: "legal-terms",
      title: "Legal Terms",
      content: (proposal as any)?.legalTerms || "",
      status: (proposal as any)?.legalTerms ? "done" : "needs_action",
      icon: AlertCircle,
    },
  ];

  // Update proposal mutation
  const updateProposalMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/proposals/${proposalId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals", proposalId] });
      toast({
        title: "Success",
        description: "Section updated successfully",
      });
    },
  });

  // Regenerate section mutation
  const regenerateMutation = useMutation({
    mutationFn: async ({ sectionType }: { sectionType: string }) => {
      return apiRequest("POST", `/api/proposals/${proposalId}/regenerate`, { sectionType });
    },
    onSuccess: () => {
      setRegeneratingSection(null);
      queryClient.invalidateQueries({ queryKey: ["/api/proposals", proposalId] });
      toast({
        title: "Success",
        description: "Section regenerated successfully",
      });
    },
  });

  // Share proposal mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/proposals/${proposalId}/share`);
    },
    onSuccess: (data: any) => {
      navigator.clipboard.writeText(data.shareUrl);
      toast({
        title: "Share Link Copied",
        description: "The proposal share link has been copied to your clipboard",
      });
    },
  });

  const handleSaveSection = (sectionId: string) => {
    const fieldMap: Record<string, string> = {
      "executive-summary": "executiveSummary",
      "scope-of-work": "scopeOfWork",
      "timeline": "timeline",
      "legal-terms": "legalTerms",
    };

    const field = fieldMap[sectionId];
    if (field) {
      updateProposalMutation.mutate({ [field]: editContent });
    }
    setEditingSection(null);
  };

  const handleRegenerateSection = (sectionId: string) => {
    setRegeneratingSection(sectionId);
    regenerateMutation.mutate({ sectionType: sectionId });
  };

  const handleInjectClause = (clause: MemoryClause) => {
    if (editingSection) {
      setEditContent(prev => prev + "\n\n" + clause.content);
      toast({
        title: "Clause Injected",
        description: `"${clause.title}" has been added to the current section`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "editing": return <Edit3 className="w-4 h-4 text-blue-400" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-400" />;
      case "saved": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "needs_action": return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      done: "default",
      editing: "secondary", 
      pending: "outline",
      saved: "default",
      needs_action: "destructive",
    };
    return variants[status] || "outline";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-xl text-gray-400">Loading proposal editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onClose}>
                ← Back to Proposals
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-bold">{(proposal as any)?.title || 'Loading...'}</h1>
                <p className="text-sm text-gray-400">Proposal Editor Workspace</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => shareMutation.mutate()}
                disabled={shareMutation.isPending}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar - Section Navigation */}
        <div className="w-80 border-r border-gray-800 bg-gray-900/30 p-6">
          <h2 className="text-lg font-semibold mb-4 text-cyan-400">Proposal Sections</h2>
          <div className="space-y-3">
            {sections.map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sections.indexOf(section) * 0.1 }}
              >
                <Card 
                  className={`p-4 cursor-pointer transition-all duration-200 border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800/50 ${
                    selectedSection === section.id 
                      ? "border-cyan-500 bg-gray-800/70 shadow-lg shadow-cyan-500/20" 
                      : "bg-gray-900/50"
                  }`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <section.icon className="w-5 h-5 text-cyan-400" />
                      <span className="font-medium">{section.title}</span>
                    </div>
                    {getStatusIcon(section.status)}
                  </div>
                  <Badge variant={getStatusBadge(section.status)} className="text-xs">
                    {section.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center Panel - Content Editor */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {sections.map((section) => (
              selectedSection === section.id && (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2" style={{ 
                        textShadow: "0 0 20px rgba(34, 211, 238, 0.3)" 
                      }}>
                        {section.title}
                      </h2>
                      <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded"></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateSection(section.id)}
                        disabled={regeneratingSection === section.id}
                      >
                        <RotateCcw className={`w-4 h-4 mr-2 ${regeneratingSection === section.id ? 'animate-spin' : ''}`} />
                        Regenerate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSection(section.id);
                          setEditContent(section.content);
                        }}
                        disabled={editingSection === section.id}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  {regeneratingSection === section.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative overflow-hidden bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-6 border border-cyan-500/30"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse"></div>
                      <div className="text-center text-cyan-400">
                        <Brain className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                        AI is rewriting this section...
                      </div>
                    </motion.div>
                  )}

                  <Card className="p-6 bg-gray-900/50 border-gray-700">
                    {editingSection === section.id ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[400px] bg-gray-800 border-gray-600 text-white resize-none font-mono text-sm"
                          placeholder="Edit your content here..."
                          style={{
                            boxShadow: "inset 0 0 20px rgba(34, 211, 238, 0.1)",
                          }}
                        />
                        <div className="flex items-center space-x-3">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveSection(section.id)}
                            disabled={updateProposalMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingSection(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      section.content ? (
                        <MarkdownRenderer 
                          content={section.content}
                          className="whitespace-pre-wrap text-gray-200 leading-relaxed"
                        />
                      ) : (
                        <div className="text-gray-500 italic text-center py-8">
                          No content generated yet. Click "Regenerate" to create content for this section.
                        </div>
                      )
                    )}
                  </Card>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Memory Engine */}
        <div className="w-80 border-l border-gray-800 bg-gray-900/30 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-purple-400">Company Memory Engine</h2>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-3">
              Suggested Reuse from Past Wins
            </div>
            
            {memoryClauses.slice(0, 5).map((clause, index) => (
              <motion.div
                key={clause.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer group">
                  <div className="mb-3">
                    <h4 className="font-medium text-sm mb-1">{clause.title}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{clause.content}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {clause.winRate}% win rate
                      </Badge>
                      <span className="text-gray-500">Used {clause.usageCount}x</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleInjectClause(clause)}
                      disabled={!editingSection}
                    >
                      <PlusCircle className="w-3 h-3 mr-1" />
                      Inject
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
            
            {memoryClauses.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No memory clauses yet.</p>
                <p className="text-xs">Generate more proposals to build your memory bank!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}