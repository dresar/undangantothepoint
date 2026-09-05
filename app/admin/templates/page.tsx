"use client";

import { TemplateList } from "@/components/admin/TemplateList";

export default function AdminTemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Template Management
        </h1>
        <TemplateList />
      </div>
    </div>
  );
}

