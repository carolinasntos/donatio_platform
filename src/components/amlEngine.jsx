// AML Engine - Compliance Rules and Calculations

export const UMA_DEFAULT = {
  year: 2026,
  daily_value_mxn: 117.31,
  threshold_identification_uma: 1605,
  threshold_notice_uma: 3210
};

// El valor de referencia para conversión MXN<->UMA es el valor DIARIO de la UMA.
// Umbral ID = 1,605 UMAs × $117.31 = ~$188,282 MXN (6 meses)
// Umbral Aviso = 3,210 UMAs × $117.31 = ~$376,565 MXN (6 meses)
export function getUMAValue(umaConfig) {
  if (!umaConfig) return UMA_DEFAULT;
  return {
    ...UMA_DEFAULT,
    ...umaConfig,
    daily_value_mxn: umaConfig.daily_value_mxn || 117.31
  };
}

export function mxnToUMA(amountMXN, umaConfig) {
  const uma = getUMAValue(umaConfig);
  return amountMXN / uma.daily_value_mxn;
}

export function umaToMXN(umaAmount, umaConfig) {
  const uma = getUMAValue(umaConfig);
  return umaAmount * uma.daily_value_mxn;
}

export function calculate6MonthRolling(donations, donorId, referenceDate = new Date()) {
  const sixMonthsAgo = new Date(referenceDate);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return donations
    .filter(d => {
      if (d.donor_id !== donorId) return false;
      if (d.status === 'cancelled') return false;
      const donationDate = new Date(d.donation_date);
      return donationDate >= sixMonthsAgo && donationDate <= referenceDate;
    })
    .reduce((sum, d) => sum + (d.amount_mxn || 0), 0);
}

export function checkThresholds(accumulatedUMA, umaConfig) {
  const uma = getUMAValue(umaConfig);
  if (accumulatedUMA >= uma.threshold_notice_uma) return 'notice';
  if (accumulatedUMA >= uma.threshold_identification_uma) return 'identification';
  return 'none';
}

export function getDeadlineDate(triggerDate) {
  const d = new Date(triggerDate);
  return new Date(d.getFullYear(), d.getMonth() + 1, 17);
}

export function formatDeadline(triggerDate) {
  const deadline = getDeadlineDate(triggerDate);
  return deadline.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getDaysUntilDeadline(deadlineDate) {
  const now = new Date();
  const deadline = new Date(deadlineDate);
  return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
}

export function getComplianceStatus(donor, accumulated6mUMA, umaConfig) {
  if (donor.status === 'blocked') return 'blocked';
  if (!donor.kyc_complete) return 'incomplete';
  const threshold = checkThresholds(accumulated6mUMA, umaConfig);
  if (threshold === 'notice') return 'notice_required';
  if (threshold === 'identification') return 'identification_required';
  return 'ok';
}

export function getStatusColor(status) {
  const map = {
    ok: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    identification_required: 'text-amber-700 bg-amber-50 border-amber-200',
    notice_required: 'text-red-700 bg-red-50 border-red-200',
    blocked: 'text-red-900 bg-red-100 border-red-300',
    incomplete: 'text-slate-600 bg-slate-50 border-slate-200',
    pending: 'text-blue-700 bg-blue-50 border-blue-200'
  };
  return map[status] || 'text-slate-600 bg-slate-50 border-slate-200';
}

export function getStatusLabel(status) {
  const map = {
    ok: 'Cumplimiento OK',
    identification_required: 'Identificación Reforzada',
    notice_required: 'Obligación de Aviso',
    blocked: 'Bloqueado',
    incomplete: 'Incompleto',
    pending: 'Pendiente'
  };
  return map[status] || status;
}

export function getSeverityColor(severity) {
  const map = {
    low: 'text-blue-700 bg-blue-50 border-blue-200',
    medium: 'text-amber-700 bg-amber-50 border-amber-200',
    high: 'text-orange-700 bg-orange-50 border-orange-200',
    critical: 'text-red-800 bg-red-100 border-red-300'
  };
  return map[severity] || 'text-slate-600 bg-slate-50 border-slate-200';
}

export function getSeverityLabel(severity) {
  const map = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
  return map[severity] || severity;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
}

export function formatUMA(umaAmount) {
  return `${(umaAmount || 0).toFixed(2)} UMAs`;
}

export const DOCUMENT_TYPES = {
  acta_constitutiva: { label: 'Acta Constitutiva', required_for: ['moral'] },
  comprobante_domicilio: { label: 'Comprobante de Domicilio', required_for: ['fisica', 'moral'] },
  poder_representante: { label: 'Poder del Representante', required_for: ['moral'] },
  identificacion_representante: { label: 'Identificación Oficial del Representante', required_for: ['fisica', 'moral'] },
  cedula_fiscal: { label: 'Cédula de Identificación Fiscal', required_for: ['fisica', 'moral'] },
  constancia_dueno_beneficiario: { label: 'Constancia Dueño Beneficiario', required_for: ['fisica', 'moral'] },
  identificacion_dueno_beneficiario: { label: 'ID Dueño Beneficiario', required_for: [] },
  otro: { label: 'Otro Documento', required_for: [] }
};

export function getRequiredDocuments(donorType, hasBeneficialOwner = false) {
  const docs = Object.entries(DOCUMENT_TYPES)
    .filter(([, config]) => config.required_for.includes(donorType))
    .map(([key]) => key);
  if (hasBeneficialOwner) docs.push('identificacion_dueno_beneficiario');
  return docs;
}

export function checkDocumentCompleteness(documents, donorType, hasBeneficialOwner) {
  const required = getRequiredDocuments(donorType, hasBeneficialOwner);
  const uploadedTypes = documents.filter(d => d.status !== 'rejected').map(d => d.document_type);
  const missing = required.filter(r => !uploadedTypes.includes(r));
  const expired = documents.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date());
  return { missing, expired, isComplete: missing.length === 0 && expired.length === 0 };
}

export const ALERT_TYPES = {
  cash_detected: { label: 'Efectivo Detectado', severity: 'critical' },
  incomplete_info: { label: 'Información Incompleta', severity: 'high' },
  notice_overdue: { label: 'Aviso Vencido', severity: 'critical' },
  risk_evaluation_pending: { label: 'Evaluación de Riesgo Pendiente', severity: 'medium' },
  reputation_flag: { label: 'Riesgo Reputacional', severity: 'high' },
  threshold_identification: { label: 'Umbral Identificación Reforzada', severity: 'medium' },
  threshold_notice: { label: 'Umbral Obligación de Aviso', severity: 'high' },
  document_expired: { label: 'Documento Vencido', severity: 'medium' },
  aviso_deadline_approaching: { label: 'Plazo de Aviso Próximo', severity: 'high' }
};