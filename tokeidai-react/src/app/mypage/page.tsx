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
    Briefcase
} from "lucide-react";
import { motion } from "framer-motion";

export default function MyPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userJson = localStorage.getItem("user");
        if (userJson) {
            setUser(JSON.parse(userJson));
        } else {
            window.location.href = "/";
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
                        <span className="text-lg font-bold tracking-tight text-slate-800">TOKEIDAI <span className="text-blue-600">CLAIM</span></span>
                    </div>
                    <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                        <ArrowLeft size={16} />
                        ダッシュボードに戻る
                    </Link>
                </div>
            </nav>

            <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">マイページ</h1>
                    <p className="text-slate-500 text-sm mt-1">あなたのアカウント情報と設定項目を確認できます。</p>
                </header>

                <div className="space-y-6">
                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-24"></div>
                        <div className="px-8 pb-8">
                            <div className="relative flex justify-between items-end -mt-12 mb-6">
                                <div className="p-1 bg-white rounded-2xl shadow-sm">
                                    <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-100">
                                        <User size={48} className="text-slate-400" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="mb-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-colors"
                                >
                                    <LogOut size={16} />
                                    ログアウト
                                </button>
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-slate-900">{user.name} 様</h2>
                                <p className="text-slate-500 font-medium">社員ID: {user.id}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">メールアドレス</p>
                                        <p className="text-slate-700 font-medium">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">所属・役職</p>
                                        <p className="text-slate-700 font-medium font-bold">警備スタッフ</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Registration Data */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8"
                    >
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-blue-600" />
                            登録情報・通勤経路
                        </h3>

                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-2 bg-white text-slate-600 rounded-lg shadow-sm">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">登録済みの往復移動経路</p>
                                        <p className="text-slate-700 font-bold text-lg leading-snug">
                                            {user.route || "未設定"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pt-4 border-t border-slate-200/50">
                                    <div className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">片道運賃（登録額）</p>
                                        <p className="text-emerald-700 font-bold text-xl">
                                            {user.fare ? `¥${user.fare.toLocaleString()}` : "¥0"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    ※上記の登録情報（経路・運賃）に基づき、交通費請求書が自動生成されます。内容に変更がある場合は、事務局までご連絡ください。
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
