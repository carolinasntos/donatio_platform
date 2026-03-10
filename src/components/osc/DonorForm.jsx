import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DonorForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({
    full_name: "",
    rfc: "",
    email: "",
    phone: "",
    donor_type: "individual",
    status: "active",
  });

  const [saving, setSaving] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);

    const { error } = await supabase.from("donors").insert(form);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Error guardando donante");
      return;
    }

    if (onSaved) onSaved();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Nuevo Donante</h3>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="text-sm font-medium text-slate-700">
            Nombre completo *
          </label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">RFC</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.rfc}
            onChange={(e) => updateField("rfc", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            className="w-full border rounded-lg px-3 py-2"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Teléfono</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Tipo de donante
          </label>

          <select
            className="w-full border rounded-lg px-3 py-2"
            value={form.donor_type}
            onChange={(e) => updateField("donor_type", e.target.value)}
          >
            <option value="individual">Persona física</option>
            <option value="entity">Persona moral</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Estado</label>

          <select
            className="w-full border rounded-lg px-3 py-2"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            <option value="active">Activo</option>
            <option value="blocked">Bloqueado</option>
          </select>
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            {saving ? "Guardando..." : "Guardar Donante"}
          </button>
        </div>
      </form>
    </div>
  );
}
