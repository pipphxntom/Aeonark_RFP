import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "@/components/Logo";
import { Mail, ArrowRight, RefreshCw, Shield } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const otpSchema = z.object({
  otp: z.string().min(6, "Please enter the 6-digit code").max(6, "Please enter the 6-digit code"),
});

type EmailForm = z.infer<typeof emailSchema>;
type OTPForm = z.infer<typeof otpSchema>;

export default function Auth() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const { toast } = useToast();
  const otpInputRef = useRef<HTMLInputElement>(null);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
    mode: 'onChange',
  });

  // Focus and clear OTP input when step changes to OTP
  useEffect(() => {
    if (step === 'otp') {
      otpForm.setValue('otp', ''); // Clear the field
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step, otpForm]);

  const sendOTPMutation = useMutation({
    mutationFn: async (data: EmailForm) => {
      return apiRequest('POST', '/api/auth/send-otp', data);
    },
    onSuccess: (response: any) => {
      setEmail(emailForm.getValues('email'));
      setStep('otp');

      // In development, show OTP if email failed
      if (response.otp) {
        setDevOtp(response.otp);
        toast({
          title: "Code Generated!",
          description: `Your verification code is: ${response.otp}`,
        });
      } else {
        toast({
          title: "Code Sent!",
          description: "Please check your email for the 6-digit verification code.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: async (data: OTPForm) => {
      return apiRequest('POST', '/api/auth/verify-otp', {
        email,
        otp: data.otp,
      });
    },
    onSuccess: () => {
      toast({
        title: "Welcome to AeonRFP!",
        description: "Successfully authenticated. Redirecting...",
      });
      // Redirect to dashboard or onboarding
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Invalid Code",
        description: error.message,
        variant: "destructive",
      });
      otpForm.reset();
    },
  });

  const resendCodeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/auth/send-otp', { email });
    },
    onSuccess: () => {
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    },
  });

  const onEmailSubmit = (data: EmailForm) => {
    sendOTPMutation.mutate(data);
  };

  const onOTPSubmit = (data: OTPForm) => {
    verifyOTPMutation.mutate(data);
  };

  const handleBackToEmail = () => {
    setStep('email');
    setEmail('');
    emailForm.reset();
    otpForm.reset();
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3]/10 via-transparent to-[#00B8FF]/10 animate-pulse" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:40px_40px]" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Logo size="lg" className="justify-center" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                {step === 'email' ? 'Welcome to AeonRFP' : 'Verify Your Email'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {step === 'email' 
                  ? 'Enter your email to get started with AI-powered proposal automation'
                  : `We've sent a 6-digit code to ${email}`
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {step === 'email' ? (
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Enter your email"
                                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-[#00FFA3] focus:ring-[#00FFA3]"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={sendOTPMutation.isPending}
                      className="w-full bg-gradient-to-r from-[#00FFC6] to-[#00C0FF] text-white font-semibold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,198,0.3)] transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      {sendOTPMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          Continue with Email
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-white flex items-center justify-center gap-2 mb-4">
                          <Shield className="h-4 w-4 text-[#00FFA3]" />
                          Enter Verification Code
                        </div>
                        <div className="flex justify-center">
                          <input
                            ref={otpInputRef}
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={otpForm.watch('otp')}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              otpForm.setValue('otp', value);
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                              otpForm.setValue('otp', paste);
                            }}
                            autoComplete="one-time-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoFocus
                            className="w-full max-w-xs text-center text-2xl font-mono tracking-widest bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-[#00FFA3] focus:ring-2 focus:ring-[#00FFA3] focus:outline-none rounded-md px-4 py-3"
                          />
                        </div>
                      </div>

                      {/* Development OTP Display */}
                      {devOtp && (
                        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                          <p className="text-sm text-yellow-300 text-center mb-2">
                            <strong>Development Mode:</strong> Your verification code is <span className="font-mono text-[#00FFA3]">{devOtp}</span>
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              otpInputRef.current!.value = devOtp;
                              otpForm.setValue('otp', devOtp);
                            }}
                            className="w-full text-xs bg-yellow-900/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-900/20"
                          >
                            Auto-fill Code
                          </Button>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={verifyOTPMutation.isPending}
                      className="w-full bg-gradient-to-r from-[#00FFC6] to-[#00C0FF] text-white font-semibold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,198,0.3)] transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      {verifyOTPMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify & Continue'
                      )}
                    </Button>

                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-400">
                        Didn't receive the code?
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => resendCodeMutation.mutate()}
                        disabled={resendCodeMutation.isPending}
                        className="text-[#00FFA3] hover:text-[#00FFA3]/80 hover:bg-[#00FFA3]/10"
                      >
                        {resendCodeMutation.isPending ? 'Sending...' : 'Resend Code'}
                      </Button>
                    </div>

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleBackToEmail}
                        className="text-gray-400 hover:text-white hover:bg-gray-800"
                      >
                        ← Back to Email
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-6"
        >
          <p className="text-xs text-gray-500">
            🔒 Your data is protected with enterprise-grade security
          </p>
        </motion.div>
      </div>
    </div>
  );
}