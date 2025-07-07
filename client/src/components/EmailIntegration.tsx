import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailIntegrationProps {
  onClose: () => void;
}

interface IntegrationStatus {
  slack: boolean;
  gmail: boolean;
  outlook: boolean;
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
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    slack: false,
    gmail: false,
    outlook: false
  });
  const [autoCapture, setAutoCapture] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [emailSummaries, setEmailSummaries] = useState<EmailSummary[]>([]);
  const { toast } = useToast();

  const connectIntegration = useMutation({
    mutationFn: async (platform: keyof IntegrationStatus) => {
      setIsConnecting(platform);
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      return apiRequest('POST', `/api/integrations/${platform}/connect`, {});
    },
    onSuccess: (_, platform) => {
      setIntegrations(prev => ({ ...prev, [platform]: true }));
      setIsConnecting(null);
      toast({
        title: "Integration Connected",
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} has been successfully connected.`,
      });
    },
    onError: (error, platform) => {
      setIsConnecting(null);
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${platform}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const fetchEmails = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/integrations/emails/scan', {});
    },
    onSuccess: (data) => {
      setEmailSummaries(data.emails || []);
      toast({
        title: "Emails Scanned",
        description: `Found ${data.emails?.length || 0} potential RFP emails.`,
      });
    },
  });

  const handleConnect = (platform: keyof IntegrationStatus) => {
    if (platform === 'slack') {
      // Redirect to Slack OAuth
      window.open(`/api/integrations/slack/auth`, '_blank');
    } else if (platform === 'gmail') {
      // Redirect to Google OAuth
      window.open(`/api/integrations/gmail/auth`, '_blank');
    } else if (platform === 'outlook') {
      // Redirect to Microsoft OAuth
      window.open(`/api/integrations/outlook/auth`, '_blank');
    }
    connectIntegration.mutate(platform);
  };

  const integrationCards = [
    {
      key: 'slack' as keyof IntegrationStatus,
      title: 'Slack',
      description: 'Monitor channels for RFP discussions and notifications',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      features: ['Channel monitoring', 'Direct message scanning', 'Real-time notifications']
    },
    {
      key: 'gmail' as keyof IntegrationStatus,
      title: 'Gmail',
      description: 'Automatically detect and process RFP emails',
      icon: Mail,
      color: 'from-red-500 to-orange-500',
      features: ['Email scanning', 'Attachment processing', 'Smart categorization']
    },
    {
      key: 'outlook' as keyof IntegrationStatus,
      title: 'Outlook',
      description: 'Enterprise email integration for RFP management',
      icon: Mail,
      color: 'from-blue-500 to-cyan-500',
      features: ['Exchange integration', 'Calendar sync', 'Team collaboration']
    }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-[#0B0B0B] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Email & Communication Integrations
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
                    Automatically scan and simplify complex emails into RFP summaries
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

          {/* Integration cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {integrationCards.map((integration) => {
              const Icon = integration.icon;
              const isConnected = integrations[integration.key];
              const isConnecting = isConnecting === integration.key;

              return (
                <motion.div
                  key={integration.key}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-gray-900/50 border-gray-800 h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${integration.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        {isConnected ? (
                          <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-600 text-gray-400">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Connected
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-white">{integration.title}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {integration.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                            <CheckCircle className="h-3 w-3 text-[#00FFA3]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleConnect(integration.key)}
                        disabled={isConnected || isConnecting}
                        className={`w-full ${
                          isConnected 
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-[#00FFA3] to-[#00B8FF] hover:shadow-lg'
                        }`}
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : isConnected ? (
                          <>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect {integration.title}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Email scanning section */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Recent Email Scans</CardTitle>
                  <CardDescription>
                    Simplified summaries of complex emails automatically detected as potential RFPs
                  </CardDescription>
                </div>
                <Button
                  onClick={() => fetchEmails.mutate()}
                  disabled={fetchEmails.isPending}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  {fetchEmails.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Scan Emails'
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emailSummaries.length > 0 ? (
                <div className="space-y-4">
                  {emailSummaries.map((email) => (
                    <div key={email.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{email.subject}</h4>
                          <p className="text-sm text-gray-400">From: {email.sender}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {email.isRfp && (
                            <Badge className="bg-[#00FFA3]/20 text-[#00FFA3] border-[#00FFA3]/50">
                              RFP Detected
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-gray-600 text-gray-400">
                            {Math.round(email.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">{email.summary}</p>
                      <p className="text-xs text-gray-500 mt-2">{email.timestamp}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No emails scanned yet. Connect an integration and click "Scan Emails" to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}