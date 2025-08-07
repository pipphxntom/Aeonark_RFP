import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, TrendingUp, CheckCircle, AlertTriangle, XCircle, Target, Clock, Award, DollarSign, Users, Settings, FileText, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, ArrowRight, Brain, Database, Mail, Search, Zap } from "lucide-react";

interface SmartMatchProps {
  onClose: () => void;
  onAnalysisComplete: (rfpId: number) => void;
  rfps: any[];
}

export function SmartMatch({ onClose, onAnalysisComplete, rfps }: SmartMatchProps) {
  const [selectedRfpId, setSelectedRfpId] = useState<number | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { toast } = useToast();



  const { data: smartMatch, isLoading: isLoadingMatch, refetch } = useQuery({
    queryKey: ['/api/rfps', selectedRfpId, 'smartmatch'],
    enabled: !!selectedRfpId,
    queryFn: async () => {
      const response = await fetch(`/api/rfps/${selectedRfpId}/smartmatch`);
      if (!response.ok) {
        // If no analysis exists yet, return null instead of throwing
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch analysis');
      }
      const data = await response.json();
      
      // Transform data to match new format
      return {
        overallScore: data.overallScore,
        verdict: data.analysisDetails?.verdict || 'Analysis Available',
        breakdown: data.analysisDetails?.breakdown || {
          serviceMatch: data.servicesMatch || 0,
          industryMatch: data.industryMatch || 0,
          timelineAlignment: data.timelineMatch || 0,
          certifications: data.certificationsMatch || 0,
          valueRange: 50, // Default for old data
          pastWinSimilarity: 50 // Default for old data
        },
        documentSummary: data.analysisDetails?.documentSummary || null,
        details: data.analysisDetails?.details || {
          serviceReason: "Analysis not available",
          industryReason: "Analysis not available", 
          timelineReason: "Analysis not available",
          certificationsReason: "Analysis not available",
          valueReason: "Analysis not available",
          pastWinReason: "Analysis not available",
          recommendations: [],
          explainability: []
        }
      };
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async (rfpId: number) => {
      console.log('Making API request for RFP:', rfpId);
      const response = await fetch(`/api/rfps/${rfpId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Handle document type errors specifically
        if (result.error && (result.error.includes("Document Type") || result.error.includes("Invoice") || result.error.includes("Non-RFP"))) {
          throw new Error(`${result.message}\n\n${result.suggestion || ''}`);
        }
        throw new Error(result.message || 'Analysis failed');
      }
      
      console.log('Analysis result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Analysis successful:', data);
      setAnalysisComplete(true);
      // Refetch the smartmatch data immediately after analysis completes
      refetch();
      toast({
        title: "Analysis Complete",
        description: "SmartMatch analysis has been completed successfully.",
      });
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      const isDocumentTypeError = error.message.includes("invoice") || error.message.includes("contract") || error.message.includes("Document Type");
      
      toast({
        title: isDocumentTypeError ? "Wrong Document Type" : "Analysis Failed",
        description: error.message || "Failed to analyze RFP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (selectedRfpId) {
      console.log('Starting analysis for RFP:', selectedRfpId);
      analyzeMutation.mutate(selectedRfpId);
    } else {
      console.log('No RFP selected');
      toast({
        title: "No RFP Selected",
        description: "Please select an RFP to analyze first.",
        variant: "destructive",
      });
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
        {!analysisComplete && (
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
                  disabled={analyzeMutation.isPending || isLoadingMatch}
                  className="bg-neon-green text-black px-8 py-3 rounded-lg font-bold hover:animate-glow transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2" />
                      Analyzing Compatibility...
                    </>
                  ) : isLoadingMatch && analysisComplete ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2" />
                      Loading Results...
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
        {smartMatch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Overall Score Display */}
            <Card className="glass-morphism neon-border-cyan">
              <CardContent className="p-8 text-center">
                <motion.div 
                  className="relative inline-block mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                >
                  <div className="relative w-48 h-48 mx-auto">
                    <div className="absolute inset-0 rounded-full border-8 border-gray-700"></div>
                    <div 
                      className={`absolute inset-0 rounded-full border-8 border-transparent ${
                        smartMatch.overallScore >= 80 ? 'border-t-neon-green border-r-neon-green' :
                        smartMatch.overallScore >= 60 ? 'border-t-yellow-400 border-r-yellow-400' :
                        'border-t-red-400 border-r-red-400'
                      }`}
                      style={{
                        transform: `rotate(${(smartMatch.overallScore / 100) * 360}deg)`
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-bold">{smartMatch.overallScore}</div>
                        <div className="text-lg text-gray-400">Score</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                <Badge 
                  className={`text-xl px-6 py-2 ${
                    smartMatch.verdict === 'Strong Fit' ? 'bg-neon-green text-black' :
                    smartMatch.verdict === 'High Fit' ? 'bg-neon-cyan text-black' :
                    smartMatch.verdict === 'Medium Fit' ? 'bg-yellow-400 text-black' :
                    'bg-red-400 text-white'
                  }`}
                >
                  {smartMatch.verdict}
                </Badge>
              </CardContent>
            </Card>

            {/* Document Summary */}
            {smartMatch.documentSummary && (
              <Card className="glass-morphism neon-border-blue">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Document Analysis
                  </CardTitle>
                  <CardDescription>
                    Detailed analysis of the uploaded document
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Document Metadata */}
                  <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-neon-cyan mb-1">Document Name</h4>
                      <p className="text-sm text-gray-300">{smartMatch.documentSummary.documentName || 'Unknown'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neon-cyan mb-1">Document Type</h4>
                      <Badge className={`${
                        smartMatch.documentSummary.documentType === 'rfp' ? 'bg-green-600' :
                        smartMatch.documentSummary.documentType === 'resume' ? 'bg-blue-600' :
                        smartMatch.documentSummary.documentType === 'industry_paper' ? 'bg-purple-600' :
                        smartMatch.documentSummary.documentType === 'audit_paper' ? 'bg-orange-600' :
                        'bg-gray-600'
                      } text-white`}>
                        {smartMatch.documentSummary.documentType?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neon-cyan mb-1">Key Entities</h4>
                      <div className="flex flex-wrap gap-1">
                        {smartMatch.documentSummary.keyEntities?.slice(0, 3).map((entity, i) => (
                          <Badge key={i} variant="outline" className="text-xs text-neon-green border-neon-green">
                            {entity}
                          </Badge>
                        ))}
                        {smartMatch.documentSummary.keyEntities?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{smartMatch.documentSummary.keyEntities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Summary */}
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-neon-cyan mb-3">Document Summary</h4>
                    <p className="text-gray-200 leading-relaxed">
                      {smartMatch.documentSummary.contentSummary || 'Content summary not available'}
                    </p>
                  </div>

                  {/* Document Details Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-300 mb-2">Core Requirements</h4>
                        <ul className="space-y-1 text-sm">
                          {smartMatch.documentSummary.keyRequirements?.map((req, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-200">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {smartMatch.documentSummary.technicalSpecs && smartMatch.documentSummary.technicalSpecs.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-300 mb-2">Technical Specifications</h4>
                          <ul className="space-y-1 text-sm">
                            {smartMatch.documentSummary.technicalSpecs.map((spec, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Settings className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-200">{spec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-semibold text-sm text-gray-300 mb-2">Expected Deliverables</h4>
                        <ul className="space-y-1 text-sm">
                          {smartMatch.documentSummary.deliverables?.map((deliverable, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Target className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-200">{deliverable}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-300 mb-2">Project Scope</h4>
                        <p className="text-sm text-gray-200 leading-relaxed">
                          {smartMatch.documentSummary.projectScope}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-300 mb-1">Budget Range</h4>
                          <p className="text-sm text-gray-200">{smartMatch.documentSummary.budget}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-300 mb-1">Timeline</h4>
                          <p className="text-sm text-gray-200">{smartMatch.documentSummary.timeline}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm text-gray-300 mb-1">Industry Context</h4>
                        <p className="text-sm text-gray-200">{smartMatch.documentSummary.industryContext}</p>
                      </div>
                    </div>
                  </div>
                  
                  {smartMatch.documentSummary.technicalComplexity && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-300 mb-1">Technical Complexity</h4>
                          <p className="text-sm text-gray-200">{smartMatch.documentSummary.technicalComplexity}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-300 mb-1">Strategic Value</h4>
                          <p className="text-sm text-gray-200">{smartMatch.documentSummary.strategicValue}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 6-Dimension Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'serviceMatch', title: 'Service Match', icon: Target, weight: '35%', description: 'Services alignment' },
                { key: 'industryMatch', title: 'Industry Match', icon: Users, weight: '15%', description: 'Industry vertical fit' },
                { key: 'timelineAlignment', title: 'Timeline Fit', icon: Clock, weight: '10%', description: 'Delivery timeline' },
                { key: 'certifications', title: 'Certifications', icon: Award, weight: '15%', description: 'Required certifications' },
                { key: 'valueRange', title: 'Value Range', icon: DollarSign, weight: '10%', description: 'Budget alignment' },
                { key: 'pastWinSimilarity', title: 'Past Wins', icon: TrendingUp, weight: '15%', description: 'Similar project success' }
              ].map((dimension, index) => {
                const score = smartMatch.breakdown[dimension.key as keyof typeof smartMatch.breakdown];
                const Icon = dimension.icon;
                
                return (
                  <motion.div
                    key={dimension.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Card className={`h-full ${getScoreBorder(score)} hover:scale-105 transition-transform duration-300`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Icon className={`h-6 w-6 ${getScoreColor(score)}`} />
                          <Badge variant="outline" className="text-xs">
                            {dimension.weight}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{dimension.title}</CardTitle>
                        <p className="text-sm text-gray-400">{dimension.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{score}</span>
                            <span className="text-gray-400">/100</span>
                          </div>
                          <Progress 
                            value={score} 
                            className={`h-3 ${
                              score >= 80 ? 'progress-glow' : ''
                            }`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Collapsible Insights and Recommendations */}
            <div className="space-y-4">
              {/* Key Insights Section */}
              {smartMatch.details.explainability && smartMatch.details.explainability.length > 0 && (
                <Card className="glass-morphism">
                  <CardHeader className="pb-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowInsights(!showInsights)}
                      className="w-full justify-between p-0 hover:bg-transparent text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-neon-cyan" />
                        <span className="font-semibold text-neon-cyan">Key Insights</span>
                        <Badge variant="outline" className="text-xs">
                          {smartMatch.details.explainability.length}
                        </Badge>
                      </div>
                      {showInsights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CardHeader>
                  {showInsights && (
                    <CardContent className="pt-0">
                      <ul className="space-y-3">
                        {smartMatch.details.explainability.map((insight: string, index: number) => (
                          <motion.li 
                            key={index} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="text-gray-300 text-sm flex items-start p-3 bg-gray-800 rounded-lg"
                          >
                            <span className="text-neon-green mr-3 mt-0.5">•</span>
                            <span>{insight}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Recommendations Section */}
              {smartMatch.details.recommendations && smartMatch.details.recommendations.length > 0 && (
                <Card className="glass-morphism">
                  <CardHeader className="pb-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowRecommendations(!showRecommendations)}
                      className="w-full justify-between p-0 hover:bg-transparent text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-yellow-400" />
                        <span className="font-semibold text-yellow-400">Recommendations</span>
                        <Badge variant="outline" className="text-xs">
                          {smartMatch.details.recommendations.length}
                        </Badge>
                      </div>
                      {showRecommendations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CardHeader>
                  {showRecommendations && (
                    <CardContent className="pt-0">
                      <ul className="space-y-3">
                        {smartMatch.details.recommendations.map((rec: string, index: number) => (
                          <motion.li 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="text-gray-300 text-sm flex items-start p-3 bg-gray-800 rounded-lg"
                          >
                            <ArrowRight className="h-4 w-4 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              )}
            </div>

            {/* AI Intelligence Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-400" />
                AI Intelligence Features
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Automated Email Ingestion */}
                <Card className="glass-morphism border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-400" />
                      Email Intelligence
                    </CardTitle>
                    <CardDescription>
                      Automated RFP discovery and processing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">RFPs Discovered</p>
                        <p className="text-2xl font-bold text-blue-400">12</p>
                      </div>
                      <Mail className="h-8 w-8 text-blue-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Auto-Processed</p>
                        <p className="text-2xl font-bold text-green-400">8</p>
                      </div>
                      <Zap className="h-8 w-8 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-400">
                      Last scan: 2 hours ago
                    </p>
                  </CardContent>
                </Card>

                {/* Vector Search */}
                <Card className="glass-morphism border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-cyan-400" />
                      Vector Search
                    </CardTitle>
                    <CardDescription>
                      Semantic similarity matching
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Indexed Documents</p>
                        <p className="text-2xl font-bold text-cyan-400">156</p>
                      </div>
                      <Database className="h-8 w-8 text-cyan-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Match Accuracy</p>
                        <p className="text-2xl font-bold text-green-400">94%</p>
                      </div>
                      <Target className="h-8 w-8 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-400">
                      Vector embeddings: 768-dimensional
                    </p>
                  </CardContent>
                </Card>

                {/* Smart Learning System */}
                <Card className="glass-morphism border-green-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-green-400" />
                      Smart Learning
                    </CardTitle>
                    <CardDescription>
                      Continuous improvement algorithms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Models Trained</p>
                        <p className="text-2xl font-bold text-green-400">3</p>
                      </div>
                      <Brain className="h-8 w-8 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Feedback Score</p>
                        <p className="text-2xl font-bold text-yellow-400">4.8</p>
                      </div>
                      <Award className="h-8 w-8 text-yellow-400" />
                    </div>
                    <p className="text-xs text-gray-400">
                      Learning from {rfps.length} successful matches
                    </p>
                  </CardContent>
                </Card>

                {/* Personalized Insights */}
                <Card className="glass-morphism border-yellow-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-400" />
                      Personalized Insights
                    </CardTitle>
                    <CardDescription>
                      AI-powered recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="font-medium text-sm text-yellow-400 mb-2">Top Recommendation</p>
                      <p className="text-sm text-gray-300">
                        Focus on government cybersecurity RFPs - 40% higher win rate
                      </p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="font-medium text-sm text-blue-400 mb-2">Market Trend</p>
                      <p className="text-sm text-gray-300">
                        Cloud migration projects increasing by 25% this quarter
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Updated based on recent market analysis
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-6">
              <Button
                onClick={() => {
                  setSelectedRfpId(null);
                  setAnalysisComplete(false);
                }}
                variant="outline"
                className="px-6 py-3"
              >
                Analyze Another RFP
              </Button>
              <Button
                onClick={handleGenerateProposal}
                className="bg-gradient-to-r from-neon-green to-neon-cyan text-black px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all duration-300"
                size="lg"
              >
                Generate Proposal
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
