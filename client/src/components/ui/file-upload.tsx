import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/rfps/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Your RFP has been uploaded and is ready for analysis.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rfps'] });
      setUploadProgress(0);
      onUploadSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <motion.div
        {...getRootProps()}
        className={`upload-zone border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive 
            ? 'border-neon-green bg-neon-green/5' 
            : isDragReject
            ? 'border-red-500 bg-red-500/5'
            : 'border-gray-600 hover:border-neon-green'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <motion.div
            animate={{ 
              scale: isDragActive ? 1.1 : 1,
              color: isDragActive ? 'var(--neon-green)' : undefined
            }}
            transition={{ duration: 0.2 }}
          >
            <Upload className="h-16 w-16 mx-auto text-gray-400" />
          </motion.div>
          
          <div>
            <h3 className="text-xl font-bold mb-2">
              {isDragActive 
                ? 'Drop your RFP file here!' 
                : 'Drag & Drop RFP File'}
            </h3>
            <p className="text-gray-400 mb-4">
              Supports PDF, DOCX files up to 50MB
            </p>
            <Button 
              type="button"
              className="bg-neon-green text-black hover:bg-neon-green/90"
              disabled={uploadMutation.isPending}
            >
              Browse Files
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Upload Progress */}
      {uploadMutation.isPending && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div 
              className="bg-neon-green h-2 rounded-full progress-glow"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Success State */}
      {uploadMutation.isSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center space-x-2 text-neon-green"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Upload completed successfully!</span>
        </motion.div>
      )}

      {/* Alternative Upload Methods */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-deep-black px-2 text-gray-400">Or import from</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="w-full bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
            disabled
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            </svg>
            Import from Gmail
            <span className="ml-2 text-xs opacity-70">(Coming Soon)</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full bg-purple-600 border-purple-600 text-white hover:bg-purple-700"
            disabled
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 0 2.5 2.5c1.638 0 2.676-1.276 2.676-2.749 0-1.473-1.038-2.749-2.676-2.749s-2.5 1.128-2.5 2.5v.498z"/>
              <path d="M18.972 14.814a2.5 2.5 0 0 0-2.5-2.5c-1.638 0-2.676 1.276-2.676 2.749s1.038 2.749 2.676 2.749c1.638 0 2.5-1.128 2.5-2.5v-.498z"/>
            </svg>
            Connect Slack Channel
            <span className="ml-2 text-xs opacity-70">(Coming Soon)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
