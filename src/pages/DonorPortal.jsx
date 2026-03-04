import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Shield, FileText, AlertCircle, CheckCircle2, User, Building2, ArrowRight } from "lucide-react";
import { formatCurrency, DOCUMENT_TYPES, checkDocumentCompleteness } from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DonorPortal() {
  const [user, setUser] = useState(null);
  const [donor, setDonor] = useState(null);
  const [donations, setDonations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [donateForm, setDonateForm] = useState({ amount_mxn: "", description: "", payment_method: "transferencia" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registerForm, setRegisterForm] = useState({ donor_type: "fisica", full_name: "", rfc: "", email: "", phone: "", address: "", city: "", state: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (u) {
      const donors = await base44.entities.Donor.filter({ portal_user_email: u.email }, "-created_date", 1).catch(() => []);
      if (donors.length > 0) {
        setDonor(donors[0]);
        const [dons, docs] = await Promise.all([
          base44.entities.Donation.filter({ donor_id: donors[0].id }, "-donation_date", 20),
          base44.entities.DonorDocument.filter({ donor_id: donors[0].id }, "-created_date", 20),
        ]);
        setDonations(dons);
        setDocuments(docs);
      }
    }
    setLoading(false);
  }

  async function handleDonate(e) {
    e.preventDefault();
    if (donateForm.payment_method === "efectivo") return;
    if (!donor) return;
    setSaving(true);
    await base44.entities.Donation.create({
      donor_id: donor.id,
      organization_id: donor.organization_id,
      amount_mxn: parseFloat(donateForm.amount_mxn),
      donation_date: new Date().toISOString().split("T")[0],
      payment_method: donateForm.payment_method,
      description: donateForm.description,
      status: "registered",
    });
    setSaving(false);
    setShowDonateForm(false);
    setDonateForm({ amount_mxn: "", description: "", payment_method: "transferencia" });
    loadData();
  }

  async function handleRegister(e) {
    e.preventDefault();
    setSaving(true);
    const newDonor = await base44.entities.Donor.create({
      ...registerForm,
      portal_user_email: user?.email || registerForm.email,
      status: "pending",
      compliance_status: "incomplete",
      kyc_complete: false,
    });
    setDonor(newDonor);
    setSaving(false);
    setShowRegisterForm(false);
    loadData();
  }

  const completeness = donor ? checkDocumentCompleteness(documents, donor.donor_type, donor.beneficial_owner_exists) : { missing: [], expired: [], isComplete: false };
  const totalDonated = donations.reduce((s, d) => s + (d.amount_mxn || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900">
      {/* Hero nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <Heart className="w-4 h-4 text-teal-400" />
          </div>
          <span className="font-bold text-white">Portal Donante</span>
        </div>
        {user && <span className="text-teal-300 text-sm">{user.email}</span>}
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* If not registered as donor */}
        {!donor && !showRegisterForm && (
          <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/15 p-8 text-center">
            <Heart className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Bienvenido al Portal de Donantes</h2>
            <p className="text-teal-200 mb-6 max-w-md mx-auto">Registra tu información para comenzar el proceso de donación de manera transparente y conforme a la normativa AML.</p>
            <Button onClick={() => setShowRegisterForm(true)} className="bg-teal-500 hover:bg-teal-400 text-white gap-2">
              <User className="w-4 h-4" /> Registrarme como Donante
            </Button>
          </div>
        )}

        {/* Register form */}
        {showRegisterForm && (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="font-bold text-slate-900 text-xl mb-5">Registro de Donante</h2>
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="flex gap-3">
                {["fisica", "moral"].map(t => (
                  <button key={t} type="button" onClick={() => setRegisterForm(p => ({ ...p, donor_type: t }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-colors
                      ${registerForm.donor_type === t ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 text-slate-600 hover:border-teal-300"}`}>
                    {t === "fisica" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    {t === "fisica" ? "Persona Física" : "Persona Moral"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Nombre completo / Razón Social *</Label>
                  <Input value={registerForm.full_name} onChange={e => setRegisterForm(p => ({ ...p, full_name: e.target.value }))} required />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">RFC</Label>
                  <Input value={registerForm.rfc} onChange={e => setRegisterForm(p => ({ ...p, rfc: e.target.value.toUpperCase() }))} className="font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Correo Electrónico</Label>
                  <Input type="email" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Teléfono</Label>
                  <Input value={registerForm.phone} onChange={e => setRegisterForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Ciudad</Label>
                  <Input value={registerForm.city} onChange={e => setRegisterForm(p => ({ ...p, city: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowRegisterForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white">{saving ? "Registrando..." : "Completar Registro"}</Button>
              </div>
            </form>
          </div>
        )}

        {/* Donor dashboard */}
        {donor && (
          <>
            {/* Status card */}
            <div className={`rounded-2xl p-5 border ${donor.status === 'blocked' ? 'bg-red-900/30 border-red-500/30' : donor.kyc_complete ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-white/10 border-white/15'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-white text-xl">{donor.full_name}</h2>
                  <p className="text-teal-300 text-sm mt-0.5">RFC: {donor.rfc || "—"}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                  donor.status === 'blocked' ? 'bg-red-500 text-white' :
                  donor.kyc_complete ? 'bg-emerald-500 text-white' :
                  'bg-amber-500 text-slate-900'
                }`}>
                  {donor.status === 'blocked' ? '⛔ Bloqueado' : donor.kyc_complete ? '✓ Verificado' : '⏳ En proceso'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-teal-300 text-xs mb-1">Total Donado</p>
                  <p className="text-white font-bold">{formatCurrency(totalDonated)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-teal-300 text-xs mb-1">Donaciones</p>
                  <p className="text-white font-bold">{donations.length}</p>
                </div>
              </div>
            </div>

            {/* Document status */}
            {!completeness.isComplete && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="font-semibold text-amber-800">Expediente Incompleto</p>
                </div>
                <p className="text-sm text-amber-700 mb-3">Para procesar donativos, necesitamos los siguientes documentos:</p>
                <div className="flex flex-wrap gap-2">
                  {completeness.missing.map(m => (
                    <span key={m} className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">{DOCUMENT_TYPES[m]?.label}</span>
                  ))}
                </div>
                <Link to={createPageUrl("DonorDocuments")}>
                  <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white gap-2">
                    <Shield className="w-3.5 h-3.5" /> Subir Documentos
                  </Button>
                </Link>
              </div>
            )}

            {/* Blocked warning */}
            {donor.status === "blocked" && (
              <Alert className="border-red-300 bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700 font-medium">Tu cuenta ha sido bloqueada. Por favor contacta a la organización para más información.</AlertDescription>
              </Alert>
            )}

            {/* Donate button */}
            {donor.status !== "blocked" && (
              <button onClick={() => setShowDonateForm(!showDonateForm)}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-2xl p-5 flex items-center justify-between transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Realizar Donativo</p>
                    <p className="text-teal-100 text-sm">Registra una nueva donación</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Donate form */}
            {showDonateForm && (
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold text-slate-900 mb-4">Nuevo Donativo</h3>
                {donateForm.payment_method === "efectivo" && (
                  <Alert className="mb-4 border-red-300 bg-red-50">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-700 font-medium">⛔ Los donativos en efectivo no están permitidos por la normativa AML.</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleDonate} className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Monto (MXN) *</Label>
                    <Input type="number" min="1" step="0.01" value={donateForm.amount_mxn} onChange={e => setDonateForm(p => ({ ...p, amount_mxn: e.target.value }))} required placeholder="0.00" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Método de Pago *</Label>
                    <Select value={donateForm.payment_method} onValueChange={v => setDonateForm(p => ({ ...p, payment_method: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="efectivo">⛔ Efectivo (No permitido)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Concepto / Descripción</Label>
                    <Input value={donateForm.description} onChange={e => setDonateForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowDonateForm(false)}>Cancelar</Button>
                    <Button type="submit" disabled={saving || donateForm.payment_method === "efectivo"} className="bg-teal-600 hover:bg-teal-700 text-white">
                      {saving ? "Registrando..." : "Confirmar Donativo"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Recent donations */}
            <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/15 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Historial de Donaciones</h3>
                <Link to={createPageUrl("DonorDonations")}>
                  <Button size="sm" variant="ghost" className="text-teal-300 hover:text-white text-xs h-7">Ver todo</Button>
                </Link>
              </div>
              <div className="space-y-2">
                {donations.slice(0, 5).map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-white/8">
                    <div>
                      <p className="text-white font-medium text-sm">{formatCurrency(d.amount_mxn)}</p>
                      <p className="text-teal-300 text-xs">{d.donation_date} · {d.payment_method}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Registrado</span>
                  </div>
                ))}
                {donations.length === 0 && (
                  <p className="text-center py-6 text-teal-400 text-sm">Aún no has realizado donaciones</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}