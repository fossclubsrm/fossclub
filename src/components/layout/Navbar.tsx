"use client";

import React from "react";
import { usePathname } from "next/navigation";
import PillNav, { PillNavItem } from "@/components/ui/PillNav";

const navItems: PillNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Team", href: "/team" },
  { label: "Events", href: "/events" },
  { label: "Join Us", href: "/recruitments" },
];

export default function Navbar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/cms")) return null;

  return (
    <PillNav
      logo="/images/logo-transparent.png"
logoAlt="FOSS Club SRM KTR"
      brandText="FOSS Club SRM KTR"
      items={navItems}
    />
  );
}

