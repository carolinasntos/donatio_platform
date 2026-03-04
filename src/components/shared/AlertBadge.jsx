import React from "react";
import { getSeverityColor, getSeverityLabel } from "@/components/amlEngine";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

export default function AlertBadge({ severity, label, size = "sm" }) {
  const colorClass = getSeverityColor(severity);
  const icons = {
    critical: AlertCircle,
    high: AlertTriangle,
    medium: AlertTriangle,
    low: Info
  };
  const Icon = icons[severity] || Info;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {label || getSeverityLabel(severity)}
    </span>
  );
}