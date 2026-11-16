"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function HeaderAuth() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Link href="/overview" className="site-btn site-btn-sm site-btn-primary">
        Overview
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="site-nav-link">
        Sign in
      </Link>
      <Link href="/signup" className="site-btn site-btn-sm site-btn-primary">
        Get started
      </Link>
    </>
  );
}
