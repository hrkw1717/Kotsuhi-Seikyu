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

// 日本時間（JST）に基づいた日付を取得するユーティリティ
const getJstDate = () => {
    const now = new Date();
    const jstOffset = 9 * 60; // 日本はUTC+9
    const localOffset = now.getTimezoneOffset();
    return new Date(now.getTime() + (jstOffset + localOffset) * 60000);
};

export default function Dashboard() {
    // 選択肢の生成 (JST基準で「先月」「今月」「来月」)
    const jstNow = getJstDate();
    const dateOptions = [
        new Date(jstNow.getFullYear(), jstNow.getMonth() - 1, 1), // 先月
        new Date(jstNow.getFullYear(), jstNow.getMonth(), 1),     // 今月
        new Date(jstNow.getFullYear(), jstNow.getMonth() + 1, 1), // 来月
        new Date(jstNow.getFullYear(), jstNow.getMonth() + 2, 1), // 再来月
        new Date(jstNow.getFullYear(), jstNow.getMonth() + 3, 1), // 3ヶ月後
    ].map(d => ({
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
        isLastMonth: d.getFullYear() === (jstNow.getMonth() === 0 ? jstNow.getFullYear() - 1 : jstNow.getFullYear()) &&
            d.getMonth() === (jstNow.getMonth() === 0 ? 11 : jstNow.getMonth() - 1)
    }));

    // 初期値は「先月」
    const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [status, setStatus] = useState("idle");
    const [userName, setUserName] = useState("ゲスト");
    const [lastSent, setLastSent] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // バックエンド送付用の年月（パースして保持）
    const [year, month] = selectedDate.split("-");

    React.useEffect(() => {
        const userJson = localStorage.getItem("user");
        if (userJson) {
            const user = JSON.parse(userJson);
            setUserName(user.name || "ユーザー");
        }
    }, []);

    // 年月変更時に自動でデータを読み込む
    React.useEffect(() => {
        const userJson = localStorage.getItem("user");
        if (userJson) {
            handleLoadData();
        }
    }, [selectedDate]);

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
                setLastSent(data.data.last_sent || null);

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
        // スマホ表示などでステータス（上部）が見えるように最上部へスクロール
        window.scrollTo({ top: 0, behavior: "smooth" });

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

    const handleSendClick = () => {
        if (lastSent && selectedDate === dateOptions[0].value) {
            setShowConfirmModal(true);
        } else {
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 rotate-3">
                                <FileText className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-slate-800 tracking-tighter leading-none">TOKEIDAI</h1>
                                <p className="text-[10px] font-bold text-blue-600 tracking-[0.2em] leading-none mt-1">SMART CLAIM</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-100">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                    <User size={12} className="sm:w-[14px] sm:h-[14px]" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-slate-700">{userName}<span className="hidden xs:inline sm:inline ml-1 text-slate-400 font-medium">様</span></span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => (window.location.href = "/mypage")}
                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                    title="マイページ"
                                >
                                    <Settings size={22} />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                    title="ログアウト"
                                >
                                    <LogOut size={22} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-0 sm:px-4 md:px-8 py-4 md:py-8">
                <header className="mb-8 px-4 sm:px-0">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">交通費請求用紙の送付</h1>
                    <p className="text-slate-500 text-sm mt-1">対象年月を選択し、内容を確認してメールを送信してください。</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    {/* Left Column: Controls */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                        <div className="bg-white sm:rounded-3xl sm:shadow-sm sm:border sm:border-slate-200 overflow-hidden">
                            <div>
                                <div className="p-4 sm:p-6 pb-2 sm:pb-3">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Calendar size={18} />
                                        </div>
                                        <h2 className="font-bold text-slate-800 tracking-tight">請求対象の選択</h2>
                                    </div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">対象年月</label>
                                </div>

                                <div className="relative">
                                    <select
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setStatus("idle");
                                            setPreviewImage(null);
                                        }}
                                        className="w-full bg-slate-50 border-y border-slate-200 px-5 sm:px-6 py-4 sm:py-3 text-base sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none"
                                    >
                                        {dateOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label} {
                                                    opt.isLastMonth
                                                        ? (lastSent ? `(送信済み: ${lastSent})` : "(送信対象)")
                                                        : "(閲覧のみ)"
                                                }
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronRight size={18} className="rotate-90" />
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6 pt-2">
                                    {/* 従来の「作成」ボタンを廃止し、自動ロードに変更 */}
                                    {isLoading && (
                                        <div className="flex items-center justify-center gap-2 text-blue-600 font-bold py-2 animate-pulse">
                                            <RefreshCw className="animate-spin" size={16} />
                                            <span>データを読み込み中...</span>
                                        </div>
                                    )}
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
                                    className={`p-5 sm:p-6 sm:rounded-3xl rounded-none shadow-lg border-y sm:border ${status === "success"
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
                                                {status === "ready" && "請求用紙を作成しました"}
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
                        <AnimatePresence>
                            {selectedDate === dateOptions[0].value && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
                                >
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
                                                <span className="text-slate-400">Subject: {previewData?.subject || `交通費請求用紙_${year}${month}_●●`}</span>
                                            </div>
                                            <p className="italic">
                                                {previewData?.body ? (
                                                    previewData.body.split("\n").map((line: string, i: number) => (
                                                        <React.Fragment key={i}>{line}<br /></React.Fragment>
                                                    ))
                                                ) : (
                                                    <>
                                                        全道警備センター　高橋　様<br />
                                                        時計台警備の {userName.split(" ")[0] || userName} です。お疲れ様です。<br /><br />
                                                        交通費請求用紙<br />
                                                        {year}年{month}月分をお送りします。<br /><br />
                                                        以上、どうぞよろしくお願い致します。
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Visual Preview */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400" />
                                    <h3 className="text-sm font-bold text-slate-700 tracking-tight">シフト表と照合し内容を確認してください。</h3>
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
                                            alt="請求用紙プレビュー"
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
            </main>

            {/* Floating Action Button */}
            <AnimatePresence>
                {status === "ready" && selectedDate === dateOptions[0].value && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-0 right-0 z-40 flex justify-center pointer-events-none"
                    >
                        <button
                            onClick={handleSendClick}
                            className="pointer-events-auto bg-emerald-600 text-white px-12 py-5 rounded-full font-bold text-lg shadow-2xl shadow-emerald-500/40 hover:bg-emerald-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 active:translate-y-0"
                        >
                            <Send size={20} />
                            この内容で会社へ送信する
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100"
                        >
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Clock size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">再度、送信をしますか？</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                                    この月の請求用紙は既に送信されています。<br />
                                    修正後などで再度送信が必要な場合は「送信」を選択してください。
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setShowConfirmModal(false)}
                                        className="py-3 px-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowConfirmModal(false);
                                            handleSend();
                                        }}
                                        className="py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                                    >
                                        送信
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <footer className="mt-auto py-8 border-t border-slate-200 bg-white text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2026 TOKEIDAI KEIBI - Powerd by Advanced Agentic Technology</p>
            </footer>
        </div>
    );
}
