import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import {
  BarChart2,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, getDaysUntilDeadline } from "@/components/amlEngine";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#06b6d4"];

export default function AdminMetrics() {
  const [cases, setCases] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [{ data: cl }, { data: al }, { data: ol }, { data: dl }] =
      await Promise.all([
        supabase
          .from("compliance_cases")
          .select("*")
          .order("created_date", { ascending: false })
          .limit(500),

        supabase
          .from("alerts")
          .select("*")
          .order("created_date", { ascending: false })
          .limit(500),

        supabase
          .from("organizations")
          .select("*")
          .order("created_date", { ascending: false })
          .limit(100),

        supabase
          .from("donors")
          .select("*")
          .order("created_date", { ascending: false })
          .limit(500),
      ]);

    setCases(cl || []);
    setAlerts(al || []);
    setOrgs(ol || []);
    setDonors(dl || []);

    setLoading(false);
  }

  // Case status distribution
  const caseStatusData = [
    {
      name: "Pendiente",
      value: cases.filter((c) => c.status === "pending").length,
    },
    {
      name: "En Prep.",
      value: cases.filter((c) => c.status === "in_preparation").length,
    },
    {
      name: "Cap. SAT",
      value: cases.filter((c) => c.status === "captured_sat").length,
    },
    {
      name: "Presentado",
      value: cases.filter((c) => c.status === "presented").length,
    },
    {
      name: "Cerrado",
      value: cases.filter((c) => c.status === "closed").length,
    },
  ].filter((d) => d.value > 0);

  // Alert severity distribution
  const alertData = [
    {
      name: "Crítica",
      value: alerts.filter((a) => a.severity === "critical").length,
      fill: "#ef4444",
    },
    {
      name: "Alta",
      value: alerts.filter((a) => a.severity === "high").length,
      fill: "#f97316",
    },
    {
      name: "Media",
      value: alerts.filter((a) => a.severity === "medium").length,
      fill: "#f59e0b",
    },
    {
      name: "Baja",
      value: alerts.filter((a) => a.severity === "low").length,
      fill: "#3b82f6",
    },
  ].filter((d) => d.value > 0);

  // Compliance status distribution
  const complianceData = [
    {
      name: "OK",
      value: donors.filter((d) => d.compliance_status === "ok").length,
    },
    {
      name: "Identificación",
      value: donors.filter(
        (d) => d.compliance_status === "identification_required",
      ).length,
    },
    {
      name: "Aviso",
      value: donors.filter((d) => d.compliance_status === "notice_required")
        .length,
    },
    {
      name: "Bloqueado",
      value: donors.filter((d) => d.compliance_status === "blocked").length,
    },
    {
      name: "Incompleto",
      value: donors.filter(
        (d) => d.compliance_status === "incomplete" || !d.compliance_status,
      ).length,
    },
  ];

  // Per-org cases
  const orgCasesData = orgs.slice(0, 8).map((org) => ({
    name: org.name.length > 12 ? org.name.substring(0, 12) + "..." : org.name,
    cases: cases.filter((c) => c.organization_id === org.id).length,
    alerts: alerts.filter(
      (a) => a.organization_id === org.id && a.status === "active",
    ).length,
  }));

  const presentedOnTime = cases.filter((c) => {
    if (c.status !== "presented" && c.status !== "closed") return false;
    if (!c.deadline_date || !c.presented_date) return false;
    return new Date(c.presented_date) <= new Date(c.deadline_date);
  }).length;
  const totalPresented = cases.filter((c) =>
    ["presented", "closed"].includes(c.status),
  ).length;
  const onTimeRate =
    totalPresented > 0
      ? Math.round((presentedOnTime / totalPresented) * 100)
      : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Métricas de Cumplimiento"
        subtitle="Indicadores de desempeño AML globales"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Casos"
          value={cases.length}
          subtitle={`${cases.filter((c) => ["presented", "closed"].includes(c.status)).length} presentados`}
          icon={Shield}
          color="violet"
        />
        <StatCard
          title="Tasa Cumplimiento"
          value={`${onTimeRate}%`}
          subtitle="Avisos presentados a tiempo"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Alertas Activas"
          value={alerts.filter((a) => a.status === "active").length}
          subtitle={`${alerts.filter((a) => a.severity === "critical" && a.status === "active").length} críticas`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="OSCs Monitoreadas"
          value={orgs.length}
          subtitle="En la plataforma"
          icon={BarChart2}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Estatus de Casos de Aviso SAT
          </h3>
          {caseStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {caseStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-center py-12">Sin datos</p>
          )}
        </div>

        {/* Alert severity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Distribución de Alertas por Severidad
          </h3>
          {alertData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={alertData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={60}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {alertData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-center py-12">Sin alertas</p>
          )}
        </div>

        {/* Compliance status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Estatus de Cumplimiento — Donantes
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-org */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Casos y Alertas por OSC
          </h3>
          {orgCasesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orgCasesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="cases"
                  name="Casos"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="alerts"
                  name="Alertas"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-center py-12">Sin datos</p>
          )}
        </div>
      </div>
    </div>
  );
}
