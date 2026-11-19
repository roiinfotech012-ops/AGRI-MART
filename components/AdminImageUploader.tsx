'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw, X, FileText, Eye } from 'lucide-react';

function UploadIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CloudUploadIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

interface AdminImageUploaderProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  placeholder?: string;
  helpText?: string;
  compact?: boolean;
  accept?: string;
  aspect?: 'square' | 'video' | 'banner' | 'auto';
}

export function AdminImageUploader({
  label,
  value,
  onChange,
  folder = 'general',
  placeholder = 'No file selected',
  helpText,
  compact = false,
  accept = 'image/*',
  aspect = 'auto',
}: AdminImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isPdfAccept = accept.includes('pdf');
  const isPdf = value && (value.endsWith('.pdf') || value.includes('application/pdf') || isPdfAccept);

  useEffect(() => {
    if (!value || isPdf) {
      setImageDims(null);
      return;
    }
    let active = true;
    const probe = new window.Image();
    probe.onload = () => {
      if (active) setImageDims({ w: probe.naturalWidth, h: probe.naturalHeight });
    };
    probe.onerror = () => {
      if (active) setImageDims(null);
    };
    probe.src = value;
    return () => {
      active = false;
    };
  }, [value, isPdf]);

  // Upload the exact original file bytes with zero canvas resizing, zero compression, and zero blur
  const uploadFile = async (rawFile: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', rawFile);
      formData.append('folder', folder);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
      } else {
        alert(data.error || 'Failed to upload file. Please try again.');
      }
    } catch (err: any) {
      alert('Error uploading file: ' + (err.message || 'Network error'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-1.5 w-full min-w-0">
      {label && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <label className="block text-xs font-bold text-gray-800 truncate">{label}</label>
            {!isPdf && value && imageDims && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                {imageDims.w}×{imageDims.h}px
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[10px] text-gray-400 hover:text-emerald-700 underline cursor-pointer shrink-0"
          >
            {showManualInput ? 'Hide URL' : 'Edit URL'}
          </button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex items-center gap-3 bg-gray-50 border rounded-lg transition-colors overflow-hidden ${
          isDragOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200'
        } ${compact ? 'p-2' : 'p-2.5'}`}
      >
        {/* Preview Container */}
        <div
          onClick={() => (value && !isPdf ? setShowLightbox(true) : fileInputRef.current?.click())}
          title={value && !isPdf ? 'Click to preview full original image' : 'Click to upload file'}
          className={`relative bg-white rounded border border-gray-300 overflow-hidden shrink-0 cursor-pointer group hover:border-emerald-500 transition-colors ${
            compact ? 'w-14 h-14' : aspect === 'banner' ? 'w-28 h-16' : 'w-16 h-16'
          }`}
        >
          {value ? (
            isPdf ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600 p-1">
                <FileText className="w-6 h-6" />
                <span className="text-[8px] font-bold mt-0.5 uppercase">PDF</span>
              </div>
            ) : (
              <>
                <Image
                  src={value}
                  alt="Preview"
                  fill
                  unoptimized
                  className="object-contain p-1"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="w-4 h-4 text-white drop-shadow" />
                </div>
              </>
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-emerald-600">
              <UploadIcon className="w-4 h-4" />
              <span className="text-[8px] font-bold mt-0.5">Upload</span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0d9749] hover:bg-[#097b3a] disabled:opacity-60 text-white text-xs font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="w-3.5 h-3.5" />
                  <span>
                    {isPdf
                      ? value
                        ? 'Upload New PDF'
                        : 'Upload PDF'
                      : value
                      ? 'Upload New'
                      : 'Upload Image'}
                  </span>
                </>
              )}
            </button>

            {!isPdf && value && (
              <button
                type="button"
                onClick={() => setShowLightbox(true)}
                className="px-2 py-1 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold rounded border border-emerald-200 transition-colors cursor-pointer"
              >
                Preview
              </button>
            )}

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2 py-1 text-gray-500 hover:text-red-600 text-xs font-semibold rounded hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-[10px] text-gray-500 truncate font-mono">
            {value ? value.split('/').pop() : placeholder}
          </p>

          {showManualInput && (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="/uploads/image.png"
              className="w-full px-2.5 py-1 text-[11px] border border-gray-300 rounded font-mono text-gray-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          )}

          {helpText && <p className="text-[10px] text-gray-400">{helpText}</p>}
        </div>
      </div>

      {/* Full-Screen Exact Original Preview Lightbox */}
      {showLightbox && value && !isPdf && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {imageDims && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                    Original • {imageDims.w}×{imageDims.h}px
                  </span>
                )}
                <span className="text-xs text-gray-300 font-mono truncate">
                  {value.split('/').pop()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative flex-1 min-h-[60vh] bg-white flex items-center justify-center p-6 overflow-auto">
              <img
                src={value}
                alt="Original Quality Preview"
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AdminGalleryUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
}

export function AdminGalleryUploader({
  images,
  onChange,
  folder = 'products',
}: AdminGalleryUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dimsMap, setDimsMap] = useState<Record<string, { w: number; h: number }>>({});
  const multiInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    images.forEach((imgUrl) => {
      if (!imgUrl || dimsMap[imgUrl]) return;
      const probe = new window.Image();
      probe.onload = () => {
        setDimsMap((prev) => ({ ...prev, [imgUrl]: { w: probe.naturalWidth, h: probe.naturalHeight } }));
      };
      probe.src = imgUrl;
    });
  }, [images, dimsMap]);

  // Upload exact original bytes with zero resizing or re-encoding
  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));
      formData.append('folder', folder);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.urls)) {
        onChange([...images, ...data.urls]);
      } else {
        alert(data.error || 'Failed to upload images. Please try again.');
      }
    } catch (err: any) {
      alert('Error uploading images: ' + (err.message || 'Network error'));
    } finally {
      setIsUploading(false);
      if (multiInputRef.current) multiInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <label className="font-bold text-gray-800 text-xs">
            Product Gallery Photos ({images.length})
          </label>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
            100% Original Quality Preserved
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-gray-400 hover:text-emerald-700 underline cursor-pointer"
        >
          {showUrlInput ? 'Hide manual URL input' : '+ Add via URL'}
        </button>
      </div>

      {/* Upload Zone / Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/60'
            : 'border-gray-300 hover:border-emerald-400 bg-gray-50/50'
        }`}
      >
        <input
          ref={multiInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            {isUploading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <CloudUploadIcon className="w-6 h-6" />
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-800">
              {isUploading
                ? 'Uploading original quality photos...'
                : 'Click to select or drag & drop images here'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Uploads your exact original image file with zero compression, zero zooming, and zero blur
            </p>
          </div>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => multiInputRef.current?.click()}
            className="mt-1 px-4 py-2 bg-[#0d9749] hover:bg-[#097b3a] disabled:opacity-60 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <UploadIcon className="w-3.5 h-3.5" />
            <span>Select Photos from Computer</span>
          </button>
        </div>
      </div>

      {/* Manual URL Input (Optional) */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter image URL (e.g. /assets/products/...)"
            value={newUrlInput}
            onChange={(e) => setNewUrlInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (newUrlInput.trim()) {
                onChange([...images, newUrlInput.trim()]);
                setNewUrlInput('');
              }
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
          >
            + Add URL
          </button>
        </div>
      )}

      {/* Uploaded Photos Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {images.map((imgUrl, iIdx) => {
            const dims = dimsMap[imgUrl] || null;
            return (
              <div
                key={iIdx}
                className="relative group bg-white border border-gray-200 rounded-lg p-2 flex flex-col items-center shadow-2xs"
              >
                <div className="w-full h-24 relative bg-gray-50 rounded overflow-hidden mb-1.5 flex items-center justify-center">
                  <Image
                    src={imgUrl}
                    alt={`Gallery ${iIdx + 1}`}
                    fill
                    unoptimized
                    className="object-contain p-1"
                  />
                  {dims && (
                    <span className="absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/65 text-white">
                      {dims.w}×{dims.h}
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-gray-500 truncate w-full font-mono text-center mb-1.5">
                  {imgUrl.split('/').pop()}
                </span>

                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== iIdx))}
                  className="w-full py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
