import React, { useState, useRef } from 'react';
import { Plus, X, Upload, Edit3, Trash2, Image as ImageIcon, Check } from 'lucide-react';
import { api } from '../services/api.js';

interface MediaAsset {
  id: string;
  name: string;
  label: string;
  url: string;
  usesCount: number;
}

export const MediaLibraryPage: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [editName, setEditName] = useState('');
  const [editLabel, setEditLabel] = useState('');

  // Selected file state for upload modal
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = (asset: MediaAsset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditLabel(asset.label);
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this media asset?')) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !editName.trim()) return;

    setAssets(prev =>
      prev.map(a =>
        a.id === editingAsset.id
          ? { ...a, name: editName.trim(), label: editLabel.trim().toUpperCase() || 'FIGURE' }
          : a
      )
    );

    setEditingAsset(null);
    setIsEditOpen(false);
  };

  // Real File Selection Handler
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newSelected: { file: File; url: string }[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newSelected.push({ file, url });
      }
    });

    setSelectedFiles(prev => [...prev, ...newSelected]);
  };

  // Drag & Drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Perform upload to backend / storage
  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const newAssets: MediaAsset[] = [];

      for (const item of selectedFiles) {
        let finalUrl = item.url;
        try {
          const res = await api.uploadAsset(item.file);
          if (res.url) finalUrl = res.url;
        } catch {
          // fallback to object URL / data URL
        }

        newAssets.push({
          id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: item.file.name,
          label: item.file.name.split('.')[0].toUpperCase(),
          url: finalUrl,
          usesCount: 0
        });
      }

      setAssets(prev => [...newAssets, ...prev]);
      setSelectedFiles([]);
      setIsUploadOpen(false);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Media Library
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Reusable question images, diagrams, and figures.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedFiles([]);
            setIsUploadOpen(true);
          }}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> + Upload Image
        </button>
      </div>

      {/* Grid of Media Assets */}
      {assets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs font-semibold shadow-2xs">
          No media images uploaded yet. Click "+ Upload Image" to add your figures and diagrams.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map(asset => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between"
            >
              <div className="h-48 m-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-center overflow-hidden relative group">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="max-h-full max-w-full object-contain p-2"
                  onError={e => {
                    // Fallback preview
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200">
                  {asset.label}
                </span>
              </div>
              <div className="px-5 pb-4 pt-1 text-xs flex items-center justify-between">
                <div>
                  <b className="text-slate-900 block font-bold truncate max-w-[180px]">
                    {asset.name}
                  </b>
                  <span className="text-slate-500 text-[11px] font-medium">
                    Used {asset.usesCount} times
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(asset)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Edit Asset Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(asset.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Media Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
              <span>Upload Image</span>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={e => handleFileSelect(e.target.files)}
              className="hidden"
            />

            {/* Interactive Drag & Drop Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="py-10 px-6 border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-2xl bg-teal-50/40 hover:bg-teal-50 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all active:scale-[0.99]"
            >
              <Upload className="w-9 h-9 text-teal-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                  DRAG & DROP IMAGE HERE
                </span>
                <span className="text-[11px] text-teal-700 font-bold underline mt-1 block">
                  or click to Browse Files from device
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Supports PNG, JPG, WEBP, SVG
              </span>
            </div>

            {/* Selected File Previews */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                <div className="text-[11px] font-bold text-slate-600 uppercase">
                  Selected ({selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}):
                </div>
                {selectedFiles.map((sf, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold text-slate-800"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={sf.url} alt="" className="w-6 h-6 object-cover rounded shrink-0" />
                      <span className="truncate">{sf.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 font-bold text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedFiles.length === 0 || isUploading}
                onClick={handleUploadSubmit}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                {isUploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Upload to Media Library
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Media Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
              <span>Edit Asset Details</span>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">File Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Asset Label / Caption</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
