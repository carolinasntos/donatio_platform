import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard, Users, FileText, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Shield, Building2, AlertTriangle,
  BookOpen, MessageSquare, BarChart2, Ticket, Menu, X, Home
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const oscNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, page: "OSCDashboard" },
  { label: "Donantes", icon: Users, page: "OSCDonors" },
  { label: "Donativos", icon: FileText, page: "OSCDonations" },
  { label: "Expedientes", icon: Shield, page: "OSCExpedientes" },
  { label: "Avisos SAT", icon: AlertTriangle, page: "OSCComplianceCases" },
  { label: "Alertas", icon: Bell, page: "OSCAlerts" },
  { label: "Chatbot AML", icon: MessageSquare, page: "OSCChatbot" },
  { label: "Manual de Uso", icon: BookOpen, page: "Manual" },
  { label: "Configuración", icon: Settings, page: "OSCSettings" },
];

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, page: "AdminDashboard" },
  { label: "Organizaciones", icon: Building2, page: "AdminOrganizations" },
  { label: "Alertas Globales", icon: AlertTriangle, page: "AdminAlerts" },
  { label: "Tickets", icon: Ticket, page: "AdminTickets" },
  { label: "Métricas", icon: BarChart2, page: "AdminMetrics" },
  { label: "Configuración UMA", icon: Settings, page: "AdminSettings" },
];

const donorNavItems = [
  { label: "Inicio", icon: Home, page: "DonorPortal" },
  { label: "Mis Donativos", icon: FileText, page: "DonorDonations" },
  { label: "Mis Documentos", icon: Shield, page: "DonorDocuments" },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(0);

  useEffect(() => {
  async function loadUser() {

    const { data } = await supabase.auth.getUser();

    if (data?.user) {
      setUser(data.user);
    }

  }

  loadUser();

}, []);

  const isAdminPage = currentPageName?.startsWith("Admin");
  const isDonorPage = currentPageName?.startsWith("Donor");
  const isPublicPage = ["Home", "Login", "Register", "DonorRegister"].includes(currentPageName);

  if (isPublicPage) return <>{children}</>;

  const navItems = isAdminPage ? adminNavItems : isDonorPage ? donorNavItems : oscNavItems;
  const portalName = isAdminPage ? "AppleSeed" : isDonorPage ? "Portal Donante" : "Portal OSC";
  const portalColor = isAdminPage ? "from-violet-900 to-violet-800" : isDonorPage ? "from-teal-800 to-teal-700" : "from-slate-900 to-slate-800";

  const NavContent = () => (
    <>
      <div className={`p-4 border-b border-white/10`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">AppleSeed AML</p>
              <p className="text-white/60 text-xs">{portalName}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, page, badge }) => {
          const isActive = currentPageName === page;
          return (
            <Link
              key={page}
              to={createPageUrl(page)}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0 w-5 h-5" />
              {!collapsed && (
                <span className="text-sm font-medium flex-1">{label}</span>
              )}
              {!collapsed && label === "Alertas" && activeAlerts > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 h-5">{activeAlerts}</Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-white/80 text-sm font-medium truncate">{user.full_name || user.email}</p>
            <p className="text-white/45 text-xs truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
        }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Cerrar Sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-gradient-to-b ${portalColor} transition-all duration-300 ${collapsed ? "w-16" : "w-60"} flex-shrink-0 relative`}>
        <NavContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-600" /> : <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className={`relative w-64 h-full flex flex-col bg-gradient-to-b ${portalColor}`}>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-700" />
            <span className="font-bold text-slate-800 text-sm">AppleSeed AML</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <style>{`
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        }
        body { font-family: var(--font-sans); }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}