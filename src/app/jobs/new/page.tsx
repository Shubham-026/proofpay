import { Suspense } from "react";
import { NewJob } from "@/components/screens/NewJob";

export default function NewJobPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-zinc-400 text-[13px]">
          Initializing editor…
        </div>
      }
    >
      <NewJob />
    </Suspense>
  );
}
