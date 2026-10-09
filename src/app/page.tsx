import { Suspense } from "react";
import { JobsList } from "@/components/screens/JobsList";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-zinc-400 text-[13px]">
          Loading jobs ledger…
        </div>
      }
    >
      <JobsList />
    </Suspense>
  );
}
