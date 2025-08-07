import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  BarChart3,
  Clock,
  Award,
  Lightbulb,
  Users,
  Settings,
  Zap,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface IndustryModel {
  id: number;
  industry: string;
  modelVersion: string;
  trainingDataCount: number;
  lastTrainingDate: string | null;
  performanceMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainingDataSize: number;
  };
  isActive: boolean;
  createdAt: string;
}

interface TrainingLog {
  id: number;
  industry: string;
  trainingType: string;
  dataPointsUsed: number;
  trainingDuration: number;
  status: string;
  improvements: {
    accuracyImprovement: number;
    dataPointsAdded: number;
  };
  beforeMetrics: any;
  afterMetrics: any;
  createdAt: string;
}

interface MemoryBankEntry {
  id: number;
  industry: string;
  outcome: string;
  winProbability: string | null;
  projectValue: string | null;
  timelineWeeks: number | null;
  competitorCount: number | null;
  clientSize: string | null;
  keyPhrases: string[];
  requiredCertifications: string[];
  createdAt: string;
}

interface MemoryBankStats {
  totalEntries: number;
  winRate: number;
  avgProjectValue: number;
  industries: string[];
}

export default function SmartMatch() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("technology");
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Fetch industry models
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/smartmatch/industry-models'],
    queryFn: () => apiRequest('GET', '/api/smartmatch/industry-models').then(res => res.json())
  });

  // Fetch training logs
  const { data: trainingLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/smartmatch/training-logs', selectedIndustry],
    queryFn: () => apiRequest('GET', '/api/smartmatch/training-logs').then(res => res.json())
  });

  // Fetch memory bank data
  const { data: memoryBank, isLoading: memoryLoading } = useQuery({
    queryKey: ['/api/smartmatch/memory-banks', selectedIndustry],
    queryFn: () => apiRequest('GET', '/api/smartmatch/memory-banks').then(res => res.json())
  });

  // Fetch model metrics for selected industry
  const { data: modelMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/smartmatch/industry-models', selectedIndustry],
    queryFn: () => apiRequest('GET', '/api/smartmatch/industry-models').then(res => res.json())
  });

  // Trigger training mutation
  const trainModelMutation = useMutation({
    mutationFn: (data: { industry: string; trainingType: string }) => 
      apiRequest('POST', '/api/smartmatch/train-model', data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smartmatch'] });
    }
  });

  const availableIndustries = models?.models?.map((m: IndustryModel) => m.industry) || ["technology", "healthcare", "finance"];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      running: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20"
    };
    return variants[status as keyof typeof variants] || variants.completed;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Industry SmartMatch Engine
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Advanced AI-powered proposal matching with industry-specific learning, continuous training, and isolated memory banks for enhanced data privacy.
          </p>
        </div>

        {/* Industry Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Industry Focus</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableIndustries.map((industry) => (
              <Button
                key={industry}
                variant={selectedIndustry === industry ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedIndustry(industry)}
                className="capitalize"
              >
                {industry}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Memory Bank
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Model Performance Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Model Accuracy</CardTitle>
                    <Target className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {modelMetrics?.metrics?.performanceMetrics?.accuracy ? 
                      `${(modelMetrics.metrics.performanceMetrics.accuracy * 100).toFixed(1)}%` : 
                      "Training Required"
                    }
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {modelMetrics?.metrics?.trainingDataCount || 0} training samples
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {memoryBank?.statistics?.winRate || 0}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    From {memoryBank?.statistics?.totalEntries || 0} historical RFPs
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Avg Project Value</CardTitle>
                    <Award className="h-4 w-4 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    ${(memoryBank?.statistics?.avgProjectValue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on historical data
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Model Version</CardTitle>
                    <Zap className="h-4 w-4 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    v{modelMetrics?.metrics?.modelVersion || "1.0"}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {modelMetrics?.metrics?.lastTrainingDate ? 
                      `Updated ${new Date(modelMetrics.metrics.lastTrainingDate).toLocaleDateString()}` :
                      "Initial version"
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Model Performance Details */}
            {modelMetrics?.metrics?.performanceMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    {selectedIndustry.charAt(0).toUpperCase() + selectedIndustry.slice(1)} Model Performance
                  </CardTitle>
                  <CardDescription>
                    Detailed performance metrics for industry-specific AI model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(modelMetrics.metrics.performanceMetrics).map(([metric, value]) => (
                    <div key={metric} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{metric.replace(/([A-Z])/g, ' $1')}</span>
                        <span className={getScoreColor(typeof value === 'number' ? value * 100 : 0)}>
                          {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}
                        </span>
                      </div>
                      {typeof value === 'number' && (
                        <Progress value={value * 100} className="h-2" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Training Status */}
            {!modelMetrics?.metrics?.performanceMetrics && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Industry model requires training. Add historical RFP data to improve matching accuracy.
                  <Button 
                    size="sm" 
                    className="ml-3"
                    onClick={() => trainModelMutation.mutate({ industry: selectedIndustry, trainingType: 'initial' })}
                    disabled={trainModelMutation.isPending}
                  >
                    {trainModelMutation.isPending ? "Training..." : "Start Training"}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Training Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Model Training
                  </CardTitle>
                  <CardDescription>
                    Trigger training for {selectedIndustry} industry model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => trainModelMutation.mutate({ industry: selectedIndustry, trainingType: 'incremental' })}
                      disabled={trainModelMutation.isPending}
                      className="w-full"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Incremental Training
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => trainModelMutation.mutate({ industry: selectedIndustry, trainingType: 'retrain' })}
                      disabled={trainModelMutation.isPending}
                      className="w-full"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Full Retrain
                    </Button>
                  </div>
                  
                  {trainModelMutation.isPending && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Training in progress... This may take a few minutes.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Recent Training Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Training History
                  </CardTitle>
                  <CardDescription>
                    Recent training sessions for {selectedIndustry}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {logsLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading training logs...</div>
                    ) : trainingLogs?.trainingLogs?.length > 0 ? (
                      <div className="space-y-3">
                        {trainingLogs.trainingLogs.slice(0, 5).map((log: TrainingLog) => (
                          <div key={log.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={getStatusBadge(log.status)}>
                                {log.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <div>Type: <span className="font-medium capitalize">{log.trainingType}</span></div>
                              <div>Data Points: <span className="font-medium">{log.dataPointsUsed}</span></div>
                              <div>Duration: <span className="font-medium">{log.trainingDuration}s</span></div>
                              {log.improvements?.accuracyImprovement && (
                                <div className="text-green-600">
                                  Accuracy improved by {(log.improvements.accuracyImprovement * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No training history yet
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Memory Bank Tab */}
          <TabsContent value="memory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Historical Data Repository
                </CardTitle>
                <CardDescription>
                  Stored RFP and proposal data for {selectedIndustry} industry learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                {memoryLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading memory bank...</div>
                ) : memoryBank?.memoryBank?.length > 0 ? (
                  <div className="space-y-4">
                    {memoryBank.memoryBank.map((entry: MemoryBankEntry) => (
                      <div key={entry.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={entry.outcome === 'won' ? 'default' : entry.outcome === 'lost' ? 'destructive' : 'secondary'}>
                              {entry.outcome}
                            </Badge>
                            {entry.projectValue && (
                              <span className="text-sm text-gray-600">
                                ${parseFloat(entry.projectValue).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium mb-1">Key Phrases</div>
                            <div className="flex flex-wrap gap-1">
                              {entry.keyPhrases?.slice(0, 3).map((phrase, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {phrase}
                                </Badge>
                              ))}
                              {entry.keyPhrases?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{entry.keyPhrases.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium mb-1">Project Details</div>
                            <div className="space-y-1 text-gray-600">
                              {entry.timelineWeeks && <div>Timeline: {entry.timelineWeeks} weeks</div>}
                              {entry.competitorCount && <div>Competitors: {entry.competitorCount}</div>}
                              {entry.clientSize && <div>Client: {entry.clientSize}</div>}
                            </div>
                          </div>
                        </div>

                        {entry.requiredCertifications?.length > 0 && (
                          <div className="mt-3">
                            <div className="font-medium mb-1 text-sm">Required Certifications</div>
                            <div className="flex flex-wrap gap-1">
                              {entry.requiredCertifications.map((cert, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <div>No historical data stored yet</div>
                    <div className="text-sm mt-1">
                      Upload RFPs and add outcome data to build your industry-specific memory bank
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Success Predictors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Success Predictors
                  </CardTitle>
                  <CardDescription>
                    Key factors that correlate with winning proposals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Industry Experience Match</span>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="w-20 h-2" />
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Timeline Feasibility</span>
                      <div className="flex items-center gap-2">
                        <Progress value={78} className="w-20 h-2" />
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Certification Compliance</span>
                      <div className="flex items-center gap-2">
                        <Progress value={72} className="w-20 h-2" />
                        <span className="text-sm font-medium">72%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Competitive Pricing</span>
                      <div className="flex items-center gap-2">
                        <Progress value={65} className="w-20 h-2" />
                        <span className="text-sm font-medium">65%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Factors
                  </CardTitle>
                  <CardDescription>
                    Common factors associated with proposal losses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">High Competition</div>
                        <div className="text-xs text-gray-500">5+ competitors typically reduce win rate by 25%</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">Tight Timeline</div>
                        <div className="text-xs text-gray-500">Less than 8 weeks reduces success probability</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">Missing Certifications</div>
                        <div className="text-xs text-gray-500">Required compliance certifications not held</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">Limited Historical Data</div>
                        <div className="text-xs text-gray-500">Insufficient training data for accurate predictions</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}