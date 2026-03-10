import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Bell,
  Filter,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import AlertBadge from "@/components/shared/AlertBadge";
import {
  ALERT_TYPES,
  getSeverityColor,
  getSeverityLabel,
} from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function OSCAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [donors, setDonors] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [alertsRes, donorsRes] = await Promise.all([
      supabase
        .from("Alert")
        .select("*")
        .order("created_date", { ascending: false })
        .limit(200),

      supabase
        .from("Donor")
        .select("*")
        .order("created_date", { ascending: false })
        .limit(200),
    ]);

    setAlerts(alertsRes.data || []);
    setDonors(donorsRes.data || []);
    setLoading(false);
  }

  async function acknowledge(alertId) {
    setAcknowledging(alertId);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("Alert")
      .update({
        status: "acknowledged",
        acknowledged_by: user.email,
        acknowledged_date: new Date().toISOString(),
      })
      .eq("id", alertId);
    setAcknowledging(null);
    loadData();
  }

  async function resolve(alertId) {
    await supabase
      .from("Alert")
      .update({
        status: "resolved",
        resolved_date: new Date().toISOString(),
      })
      .eq("id", alertId);
    loadData();
  }

  const filtered = alerts.filter((a) => {
    const matchSev = filterSeverity === "all" || a.severity === filterSeverity;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSev && matchStatus;
  });

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  alerts
    .filter((a) => a.status === "active")
    .forEach((a) => {
      if (counts[a.severity] !== undefined) counts[a.severity]++;
    });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Centro de Alertas"
        subtitle="Monitoreo en tiempo real de eventos de cumplimiento AML"
      />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            key: "critical",
            label: "Críticas",
            color: "bg-red-50 border-red-200 text-red-700",
          },
          {
            key: "high",
            label: "Altas",
            color: "bg-orange-50 border-orange-200 text-orange-700",
          },
          {
            key: "medium",
            label: "Medias",
            color: "bg-amber-50 border-amber-200 text-amber-700",
          },
          {
            key: "low",
            label: "Bajas",
            color: "bg-blue-50 border-blue-200 text-blue-700",
          },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() =>
              setFilterSeverity(filterSeverity === key ? "all" : key)
            }
            className={`p-4 rounded-xl border text-left transition-all ${color} ${filterSeverity === key ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
          >
            <p className="text-2xl font-bold">{counts[key]}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="acknowledged">Atendidas</SelectItem>
            <SelectItem value="resolved">Resueltas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500 flex items-center ml-auto">
          {filtered.length} alertas
        </span>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {loading &&
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse"
              >
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
        {!loading &&
          filtered.map((a) => {
            const donor = donors.find((d) => d.id === a.donor_id);
            const isActive = a.status === "active";
            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border p-5 transition-all ${
                  a.severity === "critical" && isActive
                    ? "border-red-200 shadow-red-50 shadow-sm"
                    : a.severity === "high" && isActive
                      ? "border-orange-200"
                      : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        a.severity === "critical"
                          ? "bg-red-100"
                          : a.severity === "high"
                            ? "bg-orange-100"
                            : "bg-amber-100"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          a.severity === "critical"
                            ? "text-red-600"
                            : a.severity === "high"
                              ? "text-orange-600"
                              : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <AlertBadge severity={a.severity} />
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            a.status === "active"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : a.status === "acknowledged"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {a.status === "active"
                            ? "Activa"
                            : a.status === "acknowledged"
                              ? "Atendida"
                              : "Resuelta"}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {a.description}
                      </p>
                      {donor && (
                        <p className="text-xs text-slate-500 mt-1">
                          Donante:{" "}
                          <span className="font-medium">{donor.full_name}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(a.created_date).toLocaleString("es-MX")}
                      </p>
                      {a.acknowledged_by && (
                        <p className="text-xs text-slate-400">
                          Atendido por: {a.acknowledged_by}
                        </p>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledge(a.id)}
                        disabled={acknowledging === a.id}
                        className="h-8 text-xs whitespace-nowrap"
                      >
                        {acknowledging === a.id ? "..." : "Marcar Atendida"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resolve(a.id)}
                        className="h-8 text-xs text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                      >
                        Resolver
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-400" />
            <p className="font-medium text-slate-600">
              Sin alertas en esta categoría
            </p>
            <p className="text-sm mt-1">
              El sistema monitoreará y generará alertas automáticamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
