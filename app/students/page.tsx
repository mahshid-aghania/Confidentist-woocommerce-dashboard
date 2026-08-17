import Link from "next/link";
import { students } from "@/lib/data";
import { Users, UserCheck, UserX } from "lucide-react";

const statusStyle: Record<string, { bg: string; color: string }> = {
  active:    { bg: "#DCFCE7", color: "#15803D" },
  completed: { bg: "#DBEAFE", color: "#1D4ED8" },
  inactive:  { bg: "#F1F5F9", color: "#64748B" },
};

const PER_PAGE = 50;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp   = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const active    = students.filter(s => s.status === "active").length;
  const completed = students.filter(s => s.status === "completed").length;
  const inactive  = students.filter(s => s.status === "inactive").length;

  const totalPages   = Math.ceil(students.length / PER_PAGE);
  const pageStudents = students.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Students",    value: active,    icon: Users,     color: "#1B2E5E" },
          { label: "Completed",          value: completed, icon: UserCheck, color: "#0D9488" },
          { label: "Inactive / Refunded",value: inactive,  icon: UserX,     color: "#94A3B8" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border flex items-center gap-4" style={{ borderColor: "#E2E8F0" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold text-slate-700">
            All Students <span className="font-normal text-slate-400">({students.length.toLocaleString()} total)</span>
          </h3>
          <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Student", "Country", "Courses", "Enrolled", "Exam Date", "Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {pageStudents.map((s) => {
                const st = statusStyle[s.status];
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "#1B2E5E" }}
                        >
                          {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 text-xs">{s.name}</p>
                          <p className="text-slate-400 text-xs">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{s.country}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {s.courses.map(c => (
                          <span key={c} className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "#E8EDF8", color: "#1B2E5E" }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{s.enrolledAt}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{s.examDate ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize"
                        style={{ background: st.bg, color: st.color }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <p className="text-xs text-slate-400">
            Showing {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, students.length)} of {students.length.toLocaleString()} students
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/students?page=${page - 1}`}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:bg-slate-50"
                style={{ borderColor: "#E2E8F0", color: "#1B2E5E" }}
              >
                ← Prev
              </Link>
            )}
            <span className="text-xs text-slate-500 px-2">{page} / {totalPages}</span>
            {page < totalPages && (
              <Link
                href={`/students?page=${page + 1}`}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:bg-slate-50"
                style={{ borderColor: "#E2E8F0", color: "#1B2E5E" }}
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
