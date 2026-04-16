"use client";

import { useEffect, useState } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";

export default function FactOfWeek() {
  const [fact, setFact] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchFact = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fact");
      const data = await res.json();
      setFact(data.fact);
    } catch {
      setFact("Did you know? Honey never spoils — archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFact();
  }, []);

  return (
    <section className="py-20 px-4 bg-[#0c0414]">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#1c1528] rounded-full px-4 py-2 text-xs text-gray-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            Fact of the Week
          </div>
          <h2 className="text-4xl font-bold text-white">Learn Something New</h2>
        </div>

        <div className="bg-[#1c1528] border border-[#2a1f3d] rounded-2xl p-8 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl" />

          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
            </div>

            <div className="flex-1">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-[#2a1f3d] rounded-full animate-pulse w-full" />
                  <div className="h-4 bg-[#2a1f3d] rounded-full animate-pulse w-4/5" />
                  <div className="h-4 bg-[#2a1f3d] rounded-full animate-pulse w-3/5" />
                </div>
              ) : (
                <p className="text-white text-lg leading-relaxed font-medium">{fact}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={fetchFact}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#2a1f3d] hover:bg-[#3a2f4d] rounded-full px-4 py-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              New Fact
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
