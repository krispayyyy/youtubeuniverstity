"use client";
import { useRouter } from "next/navigation";
import { MethodologyPage } from "@/components/youtube/pages/MethodologyPage";
import { TARGET_TO_PATH, type PageTarget } from "@/components/youtube/pages/nav";

export default function Page() {
  const router = useRouter();
  const onNavigate = (target: PageTarget) => router.push(TARGET_TO_PATH[target]);
  return <MethodologyPage onNavigate={onNavigate} />;
}
