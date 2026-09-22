"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { playClickSound } from "@/lib/sound";

export interface GlassSelectOption {
  value: string;
  label: string;
  color?: string;
  bg?: string;
  border?: string;
}

export interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function GlassSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  className = "",
  disabled = false,
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Auto-flip the dropdown upward when there isn't enough space below the trigger
  useEffect(() => {
    if (!isOpen) return;
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 260;
    setOpenUp(spaceBelow < menuHeight && rect.top > spaceBelow);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    try { playClickSound(); } catch {}
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    try { playClickSound(); } catch {}
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full min-h-[40px] px-3.5 py-2 rounded-xl flex items-center justify-between gap-2 text-xs font-mono font-bold transition-all text-left select-none cursor-pointer ${
          isOpen
            ? "bg-white/[0.14] border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.35)]"
            : "bg-white/[0.07] hover:bg-white/[0.11] border-white/20 hover:border-white/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)]"
        } border backdrop-blur-2xl disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <>
              {selectedOption.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: selectedOption.color,
                    boxShadow: `0 0 8px ${selectedOption.color}90`,
                  }}
                />
              )}
              <span
                className="truncate"
                style={{ color: selectedOption.color || "#fafafa" }}
              >
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-zinc-500 truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Floating Glass Options Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUp ? 6 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUp ? 6 : -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute left-0 right-0 z-[100] rounded-2xl overflow-hidden p-1.5 bg-[#090e18]/95 border border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-2xl ${
              openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            {/* Top catch light */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

            <div className="space-y-0.5 max-h-56 overflow-y-auto overscroll-contain">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.14] text-white border border-white/20 shadow-sm"
                        : "text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {opt.color && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: opt.color,
                            boxShadow: isSelected ? `0 0 8px ${opt.color}` : undefined,
                          }}
                        />
                      )}
                      <span
                        className="truncate"
                        style={{ color: isSelected ? opt.color || "#ffffff" : undefined }}
                      >
                        {opt.label}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: opt.color || "#22c55e" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
