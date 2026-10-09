import { Suspense } from "react";
import { JobDetail } from "@/components/screens/JobDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-zinc-400 text-[13px]">
          Loading job ledger…
        </div>
      }
    >
      <JobDetail jobId={id} />
    </Suspense>
  );
}
