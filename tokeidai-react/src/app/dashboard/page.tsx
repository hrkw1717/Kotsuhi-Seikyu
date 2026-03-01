"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Send,
    FileText,
    Calendar,
    CheckCircle2,
    Clock,
    LogOut,
    ChevronRight,
    RefreshCw,
    Mail,
    User,
    Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
    const [year, setYear] = useState("2026");
    const [month, setMonth] = useState("02");
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [status, setStatus] = useState("idle");
    const [userName, setUserName] = useState("ゲスト");

    React.useEffect(() => {
        const userJson = localStorage.getItem("user");
        if (userJson) {
            const user = JSON.parse(userJson);
            setUserName(user.name || "ユーザー");
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const handleLoadData = async () => {
        setIsLoading(true);
        setStatus("loading");

        try {
            const userJson = localStorage.getItem("user");
            const user = userJson ? JSON.parse(userJson) : { id: "unknown" };

            const res = await fetch(`${API_BASE_URL}/api/claims/preview`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ year, month, userid: user.id }),
            });
            const data = await res.json();

            if (data.status === "success") {
                setPreviewData(data.data);

                // PDFプレビュー画像を取得
                const imgRes = await fetch(`${API_BASE_URL}/api/claims/render-preview`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ year, month, userid: user.id }),
                });
                const imgData = await imgRes.json();
                if (imgData.status === "success") {
                    setPreviewImage(imgData.image);
                }

                setStatus("ready");
            } else {
                alert("データの読み込みに失敗しました");
                setStatus("idle");
            }
        } catch (err) {
            alert("サーバーに接続できません");
            setStatus("idle");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        setStatus("sending");
        try {
            const userJson = localStorage.getItem("user");
            const user = userJson ? JSON.parse(userJson) : { id: "unknown" };

            const res = await fetch(`${API_BASE_URL}/api/claims/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ year, month, userid: user.id }),
            });
            const data = await res.json();

            if (data.status === "success") {
                setStatus("success");
            } else {
                alert(data.message || "送信に失敗しました");
                setStatus("ready");
            }
        } catch (err) {
            alert("サーバーに接続できません");
            setStatus("ready");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
                        <span className="text-lg font-bold tracking-tight text-slate-800">TOKEIDAI <span className="text-blue-600">CLAIM</span></span>
                    </div>

                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex gap-1">
                            <button className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">請求書送信</button>
                            <Link href="/mypage">
                                <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">マイページ</button>
                            </Link>
                        </nav>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Authenticated</p>
                                <p className="text-sm font-bold text-slate-700 leading-none">{userName} 様</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                title="ログアウト"
                                className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">交通費請求書の送付</h1>
                    <p className="text-slate-500 text-sm mt-1">対象年月を選択し、内容を確認してメールを送信してください。</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Controls */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Calendar size={18} />
                                    </div>
                                    <h2 className="font-bold text-slate-800 tracking-tight">請求対象の選択</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Year</label>
                                            <select
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            >
                                                <option value="2026">2026年</option>
                                                <option value="2025">2025年</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Month</label>
                                            <select
                                                value={month}
                                                onChange={(e) => setMonth(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            >
                                                {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(m => (
                                                    <option key={m} value={m}>{parseInt(m)}月</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLoadData}
                                        disabled={isLoading || status === "sending"}
                                        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <RefreshCw className="animate-spin" size={20} /> : "データを読み込む"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status Card */}
                        <AnimatePresence mode="wait">
                            {status !== "idle" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`p-6 rounded-3xl shadow-lg border ${status === "success"
                                        ? "bg-green-600 border-green-500 text-white shadow-green-100"
                                        : "bg-blue-600 border-blue-500 text-white shadow-blue-100"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Current Status</span>
                                        {status === "ready" && <div className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {status === "loading" && <RefreshCw size={24} className="animate-spin" />}
                                        {status === "ready" && <CheckCircle2 size={24} />}
                                        {status === "sending" && <RefreshCw size={24} className="animate-spin" />}
                                        {status === "success" && <CheckCircle2 size={24} />}
                                        <div>
                                            <p className="text-xl font-bold tracking-tight leading-none">
                                                {status === "ready" && "準備完了"}
                                                {status === "sending" && "送信中..."}
                                                {status === "success" && "送信完了！"}
                                            </p>
                                            <p className="text-xs mt-1 opacity-80">
                                                {status === "ready" && "内容を確認して送信してください。"}
                                                {status === "sending" && "メールとPDFを送信しています。"}
                                                {status === "success" && "会社へのメール送信が成功しました。"}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Previews */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Message Preview */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" />
                                    <h3 className="text-sm font-bold text-slate-700 tracking-tight">送信メッセージのプレビュー</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Draft</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 font-mono text-sm text-slate-600 leading-relaxed shadow-inner">
                                    <div className="flex justify-between border-b border-slate-200 pb-3 mb-6">
                                        <span className="font-bold text-slate-800">To: {previewData?.recipient || "sbs@sobun.net"}</span>
                                        <span className="text-slate-400">Subject: {previewData?.subject || `交通費請求書_${year}${month}_堀川勉`}</span>
                                    </div>
                                    <p className="italic">
                                        {previewData?.body ? (
                                            previewData.body.split("\n").map((line: string, i: number) => (
                                                <React.Fragment key={i}>{line}<br /></React.Fragment>
                                            ))
                                        ) : (
                                            <>
                                                sbs@sobun.net 様<br /><br />
                                                堀川勉 です。<br />
                                                {year}年{month}月分の交通費請求書を送付いたします。<br />
                                                ご確認のほど、よろしくお願い申し上げます。
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Visual Preview */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400" />
                                    <h3 className="text-sm font-bold text-slate-700 tracking-tight">請求書イメージ確認</h3>
                                </div>
                            </div>
                            <div className="p-8 md:p-12 bg-slate-200/50 flex justify-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white w-full max-w-[600px] shadow-2xl rounded p-1 flex flex-col items-center overflow-hidden"
                                >
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="請求書プレビュー"
                                            className="w-full h-auto object-contain"
                                        />
                                    ) : (
                                        <div className="w-full aspect-[1/1.41] flex flex-col items-center justify-center space-y-4 py-20 bg-white">
                                            <FileText className="w-12 h-12 text-slate-200" />
                                            <p className="text-slate-400 text-sm font-medium italic">
                                                No Preview Available
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Action Button */}
                <AnimatePresence>
                    {status === "ready" && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-8 left-0 right-0 z-40 flex justify-center pointer-events-none"
                        >
                            <button
                                onClick={handleSend}
                                className="pointer-events-auto bg-blue-600 text-white px-12 py-5 rounded-full font-bold text-lg shadow-2xl shadow-blue-400/40 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 active:translate-y-0"
                            >
                                <Send size={20} />
                                この内容で会社へ送信する
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="mt-auto py-8 border-t border-slate-200 bg-white text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2026 TOKEIDAI KEIBI - Powerd by Advanced Agentic Technology</p>
            </footer>
        </div>
    );
}
