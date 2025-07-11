'use client';

import React, {useCallback, useState} from 'react';
import {Upload, AlertCircle} from 'lucide-react';
import {Button} from './ui/button';
import {Card, CardContent} from './ui/card';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  showPreviews?: boolean;
}

export function FileUpload({
  onFilesChange,
  accept = 'image/*',
  multiple = true,
  maxFiles = 100,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className = '',
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File ${file.name} is too large. Maximum size is ${formatFileSize(maxFileSize)}.`;
    }

    if (accept && !accept.includes('*')) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      if (!acceptedTypes.some(type => file.type.match(type))) {
        return `File ${file.name} is not an accepted file type.`;
      }
    }
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = async (newFiles: File[]) => {
    setError(null);

    for (const file of newFiles) {
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }
    }
    if (files.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      void processFiles(droppedFiles);
    },
    [disabled, files, maxFiles, maxFileSize],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setDragActive(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    void processFiles(selectedFiles);
    e.target.value = ''; // Reset input
  };

  const clearAll = () => {
    setFiles([]);
    onFilesChange([]);
    setError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {files.length === 0 && (
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() =>
            !disabled && document.getElementById('file-input')?.click()
          }
        >
          <input
            id="file-input"
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-4">
            <div
              className={`rounded-full p-4 ${dragActive ? 'bg-blue-100' : 'bg-gray-100'} `}
            >
              <Upload
                className={`h-8 w-8 ${dragActive ? 'text-blue-500' : 'text-gray-400'} `}
              />
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {dragActive ? 'Drop files here' : 'Upload files'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Max {maxFiles} files, {formatFileSize(maxFileSize)} each
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Selected Files ({files.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
