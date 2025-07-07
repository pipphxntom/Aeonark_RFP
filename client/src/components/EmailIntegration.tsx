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
  };
  slack: {
    connected: boolean;
    team?: string;
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
      const response = await apiRequest(`/api/oauth/connect`, {
        method: "POST",
        body: { provider }
      });
      return response;
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
    onError: (error) => {
      console.error("OAuth connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to the service. Please try again.",
        variant: "destructive"
      });
      setIsConnecting(null);
    }
  });

  // Disconnect OAuth provider
  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      return await apiRequest(`/api/oauth/disconnect/${provider}`, {
        method: "DELETE"
      });
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

  const fetchEmails = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/integrations/emails/scan', {
        method: 'GET'
      });
    },
    onSuccess: (data) => {
      setEmailSummaries(data.emails || []);
      toast({
        title: "Emails Scanned",
        description: `Found ${data.emails?.length || 0} potential RFP emails.`,
      });
    },
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
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Email Monitoring Section */}
          {(integrations?.gmail?.connected || integrations?.slack?.connected) && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="h-5 w-5 text-[#00FFA3]" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest emails and messages scanned for RFP content
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
                        Scan Now
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {emailSummaries.length > 0 ? (
                  <div className="space-y-3">
                    {emailSummaries.map((email) => (
                      <div key={email.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white text-sm">{email.subject}</h4>
                            {email.isRfp && (
                              <Badge className="bg-[#00FFA3]/20 text-[#00FFA3] border-[#00FFA3]/30 text-xs">
                                RFP Detected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">From: {email.sender}</p>
                          <p className="text-xs text-gray-300 mt-1">{email.summary}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">{email.timestamp}</div>
                          <div className="text-xs text-[#00FFA3] mt-1">
                            {email.confidence}% confidence
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity to display</p>
                    <p className="text-sm">Connect your platforms and scan for RFPs</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}