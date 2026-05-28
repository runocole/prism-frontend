import { createFileRoute } from "@tanstack/react-router";
import { HrLayout } from "@/components/HrLayout";

export const Route = createFileRoute("/hr")({
  component: HrLayout,
});
