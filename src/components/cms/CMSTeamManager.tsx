"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TeamMember, DomainType, StatusHistoryEntry } from "@/types";
import {
  Plus, Edit2, Trash2, Save, X, Check, AlertCircle,
  Award, Github, Linkedin, Instagram, Search, ChevronDown, ChevronUp,
} from "lucide-react";
import { playClickSound, playSuccessSound } from "@/lib/sound";
import { useGlassToast } from "@/components/ui/GlassToast";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { notifySessionExpired } from "@/lib/authClient";

const DOMAINS: DomainType[] = ["Technical", "Corporate", "Creative"];
const DOMAIN_PRIORITY_ORDER: DomainType[] = ["Technical", "Corporate", "Creative"];
const POSITIONS = ["Head", "co-head", "Maintainer", "Volunteer"];
const positionLabel = (p: string) => (p === "co-head" ? "CO-HEAD" : p);

const DOMAIN_META: Record<string, { color: string; bg: string; border: string }> = {
  Technical: { color: "#22c55e", bg: "#0c2317", border: "#14532d" },
  Corporate: { color: "#38bdf8", bg: "#082f49", border: "#0c4a6e" },
  Creative:  { color: "#fb7185", bg: "rgba(251, 113, 133, 0.15)", border: "rgba(251, 113, 133, 0.35)" },
};

const INPUT_CLS = "w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono text-xs placeholder-zinc-500 transition-colors";
const LABEL_CLS = "block text-[11px] font-mono text-gray-400 mb-1 uppercase tracking-wider";

export function CMSTeamManager() {
  const toast = useGlassToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [saveMsg, setSaveMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingMember) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [editingMember]);

  const fetchMembers = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("foss_cms_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/team?t=${Date.now()}`, { headers, cache: "no-store" });
      if (res.status === 401) {
        notifySessionExpired();
        return;
      }
      const data = await res.json();
      if (data.data) setMembers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const getMaxYearStr = (): string => {
    let maxStartYear = 2024;
    members.forEach((m) => {
      m.statusHistory?.forEach((h) => {
        if (!h.year) return;
        const match = h.year.match(/^(\d{4})/);
        if (match) {
          const y = parseInt(match[1], 10);
          if (!isNaN(y) && y > maxStartYear) maxStartYear = y;
        }
      });
    });
    return `${maxStartYear}-${String((maxStartYear + 1) % 100).padStart(2, "0")}`;
  };

  const blankMember = (): TeamMember => ({
    _id: "",
    name: "",
    regNo: "",
    imageUrl: "",
    domain: "Technical",
    github: "",
    linkedin: "",
    instagram: "",
    statusHistory: [{ position: "Volunteer", year: getMaxYearStr() }],
    featured: false,
    order: undefined,
    index: undefined,
  });

  const handleAddNew = () => {
    playClickSound();
    setIsNew(true);
    setEditingMember(blankMember());
    setSaveStatus("idle");
  };

  const handleEdit = (member: TeamMember) => {
    playClickSound();
    setIsNew(false);
    setEditingMember(JSON.parse(JSON.stringify(member)));
    setSaveStatus("idle");
  };

  const handleDelete = (id: string, name: string) => {
    toast.confirmDelete({
      title: "Remove Team Member?",
      message: `Are you sure you want to remove ${name} from the active roster? This action cannot be undone.`,
      confirmLabel: "Delete Member",
      onConfirm: async () => {
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("foss_cms_token") : null;
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(`/api/team/${id}`, { method: "DELETE", headers });
          if (res.status === 401) {
            notifySessionExpired();
            return;
          }
          const data = await res.json();
          if (data.success) {
            setMembers((prev) => prev.filter((m) => m._id !== id));
            toast.deleted("Member Removed", `${name} has been deleted from the roster.`);
          } else {
            toast.error("Delete Failed", data.error || "Could not delete member");
          }
        } catch {
          toast.error("Delete Failed", "Network error while deleting member");
        }
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const hasValidStatusHistory = (editingMember.statusHistory || []).some(
      (h) => h.position && h.position.trim() && h.year && h.year.trim()
    );
    if (!hasValidStatusHistory) {
      setSaveStatus("err");
      setSaveMsg("Position by Year is required — add at least one year entry.");
      toast.error("Validation Error", "Position by Year is required. Click \"Add Year\".");
      return;
    }

    setSaveStatus("saving");
    setSaveMsg("Saving...");
    try {
      const url = isNew ? "/api/team" : `/api/team/${editingMember._id}`;
      const method = isNew ? "POST" : "PUT";
      const token = typeof window !== "undefined" ? localStorage.getItem("foss_cms_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(editingMember),
      });
      if (res.status === 401) {
        notifySessionExpired();
        return;
      }
      const data = await res.json();
      if (data.success) {
        playSuccessSound();
        setSaveStatus("ok");
        const msg = isNew ? "Member created!" : "Saved successfully!";
        setSaveMsg(msg);
        toast.success(isNew ? "Member Created" : "Member Updated", `${editingMember.name} has been saved.`);
        setTimeout(() => {
          setEditingMember(null);
          setSaveStatus("idle");
          fetchMembers();
        }, 800);
      } else {
        setSaveStatus("err");
        setSaveMsg(data.error || "Save failed");
        toast.error("Save Failed", data.error || "Could not save member");
      }
    } catch {
      setSaveStatus("err");
      setSaveMsg("Server error");
      toast.error("Save Failed", "Network error while saving member");
    }
  };

  const handleAddStatusRow = () => {
    if (!editingMember) return;
    setEditingMember({
      ...editingMember,
      statusHistory: [{ position: "Volunteer", year: getMaxYearStr() }, ...(editingMember.statusHistory || [])],
    });
  };

  const handleRemoveStatusRow = (idx: number) => {
    if (!editingMember) return;
    const updated = [...(editingMember.statusHistory || [])];
    updated.splice(idx, 1);
    setEditingMember({ ...editingMember, statusHistory: updated });
  };

  const handleStatusChange = (idx: number, field: keyof StatusHistoryEntry, value: string) => {
    if (!editingMember) return;
    const updated = [...(editingMember.statusHistory || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditingMember({ ...editingMember, statusHistory: updated });
  };

  const field = (key: keyof TeamMember) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditingMember((prev) => prev ? { ...prev, [key]: e.target.value } : prev);

  const filteredMembers = members
    .filter((member) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = member.name.toLowerCase().includes(q);
      const matchRegNo = member.regNo?.toLowerCase().includes(q);
      const matchDomain = member.domain.toLowerCase().includes(q);
      const matchCaption = member.caption?.toLowerCase().includes(q);
      const matchStatus = member.statusHistory?.some(
        (h) => h.position.toLowerCase().includes(q) || h.year.toLowerCase().includes(q)
      );
      return matchName || matchRegNo || matchDomain || matchCaption || matchStatus;
    })
    .sort((a, b) => {
      const posA = a.statusHistory?.[0]?.position || "Volunteer";
      const posB = b.statusHistory?.[0]?.position || "Volunteer";
      const rankA = POSITIONS.indexOf(posA);
      const rankB = POSITIONS.indexOf(posB);
      const rankDiff = (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB);
      if (rankDiff !== 0) return rankDiff;

      const idxA = a.order ?? a.index;
      const idxB = b.order ?? b.index;
      const hasIdxA = typeof idxA === "number" && !isNaN(idxA);
      const hasIdxB = typeof idxB === "number" && !isNaN(idxB);

      if (hasIdxA && hasIdxB) {
        if (idxA !== idxB) return idxA - idxB;
      } else if (hasIdxA) {
        return -1;
      } else if (hasIdxB) {
        return 1;
      }

      // Domain Priority: Technical -> Creative -> Corporate
      const domA = DOMAIN_PRIORITY_ORDER.indexOf(a.domain);
      const domB = DOMAIN_PRIORITY_ORDER.indexOf(b.domain);
      const domDiff = (domA === -1 ? 99 : domA) - (domB === -1 ? 99 : domB);
      if (domDiff !== 0) return domDiff;

      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Team Roster</h2>
          <p className="text-xs text-gray-400">
            Add members via ImageKit URL. Track positions across years.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono flex items-center space-x-1.5 self-start sm:self-auto transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name, Reg. No, domain, position, or year (e.g. RA2311..., Technical)..."
            className="w-full pl-9 pr-8 py-2 bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-xl text-[#fafafa] text-xs font-mono focus:outline-none focus:border-[#22c55e] placeholder-zinc-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between sm:justify-end gap-3 px-2">
          <span>
            Showing <strong className="text-white">{filteredMembers.length}</strong> of {members.length} members
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[#22c55e] hover:underline font-bold"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 font-mono text-xs animate-pulse">Loading roster...</div>
      ) : members.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
          <p className="text-gray-400 text-xs font-mono">No members yet. Add one above.</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
          <Search className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-300 text-xs font-mono font-semibold">No members match &quot;{searchQuery}&quot;</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-2 text-xs text-[#22c55e] font-mono underline"
          >
            Reset search query
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card-Based List (< sm) */}
          <div className="block sm:hidden space-y-3">
            {filteredMembers.map((member) => {
              const dm = DOMAIN_META[member.domain] || DOMAIN_META.Technical;
              return (
                <div
                  key={member._id}
                  className="p-4 rounded-2xl bg-[#080C14] border border-white/10 space-y-3 shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                      {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-base font-bold font-mono">{member.name[0]}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="font-bold text-white text-sm font-sans truncate">{member.name}</p>
                          {member.regNo && (
                            <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-zinc-300 font-mono text-[9px] tracking-wider shrink-0">
                              {member.regNo}
                            </span>
                          )}
                        </div>
                        {(member.order !== undefined && member.order !== null) || (member.index !== undefined && member.index !== null) ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] font-mono shrink-0">
                            #{member.order ?? member.index}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border"
                          style={{ color: dm.color, background: dm.bg, borderColor: dm.border }}
                        >
                          {member.domain}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Positions */}
                  {member.statusHistory && member.statusHistory.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {member.statusHistory.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] text-zinc-300 font-mono">
                          {positionLabel(h.position)} <span className="text-zinc-500">({h.year})</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom bar with Socials & Action buttons */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                    <div className="flex items-center gap-3 text-zinc-400">
                      {member.github && (
                        <a href={member.github} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="GitHub">
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors" title="LinkedIn">
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.instagram && (
                        <a href={member.instagram} target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors" title="Instagram">
                          <Instagram className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(member)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-mono flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(member._id, member.name)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-xs text-red-400 font-mono flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Spacious Table (>= sm) */}
          <div className="hidden sm:block rounded-2xl bg-[#080C14] border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0b101c] text-gray-400 border-b border-white/10 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Member</th>
                    <th className="p-4">Index</th>
                    <th className="p-4">Domain</th>
                    <th className="p-4">Position History</th>
                    <th className="p-4">Socials</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMembers.map((member) => {
                    const dm = DOMAIN_META[member.domain] || DOMAIN_META.Technical;
                    return (
                      <tr key={member._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0">
                              {member.imageUrl ? (
                                <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-base font-bold font-mono">{member.name[0]}</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white text-sm font-sans truncate">{member.name}</p>
                                {member.regNo && (
                                  <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-zinc-300 font-mono text-[10px] tracking-wider shrink-0" title="University Registration Number">
                                    {member.regNo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {(member.order !== undefined && member.order !== null) || (member.index !== undefined && member.index !== null) ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-[11px] font-mono">
                              #{member.order ?? member.index}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-[11px] font-mono">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border backdrop-blur-md"
                            style={{ color: dm.color, background: dm.bg, borderColor: dm.border }}
                          >
                            {member.domain}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">
                          <div className="flex flex-wrap gap-1.5">
                            {member.statusHistory?.map((h, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] text-zinc-300 font-mono">
                                {positionLabel(h.position)} <span className="text-zinc-500">({h.year})</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5 text-zinc-400">
                            {member.github && (
                              <a href={member.github} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="GitHub">
                                <Github className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {member.linkedin && (
                              <a href={member.linkedin} target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors" title="LinkedIn">
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {member.instagram && (
                              <a href={member.instagram} target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors" title="Instagram">
                                <Instagram className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                            title="Edit member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(member._id, member.name)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {mounted && editingMember && createPortal(
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full sm:max-w-xl bg-[#080C14] border border-white/20 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] backdrop-blur-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 shrink-0 bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white font-mono">
                {isNew ? "+ New Member" : `Edit: ${editingMember.name}`}
              </h3>
              <button onClick={() => setEditingMember(null)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1 overscroll-contain">

                {/* Name & Reg. No */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editingMember.name}
                      onChange={field("name")}
                      className={INPUT_CLS}
                      placeholder="e.g. Mohamed Azam"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={LABEL_CLS}>Registration No.</label>
                      <span className="text-[9px] font-mono text-emerald-400/90 uppercase tracking-wider">
                        Hidden from site
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editingMember.regNo || ""}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          regNo: e.target.value.toUpperCase(),
                        })
                      }
                      className={INPUT_CLS}
                      placeholder="e.g. RA2311003010123"
                    />
                  </div>
                </div>

                {/* ImageKit URL */}
                <div>
                  <label className={LABEL_CLS}>Profile Image URL (from ImageKit)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#111114] border border-white/10 shrink-0">
                      {editingMember.imageUrl ? (
                        <img src={editingMember.imageUrl} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-mono">IMG</div>
                      )}
                    </div>
                    <input type="url" value={editingMember.imageUrl} onChange={field("imageUrl")}
                      className={INPUT_CLS} placeholder="https://ik.imagekit.io/fossclubsrm/..." />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">Upload the image to ImageKit first, then paste the URL here.</p>
                </div>

                {/* Socials */}
                <div className="space-y-2">
                  <p className={LABEL_CLS}>Social Links</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                      <input type="url" value={editingMember.linkedin || ""} onChange={field("linkedin")}
                        className={INPUT_CLS} placeholder="https://linkedin.com/in/username" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Instagram className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                      <input type="url" value={editingMember.instagram || ""} onChange={field("instagram")}
                        className={INPUT_CLS} placeholder="https://instagram.com/username" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Github className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
                      <input type="url" value={editingMember.github || ""} onChange={field("github")}
                        className={INPUT_CLS} placeholder="https://github.com/username" />
                    </div>
                  </div>
                </div>

                {/* Domain & Display Index */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Domain *</label>
                    <GlassSelect
                      value={editingMember.domain}
                      onChange={(val) => setEditingMember({ ...editingMember, domain: val as DomainType })}
                      options={[
                        { value: "Technical", label: "Technical", color: "#22c55e" },
                        { value: "Corporate", label: "Corporate", color: "#38bdf8" },
                        { value: "Creative",  label: "Creative",  color: "#fb7185" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Display Index / Order (Optional)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editingMember.order ?? editingMember.index ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                        setEditingMember({ ...editingMember, order: val, index: val });
                      }}
                      className={INPUT_CLS}
                      placeholder="e.g. 1, 2, 3 (lower shows first)"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                      Decides display order after hierarchy. If unset, sorted alphabetically.
                    </p>
                  </div>
                </div>

                {/* Position History */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-[#22c55e] uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3 h-3" /> Position by Year *
                    </label>
                    <button type="button" onClick={handleAddStatusRow}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0c2317] border border-[#14532d] text-[#22c55e] text-[10px] font-mono hover:bg-[#112b1c] transition-colors cursor-pointer">
                      <Plus className="w-3 h-3" /> Add Year
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editingMember.statusHistory?.map((row, idx) => {
                      const match = row.year?.match(/^(\d{4})/);
                      const rowYearNum = match ? parseInt(match[1], 10) : (row.year ? parseInt(row.year, 10) || 2024 : 2024);

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 bg-white/[0.03] border border-white/10 rounded-2xl relative">
                          {/* Position Glass Dropdown */}
                          <div className="flex-1 w-full">
                            <p className="text-[9px] text-zinc-400 mb-1 uppercase tracking-wider font-mono">Position</p>
                            <GlassSelect
                              value={row.position}
                              onChange={(val) => handleStatusChange(idx, "position", val)}
                              options={[
                                { value: "Head", label: "Head", color: "#f59e0b" },
                                { value: "co-head", label: "CO-HEAD", color: "#f59e0b" },
                                { value: "Maintainer", label: "Maintainer", color: "#d946ef" },
                                { value: "Volunteer", label: "Volunteer", color: "#a1a1aa" },
                              ]}
                            />
                          </div>

                          {/* Numeric Year Stepper (like Index input) */}
                          <div className="w-full sm:w-36">
                            <p className="text-[9px] text-zinc-400 mb-1 uppercase tracking-wider font-mono">Year</p>
                            <div className="relative flex items-center h-[40px] bg-white/[0.07] backdrop-blur-2xl border border-white/20 hover:border-white/35 rounded-xl px-2.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                              <input
                                type="number"
                                min={2024}
                                step={1}
                                value={rowYearNum || ""}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === "") {
                                    handleStatusChange(idx, "year", "");
                                    return;
                                  }
                                  const val = parseInt(raw, 10);
                                  if (!isNaN(val)) {
                                    const nextYY = String((val + 1) % 100).padStart(2, "0");
                                    handleStatusChange(idx, "year", `${val}-${nextYY}`);
                                  }
                                }}
                                className="w-14 bg-transparent text-xs font-mono font-bold text-emerald-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="2024"
                              />
                              <span className="text-xs font-mono font-bold text-emerald-400/80 select-none">
                                -{String(((rowYearNum || 2024) + 1) % 100).padStart(2, "0")}
                              </span>

                              {/* Up and Down Stepper Arrows */}
                              <div className="flex flex-col ml-auto pl-1.5 border-l border-white/10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClickSound();
                                    const currentNum = rowYearNum || 2024;
                                    const nextNum = currentNum + 1;
                                    const nextYY = String((nextNum + 1) % 100).padStart(2, "0");
                                    handleStatusChange(idx, "year", `${nextNum}-${nextYY}`);
                                  }}
                                  className="text-zinc-400 hover:text-emerald-400 p-0.5 transition-colors leading-none cursor-pointer"
                                  title="Increase Year (Up)"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClickSound();
                                    const currentNum = rowYearNum || 2024;
                                    const prevNum = Math.max(2024, currentNum - 1);
                                    const prevYY = String((prevNum + 1) % 100).padStart(2, "0");
                                    handleStatusChange(idx, "year", `${prevNum}-${prevYY}`);
                                  }}
                                  className="text-zinc-400 hover:text-emerald-400 p-0.5 transition-colors leading-none cursor-pointer"
                                  title="Decrease Year (Down)"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Delete Row Button */}
                          <div className="self-end sm:self-center sm:pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveStatusRow(idx)}
                              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                              title="Remove Year Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {(!editingMember.statusHistory || editingMember.statusHistory.length === 0) && (
                      <p className="text-[10px] text-zinc-500 font-mono text-center py-2">No year entries. Click &quot;Add Year&quot; above.</p>
                    )}
                  </div>
                </div>

                {/* Status message */}
                {saveStatus !== "idle" && (
                  <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-mono border ${
                    saveStatus === "ok"  ? "bg-[#0c2317] border-[#14532d] text-[#22c55e]" :
                    saveStatus === "err" ? "bg-[#200a0a] border-[#3f1515] text-[#f87171]" :
                    "bg-white/[0.04] border-white/10 text-zinc-400"
                  }`}>
                    {saveStatus === "ok" ? <Check className="w-3.5 h-3.5 shrink-0" /> : saveStatus === "err" ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : null}
                    {saveMsg}
                  </div>
                )}
              </div>

              {/* Actions - Sticky bottom footer */}
              <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 border-t border-white/10 bg-[#080C14]/95 backdrop-blur-md shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs font-mono transition-colors border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="px-5 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isNew ? "Create Member" : "Save Changes"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
