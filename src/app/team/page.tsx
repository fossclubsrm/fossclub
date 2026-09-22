"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Users, ChevronDown, Check, X } from "lucide-react";
import { TeamMember, DomainType } from "@/types";
import { playClickSound } from "@/lib/sound";

/* ─── Social SVGs (LinkedIn, Instagram, GitHub ONLY) ─────────────────────── */
const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);
const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

/* ─── Domain & Position Config ────────────────────────────────────────────── */
const DOMAIN_META: Record<string, { color: string; bg: string; border: string }> = {
  Technical: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.35)" },
  Corporate: { color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.35)" },
  Creative:  { color: "#fb7185", bg: "rgba(251, 113, 133, 0.15)", border: "rgba(251, 113, 133, 0.35)" },
};

const POSITION_ORDER = ["Head", "co-head", "Maintainer", "Volunteer"];
// Positions that fall under the "HEADS" umbrella (filter/group them together)
const HEADS_POSITIONS = ["Head", "co-head"];
const DOMAIN_PRIORITY_ORDER = ["Technical", "Corporate", "Creative"];

// Frontend-only display label. DB/logic keep the raw position name ("Head", "co-head").
const POSITION_LABEL = (p: string) =>
  p === "Head" ? "HEADS" : p === "co-head" ? "CO-HEAD" : p;

// Per-card badge label: singular "CLUB HEAD" on name cards (section header stays "HEADS").
const CARD_LABEL = (p: string) =>
  p === "Head" ? "CLUB HEAD" : p === "co-head" ? "CO-HEAD" : p;

const POSITION_BADGE: Record<string, { color: string; bg: string; border: string }> = {
  "Head":       { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" },
  "co-head":    { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" },
  "Maintainer": { color: "#d946ef", bg: "rgba(217, 70, 239, 0.12)", border: "rgba(217, 70, 239, 0.3)" },
  "Volunteer":  { color: "#a1a1aa", bg: "rgba(255, 255, 255, 0.05)", border: "rgba(255, 255, 255, 0.1)" },
};

/* ─── Motion Variants ─────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:  { opacity: 0, transition: { duration: 0.15 } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

/* ─── Member Card (Clean, Sharp, Zero Blur on Hover/Click) ─────────────────── */
function LiquidGlassMemberCard({
  member,
  position,
}: {
  member: TeamMember;
  position: string;
}) {
  const dm = DOMAIN_META[member.domain] || DOMAIN_META.Technical;
  const pb = POSITION_BADGE[position] || POSITION_BADGE.Volunteer;

  return (
    <motion.div variants={fadeUp} layout className="group h-full">
      <div className={`bg-[#0c0c0e] rounded-2xl p-3 sm:p-3.5 h-full relative flex flex-col justify-between border border-white/10 transition-all duration-300 shadow-lg overflow-hidden hover:border-white/30 hover:shadow-[0_0_22px_rgba(255,255,255,0.35)] isolate [transform:translateZ(0)]`}>
        {/* Specular Catch-light */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-20"
          style={{
            background: "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent)",
          }}
        />

        <div>
          {/* Square Image Container with Rounded Corners - Clean without overlays */}
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#060608] shrink-0 border border-white/10 shadow-inner mb-3">
            {member.imageUrl ? (
              <img
                src={member.imageUrl}
                alt={member.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-top rounded-xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold font-mono text-[#22c55e]/40">
                {member.name[0] || "?"}
              </div>
            )}

            {/* Ambient Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none rounded-xl" />
          </div>

          {/* Content Body */}
          <div>
            <h3 className="text-[#fafafa] font-extrabold text-sm group-hover:text-[#22c55e] transition-colors truncate tracking-tight">
              {member.name}
            </h3>

            {/* Separate Badges: Position and Domain */}
            <div className="mt-2 flex items-center gap-1">
              {/* Box 1: Position */}
              <span
                className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-extrabold px-1 py-0.5 rounded border uppercase tracking-wide whitespace-nowrap shrink-0"
                style={{
                  color: pb.color,
                  background: pb.bg,
                  borderColor: pb.border,
                }}
              >
                <span>{CARD_LABEL(position)}</span>
              </span>

              {/* Box 2: Domain */}
              <span
                className="inline-flex items-center text-[9px] sm:text-[10px] font-mono font-extrabold px-1 py-0.5 rounded border uppercase tracking-wide whitespace-nowrap shrink-0"
                style={{ color: dm.color, background: dm.bg, borderColor: dm.border }}
              >
                <span>{member.domain}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Social Links (LinkedIn, Instagram, GitHub ONLY) with prominent glowing buttons */}
        {(member.github || member.linkedin || member.instagram) && (
          <div className="flex items-center gap-2 pt-3 border-t border-white/[0.08] mt-3">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noreferrer"
                onClick={() => { try { playClickSound(); } catch {} }}
                className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-[#38bdf8] hover:border-[#38bdf8]/50 hover:bg-[#38bdf8]/10 hover:shadow-[0_0_18px_rgba(56,189,248,0.5)] transition-all duration-200 active:scale-95"
                title="LinkedIn Profile"
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
            )}
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noreferrer"
                onClick={() => { try { playClickSound(); } catch {} }}
                className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/40 hover:bg-white/10 hover:shadow-[0_0_18px_rgba(255,255,255,0.45)] transition-all duration-200 active:scale-95"
                title="GitHub Profile"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            )}
            {member.instagram && (
              <a
                href={member.instagram}
                target="_blank"
                rel="noreferrer"
                onClick={() => { try { playClickSound(); } catch {} }}
                className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-[#fb7185] hover:border-[#fb7185]/50 hover:bg-[#fb7185]/10 hover:shadow-[0_0_18px_rgba(251,113,133,0.5)] transition-all duration-200 active:scale-95"
                title="Instagram Profile"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Global In-Memory Cache for 0ms Instant Navigation ─────────────────── */
let cachedTeamMembers: TeamMember[] | null = null;
let cachedLatestYear: string = "2025-26";

/* ─── Main Team Page ──────────────────────────────────────────────────────── */
export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(() => cachedTeamMembers || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedTeamMembers);
  const [filterDomain, setFilterDomain] = useState<string>("All");
  const [filterPosition, setFilterPosition] = useState<string>("All");
  const [filterYear, setFilterYear] = useState<string>(() => cachedLatestYear);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setIsYearOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => {
        if (d?.data && Array.isArray(d.data)) {
          cachedTeamMembers = d.data;
          setMembers(d.data);

          // Find the maximum academic year in DB
          let maxStartYear = 2025;
          d.data.forEach((m: TeamMember) => {
            m.statusHistory?.forEach((h) => {
              if (!h.year) return;
              const match = h.year.match(/^(\d{4})/);
              if (match) {
                const y = parseInt(match[1], 10);
                if (!isNaN(y) && y > maxStartYear) maxStartYear = y;
              }
            });
          });

          const maxYearStr = `${maxStartYear}-${String((maxStartYear + 1) % 100).padStart(2, "0")}`;
          cachedLatestYear = maxYearStr;
          setFilterYear(maxYearStr);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* Generate all consecutive years from max year in db down to 2025-26 */
  const availableYears = useMemo(() => {
    let maxStartYear = 2025;
    let minStartYear = 2025;

    members.forEach((m) => {
      m.statusHistory?.forEach((h) => {
        if (!h.year) return;
        const match = h.year.match(/^(\d{4})/);
        if (match) {
          const y = parseInt(match[1], 10);
          if (!isNaN(y)) {
            if (y > maxStartYear) maxStartYear = y;
            if (y < minStartYear) minStartYear = y;
          }
        }
      });
    });

    const years: string[] = [];
    for (let y = maxStartYear; y >= minStartYear; y--) {
      const next = String((y + 1) % 100).padStart(2, "0");
      years.push(`${y}-${next}`);
    }

    return years;
  }, [members]);

  /* Filter by domain and year, and resolve exact position */
  const displayList = useMemo(() => {
    return members
      .filter((m) => {
        // Domain filter
        if (filterDomain !== "All" && m.domain !== filterDomain) return false;

        // Year filter: member MUST have an entry for the selected year
        return m.statusHistory?.some((h) => h.year === filterYear);
      })
      .map((m) => {
        // Position resolution for the selected year
        const resolvedPosition =
          m.statusHistory?.find((h) => h.year === filterYear)?.position || "Volunteer";
        return { member: m, position: resolvedPosition };
      })
      .filter((item) => {
        // Position filter ("Head" umbrella includes "co-head")
        if (filterPosition !== "All") {
          if (filterPosition === "Head" && HEADS_POSITIONS.includes(item.position)) return true;
          if (item.position !== filterPosition) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // 1. Hierarchy ordering: Head -> Maintainer -> Volunteer
        const rankA = POSITION_ORDER.indexOf(a.position);
        const rankB = POSITION_ORDER.indexOf(b.position);
        const rankDiff = (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB);
        if (rankDiff !== 0) return rankDiff;

        // 2. Index / Order (optional field): lower numbers show first
        const idxA = a.member.order ?? a.member.index;
        const idxB = b.member.order ?? b.member.index;
        const hasIdxA = typeof idxA === "number" && !isNaN(idxA);
        const hasIdxB = typeof idxB === "number" && !isNaN(idxB);

        if (hasIdxA && hasIdxB) {
          if (idxA !== idxB) return idxA - idxB;
        } else if (hasIdxA) {
          return -1; // Member with index comes first
        } else if (hasIdxB) {
          return 1; // Member with index comes first
        }

        // 3. Domain Priority: Technical -> Creative -> Corporate
        const domA = DOMAIN_PRIORITY_ORDER.indexOf(a.member.domain);
        const domB = DOMAIN_PRIORITY_ORDER.indexOf(b.member.domain);
        const domDiff = (domA === -1 ? 99 : domA) - (domB === -1 ? 99 : domB);
        if (domDiff !== 0) return domDiff;

        // 4. Alphabetical order by member name
        return a.member.name.localeCompare(b.member.name, undefined, { sensitivity: "base" });
      });
  }, [members, filterDomain, filterYear, filterPosition]);

  /* Group by hierarchy: Head + co-head (HEADS) -> Maintainer -> Volunteer */
  const groupedHierarchy = useMemo(() => {
    const groups: Record<string, { member: TeamMember; position: string }[]> = {};
    POSITION_ORDER.forEach((pos) => {
      // co-head members are grouped under the HEADS section alongside Head
      const groupKey = pos === "co-head" ? "Head" : pos;
      const matching = displayList.filter((item) => item.position === pos);
      if (matching.length > 0) {
        groups[groupKey] = [...(groups[groupKey] || []), ...matching];
      }
    });

    // Handle any custom positions
    const other = displayList.filter((item) => !POSITION_ORDER.includes(item.position));
    if (other.length > 0) groups["Other Members"] = other;

    return groups;
  }, [displayList]);

  const DOMAINS = ["All", "Technical", "Corporate", "Creative"];

  return (
    <div className="min-h-screen bg-transparent text-[#fafafa] relative overflow-hidden">

      {/* Hero Header */}
      <section ref={headerRef} className="pt-24 sm:pt-28 pb-8 sm:pb-10 px-4 sm:px-6 max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <h1 className="text-4xl xs:text-5xl md:text-7xl font-black text-[#fafafa] leading-[0.96] tracking-tight">
            Meet Our <br />
            <span style={{ color: "#22c55e" }}>Team</span>
          </h1>
        </motion.div>
      </section>

      {/* Filter Toolbar (Translucent Liquid Glass) */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto pb-6 sm:pb-8 relative z-30">
        <div className="relative z-30 p-2 sm:p-2.5 rounded-2xl border border-white/20 backdrop-blur-2xl bg-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.28),0_16px_36px_-8px_rgba(0,0,0,0.7)]">
          
          {/* Domain Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {DOMAINS.map((d) => {
              const dm = d !== "All" ? DOMAIN_META[d] : null;
              const active = filterDomain === d;
              return (
                <button
                  key={d}
                  onClick={() => setFilterDomain(d)}
                  className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-semibold transition-all duration-200 cursor-pointer"
                  style={
                    active
                      ? {
                          color: dm?.color ?? "#fafafa",
                          background: dm?.bg ?? "rgba(255, 255, 255, 0.14)",
                          border: `1px solid ${dm?.border ?? "rgba(255, 255, 255, 0.3)"}`,
                          boxShadow: "0 0 16px -4px rgba(34, 197, 94, 0.25)",
                        }
                      : {
                          color: "#71717a",
                          background: "transparent",
                          border: "1px solid transparent",
                        }
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Year Glass Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider hidden md:inline">
              Year:
            </span>
            <div className="relative z-40 w-full sm:w-auto" ref={yearDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsYearOpen(!isYearOpen);
                }}
                className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-2xl border border-white/20 hover:border-white/35 text-[#fafafa] text-xs font-mono transition-all shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)] cursor-pointer"
              >
                <span>{filterYear}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    isYearOpen ? "rotate-180 text-[#22c55e]" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isYearOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-full sm:w-48 rounded-2xl bg-[#080c14]/95 backdrop-blur-3xl border border-white/20 p-1.5 shadow-[0_20px_45px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] z-50 overflow-hidden"
                  >
                    {availableYears.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setFilterYear(y);
                          setIsYearOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-left transition-all ${
                          filterYear === y
                            ? "bg-[#0c2317] text-[#22c55e] border border-[#14532d] font-bold shadow-sm"
                            : "text-zinc-300 hover:text-white hover:bg-white/[0.08]"
                        }`}
                      >
                        <span>{y}</span>
                        {filterYear === y && <Check className="w-3.5 h-3.5 text-[#22c55e]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Hierarchy / Rank Filter Bar */}
        <div className="relative z-10 mt-3 sm:mt-4 p-2 sm:p-2.5 rounded-2xl border border-white/15 backdrop-blur-2xl bg-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.15)]">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <span className="text-[9.5px] font-mono text-zinc-400 font-semibold flex items-center gap-1.5 px-1 mr-0.5">
              <span className="uppercase tracking-wider">Rank:</span>
            </span>

            {/* Heads Button (Head + Co-Head) */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setFilterPosition((prev) => (prev === "Head" ? "All" : "Head"));
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                filterPosition === "Head"
                  ? "border border-amber-400 text-amber-300 bg-amber-500/25 shadow-[0_0_18px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/60"
                  : "border border-amber-500/30 text-amber-400/90 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/60 hover:text-amber-300"
              }`}
              title={filterPosition === "Head" ? "Filtered by Heads — Click to see all ranks" : "Click to filter by Heads (Head & Co-Head)"}
            >
              <span>HEADS</span>
              {filterPosition === "Head" && <X className="w-3 h-3 ml-0.5 text-amber-300 shrink-0" />}
            </button>

            <span className="text-zinc-600 font-mono text-xs select-none">›</span>

            {/* Maintainer Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setFilterPosition((prev) => (prev === "Maintainer" ? "All" : "Maintainer"));
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                filterPosition === "Maintainer"
                  ? "border border-[#d946ef] text-[#fae8ff] bg-[#d946ef]/20 shadow-[0_0_22px_rgba(217,70,239,0.7),inset_0_0_10px_rgba(217,70,239,0.25)] ring-1 ring-[#d946ef]"
                  : "border border-[#d946ef]/40 text-[#f0abfc] bg-[#d946ef]/10 hover:bg-[#d946ef]/20 hover:border-[#d946ef] hover:text-white hover:shadow-[0_0_18px_rgba(217,70,239,0.55)]"
              }`}
              title={filterPosition === "Maintainer" ? "Filtered by Maintainer — Click to see all ranks" : "Click to filter by Maintainer"}
            >
              <span>Maintainer</span>
              {filterPosition === "Maintainer" && <X className="w-3 h-3 ml-0.5 text-[#f5d0fe] shrink-0" />}
            </button>

            <span className="text-zinc-600 font-mono text-xs select-none">›</span>

            {/* Volunteer Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setFilterPosition((prev) => (prev === "Volunteer" ? "All" : "Volunteer"));
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                filterPosition === "Volunteer"
                  ? "border border-zinc-300 text-white bg-white/25 shadow-[0_0_18px_rgba(255,255,255,0.35)] ring-1 ring-white/60"
                  : "border border-white/15 text-zinc-300 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/30"
              }`}
              title={filterPosition === "Volunteer" ? "Filtered by Volunteer — Click to see all ranks" : "Click to filter by Volunteer"}
            >
              <span>Volunteer</span>
              {filterPosition === "Volunteer" && <X className="w-3 h-3 ml-0.5 text-white shrink-0" />}
            </button>
          </div>

          {/* Right Status Indicator */}
          <div className="text-[11px] font-mono flex items-center justify-between sm:justify-end gap-2.5 px-1">
            <span className="text-zinc-500 hidden sm:inline">
              Click rank to filter
            </span>
            {filterYear && (
              <span className="text-zinc-500 hidden md:inline">
                • Year {filterYear}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Roster Grid */}
      <main className="px-4 sm:px-6 max-w-6xl mx-auto pb-28 relative z-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl backdrop-blur-xl bg-white/[0.02]">
            <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm font-mono">
              {members.length === 0
                ? "No team members recorded yet. Add members via CMS."
                : filterPosition !== "All"
                ? `No ${POSITION_LABEL(filterPosition)} members recorded for year ${filterYear}${filterDomain !== "All" ? ` in ${filterDomain} domain` : ""}.`
                : `No members recorded for year ${filterYear}.`}
            </p>
            {(filterPosition !== "All" || filterDomain !== "All") && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setFilterPosition("All");
                  setFilterDomain("All");
                  setFilterYear(cachedLatestYear);
                }}
                className="mt-3 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 text-xs font-mono transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          /* Render grouped by hierarchy */
          <div className="space-y-12">
            {Object.entries(groupedHierarchy).map(([pos, items]) => {
              const pb = POSITION_BADGE[pos] || POSITION_BADGE.Volunteer;
              return (
                <section key={pos}>
                  {/* Position Header with translucent badge & divider */}
                  <div className="flex items-center gap-3 mb-6">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-lg border uppercase tracking-wider backdrop-blur-md"
                      style={{
                        color: pb.color,
                        background: pb.bg,
                        borderColor: pb.border,
                        boxShadow: pos === "Maintainer" ? "0 0 14px rgba(217, 70, 239, 0.45)" : undefined,
                      }}
                    >
                      {POSITION_LABEL(pos)}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  {/* Cards Grid */}
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                  >
                    <AnimatePresence mode="popLayout">
                      {items.map(({ member, position }) => (
                        <LiquidGlassMemberCard
                          key={member._id}
                          member={member}
                          position={position}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </section>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
