import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <span className="font-bold text-xl tracking-tight">
            AppleSeed AML
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("OSCDashboard")}>
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Portal OSC
            </Button>
          </Link>
          <Link to={createPageUrl("AdminDashboard")}>
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              AppleSeed Admin
            </Button>
          </Link>
          <Link to={createPageUrl("DonorPortal")}>
            <Button className="bg-violet-600 hover:bg-violet-500 text-white border-0">
              Portal Donante
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            Cumplimiento LFPIORPI — Actividades Vulnerables
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
            Cumplimiento AML{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-teal-400">
              automatizado
            </span>{" "}
            para donativos
          </h1>
          <p className="text-xl text-white/60 leading-relaxed mb-10 max-w-2xl">
            Plataforma integral para OSC. Controla acumulados en ventana móvil
            de 6 meses, genera alertas automáticas, organiza expedientes
            digitales y prepara la Plantilla SAT para avisos en tiempo.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to={createPageUrl("OSCDashboard")}>
              <Button
                size="lg"
                className="bg-violet-600 hover:bg-violet-500 text-white gap-2 px-8 h-12"
              >
                Acceder al Portal OSC <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl("DonorPortal")}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-2 px-8 h-12"
              >
                Soy Donante
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-24">
          {[
            {
              icon: FileText,
              title: "Plantilla SAT",
              desc: "Genera automáticamente la ficha completa para capturar el aviso en el portal SAT.",
              color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
            },
            {
              icon: AlertTriangle,
              title: "Alertas en tiempo real",
              desc: "Detecta efectivo, información incompleta, plazos próximos y más. Acción inmediata.",
              color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            },
            {
              icon: Users,
              title: "Expediente digital",
              desc: "Checklist de documentos, verificación y trazabilidad completa por donante.",
              color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
            },
            {
              icon: Building2,
              title: "Multi-OSC",
              desc: "Plataforma multi-tenant con aislamiento estricto, roles y bitácora de auditoría.",
              color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Portals */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Portal OSC",
              subtitle: "Para organizaciones sin fines de lucro",
              page: "OSCDashboard",
              color: "from-slate-800 to-slate-700",
              border: "border-slate-600",
            },
            {
              title: "Portal Donante",
              subtitle: "Para personas físicas y morales",
              page: "DonorPortal",
              color: "from-teal-900 to-teal-800",
              border: "border-teal-700",
            },
            {
              title: "AppleSeed Admin",
              subtitle: "Supervisión y control multi-OSC",
              page: "AdminDashboard",
              color: "from-violet-900 to-violet-800",
              border: "border-violet-700",
            },
          ].map(({ title, subtitle, page, color, border }) => (
            <Link
              key={page}
              to={createPageUrl(page)}
              className={`group p-6 rounded-2xl bg-gradient-to-br ${color} border ${border} hover:scale-[1.02] transition-transform`}
            >
              <h3 className="font-bold text-white text-lg mb-1">{title}</h3>
              <p className="text-white/55 text-sm mb-4">{subtitle}</p>
              <div className="flex items-center gap-1 text-white/70 group-hover:text-white text-sm font-medium transition-colors">
                Acceder <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
