import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Upload, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";
import { DOCUMENT_TYPES, checkDocumentCompleteness } from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DonorDocuments() {
  const [donor, setDonor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ document_type: "", expiry_date: "" });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: donors } = await supabase
  .from("donors")
  .select("*")
  .eq("portal_user_email", user.email)
  .limit(1);

if (donors && donors.length > 0) {
  setDonor(donors[0]);

  const { data: docs } = await supabase
    .from("donor_documents")
    .select("*")
    .eq("donor_id", donors[0].id)
    .order("created_date", { ascending: false })
    .limit(50);

  setDocuments(docs || []);
}
    }
    setLoading(false);
  }

  async function handleUpload(e) {
  e.preventDefault();

  if (!file || !donor) return;

  setUploading(true);

  const filePath = `documents/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) {
    console.error(uploadError);
    setUploading(false);
    return;
  }

  const { data } = supabase.storage
    .from("documents")
    .getPublicUrl(filePath);

  const file_url = data.publicUrl;

  await supabase.from("donor_documents").insert({
    donor_id: donor.id,
    organization_id: donor.organization_id,
    document_type: form.document_type,
    document_name: file.name,
    file_url,
    upload_date: new Date().toISOString().split("T")[0],
    expiry_date: form.expiry_date || null,
    status: "pending",
  });

  setFile(null);
  setForm({ document_type: "", expiry_date: "" });
  setShowUpload(false);
  setUploading(false);

  loadData();
}

  if (!donor && !loading) return (
    <div className="p-6 max-w-2xl mx-auto text-center py-20">
      <p className="text-slate-500">Primero debes registrarte como donante desde el Portal Donante.</p>
    </div>
  );

  const required = donor ? Object.entries(DOCUMENT_TYPES).filter(([, c]) => c.required_for.includes(donor.donor_type)).map(([k]) => k) : [];
  if (donor?.beneficial_owner_exists) required.push("identificacion_dueno_beneficiario");
  const completeness = donor ? checkDocumentCompleteness(documents, donor.donor_type, donor.beneficial_owner_exists) : { missing: [], expired: [], isComplete: false };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Documentos</h1>
          <p className="text-slate-500 text-sm mt-1">Expediente digital requerido para cumplimiento AML</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <Upload className="w-4 h-4" /> Subir Documento
        </Button>
      </div>

      {/* Completeness */}
      <div className={`p-4 rounded-2xl border ${completeness.isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          {completeness.isComplete
            ? <><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-emerald-800">Expediente Completo — KYC OK</span></>
            : <><Clock className="w-5 h-5 text-amber-600" /><span className="font-semibold text-amber-800">{completeness.missing.length} documento(s) pendiente(s)</span></>
          }
        </div>
        {completeness.missing.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {completeness.missing.map(m => (
              <span key={m} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">{DOCUMENT_TYPES[m]?.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* Upload form */}
      {showUpload && (
        <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Subir Documento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Tipo de Documento *</Label>
              <Select value={form.document_type} onValueChange={v => setForm(p => ({ ...p, document_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPES).filter(([, c]) => !c.required_for.length || c.required_for.includes(donor?.donor_type)).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}{required.includes(k) ? " *" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Fecha de Vencimiento</Label>
              <Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Archivo (PDF, JPG, PNG) *</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} required className="h-auto py-1.5" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button type="submit" disabled={uploading || !form.document_type} className="bg-teal-600 text-white">
              {uploading ? "Subiendo..." : "Subir Archivo"}
            </Button>
          </div>
        </form>
      )}

      {/* Document checklist */}
      <div className="space-y-2">
        {loading ? Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />) :
          required.map(reqType => {
            const docs = documents.filter(d => d.document_type === reqType);
            const latestDoc = docs[docs.length - 1];
            const isExpired = latestDoc?.expiry_date && new Date(latestDoc.expiry_date) < new Date();
            return (
              <div key={reqType} className={`flex items-center justify-between p-4 rounded-xl border ${latestDoc && !isExpired ? 'bg-emerald-50 border-emerald-200' : isExpired ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  {latestDoc && !isExpired ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : isExpired ? <XCircle className="w-5 h-5 text-red-600" /> : <Clock className="w-5 h-5 text-slate-400" />}
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{DOCUMENT_TYPES[reqType]?.label}</p>
                    {latestDoc && <p className="text-xs text-slate-500 mt-0.5">{latestDoc.document_name} · {latestDoc.status === 'valid' ? '✓ Verificado' : 'Pendiente verificación'}</p>}
                    {!latestDoc && <p className="text-xs text-slate-400 mt-0.5">Pendiente de carga</p>}
                  </div>
                </div>
                {latestDoc && (
                  <a href={latestDoc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                  </a>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}