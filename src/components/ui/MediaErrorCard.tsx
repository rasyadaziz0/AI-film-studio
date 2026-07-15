"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export interface MediaErrorCardProps {
  title?: string;
  message?: string;
  actionText?: string;
  onActionClick?: () => void;
  accent?: "amber" | "red" | "blue";
}

export function MediaErrorCard({
  title = "⚠️ Media Tidak Dapat Dimuat",
  message = "File lama mengalami kegagalan proses atau kadaluwarsa.",
  actionText = "Klik tombol Run atau Upload ulang untuk memperbarui.",
  onActionClick,
  accent = "amber",
}: MediaErrorCardProps) {
  const borderBgClass = {
    amber: "border-amber-500/30 bg-[#151520] text-[#a0a0b0]",
    red: "border-red-500/30 bg-[#1f1215] text-red-200",
    blue: "border-blue-500/30 bg-[#121520] text-blue-200",
  }[accent];

  const titleColorClass = {
    amber: "text-amber-400 font-semibold",
    red: "text-red-400 font-semibold",
    blue: "text-blue-400 font-semibold",
  }[accent];

  return (
    <div className={`flex flex-col items-center justify-center p-3 text-center text-[10px] gap-1.5 border rounded-md shadow-inner ${borderBgClass}`}>
      <div className="flex items-center gap-1.5">
        <AlertTriangle size={14} className={titleColorClass} />
        <span className={titleColorClass}>{title}</span>
      </div>
      <span>{message}</span>
      {actionText && (
        <span
          onClick={onActionClick}
          className={`font-medium ${onActionClick ? "cursor-pointer underline hover:text-white" : "text-blue-400"}`}
        >
          {actionText}
        </span>
      )}
    </div>
  );
}
