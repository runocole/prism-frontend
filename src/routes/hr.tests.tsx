import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { Plus, Clock, HelpCircle, CheckCircle2, Archive, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTests, publishTest, deleteTest, type APITest } from "@/services/assessments.service";

export const Route = createFileRoute("/hr/tests")({
  head: () => ({ meta: [{ title: "Tests — OTIC" }] }),
  loader: async (): Promise<{ tests: APITest[] }> => {
    const tests = await getTests();
    return { tests };
  },
  component: Tests,
});

type StatusFilter = "all" | "draft" | "published" | "archived";

type StyleEntry = {
  cls: string;
  label: string;
  Icon: (props: { className?: string }) => ReactNode;
};

const statusBadge: Record<APITest["status"], StyleEntry> = {
  draft: { cls: "bg-muted text-muted-foreground", label: "Draft", Icon: HelpCircle },
  published: { cls: "bg-success/15 text-success", label: "Published", Icon: CheckCircle2 },
  archived: { cls: "bg-destructive/10 text-destructive", label: "Archived", Icon: Archive },
};

function Tests() {
  const loaderData = Route.useLoaderData() as { tests: APITest[] };
  const navigate = useNavigate();
  const [tests, setTests] = useState<APITest[]>(loaderData.tests);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [publishing, setPublishing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const filtered = tests.filter((t) => filter === "all" || t.status === filter);

  // Group by department (stored in title field)
  const grouped = filtered.reduce<Record<string, APITest[]>>((acc, test) => {
    const dept = test.title?.trim() || "Uncategorised";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(test);
    return acc;
  }, {});

  const counts: Record<StatusFilter, number> = {
    all: tests.length,
    draft: tests.filter((t) => t.status === "draft").length,
    published: tests.filter((t) => t.status === "published").length,
    archived: tests.filter((t) => t.status === "archived").length,
  };

  const handlePublish = async (id: number) => {
    setPublishing(id);
    try {
      const updated = await publishTest(id);
      setTests((prev) => prev.map((t) => (t.id === id ? { ...t, status: updated.status } : t)));
    } catch {
      alert("Failed to publish test.");
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await deleteTest(id);
      setTests((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert("Failed to delete test.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Assessment library
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Tests</h1>
        </div>
        <button
          onClick={() => navigate({ to: "/hr/tests/new" })}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy-deep"
        >
          <Plus className="h-4 w-4" /> New test
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mt-8 flex items-center gap-1 border-b border-border">
        {(["all", "draft", "published", "archived"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm capitalize transition-colors -mb-px",
              filter === f
                ? "border-navy text-navy font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Grouped by department */}
      <div className="mt-6 space-y-8">
        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <HelpCircle className="h-8 w-8 opacity-30" />
            <p className="text-sm">No tests found. Create your first test.</p>
            <button
              onClick={() => navigate({ to: "/hr/tests/new" })}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline"
            >
              <Plus className="h-4 w-4" /> Create test
            </button>
          </div>
        )}

        {Object.entries(grouped).map(([dept, deptTests]) => (
          <div key={dept}>
            <div className="mb-3 flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-base font-semibold">{dept}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {deptTests.length} test{deptTests.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-soft">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Job Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Duration</th>
                    <th className="px-5 py-3 font-medium">Questions</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {deptTests.map((test) => {
                    const badge = statusBadge[test.status];
                    const Icon = badge.Icon;
                    return (
                      <tr
                        key={test.id}
                        className="border-b border-border last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium">{test.job_role || "—"}</div>
                          {test.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {test.description}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            badge.cls,
                          )}>
                            <Icon className="h-3 w-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {test.duration_mins} min
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-muted-foreground">
                          {test.question_count ?? 0}
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {new Date(test.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {test.status === "draft" && (
                              <>
                                <Link
                                  to="/hr/tests/$testId"
                                  params={{ testId: String(test.id) }}
                                  className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handlePublish(test.id)}
                                  disabled={publishing === test.id}
                                  className="rounded-md bg-navy px-3 py-1 text-xs font-medium text-navy-foreground hover:bg-navy-deep disabled:opacity-60"
                                >
                                  {publishing === test.id ? "Publishing…" : "Publish"}
                                </button>
                                <button
                                  onClick={() => handleDelete(test.id)}
                                  disabled={deleting === test.id}
                                  className="rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
                                >
                                  {deleting === test.id ? "Deleting…" : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                              </>
                            )}
                            {test.status === "published" && (
                              <>
                                <Link
                                  to="/hr/tests/$testId"
                                  params={{ testId: String(test.id) }}
                                  className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted"
                                >
                                  View
                                </Link>
                                <Link
                                  to="/hr/invites"
                                  className="text-xs font-medium text-navy hover:underline"
                                >
                                  Send invite →
                                </Link>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}