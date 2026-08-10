import { Settings, Globe, Bell, Shield, CreditCard } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F1F5F9" }}>
          <Globe size={16} style={{ color: "#1B2E5E" }} />
          <h3 className="text-sm font-semibold text-slate-700">WooCommerce Connection</h3>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Store URL",       placeholder: "https://product.confidentist.ca", type: "url"  },
            { label: "Consumer Key",    placeholder: "ck_••••••••••••••••••••",          type: "text" },
            { label: "Consumer Secret", placeholder: "cs_••••••••••••••••••••",          type: "password" },
          ].map(({ label, placeholder, type }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none"
                style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
              />
            </div>
          ))}
          <button
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#1B2E5E" }}
          >
            Save Connection
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F1F5F9" }}>
          <Bell size={16} style={{ color: "#1B2E5E" }} />
          <h3 className="text-sm font-semibold text-slate-700">Notifications</h3>
        </div>
        <div className="p-6 space-y-4">
          {[
            "Email alert on new enrollment",
            "Email alert on refund request",
            "Weekly revenue summary",
            "Low exam capacity warning",
          ].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{item}</span>
              <div
                className="w-10 h-5 rounded-full relative cursor-pointer"
                style={{ background: "#1B2E5E" }}
              >
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F1F5F9" }}>
          <Shield size={16} style={{ color: "#1B2E5E" }} />
          <h3 className="text-sm font-semibold text-slate-700">Admin Account</h3>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Full Name",        value: "Admin",                  type: "text"     },
            { label: "Email",            value: "admin@confidentist.ca",  type: "email"    },
            { label: "New Password",     value: "",                       type: "password" },
          ].map(({ label, value, type }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
              <input
                type={type}
                defaultValue={value}
                className="w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none"
                style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
              />
            </div>
          ))}
          <button
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#1B2E5E" }}
          >
            Update Account
          </button>
        </div>
      </div>
    </div>
  );
}
