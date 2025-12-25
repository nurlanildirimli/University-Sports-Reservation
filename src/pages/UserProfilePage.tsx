import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, saveUserProfile, type UserProfile } from "../services/userService";

export default function UserProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getUserProfile(user.uid);
        if (data) {
          setProfile(data);
          setDisplayName(data.displayName ?? "");
          setFullName(data.fullName ?? data.displayName ?? "");
          setStudentId(data.studentId ?? "");
          setPhone(data.phone ?? "");
        } else {
          setProfile({
            id: user.uid,
            displayName: user.displayName ?? "",
            fullName: user.displayName ?? "",
            studentId: "",
            phone: "",
          });
          setDisplayName(user.displayName ?? "");
          setFullName(user.displayName ?? "");
          setStudentId("");
          setPhone("");
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await saveUserProfile(user, {
        displayName: displayName.trim(),
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        phone: phone.trim(),
      });
      setProfile(updated);
      setSuccess("Profile updated.");
    } catch (e: any) {
      setError(e.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <header
        style={{
          padding: "1rem",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
          color: "#fff",
          boxShadow: "0 10px 26px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <p style={{ margin: 0, opacity: 0.85, letterSpacing: 0.5 }}>Profile</p>
        <h1 style={{ margin: "0.1rem 0 0" }}>My Account</h1>
        <p style={{ margin: "0.2rem 0 0", opacity: 0.9 }}>Update your personal information.</p>
      </header>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecdd3",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: "#f0fdf4",
            color: "#15803d",
            border: "1px solid #bbf7d0",
          }}
        >
          {success}
        </div>
      )}

      {loading && <p>Loading profile...</p>}

      {!loading && (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "1.25rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            maxWidth: "600px",
          }}
        >
          <form style={{ display: "grid", gap: "1rem" }} onSubmit={handleSave}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span>Email</span>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                style={{ padding: "0.6rem 0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span>Full name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Name Surname"
                style={{ padding: "0.6rem 0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span>Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={{ padding: "0.6rem 0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span>Student ID</span>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 20231234"
                style={{ padding: "0.6rem 0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span>Phone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(optional)"
                style={{ padding: "0.6rem 0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
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
                  fontWeight: 600,
                }}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
