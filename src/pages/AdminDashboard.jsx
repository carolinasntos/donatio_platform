import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Building2,
  AlertTriangle,
  Shield,
  BarChart2,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import AlertBadge from "@/components/shared/AlertBadge";
import {
  formatCurrency,
  getDaysUntilDeadline,
  getSeverityColor,
  getSeverityLabel,
} from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [orgs, setOrgs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [{ data: ol }, { data: al }, { data: cl }, { data: dl }] =
      await Promise.all([
        supabase
          .from("organizations")
          .select("*")
          .order("created_date", { ascending: false })
          .limit(100),

        supabase
          .from("alerts")
          .select("*")
          .eq("status", "active")
          .order("created_date", { ascending: false })
          .limit(200),

        supabase
          .from("compliance_cases")
          .select("*")
          .order("created_date", { ascending: false })
          .limit(200),

        supabase
          .from("donors")
          .select("*")
          .order("created_date", { ascending: false })
          .limit(500),
      ]);

    setOrgs(ol || []);
    setAlerts(al || []);
    setCases(cl || []);
    setDonors(dl || []);
    setLoading(false);
  }

  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const overdueCount = cases.filter(
    (c) =>
      c.deadline_date &&
      getDaysUntilDeadline(c.deadline_date) < 0 &&
      !["closed", "presented"].includes(c.status),
  ).length;
  const pendingCases = cases.filter((c) =>
    ["pending", "in_preparation"].includes(c.status),
  );

  // Per-org stats
  const orgStats = orgs.map((org) => {
    const orgAlerts = alerts.filter((a) => a.organization_id === org.id);
    const orgCases = cases.filter((c) => c.organization_id === org.id);
    const orgDonors = donors.filter((d) => d.organization_id === org.id);
    const overdueOrgCases = orgCases.filter(
      (c) =>
        c.deadline_date &&
        getDaysUntilDeadline(c.deadline_date) < 0 &&
        !["closed", "presented"].includes(c.status),
    );
    const riskLevel =
      overdueOrgCases.length > 0 ||
      orgAlerts.filter((a) => a.severity === "critical").length > 0
        ? "high"
        : orgAlerts.filter((a) => a.severity === "high").length > 0
          ? "medium"
          : "low";
    return {
      ...org,
      alertCount: orgAlerts.length,
      caseCount: orgCases.length,
      donorCount: orgDonors.length,
      overdueCount: overdueOrgCases.length,
      riskLevel,
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="AppleSeed — Panel de Supervisión"
        subtitle="Vista consolidada multi-OSC de cumplimiento AML"
        badge={
          <>
            <Shield className="w-3 h-3" /> AppleSeed Admin
          </>
        }
        actions={
          <Link to={createPageUrl("AdminOrganizations")}>
            <Button className="bg-violet-700 hover:bg-violet-800 text-white gap-2">
              <Building2 className="w-4 h-4" /> Organizaciones
            </Button>
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="OSCs Activas"
          value={orgs.filter((o) => o.status === "active").length}
          subtitle={`${orgs.length} registradas`}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Alertas Críticas"
          value={criticalAlerts.length}
          subtitle="Requieren atención inmediata"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Avisos Vencidos"
          value={overdueCount}
          subtitle="Plazo día 17 incumplido"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Casos Pendientes"
          value={pendingCases.length}
          subtitle="En preparación o sin iniciar"
          icon={Shield}
          color="violet"
        />
      </div>

      {/* Critical alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-bold text-red-800">
                {criticalAlerts.length} Alertas Críticas Globales
              </span>
            </div>
            <Link to={createPageUrl("AdminAlerts")}>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100 h-7 text-xs"
              >
                Ver todas
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-red-100"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {a.title}
                  </p>
                  <p className="text-xs text-slate-500">{a.organization_id}</p>
                </div>
                <AlertBadge severity={a.severity} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Org table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            Organizaciones — Semáforo de Riesgo
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Organización
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Plan
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Donantes
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Alertas
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Casos
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Vencidos
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Riesgo
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Estatus
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array(8)
                        .fill(0)
                        .map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-slate-100 rounded animate-pulse" />
                          </td>
                        ))}
                    </tr>
                  ))
              ) : orgStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No hay organizaciones registradas
                  </td>
                </tr>
              ) : (
                orgStats.map((org) => (
                  <tr
                    key={org.id}
                    className="border-b border-slate-50 hover:bg-slate-50/60"
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-900 text-sm">
                        {org.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {org.rfc}
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium capitalize">
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">
                      {org.donorCount}
                    </td>
                    <td className="px-6 py-3.5">
                      {org.alertCount > 0 ? (
                        <span className="text-sm font-semibold text-red-600">
                          {org.alertCount}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">
                      {org.caseCount}
                    </td>
                    <td className="px-6 py-3.5">
                      {org.overdueCount > 0 ? (
                        <span className="text-sm font-bold text-red-700">
                          {org.overdueCount}
                        </span>
                      ) : (
                        <span className="text-sm text-emerald-600">0</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          org.riskLevel === "high"
                            ? "bg-red-100 text-red-700"
                            : org.riskLevel === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {org.riskLevel === "high"
                          ? "Alto"
                          : org.riskLevel === "medium"
                            ? "Medio"
                            : "Bajo"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${org.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {org.status === "active" ? "Activa" : org.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
