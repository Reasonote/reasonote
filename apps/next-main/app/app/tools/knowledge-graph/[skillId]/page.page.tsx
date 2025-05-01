"use client";

import {useEffect} from "react";

import {useRouter} from "next/navigation";

export default function SkillPage({ params }: { params: { skillId: string } }) {
  const { skillId } = params;
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main page with the skillId as a query parameter
    router.replace(`/app/tools/knowledge-graph?skillId=${skillId}`);
  }, [skillId, router]);
  
  return null;
} 