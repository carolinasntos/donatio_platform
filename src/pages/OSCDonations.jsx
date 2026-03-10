import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, AlertCircle, Search, Download } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import {
  mxnToUMA,
  calculate6MonthRolling,
  formatCurrency,
  formatUMA,
  UMA_DEFAULT,
  checkThresholds,
  getDeadlineDate,
} from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OSCDonations() {
  const [donations, setDonations] = useState([]);
  const [donors, setDonors] = useState([]);
  const [umaConfig, setUmaConfig] = useState(UMA_DEFAULT);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    donor_id: "",
    amount_mxn: "",
    donation_date: new Date().toISOString().split("T")[0],
    payment_method: "transferencia",
    description: "",
    reference: "",
    is_manual_entry: true,
  });
  const [cashWarning, setCashWarning] = useState(false);
  const [thresholdWarning, setThresholdWarning] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [donRes, donorRes, umaRes] = await Promise.all([
      supabase
        .from("donations")
        .select("*")
        .order("donation_date", { ascending: false })
        .limit(300),

      supabase
        .from("donors")
        .select("*")
        .order("created_date", { ascending: false })
        .limit(200),

      supabase
        .from("uma_config")
        .select("*")
        .eq("is_active", true)
        .order("year", { ascending: false })
        .limit(1),
    ]);

    if (donRes.data) setDonations(donRes.data);
    if (donorRes.data) setDonors(donorRes.data);
    if (umaRes.data?.length) setUmaConfig(umaRes.data[0]);

    setLoading(false);
  }

  function handleAmountChange(val) {
    setForm((prev) => ({ ...prev, amount_mxn: val }));
    if (form.donor_id && val) {
      const current6m = calculate6MonthRolling(donations, form.donor_id);
      const newTotal = current6m + parseFloat(val || 0);
      const newUMA = mxnToUMA(newTotal, umaConfig);
      const trigger = checkThresholds(newUMA, umaConfig);
      setThresholdWarning(
        trigger !== "none" ? { trigger, newTotal, newUMA } : null,
      );
    }
  }

  function handleMethodChange(val) {
    setForm((prev) => ({ ...prev, payment_method: val }));
    setCashWarning(val === "efectivo");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (cashWarning) return;
    setSaving(true);
    const amount = parseFloat(form.amount_mxn);
    const amountUMA = mxnToUMA(amount, umaConfig);
    const acc6m = calculate6MonthRolling(donations, form.donor_id) + amount;
    const accUMA = mxnToUMA(acc6m, umaConfig);
    const threshold = checkThresholds(accUMA, umaConfig);

    const { data: donation, error } = await supabase
      .from("donations")
      .insert({
        donor_id: form.donor_id,
        amount_mxn: amount,
        amount_uma: amountUMA,
        accumulated_6m_at_donation: acc6m,
        accumulated_uma_6m: accUMA,
        threshold_triggered: threshold,
        donation_date: form.donation_date,
        payment_method: form.payment_method,
        description: form.description,
        reference: form.reference,
        is_manual_entry: true,
      })
      .select()
      .single();

    // Create alert/case if threshold triggered
    if (threshold === "notice") {
      const deadline = getDeadlineDate(form.donation_date);
      await Promise.all([
        await supabase.from("compliance_cases").insert({
          donor_id: form.donor_id,
          case_type: "aviso_sat",
          threshold_triggered: "notice",
          threshold_uma: umaConfig.threshold_notice_uma || 3210,
          accumulated_mxn: acc6m,
          accumulated_uma: accUMA,
          trigger_date: form.donation_date,
          deadline_date: deadline.toISOString().split("T")[0],
          status: "pending",
        }),
        await supabase.from("alerts").insert({
          donor_id: form.donor_id,
          donation_id: donation.id,
          alert_type: "threshold_notice",
          severity: "high",
          title: "Umbral de Aviso SAT Activado",
          description: `Acumulado de ${formatCurrency(acc6m)} (${formatUMA(accUMA)}) supera umbral de aviso.`,
          status: "active",
        }),
      ]);
    } else if (threshold === "identification") {
      await supabase.from("alerts").insert({
        donor_id: form.donor_id,
        donation_id: donation.id,
        alert_type: "threshold_identification",
        severity: "medium",
        title: "Identificación Reforzada Requerida",
        description: `Acumulado de ${formatCurrency(acc6m)} (${formatUMA(accUMA)}) supera umbral de identificación.`,
        status: "active",
      });

      await supabase
        .from("donors")
        .update({ compliance_status: "identification_required" })
        .eq("id", form.donor_id);
    }

    setSaving(false);
    setShowForm(false);
    setForm({
      donor_id: "",
      amount_mxn: "",
      donation_date: new Date().toISOString().split("T")[0],
      payment_method: "transferencia",
      description: "",
      reference: "",
      is_manual_entry: true,
    });
    setCashWarning(false);
    setThresholdWarning(null);
    loadData();
  }

  const filtered = donations.filter((d) => {
    if (!search) return true;
    const donor = donors.find((dr) => dr.id === d.donor_id);
    return (
      donor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.reference?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalMXN = donations.reduce((s, d) => s + (d.amount_mxn || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Donativos"
        subtitle={`Total registrado: ${formatCurrency(totalMXN)}`}
        actions={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Registrar Donativo
          </Button>
        }
      />

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Nuevo Donativo (Captura Manual)
          </h3>
          {cashWarning && (
            <Alert className="mb-4 border-red-300 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-700 font-medium">
                ⛔ BLOQUEADO: Los donativos en efectivo no están permitidos bajo
                la normativa AML/LFPIORPI. Selecciona otro método de pago.
              </AlertDescription>
            </Alert>
          )}
          {thresholdWarning && (
            <Alert
              className={`mb-4 ${thresholdWarning.trigger === "notice" ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}
            >
              <AlertCircle
                className={`w-4 h-4 ${thresholdWarning.trigger === "notice" ? "text-red-600" : "text-amber-600"}`}
              />
              <AlertDescription
                className={
                  thresholdWarning.trigger === "notice"
                    ? "text-red-700"
                    : "text-amber-700"
                }
              >
                {thresholdWarning.trigger === "notice"
                  ? `⚠️ OBLIGACIÓN DE AVISO: Al registrar este donativo, el acumulado llegará a ${formatCurrency(thresholdWarning.newTotal)} (${formatUMA(thresholdWarning.newUMA)}), superando el umbral de 3,210 UMAs. Se generará un Caso de Aviso SAT.`
                  : `⚠️ Identificación Reforzada: El acumulado llegará a ${formatCurrency(thresholdWarning.newTotal)} (${formatUMA(thresholdWarning.newUMA)}), superando el umbral de 1,605 UMAs.`}
              </AlertDescription>
            </Alert>
          )}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Donante *
              </Label>
              <Select
                value={form.donor_id}
                onValueChange={(v) => setForm((p) => ({ ...p, donor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar donante" />
                </SelectTrigger>
                <SelectContent>
                  {donors
                    .filter((d) => d.status !== "blocked")
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name} — {d.rfc || "Sin RFC"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Monto (MXN) *
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount_mxn}
                onChange={(e) => handleAmountChange(e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Fecha del Donativo *
              </Label>
              <Input
                type="date"
                value={form.donation_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, donation_date: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Método de Pago *
              </Label>
              <Select
                value={form.payment_method}
                onValueChange={handleMethodChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">
                    Transferencia Bancaria
                  </SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="efectivo">
                    ⛔ Efectivo (No permitido)
                  </SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Referencia / Folio
              </Label>
              <Input
                value={form.reference}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reference: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Descripción
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setCashWarning(false);
                  setThresholdWarning(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={cashWarning || saving}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                {saving ? "Guardando..." : "Registrar Donativo"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar donativo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Donante
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Fecha
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Monto
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Método
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Acum. 6M
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Umbral
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Referencia
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5)
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
                : filtered.map((don) => {
                    const donor = donors.find((d) => d.id === don.donor_id);
                    return (
                      <tr
                        key={don.id}
                        className="border-b border-slate-50 hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                          {donor?.full_name || don.donor_id}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600">
                          {don.donation_date}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-bold text-slate-900">
                          {formatCurrency(don.amount_mxn)}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${don.payment_method === "efectivo" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}
                          >
                            {don.payment_method}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-700">
                          {formatCurrency(don.accumulated_6m_at_donation)}
                        </td>
                        <td className="px-6 py-3.5">
                          {don.threshold_triggered === "notice" && (
                            <Badge className="bg-red-100 text-red-700 border border-red-200">
                              Aviso SAT
                            </Badge>
                          )}
                          {don.threshold_triggered === "identification" && (
                            <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                              Identificación
                            </Badge>
                          )}
                          {(!don.threshold_triggered ||
                            don.threshold_triggered === "none") && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-500 font-mono">
                          {don.reference || "—"}
                        </td>
                      </tr>
                    );
                  })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No hay donativos registrados
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
