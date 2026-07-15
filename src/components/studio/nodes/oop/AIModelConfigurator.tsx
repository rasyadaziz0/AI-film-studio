import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BaseNodePresenter } from "./BaseNodePresenter";

interface AIModelConfiguratorProps {
  presenter: BaseNodePresenter;
}

export const AIModelConfigurator: React.FC<AIModelConfiguratorProps> = ({ presenter }) => {
  const { id, data, store } = presenter;

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium text-[#8c8c8c]">Model (Qwen DashScope)</label>
      <Select
        value={data.model || "default"}
        disabled={!store?.capabilities?.canEditCanvas}
        onValueChange={(val) => {
          store.updateNodeData(id, {
            provider: "qwen",
            model: val === "default" ? undefined : val,
          });
        }}
      >
        <SelectTrigger className="w-full h-6 px-2 py-0 text-[10px] bg-[#1e1e1e] border-transparent hover:border-[#444444] focus:border-[#18a0fb] text-[#e0e0e0] rounded-[4px] shadow-none">
          <SelectValue placeholder="Default (qwen-plus)" />
        </SelectTrigger>
        <SelectContent className="bg-[#2c2c2c] border-[#444444] text-[#e0e0e0] text-[10px] rounded-[4px] shadow-lg">
          <SelectItem value="default" className="focus:bg-[#18a0fb] focus:text-white">
            Default (qwen-plus ⚖️ Balanced)
          </SelectItem>
          <SelectItem value="qwen3.5-flash" className="focus:bg-[#18a0fb] focus:text-white">
            qwen3.5-flash ⚡ Fast &amp; Cheap
          </SelectItem>
          <SelectItem value="qwen-plus" className="focus:bg-[#18a0fb] focus:text-white">
            qwen-plus ⚖️ Balanced
          </SelectItem>
          <SelectItem value="qwen3-max" className="focus:bg-[#18a0fb] focus:text-white">
            qwen3-max 🏆 Premium
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
