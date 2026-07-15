"use client";

import React from "react";
import { ExternalLink, LucideIcon } from "lucide-react";

export interface MediaActionButtonProps {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: LucideIcon;
  variant?: "audio" | "video" | "image" | "default";
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MediaActionButton({
  label,
  onClick,
  icon: Icon = ExternalLink,
  variant = "default",
  fullWidth = true,
  disabled = false,
  className = "",
}: MediaActionButtonProps) {
  const variantStyles = {
    audio:
      "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border-amber-500/30 text-amber-300 shadow-amber-500/10",
    video:
      "bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border-red-500/30 text-red-300 shadow-red-500/10",
    image:
      "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10",
    default:
      "bg-gradient-to-r from-sky-500/20 to-purple-500/20 hover:from-sky-500/30 hover:to-purple-500/30 border-sky-500/30 text-sky-300 shadow-sky-500/10",
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${
        fullWidth ? "w-full" : "w-auto"
      } flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-[4px] border font-medium transition-all shadow-sm cursor-pointer text-[10px] disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${className}`}
    >
      <Icon size={12} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}
