import { Skeleton } from "@/app/app-skeletons";

// Route-level boundary for every app page. Sidebar navigations swap to this
// instantly while the destination page's server render (auth + Firestore
// gating) streams in, instead of freezing on the previous page.
export default function AppLoading() {
  return (
    <div className="app-x flex h-full min-h-0 flex-col gap-6 pt-6 md:ml-4 md:mr-0.5">
      <div className="hidden md:block">
        <Skeleton className="h-8 w-44" />
      </div>
      <Skeleton className="h-10 w-full max-w-2xl" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
}
