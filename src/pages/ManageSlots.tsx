import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Facility, Slot } from "../types/firestore";
import {
  createSlot,
  deleteSlot,
  getFacilities,
  getSlotsForFacility,
  updateSlot,
} from "../services/facilityService";

type FormState = {
  facilityId: string;
  dayOfWeek: string; // 0-6
  startHour: string; // HH:mm
  endHour: string; // HH:mm
  isAvailable: boolean;
  isVisible: boolean;
};

const emptyForm: FormState = {
  facilityId: "",
  dayOfWeek: "",
  startHour: "",
  endHour: "",
  isAvailable: true,
  isVisible: true,
};

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ManageSlots() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setLoadingFacilities(true);
        setError(null);
        const data = await getFacilities();
        setFacilities(data);
        if (data.length > 0) {
          setSelectedFacilityId(data[0].id);
          setForm((prev) => ({ ...prev, facilityId: data[0].id, dayOfWeek: "" }));
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load facilities.");
      } finally {
        setLoadingFacilities(false);
      }
    };

    loadFacilities();
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedFacilityId) {
        setSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        setError(null);
        const data = await getSlotsForFacility(selectedFacilityId);
        setSlots(data);
      } catch (e: any) {
        setError(e.message ?? "Failed to load slots.");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedFacilityId]);

  const resetForm = () => {
    setForm((prev) => ({
      ...emptyForm,
      facilityId: prev.facilityId || selectedFacilityId,
    }));
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.facilityId) {
      setError("Facility is required.");
      return;
    }

    const day = parseInt(form.dayOfWeek, 10);
    if (Number.isNaN(day) || day < 0 || day > 6) {
      setError("Day of week is required.");
      return;
    }

    if (!form.startHour || !form.endHour) {
      setError("Start and end time are required.");
      return;
    }

    if (form.endHour <= form.startHour) {
      setError("End time must be after start time.");
      return;
    }

    const payload = {
      facilityId: form.facilityId,
      dayOfWeek: day,
      startHour: form.startHour,
      endHour: form.endHour,
      isAvailable: form.isAvailable,
      isVisible: form.isVisible,
    };

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (editingId) {
        await updateSlot(editingId, payload);
        setSuccessMessage("Slot updated successfully.");
      } else {
        await createSlot(payload);
        setSuccessMessage("Slot created successfully.");
      }

      resetForm();
      const data = await getSlotsForFacility(selectedFacilityId);
      setSlots(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to save slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (slot: Slot) => {
    setEditingId(slot.id);
    setForm({
      facilityId: slot.facilityId,
      dayOfWeek: String(slot.dayOfWeek),
      startHour: slot.startHour,
      endHour: slot.endHour,
      isAvailable: slot.isAvailable,
      isVisible: slot.isVisible,
    });
    setSelectedFacilityId(slot.facilityId);
  };

  const handleDelete = async (slotId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this slot?");
    if (!confirmDelete) return;

    try {
      setDeletingId(slotId);
      setError(null);
      setSuccessMessage(null);
      await deleteSlot(slotId);
      setSuccessMessage("Slot deleted.");
      const data = await getSlotsForFacility(selectedFacilityId);
      setSlots(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to delete slot.");
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
          <p style={{ margin: 0, opacity: 0.85, letterSpacing: 0.5 }}>Admin • Slots</p>
          <h1 style={{ margin: "0.1rem 0 0" }}>Manage Slots</h1>
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
        <h2 style={{ marginTop: 0 }}>{editingId ? "Update Slot" : "Create Slot"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>Facility</span>
            <select
              value={form.facilityId || selectedFacilityId}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, facilityId: e.target.value }));
                setSelectedFacilityId(e.target.value);
              }}
              required
              style={{ padding: "0.55rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
            >
              <option value="">Select facility</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>Day of Week</span>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
              required
              style={{ padding: "0.55rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
            >
              <option value="">Select day</option>
              {dayLabels.map((label, idx) => (
                <option key={label} value={idx}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>Start Time (HH:MM)</span>
            <input
              type="time"
              value={form.startHour}
              onChange={(e) => setForm((prev) => ({ ...prev, startHour: e.target.value }))}
              required
              style={{ padding: "0.55rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>End Time (HH:MM)</span>
            <input
              type="time"
              value={form.endHour}
              onChange={(e) => setForm((prev) => ({ ...prev, endHour: e.target.value }))}
              required
              style={{ padding: "0.55rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
            />
            Available
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(e) => setForm((prev) => ({ ...prev, isVisible: e.target.checked }))}
            />
            Visible to students
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
                  ? "Update Slot"
                  : "Create Slot"}
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h2 style={{ margin: 0 }}>Slots</h2>
          <label>
            Facility:&nbsp;
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              disabled={loadingFacilities}
              style={{
                padding: "0.5rem 0.7rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
              }}
            >
              <option value="">Select facility</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadingSlots && <p>Loading slots...</p>}
        {!loadingSlots && slots.length === 0 && <p>No slots found.</p>}

        {!loadingSlots && slots.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
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
                    Day
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    Start
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    End
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    Available
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    Visible
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.6rem" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.55rem" }}>
                      {dayLabels[slot.dayOfWeek] ?? slot.dayOfWeek}
                    </td>
                    <td style={{ padding: "0.55rem" }}>{slot.startHour}</td>
                    <td style={{ padding: "0.55rem" }}>{slot.endHour}</td>
                    <td style={{ padding: "0.55rem" }}>{slot.isAvailable ? "Yes" : "No"}</td>
                    <td style={{ padding: "0.55rem" }}>{slot.isVisible ? "Yes" : "No"}</td>
                    <td
                      style={{
                        padding: "0.55rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleEdit(slot)}
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
                        onClick={() => handleDelete(slot.id)}
                        disabled={deletingId === slot.id}
                        style={{
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #b91c1c",
                          background: "#fef2f2",
                          color: "#7f1d1d",
                          cursor: "pointer",
                        }}
                      >
                        {deletingId === slot.id ? "Deleting..." : "Delete"}
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
