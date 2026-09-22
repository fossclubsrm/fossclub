"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Terminal as TerminalIcon, X, Minimize2, CornerDownLeft, Sparkles, Volume2, VolumeX } from "lucide-react";
import { playKeySound, playSuccessSound, toggleMute, getMuteState } from "@/lib/sound";

interface CommandHistory {
  command: string;
  output: React.ReactNode;
}

export function InteractiveTerminal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [matrixActive, setMatrixActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMuted(getMuteState());
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (history.length === 0) {
        setHistory([
          {
            command: "init",
            output: (
              <div className="text-xs text-gray-400 space-y-1">
                <p className="text-emerald-400 font-bold">FOSS Club SRM — Interactive Shell v1.0.4 [SRMIST-KTR]</p>
                <p>Welcome, contributor. Type <span className="text-cyan-400 font-semibold">&apos;help&apos;</span> to explore available commands or <span className="text-cyan-400 font-semibold">&apos;neofetch&apos;</span> for club telemetry.</p>
              </div>
            ),
          },
        ]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleToggleMute = () => {
    const newState = toggleMute();
    setMuted(newState);
  };

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    playSuccessSound();

    const parts = trimmed.split(" ");
    const root = parts[0].toLowerCase();

    let output: React.ReactNode = null;

    switch (root) {
      case "help":
        output = (
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 py-1">
            <div><span className="text-emerald-400 font-mono font-bold">about</span>: Club manifesto & chapter info</div>
            <div><span className="text-emerald-400 font-mono font-bold">events</span>: View active & past events</div>
            <div><span className="text-emerald-400 font-mono font-bold">team</span>: Explore domains & members</div>
            <div><span className="text-emerald-400 font-mono font-bold">recruit</span>: Application details & perks</div>
            <div><span className="text-emerald-400 font-mono font-bold">neofetch</span>: Club specs & ASCII badge</div>
            <div><span className="text-emerald-400 font-mono font-bold">matrix</span>: Toggle digital rain protocol</div>
            <div><span className="text-emerald-400 font-mono font-bold">clear</span>: Flush terminal buffer</div>
            <div><span className="text-emerald-400 font-mono font-bold">sudo &lt;cmd&gt;</span>: Execute as root</div>
            <div><span className="text-emerald-400 font-mono font-bold">exit</span>: Close this console</div>
          </div>
        );
        break;

      case "about":
        output = (
          <div className="text-xs text-gray-300 space-y-1">
            <p className="text-emerald-400 font-semibold">FOSS Club SRM (SRM Institute of Science and Technology, Kattankulathur)</p>
            <p>Official student chapter affiliated with <span className="text-cyan-400">FOSS United</span>.</p>
            <p>We are a syndicate of developers, systems hackers, designers, and open source evangelists building public digital infrastructure.</p>
          </div>
        );
        break;

      case "events":
        output = (
          <div className="text-xs text-gray-300 space-y-1">
            <p className="text-cyan-400">Redirecting to /events...</p>
          </div>
        );
        setTimeout(() => {
          onClose();
          router.push("/events");
        }, 500);
        break;

      case "team":
        output = (
          <div className="text-xs text-gray-300 space-y-1">
            <p className="text-cyan-400">Redirecting to /team...</p>
          </div>
        );
        setTimeout(() => {
          onClose();
        router.push("/team");
        }, 500);
        break;

      case "recruit":
      case "join":
      case "apply":
        output = (
          <div className="text-xs text-gray-300 space-y-1">
            <p className="text-cyan-400">Redirecting to /recruitments...</p>
          </div>
        );
        setTimeout(() => {
          onClose();
          router.push("/recruitments");
        }, 500);
        break;



      case "neofetch":
        output = (
          <div className="font-mono text-xs text-gray-300 flex flex-col md:flex-row gap-4 py-2">
            <pre className="text-emerald-400 font-bold leading-tight">
{`   _____ ____  _____ _____ 
  |  ___/ __ \\/ ____/ ____|
  | |_ | |  | \\___ \\| (___  
  |  _|| |  | |___) \\___ \\ 
  | |  | |__| |____/|____) |
  |_|   \\____/_____/_____/ `}
            </pre>
            <div className="space-y-0.5 text-xs">
              <p><span className="text-emerald-400 font-bold">host</span>: FOSS Club SRMIST [KTR]</p>
              <p><span className="text-cyan-400 font-bold">parent</span>: FOSS United Foundation</p>
              <p><span className="text-yellow-400 font-bold">kernel</span>: Linux 6.10.x-foss-srm</p>
              <p><span className="text-purple-400 font-bold">domains</span>: Technical | Corporate | Creative</p>
              <p><span className="text-emerald-400 font-bold">ranks</span>: Head &gt; Co-Head &gt; Maintainer &gt; Volunteer</p>
              <p><span className="text-cyan-400 font-bold">uptime</span>: 3+ academic cycles</p>
              <p className="flex items-center gap-1.5"><span className="text-gray-400 font-bold">status</span>: <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> Active Open Source Node</p>
            </div>
          </div>
        );
        break;

      case "matrix":
        setMatrixActive(!matrixActive);
        output = (
          <div className="text-xs text-emerald-400">
            {matrixActive ? "Matrix raining effect deactivated." : "Matrix raining protocol engaged. Enjoy the stream."}
          </div>
        );
        break;

      case "clear":
        setHistory([]);
        return;

      case "exit":
      case "quit":
        onClose();
        return;

      case "sudo":
        const sub = parts.slice(1).join(" ");
        if (sub.includes("rm") || sub.includes("-rf")) {
          output = (
            <div className="text-xs text-red-400 font-mono">
              [CRITICAL] Nice try, hacker. Protected root filesystem. Azam and the maintainers have been notified.
            </div>
          );
        } else {
          output = (
            <div className="text-xs text-yellow-400 font-mono">
              User is not in the sudoers file. This incident will be reported to Linus Torvalds.
            </div>
          );
        }
        break;

      default:
        output = (
          <div className="text-xs text-red-400">
            Command not recognized: &apos;{trimmed}&apos;. Type <span className="text-emerald-400 font-bold">&apos;help&apos;</span> for documentation.
          </div>
        );
        break;
    }

    setHistory((prev) => [...prev, { command: trimmed, output }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#090D14] border border-emerald-500/30 rounded-xl shadow-2xl shadow-emerald-950/50 overflow-hidden flex flex-col h-[480px] font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0c121c] border-b border-gray-800 select-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:opacity-100 cursor-pointer" onClick={onClose} />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:opacity-100 cursor-pointer" onClick={() => setHistory([])} />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:opacity-100 cursor-pointer" />
            <span className="text-xs text-gray-400 ml-2 font-mono flex items-center gap-1.5">
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
              foss-srm: ~/sh
            </span>
          </div>
          <div className="flex items-center space-x-3 text-gray-400">
            <button
              onClick={handleToggleMute}
              title={muted ? "Unmute sound" : "Mute sound"}
              className="p-1 hover:text-emerald-400 transition-colors"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative text-sm">
          {matrixActive && (
            <div className="absolute inset-0 opacity-15 pointer-events-none text-emerald-400 overflow-hidden text-[10px] leading-tight select-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  01000110 01001111 01010011 01010011 00100000 01010011 01010010 01001101
                </div>
              ))}
            </div>
          )}

          {history.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center text-xs text-emerald-400">
                <span className="text-gray-500 mr-1.5">guest@foss-srm:~$</span>
                <span className="text-white font-medium">{item.command}</span>
              </div>
              <div className="pl-4">{item.output}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Terminal Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCommand(input);
            setInput("");
          }}
          className="flex items-center px-4 py-3 bg-[#0c121c] border-t border-gray-800"
        >
          <span className="text-emerald-400 font-mono text-xs mr-2 font-bold select-none">guest@foss-srm:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              playKeySound();
              setInput(e.target.value);
            }}
            placeholder="type 'help' or 'neofetch'..."
            className="flex-1 bg-transparent text-sm text-emerald-300 focus:outline-none font-mono placeholder-gray-600"
            autoFocus
          />
          <button
            type="submit"
            className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded border border-emerald-500/30 flex items-center gap-1 transition-all"
          >
            <span>Run</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
