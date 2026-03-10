import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  Download,
  Copy,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import {
  formatCurrency,
  formatUMA,
  getDaysUntilDeadline,
  UMA_DEFAULT,
} from "@/components/amlEngine";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SATTemplate from "@/components/osc/SATTemplate.jsx";

const STATUS_STEPS = [
  { key: "pending", label: "Pendiente", icon: Clock },
  { key: "in_preparation", label: "En Preparación", icon: FileText },
  { key: "captured_sat", label: "Capturado en SAT", icon: FileText },
  { key: "presented", label: "Presentado", icon: CheckCircle2 },
  { key: "closed", label: "Cerrado", icon: CheckCircle2 },
];

export default function OSCComplianceCases() {
  const [cases, setCases] = useState([]);
  const [donors, setDonors] = useState([]);
  const [umaConfig, setUmaConfig] = useState(UMA_DEFAULT);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const [satFolio, setSatFolio] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [casesRes, donorsRes, umaRes] = await Promise.all([
      supabase
        .from("compliance_cases")
        .select("*")
        .order("created_date", { ascending: false })
        .limit(100),

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

    if (casesRes.data) setCases(casesRes.data);
    if (donorsRes.data) setDonors(donorsRes.data);
    if (umaRes.data?.length) setUmaConfig(umaRes.data[0]);

    setLoading(false);
  }

  async function updateStatus(caseId, newStatus) {
    await supabase
      .from("compliance_cases")
      .update({ status: newStatus })
      .eq("id", caseId);

    loadData();
  }

  async function uploadEvidence(caseId) {
    if (!evidenceFile) return;

    setUploading(true);

    const fileName = `${Date.now()}_${evidenceFile.name}`;

    await supabase.storage.from("evidence").upload(fileName, evidenceFile);

    const { data: urlData } = supabase.storage
      .from("evidence")
      .getPublicUrl(fileName);

    const file_url = urlData.publicUrl;

    await supabase
      .from("compliance_cases")
      .update({
        evidence_url: file_url,
        sat_folio: satFolio,
        notes,
        status: "presented",
        presented_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", caseId);

    setEvidenceFile(null);
    setSatFolio("");
    setNotes("");
    setUploading(false);

    loadData();
  }

  const filtered = cases.filter(
    (c) => filterStatus === "all" || c.status === filterStatus,
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Avisos SAT"
        subtitle="Gestión de casos y obligación de aviso al SAT"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases list */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_preparation">En Preparación</SelectItem>
                <SelectItem value="captured_sat">Capturado SAT</SelectItem>
                <SelectItem value="presented">Presentado</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-500">
              {filtered.length} caso(s)
            </span>
          </div>

          <div className="space-y-3">
            {loading &&
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse"
                  >
                    <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                ))}
            {!loading &&
              filtered.map((c) => {
                const donor = donors.find((d) => d.id === c.donor_id);
                const days = c.deadline_date
                  ? getDaysUntilDeadline(c.deadline_date)
                  : null;
                const isOverdue =
                  days !== null &&
                  days < 0 &&
                  !["closed", "presented"].includes(c.status);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCase(c);
                      setShowTemplate(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all hover:shadow-sm ${
                      selectedCase?.id === c.id
                        ? "border-slate-900 bg-slate-50"
                        : isOverdue
                          ? "border-red-200 bg-red-50"
                          : c.status === "presented" || c.status === "closed"
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {donor?.full_name || "Donante"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatCurrency(c.accumulated_mxn)} ·{" "}
                          {formatUMA(c.accumulated_uma)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusPill status={c.status} />
                        {days !== null &&
                          !["closed", "presented"].includes(c.status) && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${isOverdue ? "bg-red-100 text-red-700" : days <= 5 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                            >
                              {isOverdue
                                ? `⚠ Vencido ${Math.abs(days)}d`
                                : `${days}d restantes`}
                            </span>
                          )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Activado: {c.trigger_date} · Límite: {c.deadline_date}
                    </p>
                  </button>
                );
              })}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <p>Sin casos en esta categoría</p>
              </div>
            )}
          </div>
        </div>

        {/* Case detail */}
        {selectedCase && !showTemplate && (
          <CaseDetail
            complianceCase={selectedCase}
            donor={donors.find((d) => d.id === selectedCase.donor_id)}
            onUpdateStatus={updateStatus}
            onUploadEvidence={uploadEvidence}
            onShowTemplate={() => setShowTemplate(true)}
            evidenceFile={evidenceFile}
            setEvidenceFile={setEvidenceFile}
            satFolio={satFolio}
            setSatFolio={setSatFolio}
            notes={notes}
            setNotes={setNotes}
            uploading={uploading}
          />
        )}

        {selectedCase && showTemplate && (
          <SATTemplate
            complianceCase={selectedCase}
            donor={donors.find((d) => d.id === selectedCase.donor_id)}
            umaConfig={umaConfig}
            onBack={() => setShowTemplate(false)}
          />
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: "bg-slate-100 text-slate-600",
    in_preparation: "bg-blue-100 text-blue-700",
    captured_sat: "bg-amber-100 text-amber-700",
    presented: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-200 text-slate-500",
    overdue: "bg-red-100 text-red-700",
  };
  const labels = {
    pending: "Pendiente",
    in_preparation: "En Preparación",
    captured_sat: "Capturado SAT",
    presented: "Presentado",
    closed: "Cerrado",
    overdue: "Vencido",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || map.pending}`}
    >
      {labels[status] || status}
    </span>
  );
}

function CaseDetail({
  complianceCase: c,
  donor,
  onUpdateStatus,
  onUploadEvidence,
  onShowTemplate,
  evidenceFile,
  setEvidenceFile,
  satFolio,
  setSatFolio,
  notes,
  setNotes,
  uploading,
}) {
  const days = c.deadline_date ? getDaysUntilDeadline(c.deadline_date) : null;
  const isOverdue = days !== null && days < 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-900">Detalle del Caso</h3>
          <StatusPill status={c.status} />
        </div>
        {donor && (
          <p className="text-sm text-slate-600 font-medium">
            {donor.full_name}
          </p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">
          RFC: {donor?.rfc || "—"}
        </p>
      </div>

      {/* Deadline banner */}
      {days !== null && !["closed", "presented"].includes(c.status) && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 ${isOverdue ? "bg-red-50 border-red-200" : days <= 5 ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}
        >
          <Clock
            className={`w-5 h-5 flex-shrink-0 ${isOverdue ? "text-red-600" : days <= 5 ? "text-amber-600" : "text-blue-600"}`}
          />
          <div>
            <p
              className={`text-sm font-semibold ${isOverdue ? "text-red-800" : days <= 5 ? "text-amber-800" : "text-blue-800"}`}
            >
              {isOverdue
                ? `Plazo VENCIDO hace ${Math.abs(days)} días`
                : `${days} días para presentar aviso`}
            </p>
            <p
              className={`text-xs ${isOverdue ? "text-red-600" : "text-slate-500"}`}
            >
              Fecha límite: {c.deadline_date} (día 17 del mes siguiente)
            </p>
          </div>
        </div>
      )}

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Acumulado 6M</p>
          <p className="font-bold text-slate-900">
            {formatCurrency(c.accumulated_mxn)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Equivalente UMA</p>
          <p className="font-bold text-slate-900">
            {formatUMA(c.accumulated_uma)}
          </p>
        </div>
      </div>

      {/* Status flow */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Flujo del Caso
        </p>
        <div className="flex items-center gap-1">
          {STATUS_STEPS.map((step, i) => {
            const stepOrder = [
              "pending",
              "in_preparation",
              "captured_sat",
              "presented",
              "closed",
            ];
            const currentIdx = stepOrder.indexOf(c.status);
            const stepIdx = stepOrder.indexOf(step.key);
            const isDone = stepIdx < currentIdx;
            const isCurrent = stepIdx === currentIdx;
            return (
              <React.Fragment key={step.key}>
                <div className={`flex-1 text-center ${i > 0 ? "" : ""}`}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  <p
                    className={`text-xs leading-tight ${isCurrent ? "font-semibold text-slate-900" : "text-slate-400"}`}
                  >
                    {step.label}
                  </p>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-shrink-0 h-0.5 w-4 ${isDone ? "bg-emerald-400" : "bg-slate-200"}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={onShowTemplate}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          <FileText className="w-4 h-4" /> Generar Plantilla SAT
        </Button>

        {c.status === "pending" && (
          <Button
            onClick={() => onUpdateStatus(c.id, "in_preparation")}
            variant="outline"
            className="w-full"
          >
            Iniciar Preparación
          </Button>
        )}
        {c.status === "in_preparation" && (
          <Button
            onClick={() => onUpdateStatus(c.id, "captured_sat")}
            variant="outline"
            className="w-full"
          >
            Marcar: Capturado en SAT
          </Button>
        )}

        {/* Upload evidence */}
        {["captured_sat", "in_preparation"].includes(c.status) && (
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
            <p className="text-sm font-semibold text-slate-800">
              Marcar como Presentado
            </p>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Folio SAT / Acuse
              </Label>
              <Input
                value={satFolio}
                onChange={(e) => setSatFolio(e.target.value)}
                placeholder="Número de folio o acuse"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Evidencia (archivo)
              </Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg"
                onChange={(e) => setEvidenceFile(e.target.files[0])}
                className="h-auto py-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Notas
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <Button
              onClick={() => onUploadEvidence(c.id)}
              disabled={!evidenceFile || uploading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploading ? "Subiendo..." : "Confirmar Presentación"}
            </Button>
          </div>
        )}

        {c.status === "presented" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="font-semibold text-emerald-800">Aviso Presentado</p>
            </div>
            {c.sat_folio && (
              <p className="text-sm text-emerald-700">Folio: {c.sat_folio}</p>
            )}
            {c.presented_date && (
              <p className="text-xs text-emerald-600">
                Fecha: {c.presented_date}
              </p>
            )}
            {c.evidence_url && (
              <a
                href={c.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 underline"
              >
                Ver evidencia
              </a>
            )}
            <Button
              onClick={() => onUpdateStatus(c.id, "closed")}
              variant="outline"
              className="w-full mt-3 border-emerald-300"
            >
              Cerrar Caso
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
