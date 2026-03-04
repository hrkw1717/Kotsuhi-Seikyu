"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import {
    Save, CheckCircle2, AlertCircle, Loader2,
    ChevronLeft, ChevronRight, ShieldCheck, X, AlertTriangle
} from "lucide-react";

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
    "山口": "bg-blue-500 text-white border-blue-500 shadow-blue-200",
    "坂下": "bg-emerald-500 text-white border-emerald-500 shadow-emerald-200",
    "堀川": "bg-violet-500 text-white border-violet-500 shadow-violet-200",
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function getDayOfWeek(year: number, month: number, day: number): number {
    return new Date(year, month - 1, day).getDay();
}

/** 正月三が日（1月1〜3日）かどうか */
function isNewYearSpecial(month: number, day: number): boolean {
    return month === 1 && day >= 1 && day <= 3;
}

// day -> 出勤スタッフ名の配列（複数可）
type Assignments = Record<number, string[]>;

interface ValidationResult {
    ok: boolean;
    errors: string[];
}

function validateShift(assignments: Assignments, lastDay: number, month: number): ValidationResult {
    const errors: string[] = [];

    // 正月三が日以外: 同じ担当者が連続する日に出勤していないか
    for (const [dayStr, names] of Object.entries(assignments)) {
        const day = Number(dayStr);
        if (isNewYearSpecial(month, day)) continue; // 三が日はスキップ

        for (const name of names) {
            const nextDay = day + 1;
            if (nextDay <= lastDay && !isNewYearSpecial(month, nextDay) && assignments[nextDay]?.includes(name)) {
                errors.push(`${day}日と${nextDay}日に「${name}」が連続しています（${day}日が「出」なら翌日は「明」のため出勤不可）`);
            }
        }
    }

    // 正月三が日以外: 1日に2人以上
    for (const [dayStr, names] of Object.entries(assignments)) {
        const day = Number(dayStr);
        if (isNewYearSpecial(month, day)) continue;
        if (names.length > 1) {
            errors.push(`${day}日に複数人（${names.join("・")}）が割り当てられています（1日1名のルール）`);
        }
    }

    return { ok: errors.length === 0, errors };
}

export default function ShiftEditPage() {
    const [userName, setUserName] = useState("");
    const [year, setYear] = useState(0);
    const [month, setMonth] = useState(0);
    const [lastDay, setLastDay] = useState(31);
    const [assignments, setAssignments] = useState<Assignments>({});
    const [staff, setStaff] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showValidationDialog, setShowValidationDialog] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    useEffect(() => {
        const userJson = localStorage.getItem("user");
        if (userJson) {
            const userData = JSON.parse(userJson);
            setUserName(userData.name || "ユーザー");
        } else {
            window.location.href = "/";
            return;
        }
        const now = new Date(Date.now() + 9 * 3600 * 1000);
        setYear(now.getUTCFullYear());
        setMonth(now.getUTCMonth() + 1);
    }, []);

    const fetchShift = useCallback(async (y: number, m: number) => {
        if (!y || !m) return;
        setIsLoading(true);
        setSaveStatus(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/shift/${y}/${m}`);
            if (!res.ok) throw new Error((await res.json()).detail || "取得エラー");
            const data = await res.json();
            setLastDay(data.last_day);
            setStaff(data.staff);

            // 全スタッフ分の出勤状態を収集
            const init: Assignments = {};
            for (const [dayStr, staffMap] of Object.entries(data.data as Record<string, Record<string, string>>)) {
                const day = Number(dayStr);
                const names: string[] = [];
                for (const [name, val] of Object.entries(staffMap)) {
                    if (val === "出") {
                        names.push(name);
                    } else if (val === "朝" || val === "夜") {
                        names.push(`${name}(${val})`);
                    }
                }
                if (names.length > 0) init[day] = names;
            }
            setAssignments(init);
        } catch (e: any) {
            setSaveStatus({ type: "error", text: e.message });
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

    const toggleStaff = (day: number, clickedName: string) => {
        const special = isNewYearSpecial(month, day);
        setAssignments(prev => {
            const current = prev[day] ?? [];
            const isSelected = current.includes(clickedName);
            const isAsa = current.includes(`${clickedName}(朝)`) || (special && isSelected && current.find(n => n.startsWith(clickedName))?.includes("朝"));
            const isYoru = current.includes(`${clickedName}(夜)`) || (special && isSelected && current.find(n => n.startsWith(clickedName))?.includes("夜"));

            const next = { ...prev };

            if (special) {
                // 三が日: ループトグル [- -> 朝 -> 夜 -> -]
                // 内部的には "氏名(朝)", "氏名(夜)" という形式で保持するか、
                // 単に "山口" が入っていれば「出（朝）」とみなす等の既存ロジックとの互換性を考慮
                // ここではシンプルに "山口(朝)", "山口(夜)" という文字列を扱う設計にします

                const currentVal = current.find(n => n.startsWith(clickedName));
                let newVal: string | null = null;

                if (!currentVal) {
                    newVal = `${clickedName}(朝)`;
                } else if (currentVal.includes("朝")) {
                    newVal = `${clickedName}(夜)`;
                } else {
                    newVal = null; // 消去
                }

                const filtered = current.filter(n => !n.startsWith(clickedName));
                const updated = newVal ? [...filtered, newVal] : filtered;

                if (updated.length === 0) delete next[day];
                else next[day] = updated;
            } else {
                // 通常: 1日1名トグル
                if (isSelected) {
                    delete next[day];
                } else {
                    next[day] = [clickedName];
                }
            }
            return next;
        });
    };

    const handleValidate = () => {
        const result = validateShift(assignments, lastDay, month);
        setValidationResult(result);
        setShowValidationDialog(true);
    };

    const handleSave = async () => {
        setShowValidationDialog(false);
        setIsSaving(true);
        setSaveStatus(null);
        try {
            const entries: { day: number; name: string; value: string }[] = [];
            for (const [dayStr, names] of Object.entries(assignments)) {
                for (const nameWithAttr of names) {
                    // "氏名(朝)" などの形式から分離
                    if (nameWithAttr.includes("(") && nameWithAttr.includes(")")) {
                        const name = nameWithAttr.split("(")[0];
                        const val = nameWithAttr.split("(")[1].replace(")", "");
                        entries.push({ day: Number(dayStr), name, value: val });
                    } else {
                        entries.push({ day: Number(dayStr), name: nameWithAttr, value: "出" });
                    }
                }
            }
            const res = await fetch(`${API_BASE_URL}/api/shift/${year}/${month}/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entries }),
            });
            if (!res.ok) throw new Error((await res.json()).detail || "保存エラー");
            const data = await res.json();
            setSaveStatus({ type: "success", text: data.message });
            await fetchShift(year, month);
        } catch (e: any) {
            setSaveStatus({ type: "error", text: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header userName={userName} />

            {/* Validation Dialog */}
            <AnimatePresence>
                {showValidationDialog && validationResult && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowValidationDialog(false)}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
                        >
                            {validationResult.ok ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={36} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 mb-2">検査合格！</h2>
                                    <p className="text-sm text-slate-500 mb-8">矛盾は見つかりませんでした。シフトを保存しますか？</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowValidationDialog(false)}
                                            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">
                                            キャンセル
                                        </button>
                                        <button onClick={handleSave}
                                            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2">
                                            <Save size={16} />保存
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                                            <AlertTriangle size={24} className="text-red-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-800">検査不合格</h2>
                                            <p className="text-sm text-slate-500 mt-1">以下の矛盾を修正してください。</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-3 mb-6">
                                        {validationResult.errors.map((err, i) => (
                                            <li key={i} className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">
                                                <AlertCircle size={16} className="shrink-0 mt-0.5" />{err}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => setShowValidationDialog(false)}
                                        className="w-full py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                        <X size={16} />修正する
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
                <header className="mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">シフト表編集</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">担当者ボタンをタップして「出」を割り当て。1月1〜3日は2人まで同時出勤可能です。</p>
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
                </div>

                {/* Save Status */}
                <AnimatePresence>
                    {saveStatus && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`mb-5 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border-2 ${saveStatus.type === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-red-50 text-red-700 border-red-100"}`}
                        >
                            {saveStatus.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {saveStatus.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Shift Grid */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                    <div className="grid grid-cols-[3rem_1fr_1fr_1fr] bg-slate-50 border-b border-slate-100">
                        <div className="px-3 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">日付</div>
                        {staff.map(name => (
                            <div key={name} className="px-2 py-3 text-center text-xs font-black text-slate-500 tracking-wider">{name}</div>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
                            <Loader2 size={22} className="animate-spin" />
                            <span className="text-sm font-medium">読み込み中...</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {Array.from({ length: lastDay }, (_, i) => i + 1).map(day => {
                                const dow = getDayOfWeek(year, month, day);
                                const isSun = dow === 0;
                                const isSat = dow === 6;
                                const special = isNewYearSpecial(month, day);
                                const assignedNames = assignments[day] ?? [];
                                return (
                                    <div
                                        key={day}
                                        className={`grid grid-cols-[3rem_1fr_1fr_1fr] items-center min-h-[52px] ${special ? "bg-amber-50/60" : isSun ? "bg-red-50/40" : isSat ? "bg-blue-50/30" : ""
                                            }`}
                                    >
                                        <div className={`px-3 py-2 text-sm font-black ${isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-slate-600"}`}>
                                            <span>{day}</span>
                                            <span className="text-[10px] ml-1 font-medium opacity-70">{DAY_LABELS[dow]}</span>
                                            {special && <span className="block text-[9px] text-amber-500 font-bold">2人可</span>}
                                        </div>
                                        {staff.map(name => {
                                            const entry = assignedNames.find(n => n.startsWith(name));
                                            const isAsa = entry?.includes("朝");
                                            const isYoru = entry?.includes("夜");
                                            const isAssigned = !!entry && !isAsa && !isYoru;

                                            // ボタンのラベルとスタイル
                                            let label = "－";
                                            let activeClass = "";
                                            if (isAsa) { label = "朝"; activeClass = STAFF_SELECTED[name] || "bg-slate-500 text-white"; }
                                            else if (isYoru) { label = "夜"; activeClass = "bg-slate-800 text-white border-slate-800 shadow-slate-200"; }
                                            else if (isAssigned) { label = "出"; activeClass = STAFF_SELECTED[name] || "bg-slate-500 text-white"; }

                                            return (
                                                <div key={name} className="px-2 py-1.5 flex justify-center">
                                                    <button
                                                        onClick={() => toggleStaff(day, name)}
                                                        className={`w-full max-w-[80px] py-2 rounded-xl text-sm font-bold border transition-all ${entry
                                                            ? `${activeClass} shadow-md`
                                                            : "bg-slate-50 text-slate-300 border-slate-100 hover:bg-slate-100 hover:border-slate-200 hover:text-slate-400"
                                                            }`}
                                                    >
                                                        {label}
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

                {/* Validate Button */}
                <motion.button
                    onClick={handleValidate}
                    disabled={isSaving || isLoading}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 bg-gradient-to-r from-slate-700 to-slate-900 text-white font-black text-base rounded-2xl shadow-lg hover:from-slate-800 hover:to-black transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSaving
                        ? <><Loader2 size={20} className="animate-spin" /> 保存中...</>
                        : <><ShieldCheck size={20} /> 検査して保存</>
                    }
                </motion.button>
            </main>
        </div>
    );
}
