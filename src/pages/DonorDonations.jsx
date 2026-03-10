import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FileText, Download } from "lucide-react";
import { formatCurrency } from "@/components/amlEngine";
import { Button } from "@/components/ui/button";

export default function DonorDonations() {
  const [donations, setDonations] = useState([]);
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: donors } = await supabase
        .from("donors")
        .select("*")
        .eq("portal_user_email", user.email)
        .limit(1);

      if (donors && donors.length > 0) {
        setDonor(donors[0]);

        const { data: donationsData } = await supabase
          .from("donations")
          .select("*")
          .eq("donor_id", donors[0].id)
          .order("donation_date", { ascending: false })
          .limit(100);

        setDonations(donationsData || []);
      }
    }
    setLoading(false);
  }

  const totalDonated = donations.reduce((s, d) => s + (d.amount_mxn || 0), 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mis Donativos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Historial completo de tus donaciones
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-xs text-teal-600 mb-1">Total Donado</p>
          <p className="text-xl font-bold text-teal-900">
            {formatCurrency(totalDonated)}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Número de Donaciones</p>
          <p className="text-xl font-bold text-slate-900">{donations.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Fecha
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Monto
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Método
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Concepto
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Estatus
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        {Array(5)
                          .fill(0)
                          .map((_, j) => (
                            <td key={j} className="px-5 py-4">
                              <div className="h-4 bg-slate-100 rounded animate-pulse" />
                            </td>
                          ))}
                      </tr>
                    ))
                : donations.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {d.donation_date}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-900">
                        {formatCurrency(d.amount_mxn)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {d.payment_method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 max-w-[160px] truncate">
                        {d.description || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                          Registrado
                        </span>
                      </td>
                    </tr>
                  ))}
              {!loading && donations.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-400"
                  >
                    Sin donaciones registradas
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
