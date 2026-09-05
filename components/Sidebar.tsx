"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Plus,
  FileText,
  Settings,
  Music,
  Palette,
  Users,
  Upload,
  Layout,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/create", icon: Plus, label: "Buat Undangan" },
  { href: "/invitations", icon: FileText, label: "Semua Undangan" },
  { href: "/themes", icon: Palette, label: "Tema" },
  { href: "/music", icon: Music, label: "Musik" },
  { href: "/settings", icon: Settings, label: "Pengaturan" },
];

const adminMenuItems = [
  { href: "/admin/upload", icon: Upload, label: "Upload Template" },
  { href: "/admin/templates", icon: Layout, label: "Kelola Template" },
];

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl border-r border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Undangan
        </h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          Digital Platform
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white hover:translate-x-1"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Admin Section */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center gap-2 px-4 mb-3">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Admin
            </span>
          </div>
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/50"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white hover:translate-x-1"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-700 bg-gray-900/50 space-y-2">
        <Link
          href="/create"
          prefetch={true}
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 group"
        >
          <Plus className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <span className="font-semibold">Buat Baru</span>
        </Link>
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              Demo User
            </p>
            <p className="text-xs text-gray-400 truncate">demo@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
});
