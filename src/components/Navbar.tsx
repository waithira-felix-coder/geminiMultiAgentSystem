/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Bot, BookOpen, Code2, Sparkles, CheckCircle2 } from "lucide-react";

interface NavbarProps {
  activeTab: "studio" | "guide" | "code";
  onTabChange: (tab: "studio" | "guide" | "code") => void;
  isRunning?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isRunning = false,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 text-base tracking-tight">
                  Multi-Agent System Studio
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Free Tier (No Billing)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Google Codelab Roadshow Lab 1 • Vertex AI ➔ AI Studio Migration
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange("studio")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "studio"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Agent Studio</span>
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
              )}
            </button>

            <button
              onClick={() => onTabChange("guide")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "guide"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Migration Guide</span>
            </button>

            <button
              onClick={() => onTabChange("code")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "code"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Code Exporter</span>
            </button>
          </nav>

          {/* Model Badge */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Model:</span>
            <span className="font-mono text-cyan-400 font-medium">gemini-3.8-flash</span>
          </div>
        </div>
      </div>
    </header>
  );
};
