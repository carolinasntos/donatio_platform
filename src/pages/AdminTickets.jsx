import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Search, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [note, setNote] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", category: "compliance", priority: "medium", organization_id: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
  setLoading(true);

  const [
    { data: tl },
    { data: ol }
  ] = await Promise.all([
    supabase
      .from("support_tickets")
      .select("*")
      .order("created_date", { ascending: false })
      .limit(100),

    supabase
      .from("organizations")
      .select("*")
      .order("created_date", { ascending: false })
      .limit(100)
  ]);

  setTickets(tl || []);
  setOrgs(ol || []);
  setLoading(false);
}

  async function createTicket(e) {
    e.preventDefault();
    await supabase
  .from("support_tickets")
  .insert([{ ...form, notes: [] }]);
    setForm({ title: "", description: "", category: "compliance", priority: "medium", organization_id: "" });
    loadData();
  }

  async function addNote(ticketId) {
    if (!note.trim()) return;
    const ticket = tickets.find(t => t.id === ticketId);
const existingNotes = ticket?.notes || [];

await supabase
  .from("support_tickets")
  .update({
    notes: [
      ...existingNotes,
      {
        author: "admin",
        text: note,
        date: new Date().toISOString()
      }
    ]
  })
  .eq("id", ticketId);
    setNote("");
    loadData();
  }

  async function updateStatus(ticketId, status) {
    await supabase
  .from("support_tickets")
  .update({ status })
  .eq("id", ticketId);
    loadData();
  }

  const filtered = tickets.filter(t => filterStatus === "all" || t.status === filterStatus);

  const statusColors = {
    open: "bg-red-100 text-red-700", in_progress: "bg-blue-100 text-blue-700",
    pending_osc: "bg-amber-100 text-amber-700", resolved: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-100 text-slate-500"
  };
  const statusLabels = { open: "Abierto", in_progress: "En Progreso", pending_osc: "Pendiente OSC", resolved: "Resuelto", closed: "Cerrado" };
  const priorityColors = { low: "text-blue-600", medium: "text-amber-600", high: "text-orange-600", urgent: "text-red-600" };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Tickets de Soporte"
        subtitle="Gestión de casos y atención a OSCs"
        actions={
          <Button onClick={() => setShowNew(!showNew)} className="bg-violet-700 hover:bg-violet-800 text-white gap-2">
            <Plus className="w-4 h-4" /> Nuevo Ticket
          </Button>
        }
      />

      {showNew && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Crear Ticket</h3>
          <form onSubmit={createTicket} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Título *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Organización</Label>
              <Select value={form.organization_id} onValueChange={v => setForm(p => ({ ...p, organization_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar OSC" /></SelectTrigger>
                <SelectContent>{orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Categoría</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["compliance", "technical", "billing", "general"].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Prioridad</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "urgent"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Descripción *</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required rows={3} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button type="submit" className="bg-violet-700 text-white">Crear Ticket</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.keys(statusLabels).map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="space-y-2">
            {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />) :
              filtered.map(t => {
                const org = orgs.find(o => o.id === t.organization_id);
                return (
                  <button key={t.id} onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTicket?.id === t.id ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-start justify-between mb-1.5">
                      <p className="font-medium text-slate-900 text-sm line-clamp-1">{t.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {org && <span>{org.name}</span>}
                      <span className={`font-medium ${priorityColors[t.priority]}`}>{t.priority}</span>
                      <span>{new Date(t.created_date).toLocaleDateString("es-MX")}</span>
                    </div>
                  </button>
                );
              })
            }
            {!loading && filtered.length === 0 && <p className="text-center py-8 text-slate-400">Sin tickets</p>}
          </div>
        </div>

        {/* Detail */}
        {selectedTicket && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedTicket.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[selectedTicket.status]}`}>{statusLabels[selectedTicket.status]}</span>
              </div>
              <p className="text-sm text-slate-600">{selectedTicket.description}</p>
            </div>

            {/* Status actions */}
            <div className="flex flex-wrap gap-2">
              {selectedTicket.status === "open" && <Button size="sm" onClick={() => updateStatus(selectedTicket.id, "in_progress")} className="bg-blue-600 text-white h-7 text-xs">Iniciar</Button>}
              {selectedTicket.status === "in_progress" && <Button size="sm" onClick={() => updateStatus(selectedTicket.id, "pending_osc")} variant="outline" className="h-7 text-xs">Pendiente OSC</Button>}
              {["in_progress", "pending_osc"].includes(selectedTicket.status) && <Button size="sm" onClick={() => updateStatus(selectedTicket.id, "resolved")} className="bg-emerald-600 text-white h-7 text-xs">Resolver</Button>}
              {selectedTicket.status === "resolved" && <Button size="sm" onClick={() => updateStatus(selectedTicket.id, "closed")} variant="outline" className="h-7 text-xs">Cerrar</Button>}
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notas del Caso</p>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {(selectedTicket.notes || []).map((n, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-sm text-slate-800">{n.text}</p>
                    <p className="text-xs text-slate-500 mt-1">{n.author} · {new Date(n.date).toLocaleString("es-MX")}</p>
                  </div>
                ))}
                {(!selectedTicket.notes || selectedTicket.notes.length === 0) && (
                  <p className="text-xs text-slate-400 py-2">Sin notas aún</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Agregar nota..." className="flex-1 h-9" onKeyDown={e => e.key === "Enter" && addNote(selectedTicket.id)} />
                <Button size="sm" onClick={() => addNote(selectedTicket.id)} className="bg-slate-900 text-white h-9">Agregar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}