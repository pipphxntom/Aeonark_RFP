import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Mail, 
  Search, 
  Star, 
  MessageSquare, 
  BarChart3,
  Zap,
  Database,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings
} from 'lucide-react';

export default function SmartMatchIntelligence() {
  const [activeTab, setActiveTab] = useState('analysis');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch SmartMatch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/smartmatch/analytics'],
    queryFn: () => apiRequest('GET', '/api/smartmatch/analytics').then(res => res.json())
  });

  // Fetch personalized recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/smartmatch/recommendations'],
    queryFn: () => apiRequest('GET', '/api/smartmatch/recommendations').then(res => res.json())
  });

  // Fetch email ingestion status
  const { data: emailStatus, isLoading: emailLoading } = useQuery({
    queryKey: ['/api/smartmatch/email-status'],
    queryFn: () => apiRequest('GET', '/api/smartmatch/email-status').then(res => res.json())
  });

  // Submit feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: (feedbackData: any) => 
      apiRequest('POST', '/api/smartmatch/feedback', feedbackData).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping improve SmartMatch accuracy",
      });
      setFeedbackComments('');
      queryClient.invalidateQueries({ queryKey: ['/api/smartmatch'] });
    },
    onError: (error: any) => {
      toast({
        title: "Feedback Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    }
  });

  // Vector similarity search mutation
  const searchMutation = useMutation({
    mutationFn: (searchData: any) => 
      apiRequest('POST', '/api/smartmatch/search-similar', searchData).then(res => res.json()),
    onError: (error: any) => {
      toast({
        title: "Search Error",
        description: error.message || "Failed to search similar RFPs",
        variant: "destructive",
      });
    }
  });

  // Email ingestion mutation
  const ingestEmailsMutation = useMutation({
    mutationFn: (provider?: string) => 
      apiRequest('POST', '/api/smartmatch/ingest-emails', { provider }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Email Ingestion Complete",
        description: `Processed ${data.processed} emails, found ${data.classified} RFPs`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/smartmatch/email-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ingestion Error",
        description: error.message || "Failed to ingest emails",
        variant: "destructive",
      });
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    searchMutation.mutate({
      query: searchQuery,
      filters: {},
      limit: 10
    });
  };

  const handleFeedback = (smartMatchId: number) => {
    feedbackMutation.mutate({
      smartMatchId,
      rating: feedbackRating,
      feedbackType: feedbackRating >= 4 ? 'positive' : feedbackRating <= 2 ? 'negative' : 'neutral',
      comments: feedbackComments
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-cyan-500">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                SmartMatch Intelligence
              </h1>
              <p className="text-gray-400 text-lg">
                AI-powered RFP analysis with deep learning and vector intelligence
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
            <TabsTrigger value="analysis" className="data-[state=active]:bg-green-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-green-600">
              <Search className="h-4 w-4 mr-2" />
              Vector Search
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-green-600">
              <MessageSquare className="h-4 w-4 mr-2" />
              Learning
            </TabsTrigger>
            <TabsTrigger value="automation" className="data-[state=active]:bg-green-600">
              <Mail className="h-4 w-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-green-600">
              <Eye className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Analytics Dashboard */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Matches</CardTitle>
                    <Target className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    {analyticsLoading ? '...' : analytics?.totalMatches || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Processed RFPs
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Average Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(analytics?.averageScore || 0)}`}>
                    {analyticsLoading ? '...' : `${Math.round(analytics?.averageScore || 0)}%`}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Compatibility score
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Email Status</CardTitle>
                    <Mail className="h-4 w-4 text-cyan-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-400">
                    {emailLoading ? '...' : emailStatus?.totalProcessed || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-processed
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-400">Learning Rate</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">
                    Active
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    AI improving
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Categories */}
            {analytics?.topCategories && analytics.topCategories.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Top Categories
                  </CardTitle>
                  <CardDescription>
                    Most frequently matched RFP categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analytics.topCategories.map((category: string, index: number) => (
                      <Badge 
                        key={category} 
                        variant="secondary" 
                        className={`
                          ${index === 0 ? 'bg-green-600 text-white' : ''}
                          ${index === 1 ? 'bg-blue-600 text-white' : ''}
                          ${index === 2 ? 'bg-purple-600 text-white' : ''}
                        `}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest SmartMatch analysis results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {analytics.recentActivity.slice(0, 5).map((activity: any) => (
                        <div key={activity.id} className="p-3 border border-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getScoreColor(activity.overallScore)}>
                              {activity.overallScore}% match
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>Industry: <span className="font-medium">{activity.analysisDetails?.classification?.industry || 'Unknown'}</span></div>
                            <div>Complexity: <span className="font-medium capitalize">{activity.analysisDetails?.classification?.complexity || 'Medium'}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Vector Search */}
          <TabsContent value="search" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Vector Similarity Search
                </CardTitle>
                <CardDescription>
                  Find similar RFPs using AI-powered semantic search
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe the type of RFP you're looking for..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || searchMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {searchMutation.isPending ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {searchMutation.data?.results && (
                  <div className="space-y-3 mt-6">
                    <h3 className="text-lg font-semibold">Search Results</h3>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {searchMutation.data.results.map((result: any, index: number) => (
                          <div key={result.id} className="p-4 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {Math.round(result.score * 100)}% similarity
                              </Badge>
                              <span className="text-xs text-gray-500">
                                RFP #{result.metadata.rfpId}
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <div>Industry: <span className="font-medium">{result.metadata.industry}</span></div>
                              <div>Section: <span className="font-medium capitalize">{result.metadata.sectionType}</span></div>
                              <div className="text-gray-400 mt-2">
                                {result.metadata.content?.substring(0, 150)}...
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning & Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  SmartMatch Learning System
                </CardTitle>
                <CardDescription>
                  Help improve AI accuracy with your feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Rate the latest SmartMatch result (1-5 stars)
                    </label>
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`p-1 rounded ${
                            star <= feedbackRating 
                              ? 'text-yellow-400' 
                              : 'text-gray-600 hover:text-yellow-300'
                          }`}
                        >
                          <Star className="h-6 w-6" fill={star <= feedbackRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Comments (optional)
                    </label>
                    <Textarea
                      placeholder="What could be improved? Which aspects were accurate or inaccurate?"
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                    />
                  </div>

                  <Button 
                    onClick={() => handleFeedback(1)} // Would need actual smartMatchId
                    disabled={feedbackMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {feedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>

                {/* Learning Statistics */}
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Learning Progress</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Industry Matching</span>
                        <span className="text-green-400">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Service Alignment</span>
                        <span className="text-blue-400">87%</span>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Timeline Analysis</span>
                        <span className="text-yellow-400">84%</span>
                      </div>
                      <Progress value={84} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Technical Fit</span>
                        <span className="text-purple-400">89%</span>
                      </div>
                      <Progress value={89} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Automation */}
          <TabsContent value="automation" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Automated Email Ingestion
                </CardTitle>
                <CardDescription>
                  Automatically discover and process RFPs from your email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Ingestion Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Run:</span>
                        <span className="text-white">
                          {emailStatus?.lastRun 
                            ? new Date(emailStatus.lastRun).toLocaleString()
                            : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Processed:</span>
                        <span className="text-green-400">{emailStatus?.totalProcessed || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Configured Providers:</span>
                        <div className="flex gap-2">
                          {emailStatus?.configuredProviders?.map((provider: string) => (
                            <Badge key={provider} variant="outline">
                              {provider}
                            </Badge>
                          )) || <span className="text-gray-500">None</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => ingestEmailsMutation.mutate()}
                        disabled={ingestEmailsMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {ingestEmailsMutation.isPending ? 'Processing...' : 'Run Manual Ingestion'}
                      </Button>
                      <Button 
                        onClick={() => ingestEmailsMutation.mutate('gmail')}
                        disabled={ingestEmailsMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        Process Gmail Only
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                {emailStatus?.recentActivity && emailStatus.recentActivity.length > 0 && (
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Email Activity</h3>
                    <ScrollArea className="h-48">
                      <div className="space-y-3">
                        {emailStatus.recentActivity.slice(0, 5).map((activity: any) => (
                          <div key={activity.id} className="p-3 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">
                                {activity.provider}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(activity.processedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <div>Attachments: <span className="font-medium">{activity.attachmentCount}</span></div>
                              <div>RFPs Found: <span className="font-medium text-green-400">{activity.documentsExtracted}</span></div>
                              <div className="text-gray-400">
                                {activity.subject?.substring(0, 50)}...
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights & Recommendations */}
          <TabsContent value="insights" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Personalized Insights
                </CardTitle>
                <CardDescription>
                  AI-generated recommendations to improve your RFP success rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendationsLoading ? (
                  <div className="text-center py-8 text-gray-400">Loading recommendations...</div>
                ) : recommendations?.recommendations?.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.recommendations.map((rec: string, index: number) => (
                      <Alert key={index} className="bg-gray-700 border-gray-600">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-white">
                          {rec}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No personalized recommendations available yet. Submit more RFPs and feedback to generate insights.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Improvement Suggestions */}
            {analytics?.improvementSuggestions && analytics.improvementSuggestions.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Improvement Areas
                  </CardTitle>
                  <CardDescription>
                    Specific areas where you can enhance your proposal success rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.improvementSuggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 border border-gray-700 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}