"use client";
import { Suspense } from "react";
import SetupPasswordPage from "./SetupPasswordPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetupPasswordPage />
    </Suspense>
  );
} 