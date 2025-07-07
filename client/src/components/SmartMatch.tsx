import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, TrendingUp, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface SmartMatchProps {
  onClose: () => void;
  onAnalysisComplete: (rfpId: number) => void;
  rfps: any[];
}

export function SmartMatch({ onClose, onAnalysisComplete, rfps }: SmartMatchProps) {
  const [selectedRfpId, setSelectedRfpId] = useState<number | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const { toast } = useToast();

  const { data: smartMatch, isLoading: isLoadingMatch } = useQuery({
    queryKey: ['/api/rfps', selectedRfpId, 'smartmatch'],
    enabled: !!selectedRfpId && analysisComplete,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (rfpId: number) => {
      const response = await apiRequest('POST', `/api/rfps/${rfpId}/analyze`);
      return response.json();
    },
    onSuccess: () => {
      setAnalysisComplete(true);
      toast({
        title: "Analysis Complete",
        description: "SmartMatch analysis has been completed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (selectedRfpId) {
      analyzeMutation.mutate(selectedRfpId);
    }
  };

  const handleGenerateProposal = () => {
    if (selectedRfpId) {
      onAnalysisComplete(selectedRfpId);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-neon-green';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return XCircle;
  };

  const getScoreBorder = (score: number) => {
    if (score >= 80) return 'border-neon-green';
    if (score >= 60) return 'border-yellow-400';
    return 'border-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 bg-deep-black flex items-center justify-center p-8">
      <motion.div 
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">SmartMatch™ Analysis</h1>
            <p className="text-gray-400">AI-powered compatibility assessment</p>
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

        {/* RFP Selection */}
        {!selectedRfpId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="glass-morphism neon-border">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Select an RFP to Analyze</h3>
                
                {rfps.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No RFPs available for analysis</p>
                    <p className="text-sm mt-2">Upload an RFP document first</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rfps.map((rfp: any) => (
                      <motion.div
                        key={rfp.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all duration-300 ${
                            selectedRfpId === rfp.id 
                              ? 'border-neon-green bg-neon-green/10' 
                              : 'border-gray-700 hover:border-neon-green/50'
                          }`}
                          onClick={() => setSelectedRfpId(rfp.id)}
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-lg">{rfp.title}</h4>
                                <p className="text-gray-400 text-sm">
                                  Uploaded: {new Date(rfp.createdAt).toLocaleDateString()}
                                </p>
                                {rfp.deadline && (
                                  <p className="text-gray-400 text-sm">
                                    Deadline: {new Date(rfp.deadline).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                rfp.status === 'analyzed' ? 'bg-neon-green text-black' :
                                rfp.status === 'uploaded' ? 'bg-yellow-400 text-black' :
                                'bg-gray-600 text-white'
                              }`}>
                                {rfp.status}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedRfpId && (
              <div className="text-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  className="bg-neon-green text-black px-8 py-3 rounded-lg font-bold hover:animate-glow transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2" />
                      Analyzing Compatibility...
                    </>
                  ) : (
                    'Start SmartMatch Analysis'
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Analysis Results */}
        {analysisComplete && smartMatch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Score Dial */}
            <div className="text-center mb-12">
              <motion.div 
                className="relative inline-block"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <svg width="200" height="200" className="transform -rotate-90">
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="80" 
                    stroke="rgb(55, 65, 81)" 
                    strokeWidth="20" 
                    fill="transparent"
                  />
                  <motion.circle 
                    cx="100" 
                    cy="100" 
                    r="80" 
                    stroke="var(--neon-green)" 
                    strokeWidth="20" 
                    fill="transparent"
                    strokeDasharray="502"
                    strokeDashoffset={502 - (502 * smartMatch.overallScore) / 100}
                    initial={{ strokeDashoffset: 502 }}
                    animate={{ strokeDashoffset: 502 - (502 * smartMatch.overallScore) / 100 }}
                    transition={{ delay: 1, duration: 2 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-neon-green">
                      {smartMatch.overallScore}%
                    </div>
                    <div className="text-sm text-gray-400">Match Score</div>
                    <div className="text-xs text-neon-green font-bold">
                      {smartMatch.overallScore >= 80 ? 'High Fit' : 
                       smartMatch.overallScore >= 60 ? 'Medium Fit' : 'Low Fit'}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Industry Match', score: smartMatch.industryMatch, reason: smartMatch.analysisDetails?.industryReason },
                { label: 'Services Fit', score: smartMatch.servicesMatch, reason: smartMatch.analysisDetails?.servicesReason },
                { label: 'Timeline', score: smartMatch.timelineMatch, reason: smartMatch.analysisDetails?.timelineReason },
                { label: 'Certifications', score: smartMatch.certificationsMatch, reason: smartMatch.analysisDetails?.certificationsReason }
              ].map((item, index) => {
                const Icon = getScoreIcon(item.score);
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 + index * 0.2 }}
                  >
                    <Card className={`glass-morphism border-l-4 ${getScoreBorder(item.score)}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold flex items-center">
                            <Icon className={`h-4 w-4 mr-2 ${getScoreColor(item.score)}`} />
                            {item.label}
                          </h3>
                          <span className={`font-bold ${getScoreColor(item.score)}`}>
                            {item.score}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          {item.reason || 'Analysis details not available'}
                        </p>
                        <div className="bg-gray-700 rounded-full h-2">
                          <motion.div 
                            className={`h-2 rounded-full ${
                              item.score >= 80 ? 'bg-neon-green' :
                              item.score >= 60 ? 'bg-yellow-400' :
                              'bg-red-400'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ delay: 2 + index * 0.1, duration: 1 }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Recommendations */}
            {smartMatch.analysisDetails?.recommendations && smartMatch.analysisDetails.recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 }}
              >
                <Card className="glass-morphism">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Recommendations</h3>
                    <ul className="space-y-2">
                      {smartMatch.analysisDetails.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-neon-cyan rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div 
              className="text-center space-x-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
            >
              <Button
                onClick={onClose}
                variant="outline"
                className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              >
                Back to Dashboard
              </Button>
              {smartMatch.overallScore >= 60 && (
                <Button
                  onClick={handleGenerateProposal}
                  className="bg-neon-green text-black px-8 py-3 rounded-lg font-bold hover:animate-glow transition-all duration-300 transform hover:scale-105"
                >
                  Generate Proposal
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
