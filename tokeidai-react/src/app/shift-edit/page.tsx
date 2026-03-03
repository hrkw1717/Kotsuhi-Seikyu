"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Save, CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STAFF_COLORS: Record<string, string> = {
    "山口": "bg-blue-500",
    "坂下": "bg-emerald-500",
    "堀川": "bg-violet-500",
};
const STAFF_LIGHT: Record<string, string> = {
    "山口": "bg-blue-50 text-blue-700 border-blue-200",
    "坂下": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "堀川": "bg-violet-50 text-violet-700 border-violet-200",
};
const STAFF_SELECTED: Record<string, string> = {
    "山口": "bg-blue-500 text-white border-blue-600 shadow-blue-200",
    "坂下": "bg-emerald-500 text-white border-emerald-600 shadow-emerald-200",
    "堀川": "bg-violet-500 text-white border-violet-600 shadow-violet-200",
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function getDayOfWeek(year: number, month: number, day: number): number {
    return new Date(year, month - 1, day).getDay();
}

type ShiftData = Record<number, Record<string, string>>; // day -> name -> "出"|"明"|""

// フロントで管理する「出」のエントリ: day -> name (1日1名想定)
type Assignments = Record<number, string>; // day -> staffName | ""

export default function ShiftEditPage() {
    const [userName, setUserName] = useState("");
    const [year, setYear] = useState(0);
    const [month, setMonth] = useState(0);
    const [lastDay, setLastDay] = useState(31);
    const [assignments, setAssignments] = useState<Assignments>({});
    const [rawData, setRawData] = useState<ShiftData>({});
    const [staff, setStaff] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // JST基準での今月を初期値に
    useEffect(() => {
        const userJson = localStorage.getItem("user");
        if (userJson) {
            const userData = JSON.parse(userJson);
            setUserName(userData.name || "ユーザー");
        } else {
            window.location.href = "/";
            return;
        }
        const now = new Date(Date.now() + 9 * 3600 * 1000); // JST
        setYear(now.getUTCFullYear());
        setMonth(now.getUTCMonth() + 1);
    }, []);

    const fetchShift = useCallback(async (y: number, m: number) => {
        if (!y || !m) return;
        setIsLoading(true);
        setStatus(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/shift/${y}/${m}`);
            if (!res.ok) throw new Error((await res.json()).detail || "取得エラー");
            const data = await res.json();
            setLastDay(data.last_day);
            setStaff(data.staff);
            setRawData(data.data);

            // 「出」が入っている日→担当者のマップを初期化
            const init: Assignments = {};
            for (const [dayStr, staffMap] of Object.entries(data.data as ShiftData)) {
                const day = Number(dayStr);
                for (const [name, val] of Object.entries(staffMap)) {
                    if (val === "出") {
                        init[day] = name;
                        break;
                    }
                }
            }
            setAssignments(init);
        } catch (e: any) {
            setStatus({ type: "error", text: e.message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (year && month) fetchShift(year, month);
    }, [year, month, fetchShift]);

    const changeMonth = (delta: number) => {
        let m = month + delta;
        let y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        setYear(y);
        setMonth(m);
    };

    // セルのクリック：「なし→山口→坂下→堀川→なし」のトグル
    const toggleStaff = (day: number, clickedName: string) => {
        setAssignments(prev => {
            const current = prev[day];
            if (current === clickedName) {
                // 同じ人をもう一度押したら解除
                const next = { ...prev };
                delete next[day];
                return next;
            } else {
                return { ...prev, [day]: clickedName };
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setStatus(null);
        try {
            const entries = Object.entries(assignments).map(([day, name]) => ({
                day: Number(day),
                name,
            }));
            const res = await fetch(`${API_BASE_URL}/api/shift/${year}/${month}/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entries }),
            });
            if (!res.ok) throw new Error((await res.json()).detail || "保存エラー");
            const data = await res.json();
            setStatus({ type: "success", text: data.message });
            // 保存後に再取得して「明」も反映
            await fetchShift(year, month);
        } catch (e: any) {
            setStatus({ type: "error", text: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header userName={userName} />

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
                {/* Page Header */}
                <header className="mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">シフト表編集</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">勤務日をタップして割り当てを変更します</p>
                </header>

                {/* Month Selector */}
                <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 mb-6">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <ChevronLeft size={20} className="text-slate-500" />
                    </button>
                    <span className="text-xl font-black text-slate-800">{year}年 {month}月</span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <ChevronRight size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Staff Legend */}
                <div className="flex gap-3 mb-5 flex-wrap">
                    {staff.map(name => (
                        <div key={name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold ${STAFF_LIGHT[name] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${STAFF_COLORS[name] || "bg-slate-400"}`}></span>
                            {name}
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold bg-slate-50 text-slate-400 border-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                        未割当
                    </div>
                </div>

                {/* Status Message */}
                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`mb-5 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border-2 ${status.type === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-red-50 text-red-700 border-red-100"
                                }`}
                        >
                            {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {status.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Shift Grid */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                    {/* Grid Header */}
                    <div className="grid grid-cols-[3rem_1fr_1fr_1fr] bg-slate-50 border-b border-slate-100">
                        <div className="px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">日</div>
                        {staff.map(name => (
                            <div key={name} className="px-2 py-3 text-center text-xs font-black text-slate-500 uppercase tracking-wider">
                                {name}
                            </div>
                        ))}
                    </div>

                    {/* Grid Rows */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
                            <Loader2 size={22} className="animate-spin" />
                            <span className="text-sm font-medium">データ読み込み中...</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {Array.from({ length: lastDay }, (_, i) => i + 1).map(day => {
                                const dow = getDayOfWeek(year, month, day);
                                const isSun = dow === 0;
                                const isSat = dow === 6;
                                const assignedName = assignments[day];
                                return (
                                    <div
                                        key={day}
                                        className={`grid grid-cols-[3rem_1fr_1fr_1fr] items-center min-h-[48px] ${isSun ? "bg-red-50/40" : isSat ? "bg-blue-50/30" : ""}`}
                                    >
                                        <div className={`px-3 py-2 text-sm font-black ${isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-slate-600"}`}>
                                            <span>{day}</span>
                                            <span className="text-[10px] ml-1 font-medium opacity-70">{DAY_LABELS[dow]}</span>
                                        </div>
                                        {staff.map(name => {
                                            const rawVal = rawData[day]?.[name] || "";
                                            const isAssigned = assignedName === name;
                                            const isAke = rawVal === "明";
                                            return (
                                                <div key={name} className="px-2 py-1.5 flex justify-center">
                                                    <button
                                                        onClick={() => !isAke && toggleStaff(day, name)}
                                                        disabled={isAke}
                                                        className={`w-full max-w-[80px] py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${isAssigned
                                                                ? `${STAFF_SELECTED[name] || "bg-slate-500 text-white"} shadow-md`
                                                                : isAke
                                                                    ? "bg-amber-50 text-amber-500 border-amber-200 cursor-default opacity-80"
                                                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                                                            }`}
                                                    >
                                                        {isAssigned ? "出" : isAke ? "明" : "－"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <motion.button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-base rounded-2xl shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <><Loader2 size={20} className="animate-spin" /> 保存中...</>
                    ) : (
                        <><Save size={20} /> シフトを保存する</>
                    )}
                </motion.button>
            </main>
        </div>
    );
}
