"use client";
// Route: /info — Next.js wires this component to the URL /info.
// router.push: Next.js navigation — replaces Storybook's linkTo in production.
// TARGET_TO_PATH: the single source of truth for "which PageTarget → which URL".
import { useRouter } from "next/navigation";
import { InfoPage } from "@/components/youtube/pages/InfoPage";
import { TARGET_TO_PATH, type PageTarget } from "@/components/youtube/pages/nav";

export default function Page() {
  const router = useRouter();
  const onNavigate = (target: PageTarget) => router.push(TARGET_TO_PATH[target]);
  return <InfoPage onNavigate={onNavigate} />;
}
