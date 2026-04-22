"use client";
// Route: / — YouTube University main dashboard.
// dynamic(ssr:false): MainGrid touches `document` at module load (theme detection,
// audio singletons). Rendering it server-side would crash the prerender. Skipping
// SSR for this route means the first paint is empty then hydrates — fine for an
// interactive dashboard where users already expect a brief loading state.
import dynamicImport from "next/dynamic";
import { useRouter } from "next/navigation";
import { TARGET_TO_PATH, type PageTarget } from "@/components/youtube/pages/nav";

const MainGrid = dynamicImport(
  () => import("@/components/youtube/main-grid/MainGrid").then((m) => m.MainGrid),
  { ssr: false },
);

export default function Home() {
  const router = useRouter();
  const onNavigate = (target: PageTarget) => router.push(TARGET_TO_PATH[target]);
  return <MainGrid orangeColor="#E14920" onNavigate={onNavigate} />;
}
