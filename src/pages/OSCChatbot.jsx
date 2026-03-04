import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, AlertTriangle, RefreshCw } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

const SYSTEM_PROMPT = `Eres un asistente especializado en la Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita (LFPIORPI) de México, con enfoque en la actividad vulnerable de "Recepción de Donativos" por Asociaciones y Sociedades Civiles sin fines de lucro.

Tu función es responder preguntas frecuentes de los equipos de cumplimiento de OSCs sobre:
- Obligaciones AML (Antilavado) bajo LFPIORPI
- Umbrales en UMAs para identificación (1,605 UMA) y aviso al SAT (3,210 UMA)
- Reglas de acumulación en ventana móvil de 6 meses
- Documentación requerida en expedientes de donantes
- Proceso y plazos para presentar avisos al SAT (día 17 del mes siguiente)
- Diferencias entre persona física y moral
- Dueño Beneficiario Controlador
- Personas Políticamente Expuestas (PEP)

RESTRICCIONES IMPORTANTES:
- NO proporcionas asesoría legal profesional
- Siempre termina recordando: "Esta información es orientativa. Para asesoría legal especializada, consulta con tu asesor jurídico o un experto en cumplimiento AML."
- Si la pregunta no está relacionada con AML/LFPIORPI/cumplimiento, responde que solo puedes ayudar con temas de cumplimiento AML.
- Responde siempre en español, de forma clara y estructurada.`;

const FAQ_PROMPTS = [
  "¿Cuándo tengo obligación de presentar aviso al SAT?",
  "¿Cómo se calcula la ventana móvil de 6 meses?",
  "¿Qué documentos necesito del donante?",
  "¿Qué es el Dueño Beneficiario Controlador?",
  "¿Qué pasa si recibo un donativo en efectivo?",
];

export default function OSCChatbot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hola, soy tu asistente de cumplimiento AML. Puedo ayudarte con preguntas sobre la LFPIORPI y tus obligaciones como OSC que recibe donativos. ¿En qué te puedo orientar?\n\n*Recuerda: Esta orientación es informativa y no sustituye asesoría legal profesional.*"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const userMsg = text || input;
    if (!userMsg.trim() || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const history = messages.map(m => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`).join("\n");
    const prompt = `${SYSTEM_PROMPT}\n\nHistorial de conversación:\n${history}\n\nUsuario: ${userMsg}\n\nAsistente:`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      <PageHeader
        title="Asistente AML"
        subtitle="Preguntas frecuentes sobre LFPIORPI y cumplimiento para OSCs"
        actions={
          <Button variant="outline" size="sm" onClick={() => setMessages([{ role: "assistant", content: "Nueva conversación iniciada. ¿En qué te puedo orientar sobre cumplimiento AML?" }])} className="gap-2 h-8">
            <RefreshCw className="w-3.5 h-3.5" /> Nueva conversación
          </Button>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-700">Este chatbot es orientativo. No sustituye asesoría legal profesional. Para casos complejos, consulta con tu asesor jurídico especializado en AML.</p>
      </div>

      {/* FAQ chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FAQ_PROMPTS.map(faq => (
          <button key={faq} onClick={() => sendMessage(faq)} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200">
            {faq}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 p-4 space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-violet-600" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-slate-900 text-white" : "bg-slate-50 border border-slate-200 text-slate-800"}`}>
              {msg.role === "user"
                ? <p className="text-sm">{msg.content}</p>
                : <ReactMarkdown className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{msg.content}</ReactMarkdown>
              }
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-violet-600" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu pregunta sobre cumplimiento AML... (Enter para enviar)"
          rows={2}
          className="resize-none flex-1"
        />
        <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="bg-slate-900 hover:bg-slate-800 text-white self-end h-10 w-10 p-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}