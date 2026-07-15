"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, RefreshCw, Users, Shield, UserPlus, Trash2, Globe, Lock, AlertTriangle } from "lucide-react";
import { useStudioStore } from "@/store/useStudioStore";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/utils/toast";

interface CollaborationShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Collaborator {
  id: string;
  studio_id: string;
  user_id?: string;
  user_email: string;
  role: "editor" | "viewer";
  created_at?: string;
}

export default function CollaborationShareModal({ isOpen, onClose }: CollaborationShareModalProps) {
  const { activeStudioId, studios, updateStudio, capabilities } = useStudioStore();
  const activeStudio = studios.find(s => s.id === activeStudioId);

  const [sharingVisibility, setSharingVisibility] = useState<string>("private");
  const [shareToken, setShareToken] = useState<string>("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (activeStudio && isOpen) {
      setSharingVisibility(activeStudio.sharing_visibility || "private");
      if (!activeStudio.share_token) {
        // Generate initial token if missing
        const newToken = crypto.randomUUID();
        updateStudio({ share_token: newToken }, activeStudio.id);
        setShareToken(newToken);
      } else {
        setShareToken(activeStudio.share_token);
      }
      fetchCollaborators();
    }
  }, [activeStudio, isOpen]);

  const fetchCollaborators = async () => {
    if (!activeStudioId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("studio_collaborators")
        .select("*")
        .eq("studio_id", activeStudioId);

      if (error) {
        console.error("Error fetching collaborators:", error);
      } else {
        setCollaborators(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibilityChange = async (newVisibility: string) => {
    if (!activeStudioId || !capabilities.canManageSharing) return;
    setSharingVisibility(newVisibility);
    await updateStudio({ sharing_visibility: newVisibility }, activeStudioId);
    toast.success("Pengaturan Dibagikan Diperbarui", `Visibilitas diubah menjadi ${newVisibility === 'link_view' ? 'Publik (Dengan Link)' : 'Pribadi'}.`);
  };

  const handleResetLink = async () => {
    if (!activeStudioId || !shareToken || !capabilities.canManageSharing) return;
    if (!confirm("Reset link akan mencabut semua akses pengguna yang masuk melalui link lama. Lanjutkan?")) return;

    setIsResetting(true);
    try {
      const oldToken = shareToken;
      const newToken = crypto.randomUUID();

      // 1. Delete all old snapshot grants from studio_shared_access_grants
      const { error: revokeError } = await supabase
        .from("studio_shared_access_grants")
        .delete()
        .eq("studio_id", activeStudioId)
        .eq("granted_token_snapshot", oldToken);

      if (revokeError) {
        console.error("Error revoking old grants:", revokeError);
      }

      // 2. Update studio share_token in DB and store
      await updateStudio({ share_token: newToken }, activeStudioId);
      setShareToken(newToken);

      toast.success("Link Direset", "Link baru telah dibuat dan semua sesi akses link lama telah dicabut.");
    } catch (err) {
      console.error("Reset link failed:", err);
      toast.error("Gagal Reset Link", "Terjadi kesalahan saat mencabut akses lama.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined" || !shareToken) return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/studio/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success("Link Disalin", "Tautan berbagi berhasil disalin ke clipboard.");
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudioId || !inviteEmail || !capabilities.canManageSharing) return;

    try {
      // Memanggil fungsi RPC di Supabase untuk meng-handle invite (mencari user_id dari email)
      const { data, error } = await supabase.rpc("invite_collaborator_by_email", {
        p_studio_id: activeStudioId,
        p_email: inviteEmail.trim().toLowerCase(),
        p_role: inviteRole,
      });

      if (error) {
        throw error;
      }

      toast.success("Undangan Terkirim", `Kolaborator ${inviteEmail} berhasil ditambahkan sebagai ${inviteRole}.`);
      setInviteEmail("");
      fetchCollaborators();
    } catch (err: any) {
      console.error("Invite error:", err);
      toast.error("Gagal Mengundang", err.message || "Terjadi kesalahan saat menambahkan kolaborator.");
    }
  };

  const handleRemoveCollaborator = async (collabId: string, email: string) => {
    if (!activeStudioId || !capabilities.canManageSharing) return;
    if (!confirm(`Hapus akses untuk ${email}?`)) return;

    try {
      const { error } = await supabase
        .from("studio_collaborators")
        .delete()
        .eq("id", collabId);

      if (error) throw error;
      toast.success("Akses Dihapus", `Kolaborator ${email} telah dihapus.`);
      fetchCollaborators();
    } catch (err: any) {
      console.error("Remove collab error:", err);
      toast.error("Gagal Menghapus", err.message || "Terjadi kesalahan.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-zinc-100 text-lg">Kolaborasikan Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto overflow-x-hidden space-y-6">
          
          {/* Section 1: Sharing Link (Authenticated Link View) */}
          <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                {sharingVisibility === "link_view" ? (
                  <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-zinc-400 shrink-0" />
                )}
                <span>Akses via Link Berbagi</span>
              </div>
              <select
                value={sharingVisibility}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                disabled={!capabilities.canManageSharing}
                className="bg-zinc-900 border border-zinc-700 rounded-md text-xs px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50 sm:max-w-[240px]"
              >
                <option value="private">Pribadi (Hanya Undangan)</option>
                <option value="link_view">Siapa saja dengan Link (Lihat Saja)</option>
              </select>
            </div>

            {sharingVisibility === "link_view" && (
              <div className="space-y-3 pt-2 border-t border-zinc-800/60 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== "undefined" && shareToken ? `${window.location.origin}/studio/share/${shareToken}` : "Memuat link..."}
                    className="flex-1 min-w-0 bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 select-all font-mono truncate focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3.5 py-2 text-xs font-medium transition-all shrink-0 cursor-pointer shadow-sm shadow-indigo-600/20"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {isCopied ? "Disalin" : "Salin Link"}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <span>Sesi ini hanya memberi hak akses <b>Lihat Saja (View-Only)</b> bagi pengguna terotentikasi.</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleResetLink}
                    disabled={isResetting || !capabilities.canManageSharing}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={12} className={isResetting ? "animate-spin" : ""} />
                    {isResetting ? "Mencabut Link Lama..." : "Reset Link & Cabut Sesi Lama"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Invite Collaborators via Email */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <UserPlus size={16} className="text-indigo-400" />
              Undang Anggota Tim
            </h4>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 items-stretch">
              <input
                type="email"
                required
                placeholder="email@perusahaan.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={!capabilities.canManageSharing}
                className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
                disabled={!capabilities.canManageSharing}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50 shrink-0 w-full sm:w-auto"
              >
                <option value="editor">Editor (Run & Edit)</option>
                <option value="viewer">Viewer (Lihat Saja)</option>
              </select>
              <button
                type="submit"
                disabled={!capabilities.canManageSharing || !inviteEmail}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-colors shrink-0 cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                Undang
              </button>
            </form>
          </div>

          {/* Section 3: Collaborators List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Shield size={16} className="text-indigo-400" />
              Daftar Anggota Akses ({collaborators.length})
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-hidden pr-1">
              {isLoading ? (
                <div className="text-xs text-zinc-500 text-center py-4">Memuat anggota tim...</div>
              ) : collaborators.length === 0 ? (
                <div className="text-xs text-zinc-500 bg-zinc-950/40 border border-zinc-900 rounded-lg p-4 text-center">
                  Belum ada kolaborator yang diundang langsung.
                </div>
              ) : (
                collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between gap-2 bg-zinc-950/60 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-zinc-200 font-medium text-xs truncate">{collab.user_email}</span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{collab.role}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        collab.role === 'editor' 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {collab.role === 'editor' ? 'Editor' : 'Viewer'}
                      </span>

                      {capabilities.canManageSharing && (
                        <button
                          onClick={() => handleRemoveCollaborator(collab.id, collab.user_email)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                          title="Hapus Kolaborator"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-6 py-4 bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg px-5 py-2 text-sm font-medium transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
