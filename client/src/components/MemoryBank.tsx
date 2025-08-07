import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  FileText,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Award,
  X,
  Eye,
  Edit,
  Download,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";

interface MemoryBankProps {
  onClose: () => void;
}

export function MemoryBank({ onClose }: MemoryBankProps) {
  const [activeTab, setActiveTab] = useState('proposals');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fetch proposals for memory bank
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ['/api/proposals'],
  });

  // Fetch RFPs that have been used for training
  const { data: trainingRfps = [], isLoading: rfpsLoading } = useQuery({
    queryKey: ['/api/rfps'],
  });

  // Filter and search logic
  const filteredProposals = proposals.filter((proposal: any) => {
    const matchesSearch = !searchQuery || 
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
      proposal.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredRfps = trainingRfps.filter((rfp: any) => {
    const matchesSearch = !searchQuery || 
      rfp.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handleEditProposal = (proposalId: number) => {
    // This would typically navigate to the proposal editor
    console.log('Edit proposal:', proposalId);
  };

  const handleViewProposal = (proposalId: number) => {
    // This would typically open a modal or navigate to view the proposal
    console.log('View proposal:', proposalId);
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
            <Database className="h-10 w-10 text-yellow-400" />
            Memory Bank
          </h1>
          <p className="text-gray-400">Your repository of past proposals and RFPs used for AI training</p>
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

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="glass-morphism">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search proposals, industries, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilter === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('draft')}
                >
                  Drafts
                </Button>
                <Button
                  variant={selectedFilter === 'final' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('final')}
                >
                  Final
                </Button>
                <Button
                  variant={selectedFilter === 'won' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('won')}
                >
                  Won
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-morphism mb-8">
          <TabsTrigger value="proposals" className="data-[state=active]:bg-yellow-600">
            <FileText className="w-4 h-4 mr-2" />
            Past Proposals ({proposals.length})
          </TabsTrigger>
          <TabsTrigger value="training-data" className="data-[state=active]:bg-green-600">
            <Award className="w-4 h-4 mr-2" />
            Training Data ({trainingRfps.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Past Proposals Tab */}
        <TabsContent value="proposals" className="space-y-6">
          {proposalsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="glass-morphism animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-600 rounded mb-4"></div>
                    <div className="h-2 bg-gray-700 rounded mb-2"></div>
                    <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <Card className="glass-morphism">
              <CardContent className="p-12 text-center">
                <Database className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold mb-2 text-gray-400">No Proposals Found</h3>
                <p className="text-gray-500">
                  {searchQuery || selectedFilter !== 'all' 
                    ? "No proposals match your current filters." 
                    : "You haven't created any proposals yet. Start by uploading an RFP!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProposals.map((proposal: any, index: number) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-morphism hover:neon-border transition-all duration-300 group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2 mb-2">
                            {proposal.title || "Untitled Proposal"}
                          </CardTitle>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge 
                              variant={
                                proposal.status === 'won' ? 'default' :
                                proposal.status === 'final' ? 'secondary' :
                                'outline'
                              }
                              className={
                                proposal.status === 'won' ? 'bg-green-600' :
                                proposal.status === 'final' ? 'bg-blue-600' :
                                proposal.status === 'draft' ? 'bg-yellow-600' :
                                'bg-gray-600'
                              }
                            >
                              {proposal.status || 'draft'}
                            </Badge>
                            {proposal.industry && (
                              <Badge variant="outline" className="text-xs">
                                {proposal.industry}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-4 w-4" />
                          Created: {new Date(proposal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {proposal.estimatedValue && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <span className="text-green-400 font-bold">
                            ${parseInt(proposal.estimatedValue).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {proposal.timeline && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400">
                            {proposal.timeline} delivery
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t border-gray-700 group-hover:opacity-100 opacity-70 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProposal(proposal.id)}
                          className="flex-1"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditProposal(proposal.id)}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-3"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Training Data Tab */}
        <TabsContent value="training-data" className="space-y-6">
          <Card className="glass-morphism mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-400" />
                Training Data Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {trainingRfps.filter((rfp: any) => rfp.status === 'analyzed').length}
                  </div>
                  <div className="text-sm text-gray-400">RFPs Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {proposals.filter((p: any) => p.status === 'won').length}
                  </div>
                  <div className="text-sm text-gray-400">Winning Proposals</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {new Set(proposals.map((p: any) => p.industry).filter(Boolean)).size}
                  </div>
                  <div className="text-sm text-gray-400">Industries Covered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">94%</div>
                  <div className="text-sm text-gray-400">Model Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rfpsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="glass-morphism animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-600 rounded mb-4"></div>
                    <div className="h-2 bg-gray-700 rounded mb-2"></div>
                    <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredRfps.length === 0 ? (
              <Card className="glass-morphism col-span-2">
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold mb-2 text-gray-400">No Training Data</h3>
                  <p className="text-gray-500">Upload and analyze RFPs to build your training dataset.</p>
                </CardContent>
              </Card>
            ) : (
              filteredRfps.map((rfp: any, index: number) => (
                <motion.div
                  key={rfp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-morphism hover:border-green-400/50 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-2">
                          {rfp.title}
                        </CardTitle>
                        {rfp.status === 'analyzed' ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Status:</span>
                        <Badge 
                          variant={rfp.status === 'analyzed' ? 'default' : 'secondary'}
                          className={rfp.status === 'analyzed' ? 'bg-green-600' : 'bg-yellow-600'}
                        >
                          {rfp.status || 'uploaded'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">File Size:</span>
                        <span>{Math.round((rfp.fileSize || 0) / 1024)} KB</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Uploaded:</span>
                        <span>{new Date(rfp.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {rfp.extractedText && (
                        <div className="pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-400 mb-1">Extracted Content Preview:</p>
                          <p className="text-sm line-clamp-3">{rfp.extractedText}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-morphism">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                <div className="text-2xl font-bold mb-1">{proposals.length}</div>
                <div className="text-sm text-gray-400">Total Proposals</div>
              </CardContent>
            </Card>
            
            <Card className="glass-morphism">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-3 text-green-400" />
                <div className="text-2xl font-bold mb-1">
                  {proposals.length > 0 ? Math.round((proposals.filter((p: any) => p.status === 'won').length / proposals.length) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-400">Win Rate</div>
              </CardContent>
            </Card>
            
            <Card className="glass-morphism">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-3 text-purple-400" />
                <div className="text-2xl font-bold mb-1">2.3 days</div>
                <div className="text-sm text-gray-400">Avg Response Time</div>
              </CardContent>
            </Card>
            
            <Card className="glass-morphism">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-3 text-yellow-400" />
                <div className="text-2xl font-bold mb-1">
                  ${ 
                    proposals
                      .filter((p: any) => p.estimatedValue)
                      .reduce((sum: number, p: any) => sum + parseInt(p.estimatedValue || 0), 0)
                      .toLocaleString()
                  }
                </div>
                <div className="text-sm text-gray-400">Total Value</div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Memory Bank Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chart visualization would be implemented here</p>
                  <p className="text-sm">Showing proposal creation and success rates over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}