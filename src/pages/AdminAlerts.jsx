import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AlertTriangle, Search } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import AlertBadge from "@/components/shared/AlertBadge";
import { getSeverityLabel } from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [donors, setDonors] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [{ data: al }, { data: ol }, { data: dl }] = await Promise.all([
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
        .limit(200),
    ]);

    setAlerts(al || []);
    setOrgs(ol || []);
    setDonors(dl || []);
    setLoading(false);
  }

  const filtered = alerts.filter((a) => {
    const matchSev = filterSeverity === "all" || a.severity === filterSeverity;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const org = orgs.find((o) => o.id === a.organization_id);
    const donor = donors.find((d) => d.id === a.donor_id);
    const matchSearch =
      !search ||
      org?.name?.toLowerCase().includes(search.toLowerCase()) ||
      donor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.title?.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchStatus && matchSearch;
  });

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  alerts
    .filter((a) => a.status === "active")
    .forEach((a) => {
      if (counts[a.severity] !== undefined) counts[a.severity]++;
    });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Alertas Globales"
        subtitle="Centro de alertas consolidado de todas las OSCs"
      />

      <div className="grid grid-cols-4 gap-3">
        {[
          { key: "critical", color: "bg-red-50 border-red-200 text-red-700" },
          {
            key: "high",
            color: "bg-orange-50 border-orange-200 text-orange-700",
          },
          {
            key: "medium",
            color: "bg-amber-50 border-amber-200 text-amber-700",
          },
          { key: "low", color: "bg-blue-50 border-blue-200 text-blue-700" },
        ].map(({ key, color }) => (
          <button
            key={key}
            onClick={() =>
              setFilterSeverity(filterSeverity === key ? "all" : key)
            }
            className={`p-4 rounded-xl border text-left ${color} ${filterSeverity === key ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
          >
            <p className="text-2xl font-bold">{counts[key]}</p>
            <p className="text-xs font-medium capitalize mt-0.5">
              {getSeverityLabel(key)}
            </p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar alerta u OSC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
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
        <span className="text-sm text-slate-500 flex items-center">
          {filtered.length} alertas
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Alerta
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  OSC
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Donante
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Severidad
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Estatus
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        {Array(6)
                          .fill(0)
                          .map((_, j) => (
                            <td key={j} className="px-5 py-4">
                              <div className="h-4 bg-slate-100 rounded animate-pulse" />
                            </td>
                          ))}
                      </tr>
                    ))
                : filtered.map((a) => {
                    const org = orgs.find((o) => o.id === a.organization_id);
                    const donor = donors.find((d) => d.id === a.donor_id);
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-slate-50 hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900 text-sm">
                            {a.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[250px]">
                            {a.description}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-700">
                          {org?.name || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">
                          {donor?.full_name || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <AlertBadge severity={a.severity} />
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${a.status === "active" ? "bg-red-50 text-red-700 border-red-200" : a.status === "acknowledged" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                          >
                            {a.status === "active"
                              ? "Activa"
                              : a.status === "acknowledged"
                                ? "Atendida"
                                : "Resuelta"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {new Date(a.created_date).toLocaleDateString("es-MX")}
                        </td>
                      </tr>
                    );
                  })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Sin alertas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
