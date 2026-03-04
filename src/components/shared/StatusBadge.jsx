import React from "react";
import { getStatusColor, getStatusLabel } from "@/components/amlEngine";
import { CheckCircle2, AlertTriangle, Shield, XCircle, Clock } from "lucide-react";

export default function StatusBadge({ status, customLabel }) {
  const colorClass = getStatusColor(status);
  const icons = {
    ok: CheckCircle2,
    identification_required: AlertTriangle,
    notice_required: AlertTriangle,
    blocked: XCircle,
    incomplete: Clock,
    pending: Clock
  };
  const Icon = icons[status] || Shield;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      {customLabel || getStatusLabel(status)}
    </span>
  );
}