import React, { useState } from "react";
import { Shield, ChevronDown, ChevronRight, BookOpen, Users, FileText, Bell, AlertTriangle, Building2, Settings, CheckCircle2, XCircle, Clock, BarChart2, MessageSquare, Home, ArrowRight, Info, AlertCircle } from "lucide-react";

const sections = [
  {
    id: "intro",
    icon: BookOpen,
    title: "Introducción a AppleSeed AML",
    color: "violet",
    content: [
      {
        type: "text",
        body: "AppleSeed AML es una plataforma de cumplimiento contra el lavado de dinero (AML) diseñada específicamente para Organizaciones de la Sociedad Civil (OSC) que reciben donativos y están sujetas a la Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita (LFPIORPI)."
      },
      {
        type: "text",
        body: "La plataforma automatiza el monitoreo de acumulados en ventana móvil de 6 meses, genera alertas cuando se superan umbrales regulatorios en UMAs (Unidades de Medida y Actualización), organiza expedientes digitales de donantes y facilita la presentación de avisos al SAT."
      },
      {
        type: "highlight",
        title: "¿Qué es una UMA?",
        body: "La Unidad de Medida y Actualización (UMA) es la referencia económica que determina cuándo un donativo activa obligaciones de cumplimiento. El valor diario de la UMA para 2026 es de $117.31 MXN. Los umbrales son: 1,605 UMAs ($188,282 MXN) para identificación reforzada y 3,210 UMAs ($376,565 MXN) para obligación de aviso al SAT."
      },
      {
        type: "portals",
        items: [
          { name: "Portal OSC", desc: "Para el equipo de cumplimiento de la organización. Gestión completa de donantes, donativos, alertas y avisos SAT.", color: "slate" },
          { name: "Portal Donante", desc: "Para los donantes. Permite registrarse, ver sus donativos y subir documentos requeridos.", color: "teal" },
          { name: "AppleSeed Admin", desc: "Para el equipo de AppleSeed. Supervisión multi-organización, tickets y métricas globales.", color: "violet" },
        ]
      }
    ]
  },
  {
    id: "umbrales",
    icon: AlertTriangle,
    title: "Umbrales Regulatorios y Semáforo",
    color: "amber",
    content: [
      {
        type: "text",
        body: "El motor AML calcula en tiempo real el acumulado de donativos de cada donante en una ventana móvil de 6 meses. Cuando ese acumulado supera ciertos montos expresados en UMAs, se activan obligaciones legales."
      },
      {
        type: "thresholds",
        items: [
          {
            status: "ok",
            label: "Cumplimiento OK",
            color: "emerald",
            dot: "bg-emerald-500",
            desc: "El acumulado en 6 meses está por debajo de 1,605 UMAs ($188,282 MXN a $117.31/UMA). No hay obligaciones adicionales más allá del registro estándar.",
            action: "Ninguna acción requerida."
          },
          {
            status: "identification_required",
            label: "Identificación Reforzada",
            color: "amber",
            dot: "bg-amber-500",
            desc: "El acumulado en 6 meses supera 1,605 UMAs ($188,282 MXN a $117.31/UMA). La OSC debe realizar una identificación reforzada del donante: verificar identidad, obtener documentos adicionales y evaluar el perfil de riesgo.",
            action: "Completar expediente del donante y marcar KYC completo."
          },
          {
            status: "notice_required",
            label: "Obligación de Aviso SAT",
            color: "red",
            dot: "bg-red-500",
            desc: "El acumulado en 6 meses supera 3,210 UMAs ($376,565 MXN a $117.31/UMA). La OSC está legalmente obligada a presentar un aviso al SAT a más tardar el día 17 del mes siguiente al que se superó el umbral.",
            action: "Generar Plantilla SAT, capturar en portal SAT y registrar folio de acuse."
          },
          {
            status: "blocked",
            label: "Bloqueado",
            color: "red",
            dot: "bg-red-900",
            desc: "El donante ha sido bloqueado manualmente por el equipo de cumplimiento, generalmente por riesgo reputacional, PEP o investigación en curso.",
            action: "No se deben aceptar donativos. Consultar al área jurídica."
          },
          {
            status: "incomplete",
            label: "Expediente Incompleto",
            color: "slate",
            dot: "bg-slate-400",
            desc: "El donante no ha completado su información o documentación requerida para el KYC.",
            action: "Solicitar al donante que complete su información en el portal."
          }
        ]
      }
    ]
  },
  {
    id: "osc-portal",
    icon: Building2,
    title: "Portal OSC — Guía Completa",
    color: "slate",
    subsections: [
      {
        title: "Dashboard",
        icon: BarChart2,
        content: [
          { type: "text", body: "El Dashboard es la vista principal del Portal OSC. Muestra un resumen ejecutivo del estado de cumplimiento de toda la organización." },
          {
            type: "list",
            title: "Indicadores Clave (KPIs)",
            items: [
              "Total Donativos: Suma histórica de todos los donativos registrados.",
              "Acumulado 6 Meses: Total de donativos de toda la OSC en los últimos 6 meses, con su equivalente en UMAs.",
              "Donantes Activos: Número de donantes que no están bloqueados.",
              "Alertas Activas: Cantidad de alertas pendientes de atención, resaltando las críticas."
            ]
          },
          { type: "text", body: "El Semáforo de Cumplimiento muestra cuántos donantes hay en cada estatus (OK, Identificación Reforzada, Obligación de Aviso, Bloqueados, Incompletos) con una barra de progreso visual." },
          { type: "text", body: "La sección de Avisos SAT Pendientes muestra los casos próximos a vencer con un contador de días restantes en color rojo (≤3 días), ámbar (≤7 días) o gris (más tiempo)." }
        ]
      },
      {
        title: "Donantes",
        icon: Users,
        content: [
          { type: "text", body: "La sección de Donantes permite registrar y gestionar el padrón completo de donantes de la OSC." },
          {
            type: "list",
            title: "Cómo registrar un nuevo donante",
            items: [
              "Clic en 'Nuevo Donante' (botón superior derecho).",
              "Seleccionar tipo: Persona Física o Persona Moral.",
              "Completar datos básicos: nombre completo o razón social, RFC, domicilio, contacto.",
              "Para Persona Moral: también datos del representante legal y dueño beneficiario (si aplica).",
              "Indicar si el donante es PEP (Persona Políticamente Expuesta) o si tiene banderas de riesgo reputacional.",
              "Guardar. El donante queda en estatus 'Pendiente' hasta completar KYC."
            ]
          },
          {
            type: "list",
            title: "Columnas de la tabla de donantes",
            items: [
              "Acum. 6M: Total acumulado del donante en los últimos 6 meses (ventana móvil).",
              "UMAs: El acumulado 6M expresado en UMAs del año vigente.",
              "Estatus: Semáforo de cumplimiento del donante.",
              "KYC: Indica si el expediente documental está completo (Completo / Pendiente)."
            ]
          },
          { type: "text", body: "Se puede filtrar por estatus de cumplimiento, tipo de persona y buscar por nombre, RFC o email." }
        ]
      },
      {
        title: "Donativos",
        icon: FileText,
        content: [
          { type: "text", body: "Registro de todos los donativos recibidos. Cada donativo se asocia a un donante y se calcula automáticamente su impacto en el acumulado de 6 meses." },
          {
            type: "list",
            title: "Campos importantes al registrar un donativo",
            items: [
              "Donante: Seleccionar el donante previamente registrado.",
              "Monto MXN: Cantidad en pesos mexicanos.",
              "Fecha: Fecha real del donativo (no la de registro).",
              "Forma de pago: Transferencia, cheque, tarjeta, efectivo u otro.",
              "Referencia/Folio: Número de referencia bancaria o folio interno.",
              "¡ATENCIÓN! Donativos en EFECTIVO requieren atención especial — se genera alerta automática."
            ]
          },
          { type: "highlight", title: "Ventana móvil de 6 meses", body: "El sistema calcula el acumulado de cada donante en los 6 meses previos a la fecha de cada donativo (no el año fiscal). Esto significa que el umbral puede activarse en cualquier momento del año." }
        ]
      },
      {
        title: "Expedientes (KYC)",
        icon: Shield,
        content: [
          { type: "text", body: "El expediente digital contiene todos los documentos requeridos para el proceso de Conoce a tu Cliente (KYC) de cada donante." },
          {
            type: "list",
            title: "Documentos requeridos por tipo de donante",
            items: [
              "Persona Física: Comprobante de domicilio, Identificación oficial, Cédula fiscal SAT, Constancia de dueño beneficiario.",
              "Persona Moral: Acta constitutiva, Comprobante de domicilio, Poder del representante, Identificación oficial del representante, Cédula fiscal, Constancia dueño beneficiario.",
              "Con dueño beneficiario: Adicionalmente, identificación oficial del dueño beneficiario."
            ]
          },
          { type: "text", body: "Los documentos se verifican manualmente por el equipo de cumplimiento. Una vez que todos los documentos requeridos están verificados y vigentes, el KYC se marca como 'Completo'." }
        ]
      },
      {
        title: "Avisos SAT",
        icon: AlertTriangle,
        content: [
          { type: "text", body: "Esta sección gestiona los casos de obligación de aviso al SAT. Un caso se crea automáticamente cuando un donante supera el umbral de 3,210 UMAs acumuladas en 6 meses." },
          {
            type: "steps",
            title: "Flujo de un caso de Aviso SAT",
            items: [
              { step: "1", label: "Pendiente", desc: "El caso fue creado automáticamente. Revisar datos del donante." },
              { step: "2", label: "En Preparación", desc: "El equipo está recopilando información y preparando el aviso." },
              { step: "3", label: "Capturado en SAT", desc: "La información fue capturada en el portal del SAT." },
              { step: "4", label: "Presentado", desc: "El aviso fue presentado. Se registra el folio SAT y se sube el acuse." },
              { step: "5", label: "Cerrado", desc: "El caso está completamente resuelto y archivado." }
            ]
          },
          { type: "highlight", title: "Plazo legal", body: "El aviso debe presentarse a más tardar el día 17 del mes siguiente a aquel en que se superó el umbral. El sistema muestra el countdown en tiempo real y cambia a rojo cuando hay riesgo de incumplimiento." },
          { type: "text", body: "La Plantilla SAT es un formulario pre-llenado con todos los datos del donante y el donativo que activa el aviso. Se puede copiar o descargar como CSV para facilitar la captura en el portal del SAT." }
        ]
      },
      {
        title: "Alertas",
        icon: Bell,
        content: [
          { type: "text", body: "El sistema genera alertas automáticas para todos los eventos que requieren atención del equipo de cumplimiento." },
          {
            type: "alerts-table",
            items: [
              { type: "threshold_notice", severity: "high", label: "Umbral Obligación de Aviso", desc: "El donante superó 3,210 UMAs. Hay obligación legal de presentar aviso al SAT." },
              { type: "threshold_identification", severity: "medium", label: "Umbral Identificación Reforzada", desc: "El donante superó 1,605 UMAs. Se debe completar identificación reforzada." },
              { type: "cash_detected", severity: "critical", label: "Efectivo Detectado", desc: "Se registró un donativo en efectivo. Requiere documentación especial por LFPIORPI." },
              { type: "incomplete_info", severity: "medium", label: "Información Incompleta", desc: "El expediente del donante tiene campos o documentos faltantes." },
              { type: "notice_overdue", severity: "critical", label: "Aviso Vencido", desc: "El plazo del día 17 para presentar un aviso SAT ya venció." },
              { type: "aviso_deadline_approaching", severity: "high", label: "Plazo Próximo", desc: "Quedan pocos días para presentar un aviso SAT." },
              { type: "document_expired", severity: "medium", label: "Documento Vencido", desc: "Un documento del expediente del donante ha expirado." },
              { type: "reputation_flag", severity: "high", label: "Riesgo Reputacional", desc: "El donante tiene una bandera de riesgo reputacional activa. Requiere revisión." },
              { type: "risk_evaluation_pending", severity: "medium", label: "Evaluación de Riesgo Pendiente", desc: "No se ha realizado la evaluación de riesgo del donante." }
            ]
          },
          {
            type: "list",
            title: "Acciones sobre alertas",
            items: [
              "Reconocer (Acknowledge): Confirmar que el equipo está al tanto de la alerta sin resolverla aún.",
              "Resolver: Marcar la alerta como resuelta una vez tomada la acción correctiva.",
              "Desestimar: Descartar la alerta si se determina que no aplica o fue un falso positivo."
            ]
          }
        ]
      },
      {
        title: "Chatbot AML (LFPIORPI)",
        icon: MessageSquare,
        content: [
          { type: "text", body: "El Chatbot AML es un asistente con inteligencia artificial entrenado en la LFPIORPI y sus reglas de carácter general. Responde preguntas sobre cumplimiento, plazos, obligaciones y procedimientos." },
          {
            type: "list",
            title: "Ejemplos de preguntas al chatbot",
            items: [
              "¿Cuándo tengo obligación de presentar aviso al SAT?",
              "¿Qué documentos necesito de una persona moral?",
              "¿Cómo calculo la ventana móvil de 6 meses?",
              "¿Qué es una PEP y qué obligaciones genera?",
              "¿Cuál es el plazo para presentar el aviso y qué pasa si me paso?"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "donor-portal",
    icon: Users,
    title: "Portal Donante — Guía Completa",
    color: "teal",
    content: [
      { type: "text", body: "El Portal Donante está diseñado para que los donantes gestionen su propia información y documentación de forma autónoma, reduciendo la carga administrativa del equipo de cumplimiento de la OSC." },
      {
        type: "list",
        title: "Funcionalidades del Portal Donante",
        items: [
          "Registro: El donante puede registrarse en la plataforma proporcionando sus datos básicos.",
          "Mis Donativos: Ver el historial completo de donativos registrados por la OSC, con montos y fechas.",
          "Mis Documentos: Subir los documentos requeridos para completar el expediente KYC. El portal indica qué documentos faltan.",
          "Estatus de Cumplimiento: Ver su semáforo actual y entender qué obligaciones aplican."
        ]
      },
      { type: "highlight", title: "Nota importante", body: "El donante solo ve su propia información. Los datos son compartidos con la OSC correspondiente. La OSC verifica y valida los documentos subidos por el donante." }
    ]
  },
  {
    id: "admin-portal",
    icon: Shield,
    title: "Portal Admin AppleSeed — Guía Completa",
    color: "violet",
    content: [
      { type: "text", body: "El Portal Admin es exclusivo para el equipo interno de AppleSeed. Permite supervisar todas las organizaciones registradas en la plataforma desde un único panel." },
      {
        type: "list",
        title: "Secciones del Portal Admin",
        items: [
          "Dashboard: Vista ejecutiva de todas las OSC. Muestra OSC con alertas críticas, casos vencidos y estadísticas globales.",
          "Organizaciones: Registrar y gestionar OSC en la plataforma. Asignar plan (Trial, Basic, Professional, Enterprise) y estatus.",
          "Alertas Globales: Ver alertas de todas las OSC en un solo lugar. Filtrar por severidad y estatus.",
          "Tickets de Soporte: Gestionar solicitudes de ayuda de las OSC. Estados: Abierto, En Progreso, Pendiente OSC, Resuelto, Cerrado.",
          "Métricas: Gráficas y estadísticas de uso de la plataforma.",
          "Configuración UMA: Actualizar el valor anual de la UMA cuando el INEGI publica el nuevo valor."
        ]
      },
      {
        type: "highlight",
        title: "Planes de suscripción",
        body: "Trial: Acceso limitado para evaluación. Basic: Funcionalidades esenciales. Professional: Todas las funcionalidades incluyendo chatbot y métricas avanzadas. Enterprise: Personalización y soporte dedicado."
      }
    ]
  },
  {
    id: "glossary",
    icon: Info,
    title: "Glosario de Términos",
    color: "blue",
    content: [
      {
        type: "glossary",
        items: [
          { term: "AML", def: "Anti-Money Laundering. Conjunto de leyes, regulaciones y procedimientos para prevenir el lavado de dinero." },
          { term: "LFPIORPI", def: "Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita. La ley mexicana que regula las actividades vulnerables." },
          { term: "UMA", def: "Unidad de Medida y Actualización. Referencia económica publicada por el INEGI que se actualiza anualmente." },
          { term: "KYC", def: "Know Your Customer / Conoce a tu Cliente. Proceso de verificación de identidad y documentación de los clientes o donantes." },
          { term: "PEP", def: "Persona Políticamente Expuesta. Funcionario público o persona con influencia política que requiere due diligence reforzado." },
          { term: "Dueño Beneficiario", def: "Persona física que directa o indirectamente controla o se beneficia de una persona moral." },
          { term: "Aviso SAT", def: "Reporte obligatorio que las OSC deben presentar al SAT cuando un donante supera el umbral de 3,210 UMAs acumuladas en 6 meses." },
          { term: "Ventana Móvil 6M", def: "Cálculo de acumulados en los 6 meses previos a cada donativo. No es por año fiscal, sino móvil y continua." },
          { term: "Umbral de Identificación", def: "1,605 UMAs acumuladas en 6 meses. Activa la obligación de identificación reforzada del donante." },
          { term: "Umbral de Aviso", def: "3,210 UMAs acumuladas en 6 meses. Activa la obligación legal de presentar aviso al SAT a más tardar el día 17 del mes siguiente." },
          { term: "OSC", def: "Organización de la Sociedad Civil. Incluye Asociaciones Civiles (A.C.), Sociedades Civiles (S.C.), Fundaciones e Institutos." },
          { term: "RFC", def: "Registro Federal de Contribuyentes. Identificador fiscal único de personas físicas y morales en México." },
          { term: "CURP", def: "Clave Única de Registro de Población. Identificador único de personas físicas en México." }
        ]
      }
    ]
  }
];

const severityColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};
const severityLabels = { critical: "Crítica", high: "Alta", medium: "Media", low: "Baja" };

function ContentBlock({ block }) {
  if (block.type === "text") return <p className="text-slate-600 text-sm leading-relaxed">{block.body}</p>;

  if (block.type === "highlight") return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
      <p className="font-semibold text-violet-900 text-sm mb-1">{block.title}</p>
      <p className="text-violet-800 text-sm leading-relaxed">{block.body}</p>
    </div>
  );

  if (block.type === "list") return (
    <div>
      {block.title && <p className="font-semibold text-slate-800 text-sm mb-2">{block.title}</p>}
      <ul className="space-y-1.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  if (block.type === "portals") return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {block.items.map(p => (
        <div key={p.name} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="font-bold text-slate-900 text-sm mb-1">{p.name}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
        </div>
      ))}
    </div>
  );

  if (block.type === "thresholds") return (
    <div className="space-y-3">
      {block.items.map(item => (
        <div key={item.status} className="border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${item.dot} flex-shrink-0`} />
            <span className="font-semibold text-slate-900 text-sm">{item.label}</span>
          </div>
          <p className="text-sm text-slate-600 mb-2">{item.desc}</p>
          <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
            <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
            <span><strong>Acción:</strong> {item.action}</span>
          </div>
        </div>
      ))}
    </div>
  );

  if (block.type === "steps") return (
    <div>
      {block.title && <p className="font-semibold text-slate-800 text-sm mb-3">{block.title}</p>}
      <div className="space-y-2">
        {block.items.map(item => (
          <div key={item.step} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{item.step}</div>
            <div>
              <span className="font-semibold text-slate-800 text-sm">{item.label}: </span>
              <span className="text-sm text-slate-600">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (block.type === "alerts-table") return (
    <div className="space-y-2">
      {block.items.map(item => (
        <div key={item.type} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${severityColors[item.severity]}`}>
            {severityLabels[item.severity]}
          </span>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );

  if (block.type === "glossary") return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {block.items.map(item => (
        <div key={item.term} className="border border-slate-200 rounded-xl p-3 bg-white">
          <p className="font-bold text-slate-900 text-sm">{item.term}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.def}</p>
        </div>
      ))}
    </div>
  );

  return null;
}

function Section({ section }) {
  const [open, setOpen] = useState(false);
  const [openSub, setOpenSub] = useState(null);
  const Icon = section.icon;
  const colorMap = { violet: "bg-violet-100 text-violet-600", amber: "bg-amber-100 text-amber-600", slate: "bg-slate-100 text-slate-600", teal: "bg-teal-100 text-teal-600", blue: "bg-blue-100 text-blue-600" };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[section.color] || colorMap.slate}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900">{section.title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          {section.content?.map((block, i) => <ContentBlock key={i} block={block} />)}

          {section.subsections?.map(sub => {
            const SubIcon = sub.icon;
            const isSubOpen = openSub === sub.title;
            return (
              <div key={sub.title} className="border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setOpenSub(isSubOpen ? null : sub.title)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <SubIcon className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-800 text-sm">{sub.title}</span>
                  </div>
                  {isSubOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {isSubOpen && (
                  <div className="p-4 space-y-4 bg-white">
                    {sub.content.map((block, i) => <ContentBlock key={i} block={block} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Manual() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-violet-900 text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest">AppleSeed AML</p>
              <h1 className="text-2xl font-extrabold">Manual de Usuario</h1>
            </div>
          </div>
          <p className="text-white/65 text-sm leading-relaxed max-w-2xl">
            Guía completa de uso de la plataforma AppleSeed AML Compliance. Cubre todos los portales, funcionalidades, alertas, umbrales regulatorios y flujos de trabajo.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {["LFPIORPI", "AML / KYC", "Avisos SAT", "Ventana 6 Meses", "UMA 2026"].map(tag => (
              <span key={tag} className="text-xs bg-white/10 border border-white/20 text-white/80 px-2.5 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-2 flex gap-1 overflow-x-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex-shrink-0 text-xs text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium">
              {s.title.split("—")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {sections.map(section => (
          <div key={section.id} id={section.id}>
            <Section section={section} />
          </div>
        ))}

        <div className="text-center py-8 text-slate-400 text-xs">
          AppleSeed AML Compliance Platform · Versión 1.0 · 2026 · Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}