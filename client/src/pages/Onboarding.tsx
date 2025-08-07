import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Laptop, 
  Scale, 
  Handshake, 
  Heart, 
  Factory, 
  MoreHorizontal,
  ArrowRight,
  Users,
  Building,
  Palette
} from "lucide-react";

const industries = [
  { value: 'saas', label: 'SaaS', icon: Laptop },
  { value: 'legal', label: 'Legal', icon: Scale },
  { value: 'consulting', label: 'Consulting', icon: Handshake },
  { value: 'ngo', label: 'NGO', icon: Heart },
  { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

const companySizes = [
  { value: 'startup', label: '1-10 employees' },
  { value: 'small', label: '11-50 employees' },
  { value: 'medium', label: '51-200 employees' },
  { value: 'large', label: '201-1000 employees' },
  { value: 'enterprise', label: '1000+ employees' },
];

const services = [
  'Software Development',
  'Consulting Services',
  'Digital Marketing',
  'Cloud Infrastructure',
  'Data Analytics',
  'Cybersecurity',
  'Training & Education',
  'Project Management',
  'Legal Services',
  'Financial Services',
];

const tonePreferences = [
  { value: 'formal', label: 'Formal & Professional' },
  { value: 'conversational', label: 'Conversational & Friendly' },
  { value: 'assertive', label: 'Assertive & Confident' },
  { value: 'technical', label: 'Technical & Detailed' },
];

const onboardingSchema = z.object({
  industry: z.string().min(1, "Please select an industry"),
  companySize: z.string().min(1, "Please select company size"),
  servicesOffered: z.array(z.string()).min(1, "Please select at least one service"),
  tonePreference: z.string().min(1, "Please select a tone preference"),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  
  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      industry: '',
      companySize: '',
      servicesOffered: [],
      tonePreference: '',
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingForm) => {
      await apiRequest('POST', '/api/onboarding', data);
    },
    onSuccess: () => {
      toast({
        title: "Setup Complete!",
        description: "Your RFP Engine has been calibrated successfully.",
      });
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OnboardingForm) => {
    onboardingMutation.mutate(data);
  };

  const nextStep = () => {
    const currentValues = form.getValues();
    let canProceed = false;

    switch (currentStep) {
      case 1:
        canProceed = !!currentValues.industry;
        break;
      case 2:
        canProceed = !!currentValues.companySize;
        break;
      case 3:
        canProceed = currentValues.servicesOffered.length > 0;
        break;
      case 4:
        canProceed = !!currentValues.tonePreference;
        break;
    }

    if (canProceed) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        form.handleSubmit(onSubmit)();
      }
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-deep-black flex items-center justify-center px-4" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="max-w-2xl w-full">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 700 }}>
            Let's calibrate your RFP Engine
          </h1>
          <ProgressBar value={progress} className="mb-8" />
        </motion.div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Industry */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="glass-morphism neon-border">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 600 }}>
                      <Building className="mr-2 h-6 w-6 text-neon-cyan" />
                      What's your industry?
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {industries.map((industry) => {
                                const Icon = industry.icon;
                                return (
                                  <motion.div
                                    key={industry.value}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      type="button"
                                      variant={field.value === industry.value ? "default" : "outline"}
                                      className={`h-20 w-full flex flex-col items-center justify-center space-y-2 ${
                                        field.value === industry.value 
                                          ? 'border-neon-green bg-neon-green/10' 
                                          : 'border-gray-600 hover:border-neon-green'
                                      }`}
                                      onClick={() => field.onChange(industry.value)}
                                    >
                                      <Icon className="h-6 w-6 text-neon-cyan" />
                                      <span className="text-sm" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 500 }}>{industry.label}</span>
                                    </Button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Company Size */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="glass-morphism neon-border">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 600 }}>
                      <Users className="mr-2 h-6 w-6 text-neon-cyan" />
                      What's your company size?
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-3">
                              {companySizes.map((size) => (
                                <motion.div
                                  key={size.value}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    type="button"
                                    variant={field.value === size.value ? "default" : "outline"}
                                    className={`w-full h-12 justify-start ${
                                      field.value === size.value 
                                        ? 'border-neon-green bg-neon-green/10' 
                                        : 'border-gray-600 hover:border-neon-green'
                                    }`}
                                    onClick={() => field.onChange(size.value)}
                                  >
                                    <span style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 500 }}>{size.label}</span>
                                  </Button>
                                </motion.div>
                              ))}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Services */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="glass-morphism neon-border">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 600 }}>
                      <Handshake className="mr-2 h-6 w-6 text-neon-cyan" />
                      What services do you offer?
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="servicesOffered"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {services.map((service) => (
                                <motion.div
                                  key={service}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <label className="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg hover:border-neon-green transition-colors cursor-pointer">
                                    <Checkbox
                                      checked={field.value.includes(service)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, service]);
                                        } else {
                                          field.onChange(field.value.filter(s => s !== service));
                                        }
                                      }}
                                    />
                                    <span className="text-sm">{service}</span>
                                  </label>
                                </motion.div>
                              ))}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Tone Preference */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="glass-morphism neon-border">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 600 }}>
                      <Palette className="mr-2 h-6 w-6 text-neon-cyan" />
                      What's your preferred tone?
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="tonePreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-3">
                              {tonePreferences.map((tone) => (
                                <motion.div
                                  key={tone.value}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    type="button"
                                    variant={field.value === tone.value ? "default" : "outline"}
                                    className={`w-full h-12 justify-start ${
                                      field.value === tone.value 
                                        ? 'border-neon-green bg-neon-green/10' 
                                        : 'border-gray-600 hover:border-neon-green'
                                    }`}
                                    onClick={() => field.onChange(tone.value)}
                                  >
                                    <span style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 500 }}>{tone.label}</span>
                                  </Button>
                                </motion.div>
                              ))}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Next Button */}
            <motion.div 
              className="text-center mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                type="button"
                onClick={nextStep}
                disabled={onboardingMutation.isPending}
                className="bg-neon-green text-black px-8 py-3 rounded-lg font-bold hover:animate-glow transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                {onboardingMutation.isPending ? (
                  <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2" />
                ) : null}
                <span style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 700 }}>
                  {currentStep === 4 ? 'Finish Setup & Launch Dashboard' : 'Next Step'}
                </span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>
    </div>
  );
}
