import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import {
  DOCUMENT_TYPES,
  checkDocumentCompleteness,
  formatCurrency,
} from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function OSCExpedientes() {
  const [donors, setDonors] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    document_type: "",
    expiry_date: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [donorRes, docsRes] = await Promise.all([
      supabase
        .from("donors")
        .select("*")
        .order("created_date", { ascending: false })
        .limit(200),

      supabase
        .from("donor_documents")
        .select("*")
        .order("created_date", { ascending: false })
        .limit(500),
    ]);

    if (donorRes.data) setDonors(donorRes.data);
    if (docsRes.data) setDocuments(docsRes.data);

    if (donorRes.data?.length && !selectedDonor)
      setSelectedDonor(donorRes.data[0]);

    setLoading(false);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !selectedDonor) return;
    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("donor-documents")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("donor-documents")
      .getPublicUrl(fileName);

    const file_url = urlData.publicUrl;
    await supabase.from("donor_documents").insert({
      donor_id: selectedDonor.id,
      organization_id: selectedDonor.organization_id,
      document_type: uploadForm.document_type,
      document_name: file.name,
      file_url: file_url,
      upload_date: new Date().toISOString().split("T")[0],
      expiry_date: uploadForm.expiry_date || null,
      notes: uploadForm.notes,
      status: "pending",
      is_verified: false,
    });
    setShowUpload(false);
    setFile(null);
    setUploadForm({ document_type: "", expiry_date: "", notes: "" });
    setUploading(false);
    loadData();
  }

  async function verifyDocument(docId) {
    const { data: userData } = await supabase.auth.getUser();

    await supabase
      .from("donor_documents")
      .update({
        is_verified: true,
        verified_by: userData.user.email,
        verified_date: new Date().toISOString().split("T")[0],
        status: "valid",
      })
      .eq("id", docId);

    loadData();
  }

  async function deleteDocument(docId) {
    await supabase.from("donor_documents").delete().eq("id", docId);
    loadData();
  }

  const filteredDonors = donors.filter(
    (d) =>
      !search ||
      d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.rfc?.toLowerCase().includes(search.toLowerCase()),
  );

  const donorDocs = selectedDonor
    ? documents.filter((d) => d.donor_id === selectedDonor.id)
    : [];
  const completeness = selectedDonor
    ? checkDocumentCompleteness(
        donorDocs,
        selectedDonor.donor_type,
        selectedDonor.beneficial_owner_exists,
      )
    : { missing: [], expired: [], isComplete: false };

  const required = selectedDonor
    ? Object.entries(DOCUMENT_TYPES)
        .filter(([, c]) => c.required_for.includes(selectedDonor.donor_type))
        .map(([k]) => k)
    : [];
  if (selectedDonor?.beneficial_owner_exists)
    required.push("identificacion_dueno_beneficiario");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Expedientes Digitales"
        subtitle="Gestión documental y checklist de cumplimiento por donante"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donor list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar donante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredDonors.map((d) => {
              const dDocs = documents.filter((doc) => doc.donor_id === d.id);
              const comp = checkDocumentCompleteness(
                dDocs,
                d.donor_type,
                d.beneficial_owner_exists,
              );
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDonor(d)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${selectedDonor?.id === d.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p
                        className={`font-medium text-sm truncate ${selectedDonor?.id === d.id ? "text-white" : "text-slate-900"}`}
                      >
                        {d.full_name}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${selectedDonor?.id === d.id ? "text-white/60" : "text-slate-500"}`}
                      >
                        {d.rfc || "Sin RFC"}
                      </p>
                    </div>
                    {comp.isComplete ? (
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${selectedDonor?.id === d.id ? "text-emerald-400" : "text-emerald-500"}`}
                      />
                    ) : (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${selectedDonor?.id === d.id ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700"}`}
                      >
                        {comp.missing.length} faltantes
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDonor ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-slate-900 text-lg">
                      {selectedDonor.full_name}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      RFC: {selectedDonor.rfc || "—"} ·{" "}
                      {selectedDonor.donor_type === "fisica"
                        ? "Persona Física"
                        : "Persona Moral"}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowUpload(!showUpload)}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Subir Documento
                  </Button>
                </div>

                {/* Completeness */}
                <div
                  className={`p-3.5 rounded-xl border mb-4 ${completeness.isComplete ? "bg-emerald-50 border-emerald-200" : completeness.missing.length > 0 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="flex items-center gap-2">
                    {completeness.isComplete ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">
                          Expediente Completo
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">
                          {completeness.missing.length} documento(s) faltante(s)
                        </span>
                      </>
                    )}
                  </div>
                  {completeness.missing.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {completeness.missing.map((m) => (
                        <span
                          key={m}
                          className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full"
                        >
                          {DOCUMENT_TYPES[m]?.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {completeness.expired.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {completeness.expired.map((d) => (
                        <span
                          key={d.id}
                          className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full"
                        >
                          ⚠ {DOCUMENT_TYPES[d.document_type]?.label} vencido
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload form */}
                {showUpload && (
                  <form
                    onSubmit={handleUpload}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3"
                  >
                    <h3 className="font-semibold text-slate-800 text-sm">
                      Subir Documento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                          Tipo de Documento *
                        </Label>
                        <Select
                          value={uploadForm.document_type}
                          onValueChange={(v) =>
                            setUploadForm((p) => ({ ...p, document_type: v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DOCUMENT_TYPES).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v.label}
                                {required.includes(k) ? " *" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                          Fecha de Vencimiento
                        </Label>
                        <Input
                          type="date"
                          value={uploadForm.expiry_date}
                          onChange={(e) =>
                            setUploadForm((p) => ({
                              ...p,
                              expiry_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                          Archivo *
                        </Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setFile(e.target.files[0])}
                          required
                          className="h-auto py-1.5"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                          Notas
                        </Label>
                        <Input
                          value={uploadForm.notes}
                          onChange={(e) =>
                            setUploadForm((p) => ({
                              ...p,
                              notes: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUpload(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={uploading}
                        className="bg-slate-900 text-white"
                      >
                        {uploading ? "Subiendo..." : "Subir Archivo"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Checklist */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Documentos Requeridos
                  </p>
                  {required.map((reqType) => {
                    const docs = donorDocs.filter(
                      (d) => d.document_type === reqType,
                    );
                    const latestDoc = docs[docs.length - 1];
                    const isExpired =
                      latestDoc?.expiry_date &&
                      new Date(latestDoc.expiry_date) < new Date();
                    return (
                      <div
                        key={reqType}
                        className={`flex items-center justify-between p-3 rounded-xl border ${latestDoc && !isExpired ? "bg-emerald-50 border-emerald-200" : isExpired ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="flex items-center gap-3">
                          {latestDoc && !isExpired ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : isExpired ? (
                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {DOCUMENT_TYPES[reqType]?.label}
                            </p>
                            {latestDoc && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {latestDoc.document_name} ·{" "}
                                {latestDoc.upload_date}
                                {latestDoc.is_verified
                                  ? " · ✓ Verificado"
                                  : " · Pendiente verificación"}
                                {isExpired && " · ⚠ VENCIDO"}
                              </p>
                            )}
                          </div>
                        </div>
                        {latestDoc && (
                          <div className="flex items-center gap-1">
                            <a
                              href={latestDoc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                            {!latestDoc.is_verified && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => verifyDocument(latestDoc.id)}
                                className="h-7 text-xs text-emerald-700 hover:text-emerald-800 px-2"
                              >
                                Verificar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteDocument(latestDoc.id)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Additional docs */}
                {donorDocs.filter((d) => !required.includes(d.document_type))
                  .length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Documentos Adicionales
                    </p>
                    <div className="space-y-2">
                      {donorDocs
                        .filter((d) => !required.includes(d.document_type))
                        .map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {doc.document_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {DOCUMENT_TYPES[doc.document_type]?.label} ·{" "}
                                  {doc.upload_date}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteDocument(doc.id)}
                                className="h-7 w-7 p-0 text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FileText className="w-12 h-12 mb-3" />
              <p>Selecciona un donante para ver su expediente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
