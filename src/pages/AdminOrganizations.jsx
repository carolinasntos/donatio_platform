import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Building2, Edit, X, Save } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = { name: "", rfc: "", moral_type: "Asociación Civil", address: "", city: "", state: "", zip_code: "", phone: "", email: "", legal_rep_name: "", plan: "trial", status: "active" };

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setOrgs(await base44.entities.Organization.list("-created_date", 100));
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await base44.entities.Organization.update(editing.id, form);
    } else {
      await base44.entities.Organization.create(form);
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
    loadData();
  }

  const filtered = orgs.filter(o =>
    !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.rfc?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Organizaciones"
        subtitle="Gestión de OSCs registradas en la plataforma"
        actions={
          <Button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }} className="bg-violet-700 hover:bg-violet-800 text-white gap-2">
            <Plus className="w-4 h-4" /> Nueva OSC
          </Button>
        }
      />

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900">{editing ? "Editar OSC" : "Registrar Nueva OSC"}</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8"><X className="w-4 h-4" /></Button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Nombre / Razón Social *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">RFC *</Label>
              <Input value={form.rfc} onChange={e => setForm(p => ({ ...p, rfc: e.target.value.toUpperCase() }))} required className="font-mono" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Tipo de Persona Moral</Label>
              <Select value={form.moral_type} onValueChange={v => setForm(p => ({ ...p, moral_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Asociación Civil", "Sociedad Civil", "Fundación", "Instituto", "Otro"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Teléfono</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Representante Legal</Label>
              <Input value={form.legal_rep_name} onChange={e => setForm(p => ({ ...p, legal_rep_name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Ciudad</Label>
              <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Plan</Label>
              <Select value={form.plan} onValueChange={v => setForm(p => ({ ...p, plan: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["trial", "basic", "professional", "enterprise"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Estatus</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                  <SelectItem value="suspended">Suspendida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-violet-700 hover:bg-violet-800 text-white gap-2">
                <Save className="w-4 h-4" />{saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar OSC"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Buscar OSC..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Organización</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">RFC</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estatus</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Creada</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? Array(4).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {Array(7).fill(0).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.map(org => (
                <tr key={org.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{org.name}</p>
                        <p className="text-xs text-slate-500">{org.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-slate-700">{org.rfc}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{org.moral_type}</td>
                  <td className="px-6 py-3.5"><span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium capitalize">{org.plan}</span></td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${org.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {org.status === 'active' ? 'Activa' : org.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-500">{org.created_date?.split("T")[0]}</td>
                  <td className="px-6 py-3.5">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(org); setForm(org); setShowForm(true); }} className="h-7 w-7 p-0">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No hay organizaciones</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}