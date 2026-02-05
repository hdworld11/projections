import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types/database';
import { v4 as uuid } from 'uuid';

interface ShareDialogProps {
  project: Project;
  onClose: () => void;
  onUpdate: (project: Project) => void;
}

export default function ShareDialog({ project, onClose, onUpdate }: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(project.is_public);
  const [shareToken, setShareToken] = useState(project.share_token);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : null;

  const togglePublic = async () => {
    setUpdating(true);

    const newIsPublic = !isPublic;
    let newToken = shareToken;

    // Generate token if making public and no token exists
    if (newIsPublic && !shareToken) {
      newToken = uuid();
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        is_public: newIsPublic,
        share_token: newToken,
      })
      .eq('id', project.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating share settings:', error);
    } else if (data) {
      setIsPublic(data.is_public);
      setShareToken(data.share_token);
      onUpdate(data);
    }

    setUpdating(false);
  };

  const copyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const regenerateToken = async () => {
    if (!isPublic) return;

    setUpdating(true);
    const newToken = uuid();

    const { data, error } = await supabase
      .from('projects')
      .update({ share_token: newToken })
      .eq('id', project.id)
      .select()
      .single();

    if (error) {
      console.error('Error regenerating token:', error);
    } else if (data) {
      setShareToken(data.share_token);
      onUpdate(data);
    }

    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Share Project</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Public toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium text-slate-800">Public sharing</h3>
              <p className="text-sm text-slate-500">
                Anyone with the link can view this project
              </p>
            </div>
            <button
              onClick={togglePublic}
              disabled={updating}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-indigo-600' : 'bg-slate-200'
              } ${updating ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  isPublic ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Share link */}
          {isPublic && shareUrl && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                />
                <button
                  onClick={copyLink}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <button
                onClick={regenerateToken}
                disabled={updating}
                className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                Generate new link (invalidates old one)
              </button>
            </div>
          )}

          {!isPublic && (
            <p className="text-sm text-slate-500">
              Enable public sharing to get a shareable link.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
