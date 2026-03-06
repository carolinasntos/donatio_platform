import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Filter, User, Building2, Eye, Edit, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  calculate6MonthRolling, mxnToUMA, formatCurrency, formatUMA, UMA_DEFAULT,
  getStatusColor, getStatusLabel
} from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DonorForm from "@/components/osc/DonorForm";

export default function OSCDonors() {
  const [donors, setDonors] = useState([]);
  const [donations, setDonations] = useState([]);
  const [umaConfig, setUmaConfig] = useState(UMA_DEFAULT);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
  setLoading(true);

  const [donorsRes, donationsRes, umaRes] = await Promise.all([
    supabase
      .from("donors")
      .select("*")
      .order("created_date", { ascending: false })
      .limit(200),

    supabase
      .from("donations")
      .select("*")
      .order("donation_date", { ascending: false })
      .limit(1000),

    supabase
      .from("uma_config")
      .select("*")
      .eq("is_active", true)
      .order("year", { ascending: false })
      .limit(1),
  ]);

  if (donorsRes.data) setDonors(donorsRes.data);
  if (donationsRes.data) setDonations(donationsRes.data);
  if (umaRes.data?.length) setUmaConfig(umaRes.data[0]);

  setLoading(false);
}

  const filtered = donors.filter(d => {
    const matchSearch = !search || d.full_name?.toLowerCase().includes(search.toLowerCase()) || d.rfc?.toLowerCase().includes(search.toLowerCase()) || d.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || d.compliance_status === filterStatus;
    const matchType = filterType === "all" || d.donor_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  async function handleSave(data) {
  if (editingDonor) {
    await supabase
      .from("donors")
      .update(data)
      .eq("id", editingDonor.id);
  } else {
    await supabase
      .from("donors")
      .insert(data);
  }

  setShowForm(false);
  setEditingDonor(null);
  loadData();
}

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Donantes"
        subtitle="Registro y seguimiento de cumplimiento AML por donante"
        actions={
          <Button onClick={() => { setEditingDonor(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
            <Plus className="w-4 h-4" /> Nuevo Donante
          </Button>
        }
      />

      {showForm && (
        <DonorForm
          donor={editingDonor}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingDonor(null); }}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por nombre, RFC, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estatus</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="identification_required">Identificación Reforzada</SelectItem>
            <SelectItem value="notice_required">Obligación de Aviso</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
            <SelectItem value="incomplete">Incompleto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="fisica">Persona Física</SelectItem>
            <SelectItem value="moral">Persona Moral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-medium">
          {filtered.length} donante{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Donante</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">RFC</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acum. 6M</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">UMAs</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estatus</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">KYC</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map(d => {
                const acc = calculate6MonthRolling(donations, d.id);
                const accUMA = mxnToUMA(acc, umaConfig);
                return (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${d.donor_type === 'moral' ? 'bg-blue-100' : 'bg-violet-100'}`}>
                          {d.donor_type === 'moral' ? <Building2 className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-violet-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{d.full_name}</p>
                          <p className="text-xs text-slate-500">{d.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-mono">{d.rfc || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {d.donor_type === "fisica" ? "Física" : "Moral"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{formatCurrency(acc)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatUMA(accUMA)}</td>
                    <td className="px-6 py-4"><StatusBadge status={d.compliance_status || "incomplete"} /></td>
                    <td className="px-6 py-4">
                      {d.kyc_complete
                        ? <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">Completo</span>
                        : <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Pendiente</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingDonor(d); setShowForm(true); }} className="h-7 w-7 p-0">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Link to={createPageUrl(`OSCExpedientes`)}>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No se encontraron donantes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}