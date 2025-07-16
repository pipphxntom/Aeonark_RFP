import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Search, Sparkles, Clock, ThumbsUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ClauseMatch {
  id: number;
  title: string;
  body: string;
  category: string;
  tags: string[];
  similarityScore: number;
  explanation: string;
  usageCount: number;
}

interface SmartMatchResponse {
  matches: ClauseMatch[];
  queryId: number;
  processingTime: number;
  model: string;
}

export default function SmartMatch() {
  const [query, setQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing clause templates
  const { data: clauses, isLoading: clausesLoading } = useQuery({
    queryKey: ['/api/smartmatch/clauses'],
    queryFn: async () => {
      const response = await fetch('/api/smartmatch/clauses');
      if (!response.ok) throw new Error('Failed to fetch clauses');
      return response.json();
    }
  });

  // SmartMatch query mutation
  const smartMatchMutation = useMutation({
    mutationFn: async ({ query, model, file }: { query: string; model: string; file?: File }) => {
      const formData = new FormData();
      formData.append('query', query);
      formData.append('model', model);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/smartmatch', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process SmartMatch query');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SmartMatch Complete",
        description: "Found matching clauses for your query",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "SmartMatch Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create sample clauses mutation
  const createSampleClausesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/smartmatch/sample-clauses', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to create sample clauses');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smartmatch/clauses'] });
      toast({
        title: "Sample Clauses Created",
        description: "Added sample clause templates for testing",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !file) {
      toast({
        title: "Input Required",
        description: "Please enter a query or upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await smartMatchMutation.mutateAsync({ query, model: selectedModel, file: file || undefined });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const result = smartMatchMutation.data as SmartMatchResponse | undefined;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          SmartMatch Engine
        </h1>
        <p className="text-gray-400">
          Intelligently match your queries to relevant clause templates using AI-powered vector embeddings
        </p>
      </div>

      {/* Query Input Section */}
      <Card className="mb-8 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Query Input
          </CardTitle>
          <CardDescription>
            Enter your question or upload a PDF file to find matching clauses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="query">Text Query</Label>
                <Textarea
                  id="query"
                  placeholder="e.g., Does your company have ISO27001 certification?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={4}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="file">Or Upload PDF</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="bg-gray-800 border-gray-700"
                />
                {file && (
                  <p className="text-sm text-gray-400 mt-1">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                    <SelectItem value="claude" disabled>Claude (Coming Soon)</SelectItem>
                    <SelectItem value="gemini" disabled>Gemini (Coming Soon)</SelectItem>
                    <SelectItem value="deepseek" disabled>DeepSeek (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1" />
              
              <Button 
                type="submit" 
                disabled={isProcessing || smartMatchMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Clauses
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card className="mb-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              SmartMatch Results
            </CardTitle>
            <CardDescription>
              Found {result.matches.length} matching clauses • Processed in {result.processingTime}ms using {result.model}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.matches.map((match, index) => (
                <div key={match.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{match.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-gray-700 border-gray-600">
                            {match.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <ThumbsUp className="h-3 w-3" />
                            {match.usageCount} uses
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {Math.round(match.similarityScore * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">similarity</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Progress value={match.similarityScore * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-blue-400 mb-1">Explanation</h4>
                      <p className="text-gray-300 text-sm">{match.explanation}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-blue-400 mb-1">Clause Content</h4>
                      <p className="text-gray-300 text-sm bg-gray-900 p-3 rounded border border-gray-700">
                        {match.body}
                      </p>
                    </div>
                    
                    {match.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-400 mb-1">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {match.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="bg-gray-700 text-gray-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clause Templates Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Clause Templates
          </CardTitle>
          <CardDescription>
            Manage your clause templates for SmartMatch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clausesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading clause templates...</p>
            </div>
          ) : !clauses || clauses.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No clause templates found</p>
              <Button 
                onClick={() => createSampleClausesMutation.mutate()}
                disabled={createSampleClausesMutation.isPending}
                variant="outline"
                className="border-gray-700"
              >
                Create Sample Clauses
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clauses.map((clause: any) => (
                <div key={clause.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{clause.title}</h3>
                    <Badge variant="outline" className="bg-gray-700 border-gray-600 text-xs">
                      {clause.category}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-3">
                    {clause.body}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {clause.usageCount} uses
                    </div>
                    <div>
                      {clause.tags?.length || 0} tags
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}