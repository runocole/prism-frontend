import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/c/$token/done")({
  head: () => ({ meta: [{ title: "Assessment submitted — OTIC" }] }),
  component: Done,
});

function Done() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Assessment submitted
        </h1>
        <p className="mt-3 text-muted-foreground">
          Thank you. Your responses and recording have been securely transmitted to the hiring
          team. They'll be in touch with next steps.
        </p>
        <img src="/favicon.png" alt="OTIC" className="h-8 w-auto" />
        <div className="mt-8">
          <Link to="/" className="text-sm text-navy hover:underline">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
