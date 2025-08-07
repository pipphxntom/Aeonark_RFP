import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Target,
  Clock,
  DollarSign,
  Mail,
  MessageSquare,
  Award,
  Brain,
  Filter,
  Calendar,
  Users,
  Zap,
  Activity
} from "lucide-react";

interface AnalyticsData {
  totalProposals: number;
  winRate: number;
  avgScore: number;
  timeSaved: number;
}

interface TimelineData {
  date: string;
  proposals: number;
  turnaroundTime: number;
}

interface IndustryData {
  name: string;
  value: number;
  outcome: string;
  color: string;
}

interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d");

  // Fetch real analytics summary
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/summary"],
  });

  // Fetch timeline data for charts
  const { data: timelineData = [] } = useQuery<TimelineData[]>({
    queryKey: ["/api/analytics/timeline", timeRange],
  });

  // Mock data for demonstration - replace with real API calls
  const industryData: IndustryData[] = [
    { name: "Technology", value: 35, outcome: "won", color: "#00D4FF" },
    { name: "Healthcare", value: 28, outcome: "submitted", color: "#FF6B6B" },
    { name: "Finance", value: 22, outcome: "draft", color: "#4ECDC4" },
    { name: "Education", value: 15, outcome: "rejected", color: "#45B7D1" }
  ];

  const funnelData: FunnelData[] = [
    { name: "Uploaded", value: 100, fill: "#00D4FF" },
    { name: "Drafted", value: 85, fill: "#4ECDC4" },
    { name: "Submitted", value: 65, fill: "#FFE66D" },
    { name: "Won", value: 32, fill: "#FF6B6B" }
  ];

  const topClauses = [
    { name: "Standard Legal Terms", usage: 95, winRate: 78 },
    { name: "Payment Terms - Net 30", usage: 87, winRate: 82 },
    { name: "Scope Definition Template", usage: 76, winRate: 74 },
    { name: "Risk Mitigation Clause", usage: 68, winRate: 86 },
    { name: "IP Protection Standard", usage: 55, winRate: 91 }
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-3 animate-pulse text-cyan-400" />
          <div className="text-xl text-gray-400">Loading analytics dashboard...</div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!analytics?.hasData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">No Analytics Data Yet</h2>
            <p className="text-gray-500">Upload and analyze RFPs to see your performance metrics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ 
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              textShadow: "0 0 30px rgba(34, 211, 238, 0.4)" 
            }}>
              Mission Control Dashboard
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-cyan-500 to-blue-500 rounded mb-4"></div>
            <p className="text-gray-400">Your RFP automation command center</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Connect Gmail
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Connect Slack
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              {timeRange}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-cyan-500/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold mb-1">{analytics?.totalProposals || 0}</p>
            <p className="text-sm text-gray-400">Proposals Sent</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-green-500/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold mb-1">{analytics?.winRate || 0}%</p>
            <p className="text-sm text-gray-400">Win Rate</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-500/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold mb-1">{analytics?.avgScore || 0}</p>
            <p className="text-sm text-gray-400">Avg Match Score</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-yellow-500/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold mb-1">{analytics?.timeSaved || 0}h</p>
            <p className="text-sm text-gray-400">Time Saved</p>
          </div>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Timeline Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-cyan-400">Draft Turnaround Time</h3>
              <div className="text-sm text-gray-400">Last 30 days</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="turnaroundTime"
                  stroke="#00D4FF"
                  fill="url(#gradientCyan)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="gradientCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Industry Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-cyan-400">RFPs by Industry</h3>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  stroke="#1F2937"
                  strokeWidth={2}
                >
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {industryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-400">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Win Funnel and Memory Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Win Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-cyan-400">Conversion Funnel</h3>
            </div>
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={stage.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{stage.name}</span>
                    <span className="text-sm text-gray-400">{stage.value}%</span>
                  </div>
                  <Progress 
                    value={stage.value} 
                    className="h-3"
                    style={{ 
                      backgroundColor: '#374151',
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top Clause Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <div className="flex items-center space-x-2 mb-6">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-purple-400">Smart Reuse Heatmap</h3>
            </div>
            <div className="space-y-4">
              {topClauses.map((clause, index) => (
                <motion.div
                  key={clause.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-200">{clause.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {clause.winRate}% win rate
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Progress value={clause.usage} className="h-2" />
                    </div>
                    <span className="text-xs text-gray-400">Used {clause.usage}x</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-cyan-400">Next Best Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-cyan-600 hover:bg-cyan-700 text-white justify-start h-auto p-4"
            >
              <FileText className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Upload New RFP</div>
                <div className="text-sm opacity-80">Start your next proposal</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="border-gray-600 hover:border-purple-500 justify-start h-auto p-4"
            >
              <Brain className="w-5 h-5 mr-3 text-purple-400" />
              <div className="text-left">
                <div className="font-medium">Review Memory Bank</div>
                <div className="text-sm opacity-80">Optimize clause library</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="border-gray-600 hover:border-green-500 justify-start h-auto p-4"
            >
              <Mail className="w-5 h-5 mr-3 text-green-400" />
              <div className="text-left">
                <div className="font-medium">Connect Email</div>
                <div className="text-sm opacity-80">Auto-capture RFPs</div>
              </div>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}