import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Facility } from "../types/firestore";
import {
  createFacility,
  deleteFacility,
  getFacilities,
  updateFacility,
} from "../services/facilityService";

type FormState = {
  name: string;
  description: string;
  capacity: string;
  type: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  capacity: "",
  type: "",
};

export default function ManageFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFacilities();
      setFacilities(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load facilities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const capacity = parseInt(form.capacity, 10);
    if (Number.isNaN(capacity) || capacity <= 0) {
      setError("Capacity must be a positive number.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      capacity,
      type: form.type.trim(),
    };

    if (!payload.name || !payload.type) {
      setError("Name and type are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (editingId) {
        await updateFacility(editingId, payload);
        setSuccessMessage("Facility updated successfully.");
      } else {
        await createFacility(payload);
        setSuccessMessage("Facility created successfully.");
      }

      resetForm();
      await loadFacilities();
    } catch (e: any) {
      setError(e.message ?? "Failed to save facility.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (facility: Facility) => {
    setEditingId(facility.id);
    setForm({
      name: facility.name,
      description: facility.description ?? "",
      capacity: String(facility.capacity),
      type: facility.type,
    });
  };

  const handleDelete = async (facilityId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this facility?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(facilityId);
      setError(null);
      setSuccessMessage(null);

      await deleteFacility(facilityId);
      setSuccessMessage("Facility deleted.");
      await loadFacilities();
    } catch (e: any) {
      setError(e.message ?? "Failed to delete facility.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
          color: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div>
          <p style={{ margin: 0, opacity: 0.85, letterSpacing: 0.5 }}>Admin • Facilities</p>
          <h1 style={{ margin: "0.1rem 0 0" }}>Manage Facilities</h1>
        </div>
        <Link
          to="/admin"
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: "999px",
            border: "1px solid #f5e9dc",
            background: "#fff7ed",
            color: "#7c2d12",
            textDecoration: "none",
            fontWeight: 700,
            boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
          }}
        >
          Back to Admin
        </Link>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1.25rem",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          textAlign: "left",
          background: "#fffdf7",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editingId ? "Update Facility" : "Create Facility"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              style={{ padding: "0.55rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              style={{ padding: "0.55rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>Capacity</span>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              required
              style={{ padding: "0.55rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>Type</span>
            <input
              type="text"
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              required
              style={{ padding: "0.55rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
            />
          </label>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.55rem 0.95rem",
                borderRadius: "8px",
                border: "1px solid #b91c1c",
                background: "#b91c1c",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {saving
                ? editingId
                  ? "Updating..."
                  : "Creating..."
                : editingId
                  ? "Update Facility"
                  : "Create Facility"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                style={{
                  padding: "0.55rem 0.95rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section
        style={{
          textAlign: "left",
          padding: "1.25rem",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          background: "#fff",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Existing Facilities</h2>

        {loading && <p>Loading facilities...</p>}
        {!loading && facilities.length === 0 && <p>No facilities found.</p>}

        {!loading && facilities.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "720px",
              }}
            >
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    Name
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    Description
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    Capacity
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    Type
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((facility) => (
                  <tr key={facility.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.55rem" }}>{facility.name}</td>
                    <td style={{ padding: "0.55rem" }}>{facility.description || "-"}</td>
                    <td style={{ padding: "0.55rem" }}>{facility.capacity}</td>
                    <td style={{ padding: "0.55rem" }}>{facility.type}</td>
                    <td
                      style={{
                        padding: "0.55rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleEdit(facility)}
                        style={{
                          marginRight: "0.35rem",
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #2563eb",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(facility.id)}
                        disabled={deletingId === facility.id}
                        style={{
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #b91c1c",
                          background: "#fef2f2",
                          color: "#7f1d1d",
                          cursor: "pointer",
                        }}
                      >
                        {deletingId === facility.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
