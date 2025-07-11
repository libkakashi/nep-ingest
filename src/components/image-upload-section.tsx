'use client';

import React, {useState} from 'react';
import {Loader2, Sparkles} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {Card, CardContent} from '~/components/ui/card';
import {FileUpload} from '~/components/file-upload';

interface ImageUploadSectionProps {
  onImagesProcess: (files: File[]) => Promise<void>;
  isProcessing?: boolean;
  disabled?: boolean;
}

export function ImageUploadSection({
  onImagesProcess,
  disabled = false,
}: ImageUploadSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
    setProcessingError(null);
  };

  const handleProcessImages = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);

    try {
      setProcessingError(null);
      await onImagesProcess(selectedFiles);
    } catch (error) {
      setProcessingError('Failed to process images. Please try again.');
      console.error('Error processing images:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            <FileUpload
              onFilesChange={handleFilesChange}
              accept="image/*"
              multiple={true}
              disabled={disabled || isProcessing}
              className="w-full"
            />

            {selectedFiles.length > 0 && (
              <div className="flex justify-center">
                <Button
                  onClick={handleProcessImages}
                  disabled={isProcessing || selectedFiles.length === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Images...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analyze {selectedFiles.length} Image
                      {selectedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {processingError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <p className="text-sm text-red-600">{processingError}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
