import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Lock, Activity, ArrowRight, Users, FileSearch, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OTIC — Proctored Assessment System" },
      { name: "description", content: "End-to-end recruitment: job postings, AI screening, proctored assessments, and results — all in one platform." },
      { property: "og:title", content: "OTIC — Proctored Assessment System" },
      { property: "og:description", content: "End-to-end recruitment: job postings, AI screening, proctored assessments, and results — all in one platform." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
           <img src="/favicon.png" alt="OTIC" className="h-9 w-auto" />
          </div>
          <Link
            to="/hr/login"
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-deep"
          >
            HR Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-grid">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              End-to-end recruitment
            </div>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Hire smarter,
              <br />
              <span className="text-navy">screen faster.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              From job posting to proctored assessment — OTIC handles your entire recruitment pipeline. AI screening, blacklist checks, and tamper-proof testing in one platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/hr/login"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-deep"
              >
                Open HR Console
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              The pipeline
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
              From application to offer
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                step: "01",
                title: "Post & collect",
                body: "Post jobs on LinkedIn, Indeed, or anywhere. Candidates apply via your unique OTIC link.",
              },
              {
                icon: FileSearch,
                step: "02",
                title: "AI screening",
                body: "Automatically check CVs, screen answers against your criteria, and flag blacklisted candidates.",
              },
              {
                icon: Lock,
                step: "03",
                title: "Proctored test",
                body: "Shortlisted candidates take a tamper-proof test — webcam monitored, full-screen enforced.",
              },
              {
                icon: ClipboardCheck,
                step: "04",
                title: "Review & hire",
                body: "Review results, violations, and recordings. Email qualified candidates for interviews.",
              },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={title} className="rounded-lg border border-border bg-background p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-navy/10 text-navy">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-medium text-muted-foreground">{step}</span>
                </div>
                <h3 className="font-display text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "Webcam recording",
                body: "Full-session video plus snapshots every 60 seconds, available to reviewers.",
              },
              {
                icon: Lock,
                title: "Lockdown environment",
                body: "Full-screen enforcement, copy-paste blocked, tab switches logged with timestamps.",
              },
              {
                icon: Activity,
                title: "Reviewer-first scoring",
                body: "All violations surface in context. Reviewers decide pass, fail, or escalate.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-card p-6 sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent text-navy">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <span>© 2026 OTIC Proctored Assessment System. All rights reserved.</span>
          <span className="font-mono uppercase tracking-wider">v1.0</span>
        </div>
      </footer>
    </div>
  );
}