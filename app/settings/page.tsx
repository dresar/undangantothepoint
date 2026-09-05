"use client";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Pengaturan</h1>
        <p className="text-gray-600">Kelola pengaturan aplikasi</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Informasi Akun</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value="demo@example.com"
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  value="Demo User"
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Database</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Provider: MySQL</p>
              <p>Database: undanganhtml</p>
              <p>Host: localhost:3306</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

