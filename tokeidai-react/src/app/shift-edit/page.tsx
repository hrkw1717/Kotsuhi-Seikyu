"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { motion } from "framer-motion";
import { Calendar, Info } from "lucide-react";

export default function ShiftEditPage() {
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const userJson = localStorage.getItem("user");
        if (userJson) {
            const userData = JSON.parse(userJson);
            setUserName(userData.name || "ユーザー");
        } else {
            window.location.href = "/";
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header userName={userName} />

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">シフト表編集</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Shift Management System</p>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12 text-center"
                >
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Calendar size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">シフト表編集機能を準備中です</h2>
                    <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                        現在、ブラウザから直接シフト表を編集できる機能を開発しています。<br />
                        少々お待ちください。
                    </p>

                    <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 text-left max-w-lg mx-auto">
                        <Info size={18} className="text-blue-500 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-normal">
                            この機能により、Excelファイルを直接編集することなく、最新の勤務シフトをシステムに反映させることができるようになります。
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
