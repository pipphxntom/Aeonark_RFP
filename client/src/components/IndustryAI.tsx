import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Brain,
  TrendingUp,
  Database,
  Zap,
  Target,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Mail,
  Settings,
  BarChart3
} from "lucide-react";

interface IndustryAIProps {
  onClose: () => void;
}

export function IndustryAI({ onClose }: IndustryAIProps) {
  const [activeTab, setActiveTab] = useState('models');
  const [trainingComments, setTrainingComments] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch industry models data
  const { data: industryModels = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/industry-ai/models'],
    queryFn: () => apiRequest('GET', '/api/industry-ai/models').then(res => res.json())
  });

  // Fetch training logs
  const { data: trainingLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/industry-ai/training-logs'],
    queryFn: () => apiRequest('GET', '/api/industry-ai/training-logs').then(res => res.json())
  });

  // Fetch memory banks
  const { data: memoryBanks = [], isLoading: memoryLoading } = useQuery({
    queryKey: ['/api/industry-ai/memory-banks'],
    queryFn: () => apiRequest('GET', '/api/industry-ai/memory-banks').then(res => res.json())
  });

  // Training mutation
  const trainingMutation = useMutation({
    mutationFn: (trainingData: any) => 
      apiRequest('POST', '/api/industry-ai/train', trainingData).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Training Started",
        description: `Industry AI model training initiated for ${data.industry}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/industry-ai/training-logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Training Failed",
        description: error.message || "Failed to start training",
        variant: "destructive",
      });
    }
  });

  const handleStartTraining = (industry: string, modelType: string) => {
    trainingMutation.mutate({
      industry,
      modelType,
      comments: trainingComments
    });
    setTrainingComments('');
  };

  return (
    <div className="min-h-screen bg-deep-black text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Brain className="h-10 w-10 text-purple-400" />
            Industry AI Intelligence
          </h1>
          <p className="text-gray-400">Advanced machine learning models for industry-specific RFP analysis</p>
        </div>
        <Button 
          onClick={onClose}
          variant="outline" 
          size="sm"
          className="border-gray-600 hover:border-gray-400"
        >
          <X className="w-4 h-4 mr-2" />
          Close
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-morphism mb-8">
          <TabsTrigger value="models" className="data-[state=active]:bg-purple-600">
            <Database className="w-4 h-4 mr-2" />
            AI Models
          </TabsTrigger>
          <TabsTrigger value="training" className="data-[state=active]:bg-green-600">
            <Zap className="w-4 h-4 mr-2" />
            Training Logs
          </TabsTrigger>
          <TabsTrigger value="memory" className="data-[state=active]:bg-yellow-600">
            <Brain className="w-4 h-4 mr-2" />
            Memory Banks
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* AI Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {modelsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="glass-morphism animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-600 rounded mb-4"></div>
                    <div className="h-2 bg-gray-700 rounded mb-2"></div>
                    <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              industryModels.map((model: any, index: number) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-morphism hover:neon-border transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">{model.industry}</CardTitle>
                        <Badge 
                          variant={model.status === 'active' ? 'default' : 'secondary'}
                          className={model.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                        >
                          {model.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Model Version {model.version} • {model.dataPoints} training points
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Accuracy</span>
                          <span className="font-bold text-green-400">{(model.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.accuracy * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Precision</span>
                          <span className="font-bold text-blue-400">{(model.precision * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.precision * 100} className="h-2" />
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                        <div className="text-xs text-gray-400">
                          Last trained: {new Date(model.lastTrained).toLocaleDateString()}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStartTraining(model.industry, 'incremental')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Retrain
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        </TabsContent>

        {/* Training Logs Tab */}
        <TabsContent value="training" className="space-y-6">
          <div className="mb-6">
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle>Start New Training</CardTitle>
                <CardDescription>Improve model accuracy with additional data points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add training notes or specific improvements to focus on..."
                  value={trainingComments}
                  onChange={(e) => setTrainingComments(e.target.value)}
                  className="bg-gray-800 border-gray-600"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStartTraining('technology', 'full-retrain')}
                    disabled={trainingMutation.isPending}
                  >
                    {trainingMutation.isPending ? (
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Train Technology Model
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStartTraining('healthcare', 'incremental')}
                    disabled={trainingMutation.isPending}
                  >
                    Train Healthcare Model
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {logsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="glass-morphism animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              trainingLogs.map((log: any, index: number) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-morphism">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {log.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : log.status === 'running' ? (
                            <Activity className="w-5 h-5 text-blue-400 animate-spin" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                          <div>
                            <h3 className="font-semibold capitalize">{log.industry} Model Training</h3>
                            <p className="text-sm text-gray-400">
                              {log.trainingType} • {log.dataPointsUsed} data points
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={log.status === 'completed' ? 'default' : 'secondary'}
                          className={
                            log.status === 'completed' ? 'bg-green-600' :
                            log.status === 'running' ? 'bg-blue-600' : 'bg-red-600'
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">
                            +{(log.improvements?.accuracyImprovement * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-400">Accuracy Gain</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-400">
                            {Math.round(log.trainingDuration / 60)}m
                          </div>
                          <div className="text-xs text-gray-400">Duration</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-400">
                            {log.afterMetrics?.accuracy.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400">Final Accuracy</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-400">
                            {log.improvements?.dataPointsAdded}
                          </div>
                          <div className="text-xs text-gray-400">New Data Points</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Started: {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Memory Banks Tab */}
        <TabsContent value="memory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {memoryLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="glass-morphism animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-600 rounded mb-4"></div>
                    <div className="h-2 bg-gray-700 rounded mb-2"></div>
                    <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              memoryBanks.map((bank: any, index: number) => (
                <motion.div
                  key={bank.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-morphism hover:neon-border transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">{bank.industry}</CardTitle>
                        <Badge 
                          variant={bank.outcome === 'won' ? 'default' : 'secondary'}
                          className={bank.outcome === 'won' ? 'bg-green-600' : 'bg-red-600'}
                        >
                          {bank.outcome}
                        </Badge>
                      </div>
                      <CardDescription>
                        ${parseInt(bank.projectValue).toLocaleString()} • {bank.timelineWeeks} weeks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Win Probability</span>
                        <span className="font-bold text-green-400">
                          {(parseFloat(bank.winProbability) * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Client Size</span>
                        <span className="font-medium capitalize">{bank.clientSize}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Competitors</span>
                        <span className="font-medium">{bank.competitorCount}</span>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Key Phrases</div>
                        <div className="flex flex-wrap gap-1">
                          {bank.keyPhrases.map((phrase: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {phrase}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Required Certifications</div>
                        <div className="flex flex-wrap gap-1">
                          {bank.requiredCertifications.map((cert: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-blue-600">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 pt-4 border-t border-gray-700">
                        Added: {new Date(bank.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-morphism">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-3 text-green-400" />
                <div className="text-2xl font-bold mb-1">94.2%</div>
                <div className="text-sm text-gray-400">Overall Accuracy</div>
              </CardContent>
            </Card>
            
            <Card className="glass-morphism">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                <div className="text-2xl font-bold mb-1">+12.3%</div>
                <div className="text-sm text-gray-400">Improvement This Month</div>
              </CardContent>
            </Card>
            
            <Card className="glass-morphism">
              <CardContent className="p-6 text-center">
                <Database className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                <div className="text-2xl font-bold mb-1">2,847</div>
                <div className="text-sm text-gray-400">Training Data Points</div>
              </CardContent>
            </Card>
            
            <Card className="glass-morphism">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                <div className="text-2xl font-bold mb-1">143ms</div>
                <div className="text-sm text-gray-400">Avg Response Time</div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Model Performance by Industry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Technology', 'Healthcare', 'Finance', 'Education'].map((industry, index) => (
                  <div key={industry} className="space-y-2">
                    <div className="flex justify-between">
                      <span>{industry}</span>
                      <span className="font-bold">{94 - index * 2}%</span>
                    </div>
                    <Progress value={94 - index * 2} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}