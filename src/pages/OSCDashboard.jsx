import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, FileText, Bell, AlertTriangle, TrendingUp, Clock, CheckCircle2, XCircle, Shield } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import AlertBadge from "@/components/shared/AlertBadge";
import PageHeader from "@/components/shared/PageHeader";
import {
  mxnToUMA, umaToMXN, calculate6MonthRolling, getStatusColor, getStatusLabel,
  formatCurrency, formatUMA, getSeverityColor, getDaysUntilDeadline, UMA_DEFAULT
} from "@/components/amlEngine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function OSCDashboard() {
  const [org, setOrg] = useState(null);
  const [donors, setDonors] = useState([]);
  const [donations, setDonations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);
  const [umaConfig, setUmaConfig] = useState(UMA_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
  setLoading(true);

  const [donorsRes, donationsRes, alertsRes, casesRes, umaRes] = await Promise.all([
    supabase
      .from("donors")
      .select("*")
      .order("created_date", { ascending: false })
      .limit(100),

    supabase
      .from("donations")
      .select("*")
      .order("donation_date", { ascending: false })
      .limit(500),

    supabase
      .from("alerts")
      .select("*")
      .eq("status", "active")
      .order("created_date", { ascending: false })
      .limit(50),

    supabase
      .from("compliance_cases")
      .select("*")
      .order("created_date", { ascending: false })
      .limit(50),

    supabase
      .from("uma_config")
      .select("*")
      .eq("is_active", true)
      .order("year", { ascending: false })
      .limit(1),
  ]);

  if (donorsRes.data) setDonors(donorsRes.data);
  if (donationsRes.data) setDonations(donationsRes.data);
  if (alertsRes.data) setAlerts(alertsRes.data);
  if (casesRes.data) setCases(casesRes.data);
  if (umaRes.data?.length) setUmaConfig(umaRes.data[0]);

  setLoading(false);
}

  const totalDonations = donations.reduce((s, d) => s + (d.amount_mxn || 0), 0);
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const total6m = donations.filter(d => new Date(d.donation_date) >= sixMonthsAgo).reduce((s, d) => s + (d.amount_mxn || 0), 0);
  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  const pendingCases = cases.filter(c => ["pending", "in_preparation"].includes(c.status));
  const overdueCases = cases.filter(c => c.status === "overdue" || (c.deadline_date && getDaysUntilDeadline(c.deadline_date) < 0 && c.status !== "closed" && c.status !== "presented"));

  // Compliance breakdown
  const statusCounts = { ok: 0, identification_required: 0, notice_required: 0, blocked: 0, incomplete: 0 };
  donors.forEach(d => { if (statusCounts[d.compliance_status] !== undefined) statusCounts[d.compliance_status]++; });

  const recentDonors = donors.slice(0, 8);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Dashboard OSC"
        subtitle={`UMA 2026: ${formatCurrency(umaConfig.daily_value_mxn || UMA_DEFAULT.daily_value_mxn)} diarios · Umbral aviso: ${formatCurrency((umaConfig.daily_value_mxn || UMA_DEFAULT.daily_value_mxn) * 3210)}`}
        badge={<><Shield className="w-3 h-3" /> Cumplimiento AML</>}
        actions={
          <Link to={createPageUrl("OSCDonors")}>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
              <Users className="w-4 h-4" /> Ver Donantes
            </Button>
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Donativos" value={formatCurrency(totalDonations)} subtitle="Histórico total" icon={FileText} color="blue" />
        <StatCard title="Acumulado 6 meses" value={formatCurrency(total6m)} subtitle={`${formatUMA(mxnToUMA(total6m, umaConfig))} acumuladas`} icon={TrendingUp} color="violet" />
        <StatCard title="Donantes Activos" value={donors.filter(d => d.status !== "blocked").length} subtitle={`${donors.length} registrados total`} icon={Users} color="green" />
        <StatCard title="Alertas Activas" value={alerts.length} subtitle={`${criticalAlerts.length} críticas`} icon={Bell} color="red" />
      </div>

      {/* Critical alerts banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800">{criticalAlerts.length} Alertas Críticas Requieren Atención Inmediata</span>
          </div>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-red-100">
                <span className="text-sm font-medium text-slate-800">{a.title}</span>
                <Link to={createPageUrl("OSCAlerts")}>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs">Atender</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance semáforo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Semáforo de Cumplimiento</h2>
          <div className="space-y-3">
            {[
              { key: "ok", label: "Cumplimiento OK", color: "bg-emerald-500" },
              { key: "identification_required", label: "Identificación Reforzada", color: "bg-amber-500" },
              { key: "notice_required", label: "Obligación de Aviso", color: "bg-red-500" },
              { key: "blocked", label: "Bloqueados", color: "bg-red-900" },
              { key: "incomplete", label: "Incompletos", color: "bg-slate-400" },
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`} />
                <span className="text-sm text-slate-600 flex-1">{label}</span>
                <span className="text-sm font-bold text-slate-900">{statusCounts[key]}</span>
                <div className="w-20">
                  <Progress value={donors.length ? (statusCounts[key] / donors.length) * 100 : 0} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Casos de aviso pendientes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Avisos SAT Pendientes</h2>
            <Link to={createPageUrl("OSCComplianceCases")}>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 text-xs h-7">Ver todos</Button>
            </Link>
          </div>
          {pendingCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
              <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
              <span className="text-sm">Sin casos pendientes</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCases.slice(0, 4).map(c => {
                const days = c.deadline_date ? getDaysUntilDeadline(c.deadline_date) : null;
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-800 truncate max-w-[140px]">{c.donor_id}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(c.accumulated_mxn)}</p>
                    </div>
                    {days !== null && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${days <= 3 ? 'bg-red-100 text-red-700' : days <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {days > 0 ? `${days}d` : 'Vencido'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimas alertas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Alertas Recientes</h2>
            <Link to={createPageUrl("OSCAlerts")}>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 text-xs h-7">Ver todas</Button>
            </Link>
          </div>
          <div className="space-y-2.5">
            {alerts.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-500' : a.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{a.description}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-sm">Sin alertas activas</div>
            )}
          </div>
        </div>
      </div>

      {/* Donors table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Donantes — Estatus de Cumplimiento</h2>
          <Link to={createPageUrl("OSCDonors")}>
            <Button variant="outline" size="sm" className="text-xs h-8">Ver todos</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Donante</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acum. 6M</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">UMAs</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {recentDonors.map(d => {
                const acc = calculate6MonthRolling(donations, d.id);
                const accUMA = mxnToUMA(acc, umaConfig);
                return (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link to={createPageUrl(`OSCDonors`)} className="font-medium text-slate-900 text-sm hover:text-violet-700">{d.full_name}</Link>
                      <p className="text-xs text-slate-500">{d.rfc || "Sin RFC"}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{d.donor_type === "fisica" ? "Física" : "Moral"}</span>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-800">{formatCurrency(acc)}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{formatUMA(accUMA)}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={d.compliance_status || "incomplete"} /></td>
                  </tr>
                );
              })}
              {recentDonors.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">No hay donantes registrados aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}