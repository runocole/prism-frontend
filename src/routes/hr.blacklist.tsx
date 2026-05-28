import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Ban, Plus, Trash2, Search, Upload, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface BlacklistEntry {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  reason: string;
  created_at: string;
}

export const Route = createFileRoute("/hr/blacklist")({
  head: () => ({ meta: [{ title: "Blacklist — OTIC" }] }),
  component: BlacklistPage,
});

function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    authFetch(`${API}/jobs/blacklist/`)
      .then((r) => r.json())
      .then((d) => setEntries(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Remove from blacklist?")) return;
    setDeleting(id);
    try {
      await authFetch(`${API}/jobs/blacklist/${id}/`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const filtered = entries.filter((e) =>
    [e.name, e.email, e.phone, e.role].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="p-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Restricted
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Blacklist
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length} entries — candidates blocked from all positions
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep"
        >
          <Plus className="h-4 w-4" /> Add entry
        </button>
      </div>

      {/* Search */}
      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, role…"
          className="w-full rounded-md border border-input bg-card pl-9 pr-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
        />
      </div>

      {/* Table */}
      <div className="mt-4 rounded-lg border border-border bg-card shadow-soft">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {search ? "No results match your search." : "No blacklist entries."}
                  </td>
                </tr>
              )}
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10">
                        <Ban className="h-3.5 w-3.5 text-destructive" />
                      </div>
                      <span className="font-medium">{entry.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                    {entry.phone || "—"}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {entry.role || "—"}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {entry.reason || "No show"}
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddEntryModal
          onClose={() => setShowAdd(false)}
          onAdded={(entry) => {
            setEntries((prev) => [entry, ...prev]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function AddEntryModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (entry: BlacklistEntry) => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch(`${API}/jobs/blacklist/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onAdded(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy-deep/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border p-5">
          <h2 className="font-display text-lg font-semibold">Add to blacklist</h2>
        </div>
        <div className="space-y-4 p-5">
          {[
            { field: "name", label: "Full name *", placeholder: "John Doe" },
            { field: "phone", label: "Phone", placeholder: "+234 800 000 0000" },
            { field: "email", label: "Email", placeholder: "john@example.com" },
            { field: "role", label: "Role applied for", placeholder: "Business Development" },
            { field: "reason", label: "Reason", placeholder: "No show, declined offer, etc." },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </label>
              <input
                value={form[field as keyof typeof form]}
                onChange={(e) => set(field, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              />
            </div>
          ))}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            {saving ? "Adding…" : "Add to blacklist"}
          </button>
        </div>
      </div>
    </div>
  );
}