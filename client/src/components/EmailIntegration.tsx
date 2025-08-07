import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageSquare, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { SiSlack, SiGmail } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailIntegrationProps {
  onClose: () => void;
}

interface IntegrationStatus {
  gmail: {
    connected: boolean;
    email?: string;
    configured: boolean;
  };
  slack: {
    connected: boolean;
    team?: string;
    configured: boolean;
  };
}

interface EmailSummary {
  id: string;
  subject: string;
  sender: string;
  summary: string;
  isRfp: boolean;
  confidence: number;
  timestamp: string;
}

export function EmailIntegration({ onClose }: EmailIntegrationProps) {
  const [autoCapture, setAutoCapture] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [emailSummaries, setEmailSummaries] = useState<EmailSummary[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch OAuth status
  const { data: integrations, isLoading } = useQuery<IntegrationStatus>({
    queryKey: ["/api/oauth/status"],
  });

  // Connect to OAuth provider
  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", "/api/oauth/connect", { provider });
      return response.json();
    },
    onSuccess: (data, provider) => {
      // Open OAuth URL in new window
      const authWindow = window.open(data.authUrl, '_blank', 'width=600,height=700');
      
      // Listen for OAuth completion
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(null);
          // Refresh status after a short delay
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/oauth/status"] });
          }, 1000);
        }
      }, 1000);
    },
    onError: (error: any) => {
      console.error("OAuth connection error:", error);
      setIsConnecting(null);
      
      // Handle specific error cases
      if (error?.message?.includes('not configured')) {
        toast({
          title: "OAuth Not Configured",
          description: error.message || "Please configure OAuth credentials in Replit Secrets.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to the service. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Disconnect OAuth provider
  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("DELETE", `/api/oauth/disconnect/${provider}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oauth/status"] });
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from the service.",
      });
    },
    onError: (error) => {
      console.error("OAuth disconnect error:", error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from the service.",
        variant: "destructive"
      });
    }
  });

  // Handle OAuth connection result from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (connected) {
      toast({
        title: "Connected!",
        description: `Successfully connected to ${connected}.`,
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      queryClient.invalidateQueries({ queryKey: ["/api/oauth/status"] });
    }
    
    if (error === 'oauth_failed') {
      toast({
        title: "Connection Failed",
        description: "OAuth authentication failed. Please try again.",
        variant: "destructive"
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, queryClient]);

  const handleConnect = (platform: string) => {
    setIsConnecting(platform);
    connectMutation.mutate(platform);
  };

  const handleDisconnect = (platform: string) => {
    disconnectMutation.mutate(platform);
  };

  // Gmail email fetching
  const fetchEmails = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/gmail/emails');
      return response.json();
    },
    onSuccess: (data) => {
      setEmailSummaries(data.emails || []);
      toast({
        title: "Gmail Emails Loaded",
        description: `Found ${data.emails?.length || 0} emails with attachments.`,
      });
    },
    onError: (error) => {
      console.error("Error fetching Gmail emails:", error);
      toast({
        title: "Gmail Fetch Failed",
        description: "Unable to load emails from Gmail. Please check your connection.",
        variant: "destructive"
      });
    }
  });

  // Generate email summary
  const generateSummary = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("POST", `/api/gmail/emails/${messageId}/summary`);
      return response.json();
    },
    onSuccess: (data) => {
      // Update the specific email in the list
      setEmailSummaries(prev => 
        prev.map(email => 
          email.id === data.id 
            ? { ...email, summary: data.summary, isRfp: data.isRfp, confidence: data.confidence }
            : email
        )
      );
      toast({
        title: "Summary Generated",
        description: "Email summary updated with AI analysis.",
      });
    },
    onError: (error) => {
      console.error("Error generating summary:", error);
      toast({
        title: "Summary Failed",
        description: "Unable to generate email summary.",
        variant: "destructive"
      });
    }
  });

  // Create RFP from email
  const createRfpFromEmail = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("POST", `/api/gmail/emails/${messageId}/create-rfp`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
      toast({
        title: "RFP Created",
        description: "Successfully created RFP from email attachments.",
      });
    },
    onError: (error) => {
      console.error("Error creating RFP:", error);
      toast({
        title: "RFP Creation Failed",
        description: "Unable to create RFP from email. Check if valid documents are attached.",
        variant: "destructive"
      });
    }
  });

  const integrationCards = [
    {
      key: 'slack',
      title: 'Slack',
      description: 'Monitor channels for RFP discussions and notifications',
      icon: SiSlack,
      color: 'from-purple-500 to-pink-500',
      features: ['Channel monitoring', 'Direct message scanning', 'Real-time notifications']
    },
    {
      key: 'gmail',
      title: 'Gmail',
      description: 'Automatically detect and process RFP emails',
      icon: SiGmail,
      color: 'from-red-500 to-orange-500',
      features: ['Smart RFP detection', 'Attachment processing', 'Auto-categorization']
    },
    {
      key: 'outlook',
      title: 'Outlook',
      description: 'Enterprise email integration for RFP management',
      icon: Mail,
      color: 'from-blue-500 to-cyan-500',
      features: ['Exchange integration', 'Calendar sync', 'Team collaboration'],
      comingSoon: true
    }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-[#0B0B0B] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Integrations
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect your email and messaging platforms to automatically capture and process RFPs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Auto-capture toggle */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#00FFA3]" />
                    Auto-Capture RFPs
                  </CardTitle>
                  <CardDescription>
                    Automatically scan connected platforms for new RFPs and notifications
                  </CardDescription>
                </div>
                <Switch 
                  checked={autoCapture} 
                  onCheckedChange={setAutoCapture}
                  className="data-[state=checked]:bg-[#00FFA3]"
                />
              </div>
            </CardHeader>
          </Card>

          {/* Integration Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrationCards.map((integration) => {
              const Icon = integration.icon;
              const isConnected = integration.key === 'gmail' 
                ? integrations?.gmail?.connected 
                : integration.key === 'slack' 
                  ? integrations?.slack?.connected 
                  : false;
              const isConfigured = integration.key === 'gmail' 
                ? integrations?.gmail?.configured !== false
                : integration.key === 'slack' 
                  ? integrations?.slack?.configured !== false
                  : true;
              const isConnectingThis = isConnecting === integration.key;
              const isComingSoon = integration.comingSoon;

              return (
                <motion.div
                  key={integration.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: integrationCards.indexOf(integration) * 0.1 }}
                >
                  <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-600 transition-all h-full">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${integration.color} bg-opacity-20`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        {isConnected ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : isComingSoon ? (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Coming Soon
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-600 text-gray-400">
                            Disconnected
                          </Badge>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-white">{integration.title}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {integration.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                            <CheckCircle className="h-3 w-3 text-[#00FFA3]" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      
                      {isComingSoon ? (
                        <Button disabled className="w-full">
                          Coming Soon
                        </Button>
                      ) : isConnected ? (
                        <div className="space-y-2">
                          {integration.key === 'gmail' && integrations?.gmail?.email && (
                            <p className="text-xs text-gray-400">
                              Connected as: {integrations.gmail.email}
                            </p>
                          )}
                          {integration.key === 'slack' && integrations?.slack?.team && (
                            <p className="text-xs text-gray-400">
                              Team: {integrations.slack.team}
                            </p>
                          )}
                          <Button 
                            variant="outline" 
                            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDisconnect(integration.key)}
                            disabled={disconnectMutation.isPending}
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {!isConfigured ? (
                            <div className="text-center space-y-2">
                              <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                Not Configured
                              </Badge>
                              <p className="text-xs text-gray-400">
                                OAuth credentials not set. Add {integration.key === 'gmail' ? 'GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET' : 'SLACK_CLIENT_ID & SLACK_CLIENT_SECRET'} to Replit Secrets.
                              </p>
                            </div>
                          ) : (
                            <Button 
                              className="w-full bg-gradient-to-r from-[#00FFA3] to-[#00D4FF] text-black font-medium hover:from-[#00D4FF] hover:to-[#00FFA3]"
                              onClick={() => handleConnect(integration.key)}
                              disabled={isConnectingThis || connectMutation.isPending}
                            >
                              {isConnectingThis ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Connect
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Gmail Email Display Section */}
          {integrations?.gmail?.connected && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <SiGmail className="h-5 w-5 text-[#00FFA3]" />
                      Gmail Inbox - Emails with Attachments
                    </CardTitle>
                    <CardDescription>
                      Recent emails from your Gmail inbox containing attachments
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchEmails.mutate()}
                    disabled={fetchEmails.isPending}
                    className="border-[#00FFA3]/30 text-[#00FFA3] hover:bg-[#00FFA3]/10"
                  >
                    {fetchEmails.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load Emails
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fetchEmails.isPending ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00FFA3]" />
                    <p className="text-gray-400">Loading emails from Gmail...</p>
                  </div>
                ) : emailSummaries.length > 0 ? (
                  <div className="space-y-4">
                    {emailSummaries.map((email) => (
                      <motion.div 
                        key={email.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-600/50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-white text-sm truncate">{email.subject}</h4>
                              {email.isRfp && (
                                <Badge className="bg-[#00FFA3]/20 text-[#00FFA3] border-[#00FFA3]/30 text-xs">
                                  RFP Detected ({Math.round(email.confidence * 100)}%)
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                                {email.attachmentCount} attachment{email.attachmentCount !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="space-y-1 mb-3">
                              <p className="text-xs text-gray-400">
                                <strong>From:</strong> {email.sender} ({email.senderEmail})
                              </p>
                              <p className="text-xs text-gray-400">
                                <strong>Time:</strong> {email.timestamp}
                              </p>
                              {email.attachments.length > 0 && (
                                <p className="text-xs text-gray-300">
                                  <strong>Attachments:</strong> {email.attachments.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700/30">
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {email.summary || email.snippet}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-700/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateSummary.mutate(email.id)}
                            disabled={generateSummary.isPending}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          >
                            {generateSummary.isPending ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                            ) : (
                              <MessageSquare className="h-3 w-3 mr-2" />
                            )}
                            Update Summary
                          </Button>
                          
                          {email.attachmentCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createRfpFromEmail.mutate(email.id)}
                              disabled={createRfpFromEmail.isPending}
                              className="border-[#00FFA3]/30 text-[#00FFA3] hover:bg-[#00FFA3]/10"
                            >
                              {createRfpFromEmail.isPending ? (
                                <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                              ) : (
                                <Zap className="h-3 w-3 mr-2" />
                              )}
                              Load for SmartMatch
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No emails with attachments found</p>
                    <p className="text-sm">Click "Load Emails" to fetch recent messages from your Gmail inbox</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Auto-capture Status */}
          {integrations?.gmail?.connected && autoCapture && (
            <Card className="bg-gradient-to-r from-[#00FFA3]/10 to-[#00D4FF]/10 border-[#00FFA3]/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="animate-pulse">
                    <div className="w-3 h-3 bg-[#00FFA3] rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-[#00FFA3] font-medium">Auto-Capture Active</p>
                    <p className="text-sm text-gray-300">
                      Automatically scanning Gmail for new RFPs every 15 minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}