"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    FileText,
    User,
    Settings,
    LogOut,
    Menu,
    X,
    Home,
    Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
    userName: string;
}

export default function Header({ userName }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 rotate-3">
                            <FileText className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 tracking-tighter leading-none">TOKEIDAI</h1>
                            <p className="text-[10px] font-bold text-blue-600 tracking-[0.2em] leading-none mt-1">SMART CLAIM</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation & User Profile */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-full border border-slate-100">
                            <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                <User size={16} />
                            </div>
                            <span className="text-base font-bold text-slate-700">
                                {userName}
                                <span className="ml-1.5 text-slate-400 font-medium text-sm">様</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/dashboard"
                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="トップページ"
                            >
                                <Home size={22} />
                            </Link>
                            {/* シフト表編集 */}
                            <Link
                                href="/shift-edit"
                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="シフト表編集"
                            >
                                <Calendar size={22} />
                            </Link>
                            <Link
                                href="/mypage"
                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="マイページ"
                            >
                                <Settings size={22} />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="ログアウト"
                            >
                                <LogOut size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile: User Name & Hamburger Icon */}
                    <div className="flex md:hidden items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                <User size={14} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                                {userName}
                                <span className="ml-1 text-slate-400 font-medium text-xs">様</span>
                            </span>
                        </div>
                        <button
                            onClick={toggleMenu}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl z-50 md:hidden flex flex-col pt-20"
                        >
                            <div className="px-6 py-4 border-b border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">メニュー</p>
                                <div className="space-y-2">
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 p-4 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all font-bold"
                                    >
                                        <Home size={20} />
                                        <span>TOPページ</span>
                                    </Link>
                                    <Link
                                        href="/shift-edit"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 p-4 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all font-bold"
                                    >
                                        <Calendar size={20} />
                                        <span>シフト表編集</span>
                                    </Link>
                                    <Link
                                        href="/mypage"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 p-4 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all font-bold"
                                    >
                                        <Settings size={20} />
                                        <span>マイページ</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-auto p-6 border-t border-slate-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-4 p-4 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold shadow-sm shadow-red-100"
                                >
                                    <LogOut size={20} />
                                    <span>ログアウト</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
}
