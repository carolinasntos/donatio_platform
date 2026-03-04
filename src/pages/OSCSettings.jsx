import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Settings, Save, Calculator } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { UMA_DEFAULT, umaToMXN, formatCurrency } from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OSCSettings() {
  const [umaConfig, setUmaConfig] = useState(null);
  const [form, setForm] = useState({ year: 2026, daily_value_mxn: 117.31, threshold_identification_uma: 1605, threshold_notice_uma: 3210, source: "DOF", notes: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const uma = await base44.entities.UMAConfig.filter({ is_active: true }, "-year", 1);
    if (uma.length > 0) {
      setUmaConfig(uma[0]);
      setForm(uma[0]);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const annual = form.daily_value_mxn * 365;
    const data = { ...form, annual_value_mxn: annual, is_active: true, daily_value_mxn: parseFloat(form.daily_value_mxn), threshold_identification_uma: parseFloat(form.threshold_identification_uma), threshold_notice_uma: parseFloat(form.threshold_notice_uma) };
    if (umaConfig?.id) {
      await base44.entities.UMAConfig.update(umaConfig.id, data);
    } else {
      await base44.entities.UMAConfig.create(data);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadData();
  }

  const annual = parseFloat(form.daily_value_mxn || 0) * 365;
  const threshold1MXN = annual * parseFloat(form.threshold_identification_uma || 0);
  const threshold2MXN = annual * parseFloat(form.threshold_notice_uma || 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader title="Configuración" subtitle="Parámetros normativos y valores UMA" />

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-slate-700" />
          </div>
          <h2 className="font-bold text-slate-900">Configuración UMA</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Año Fiscal</Label>
              <Input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Valor Diario UMA (MXN)</Label>
              <Input type="number" step="0.01" value={form.daily_value_mxn} onChange={e => setForm(p => ({ ...p, daily_value_mxn: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Umbral 1: Identificación (UMAs)</Label>
              <Input type="number" value={form.threshold_identification_uma} onChange={e => setForm(p => ({ ...p, threshold_identification_uma: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Umbral 2: Obligación de Aviso (UMAs)</Label>
              <Input type="number" value={form.threshold_notice_uma} onChange={e => setForm(p => ({ ...p, threshold_notice_uma: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Fuente (DOF, etc.)</Label>
              <Input value={form.source || ""} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="DOF" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Notas</Label>
              <Input value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          {/* Calculated values */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Valores Calculados</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">UMA Anual</p>
                <p className="font-bold text-slate-900">{formatCurrency(annual)}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-600 mb-1">Umbral 1 en MXN</p>
                <p className="font-bold text-amber-900">{formatCurrency(threshold1MXN)}</p>
                <p className="text-xs text-amber-600">{form.threshold_identification_uma} UMAs</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-xs text-red-600 mb-1">Umbral 2 en MXN</p>
                <p className="font-bold text-red-900">{formatCurrency(threshold2MXN)}</p>
                <p className="text-xs text-red-600">{form.threshold_notice_uma} UMAs</p>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar Configuración"}
          </Button>
        </form>
      </div>

      {/* Reglas normativas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Reglas Normativas LFPIORPI</h2>
        <div className="space-y-3 text-sm text-slate-600">
          {[
            { icon: "📅", text: "Ventana de acumulación: 6 meses móviles por donante." },
            { icon: "⚠️", text: `Al superar ${form.threshold_identification_uma} UMAs (${formatCurrency(threshold1MXN)}): se activa Identificación Reforzada del donante.` },
            { icon: "🚨", text: `Al superar ${form.threshold_notice_uma} UMAs (${formatCurrency(threshold2MXN)}): se activa Obligación de Aviso al SAT.` },
            { icon: "📆", text: "Plazo para presentar aviso: día 17 del mes siguiente a cuando se rebasó el umbral." },
            { icon: "⛔", text: "Donativos en efectivo: PROHIBIDOS. Se genera alerta crítica y bloqueo inmediato." },
            { icon: "📋", text: "Expediente del donante debe mantenerse completo antes de aceptar donativos." },
          ].map(({ icon, text }, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="flex-shrink-0 text-base">{icon}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}