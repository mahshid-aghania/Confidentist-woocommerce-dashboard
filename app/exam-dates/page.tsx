import { CalendarDays, Users, MapPin, Clock } from "lucide-react";

const exams = [
  {
    name: "AFK — Full Exam",
    date: "December 11, 2026",
    day: "Thursday",
    registered: 89,
    capacity: 120,
    location: "NDEB Exam Centre, Ottawa",
    type: "AFK",
    color: "#1B2E5E",
    status: "Upcoming",
  },
  {
    name: "NDECC Clinical Skills",
    date: "January 15, 2027",
    day: "Friday",
    registered: 52,
    capacity: 80,
    location: "NDEB Exam Centre, Toronto",
    type: "NDECC",
    color: "#0D9488",
    status: "Upcoming",
  },
  {
    name: "ACJ — Assessment of Clinical Judgement",
    date: "February 3, 2027",
    day: "Wednesday",
    registered: 67,
    capacity: 100,
    location: "NDEB Exam Centre, Vancouver",
    type: "ACJ",
    color: "#2E4A97",
    status: "Scheduled",
  },
  {
    name: "Virtual OSCE Preparation Mock",
    date: "November 20, 2026",
    day: "Thursday",
    registered: 74,
    capacity: 90,
    location: "Online — Zoom",
    type: "OSCE",
    color: "#4C6EC4",
    status: "Upcoming",
  },
  {
    name: "ADAT — Advanced Dental Admission Test",
    date: "March 7, 2027",
    day: "Sunday",
    registered: 34,
    capacity: 60,
    location: "NDEB Exam Centre, Calgary",
    type: "ADAT",
    color: "#F59E0B",
    status: "Scheduled",
  },
  {
    name: "University Interview Coaching Session",
    date: "October 15, 2026",
    day: "Thursday",
    registered: 26,
    capacity: 30,
    location: "Online — Private Sessions",
    type: "Interview",
    color: "#6366F1",
    status: "Open",
  },
];

export default function ExamDatesPage() {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="rounded-xl px-6 py-5"
        style={{ background: "linear-gradient(135deg, #0F1D3E 0%, #1B2E5E 100%)" }}
      >
        <p className="text-blue-300 text-xs font-medium uppercase tracking-widest mb-1">NDEB Exam Schedule</p>
        <h2 className="text-white text-xl font-bold">Upcoming Exam Dates</h2>
        <p className="text-blue-200 text-sm mt-1">
          Track registered students and capacity for each upcoming exam
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exams.map((exam) => {
          const fillPct = Math.round((exam.registered / exam.capacity) * 100);
          const statusColor = exam.status === "Open" ? "#15803D" : exam.status === "Upcoming" ? "#1D4ED8" : "#B45309";
          const statusBg    = exam.status === "Open" ? "#DCFCE7"  : exam.status === "Upcoming" ? "#DBEAFE"  : "#FEF3C7";
          return (
            <div key={exam.name} className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
              <div className="h-1.5" style={{ background: exam.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${exam.color}18`, color: exam.color }}
                  >
                    {exam.type}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: statusBg, color: statusColor }}>
                    {exam.status}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-700 leading-snug mb-4">
                  {exam.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays size={12} style={{ color: exam.color }} />
                    <span className="font-medium">{exam.date}</span>
                    <span className="text-slate-400">· {exam.day}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={12} style={{ color: exam.color }} />
                    {exam.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users size={12} style={{ color: exam.color }} />
                    {exam.registered} / {exam.capacity} registered
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Capacity</span>
                    <span>{fillPct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${fillPct}%`,
                        background: fillPct > 85 ? "#EF4444" : fillPct > 60 ? exam.color : "#10B981",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold text-slate-700">Full Exam Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Exam", "Date", "Location", "Registered", "Capacity", "Fill Rate", "Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {[...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((exam) => {
                const fillPct = Math.round((exam.registered / exam.capacity) * 100);
                const statusColor = exam.status === "Open" ? "#15803D" : exam.status === "Upcoming" ? "#1D4ED8" : "#B45309";
                const statusBg    = exam.status === "Open" ? "#DCFCE7"  : exam.status === "Upcoming" ? "#DBEAFE"  : "#FEF3C7";
                return (
                  <tr key={exam.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${exam.color}18`, color: exam.color }}>
                        {exam.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-700">{exam.date}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{exam.location}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{exam.registered}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{exam.capacity}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: exam.color }} />
                        </div>
                        <span className="text-xs text-slate-500">{fillPct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: statusBg, color: statusColor }}>
                        {exam.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
