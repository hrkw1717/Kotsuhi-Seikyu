"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    User,
    Mail,
    MapPin,
    CreditCard,
    ArrowLeft,
    LogOut,
    ShieldCheck,
    Briefcase,
    Edit3,
    Save,
    X,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MyPage() {
    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    // フォーム用ステート
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company_email: "",
        route: "",
        fare: 0,
        password: ""
    });

    useEffect(() => {
        const userJson = localStorage.getItem("user");
        if (userJson) {
            const userData = JSON.parse(userJson);
            setUser(userData);
            setFormData({
                name: userData.name || "",
                email: userData.email || "",
                company_email: userData.company_email || "",
                route: userData.route || "",
                fare: userData.fare || 0,
                password: "" // パスワードは表示しない
            });
        } else {
            window.location.href = "/";
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ text: "", type: "" });

        try {
            const response = await fetch(`${API_URL}/api/mypage/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userid: user.id,
                    name: formData.name,
                    email: formData.email,
                    company_email: formData.company_email,
                    route: formData.route,
                    fare: formData.fare,
                    password: formData.password || null
                }),
            });

            const result = await response.json();

            if (response.ok && result.status === "success") {
                const updatedUser = {
                    ...user,
                    name: formData.name,
                    email: formData.email,
                    company_email: formData.company_email,
                    route: formData.route,
                    fare: formData.fare
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
                setIsEditing(false);
                setMessage({ text: "情報を更新しました！", type: "success" });
                setTimeout(() => setMessage({ text: "", type: "" }), 3000);
            } else {
                throw new Error(result.detail || "更新に失敗しました");
            }
        } catch (error: any) {
            setMessage({ text: error.message, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header userName={user?.name || "ユーザー"} />

            <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">マイページ</h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium">登録情報と設定を管理できます。</p>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                        >
                            <Edit3 size={16} />
                            中身を書き換える
                        </button>
                    )}
                </header>

                <AnimatePresence>
                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`mb-6 p-4 rounded-xl text-sm font-bold border-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                }`}
                        >
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Profile Card */}
                    <motion.div
                        layout
                        className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden"
                    >
                        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 h-28 relative">
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[2px]">
                                    <span className="bg-white/90 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-blue-600 shadow-sm">Editing Mode</span>
                                </div>
                            )}
                        </div>
                        <div className="px-6 md:px-10 pb-8">
                            <div className="relative flex justify-between items-end -mt-14 mb-8">
                                <div className="p-1.5 bg-white rounded-3xl shadow-lg shadow-slate-200">
                                    <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 overflow-hidden">
                                        <User size={48} className="text-slate-300" />
                                    </div>
                                </div>
                                {!isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="mb-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                    >
                                        <LogOut size={14} />
                                        Logout
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">お名前</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                            required
                                        />
                                    ) : (
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight ml-1">{user.name} 様</h2>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">ユーザーID</label>
                                    <div className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-slate-500 font-black tracking-widest text-sm opacity-70">
                                        {user.id}
                                    </div>
                                </div>

                                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1 flex justify-between">
                                        <span>メールアドレス (本人宛)</span>
                                        <Mail size={12} className="opacity-40" />
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                            required
                                        />
                                    ) : (
                                        <p className="text-slate-600 font-bold ml-1">{user.email || "未設定"}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1 flex justify-between">
                                        <span>会社メアド (送信の宛先)</span>
                                        <ShieldCheck size={12} className="opacity-40" />
                                    </label>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <select
                                                value={formData.company_email}
                                                onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                                                disabled={user?.id !== "hori"}
                                                className={`w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none transition-all appearance-none ${user?.id !== "hori" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                <option value="sbs@sobun.net">sbs@sobun.net</option>
                                                <option value="soumu@zendokeibi.com">soumu@zendokeibi.com (総務)</option>
                                            </select>
                                            {user?.id !== "hori" && (
                                                <p className="text-[10px] text-slate-400 font-bold ml-1">※ 送信先の設定は管理者のみ変更可能です</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-blue-600 font-black ml-1 text-sm underline underline-offset-4 decoration-blue-200">{user.company_email}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Routing Section */}
                    <motion.div
                        layout
                        className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-200 p-8 md:p-10"
                    >
                        <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <MapPin size={22} />
                            </div>
                            通勤経路・運賃設定
                        </h3>

                        <div className="space-y-8">
                            <div className="space-y-2.5 focus-within:text-blue-600 transition-colors">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">往復移動経路 (詳細)</label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.route}
                                        onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none transition-all min-h-[100px]"
                                        placeholder="例: 自宅〜〇〇駅〜現場"
                                        required
                                    />
                                ) : (
                                    <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100">
                                        <p className="text-slate-900 font-bold text-xl leading-relaxed">{user.route || "未設定"}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-2.5 focus-within:text-emerald-600 transition-colors">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">往復運賃 (税込)</label>
                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <div className="relative flex-1 flex items-center">
                                                <span className="absolute left-4 font-black text-slate-400 text-xl">¥</span>
                                                <input
                                                    type="number"
                                                    value={formData.fare}
                                                    onChange={(e) => setFormData({ ...formData, fare: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-5 py-4 text-slate-900 font-black text-2xl focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner shadow-slate-100"
                                                    required
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 w-full">
                                                <p className="text-slate-900 font-bold text-xl leading-relaxed">
                                                    ¥{user.fare?.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex-1 space-y-2.5 focus-within:text-orange-600 transition-colors">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">新しい合言葉 (変更する場合)</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:bg-white focus:border-orange-500 outline-none transition-all"
                                            placeholder="空白なら変更なし"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-5 bg-blue-50 rounded-2xl border-2 border-blue-100 flex gap-4">
                                <ShieldCheck className="text-blue-500 shrink-0 mt-0.5" size={20} />
                                <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                                    この設定に基づき請求用紙がPDF作成されます。変更すると次回送信分から反映されます。
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Bar */}
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 30 }}
                                className="flex gap-4 pt-4 sticky bottom-8 z-40"
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    disabled={isSaving}
                                    className="flex-1 bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <X size={18} />
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Settings
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </form>
            </main>
        </div>
    );
}
