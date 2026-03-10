import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency } from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettings() {
  const [umaList, setUmaList] = useState([]);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    daily_value_mxn: 117.31,
    threshold_identification_uma: 1605,
    threshold_notice_uma: 3210,
    source: "DOF",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("uma_config")
      .select("*")
      .order("year", { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
    } else {
      setUmaList(data || []);
    }

    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("uma_config").insert([
      {
        ...form,
        daily_value_mxn: parseFloat(form.daily_value_mxn),
        annual_value_mxn: parseFloat(form.daily_value_mxn) * 365,
        threshold_identification_uma: parseFloat(
          form.threshold_identification_uma,
        ),
        threshold_notice_uma: parseFloat(form.threshold_notice_uma),
      },
    ]);
    setSaving(false);
    loadData();
  }

  async function toggleActive(uma) {
    await supabase
      .from("uma_config")
      .update({ is_active: !uma.is_active })
      .eq("id", uma.id);
    loadData();
  }

  async function deleteUMA(id) {
    await supabase.from("uma_config").delete().eq("id", id);
    loadData();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Configuración Global UMA"
        subtitle="Gestión de valores UMA por año fiscal"
      />

      {/* New UMA config */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Agregar Configuración UMA
        </h2>
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Año Fiscal *
            </Label>
            <Input
              type="number"
              value={form.year}
              onChange={(e) =>
                setForm((p) => ({ ...p, year: parseInt(e.target.value) }))
              }
              required
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Valor Diario UMA (MXN) *
            </Label>
            <Input
              type="number"
              step="0.01"
              value={form.daily_value_mxn}
              onChange={(e) =>
                setForm((p) => ({ ...p, daily_value_mxn: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Fuente
            </Label>
            <Input
              value={form.source}
              onChange={(e) =>
                setForm((p) => ({ ...p, source: e.target.value }))
              }
              placeholder="DOF"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Umbral Identificación (UMAs)
            </Label>
            <Input
              type="number"
              value={form.threshold_identification_uma}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  threshold_identification_uma: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Umbral Aviso SAT (UMAs)
            </Label>
            <Input
              type="number"
              value={form.threshold_notice_uma}
              onChange={(e) =>
                setForm((p) => ({ ...p, threshold_notice_uma: e.target.value }))
              }
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-violet-700 hover:bg-violet-800 text-white gap-2 w-full"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>

      {/* UMA list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            Historial de Configuraciones UMA
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Año
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Valor Diario
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Valor Anual
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Umbral 1 (MXN)
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Umbral 2 (MXN)
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Activo
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array(7)
                        .fill(0)
                        .map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-slate-100 rounded animate-pulse" />
                          </td>
                        ))}
                    </tr>
                  ))
              : umaList.map((uma) => {
                  const annual =
                    uma.annual_value_mxn || uma.daily_value_mxn * 365;
                  const thr1MXN =
                    annual * (uma.threshold_identification_uma || 1605);
                  const thr2MXN = annual * (uma.threshold_notice_uma || 3210);
                  return (
                    <tr
                      key={uma.id}
                      className="border-b border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-900">
                        {uma.year}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-700">
                        {formatCurrency(uma.daily_value_mxn)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-700">
                        {formatCurrency(annual)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-amber-700 font-medium">
                        {formatCurrency(thr1MXN)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-red-700 font-medium">
                        {formatCurrency(thr2MXN)}
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => toggleActive(uma)}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${uma.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                        >
                          {uma.is_active ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-6 py-3.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteUMA(uma.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
