"use client";
import { useRouter } from "next/navigation";
import { FaqPage } from "@/components/youtube/pages/FaqPage";
import { TARGET_TO_PATH, type PageTarget } from "@/components/youtube/pages/nav";

export default function Page() {
  const router = useRouter();
  const onNavigate = (target: PageTarget) => router.push(TARGET_TO_PATH[target]);
  return <FaqPage onNavigate={onNavigate} />;
}
