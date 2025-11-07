/* ──────────────────────────────────────────────────────────────────────────────
   DashboardPage.tsx
   ────────────────────────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Calendar,
  Clock,
  Users,
  Building2,
  Shield,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { useAppContext } from "../../../contexts/AppContext";
import { timesheetsAPI } from "../../../api/timesheet.api";

/* ──────────────────────────────── Types ──────────────────────────────── */
interface Timesheet {
  id: number;
  projectId: number;
  userId: number;
  start_date: string;
  end_date: string;
  duration: number; // hours (float)
  description?: string;
  project?: { id: number; project_name: string };
  user?: { id: number; user_name: string };
}

interface Project {
  id: string | number;
  name: string;
  color: string;
  status: "active" | "completed" | string;
}

/* ──────────────────────────────── Helpers ──────────────────────────────── */
const formatHHMM = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, "0")}`;
};

const getDatesInRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const stop = new Date(end + "T00:00:00");
  while (cur <= stop) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

const now = new Date();
const todayStr = now.toISOString().split("T")[0];
const weekAgo = new Date(now);
weekAgo.setDate(now.getDate() - 7);
const weekAgoStr = weekAgo.toISOString().split("T")[0];
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const monthStartStr = monthStart.toISOString().split("T")[0];

/* ──────────────────────────────── UI Components ──────────────────────────────── */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>;

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-200">{children}</div>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

/* ──────────────────────── Stat / Quick-Action Cards ──────────────────────── */
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}> = ({ title, value, icon, iconBg }) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${iconBg} p-4 rounded-xl`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  iconBg: string;
}> = ({ title, description, icon, to, iconBg }) => (
  <Link
    to={to}
    className="group block p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className={`${iconBg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <ArrowRight
        size={20}
        className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
      />
    </div>
  </Link>
);

/* ──────────────────────────────── Main Component ──────────────────────────────── */
const DashboardPage: React.FC = () => {
  const { projects: rawProjects, users } = useAppContext();

  /* ---------- 1. Load Timesheets (same API you use in Reports) ---------- */
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const all: Timesheet[] = [];
      for (const p of rawProjects) {
        try {
          const data = await timesheetsAPI.getTimesheetByProject(p.id);
          if (Array.isArray(data)) all.push(...data);
        } catch (e) {
          console.error(`Failed loading timesheets for project ${p.id}`, e);
        }
      }
      setTimesheets(all);
      setLoading(false);
    };
    if (rawProjects.length) load();
  }, [rawProjects]);

  /* ---------- 2. Normalise Projects (add colour if missing) ---------- */
  const projects = useMemo(() => {
    return rawProjects.map((p) => ({
      ...p,
      color: p.color ?? "#6B7280", // default gray
    }));
  }, [rawProjects]);

  /* ---------- 3. Build flat list of daily hours per project ---------- */
  const projectHoursMap = useMemo(() => {
    const map = new Map<number, number>(); // projectId → total hours

    timesheets.forEach((ts) => {
      const dates = getDatesInRange(ts.start_date.split("T")[0], ts.end_date.split("T")[0]);
      const hoursPerDay = dates.length ? ts.duration / dates.length : 0;

      dates.forEach((date) => {
        // we only need totals, not per-day entries
        const prev = map.get(ts.projectId) ?? 0;
        map.set(ts.projectId, prev + hoursPerDay);
      });
    });

    return map;
  }, [timesheets]);

 /* ---------- 4. Global stats – today / week / month (correct & dynamic) ---------- */
const stats = useMemo(() => {
  /* ---- Local date helpers (no timezone shift) ---- */
  const toLocalDate = (raw: string): string => {
    const d = new Date(raw);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatLocalDate = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const now = new Date();
  const todayStr = formatLocalDate(now);

  /* ---- Overlap test ---- */
  const overlapsDay = (ts: Timesheet, day: string) => {
    const start = toLocalDate(ts.start_date);
    const end   = toLocalDate(ts.end_date);
    return start <= day && end >= day;
  };

  /* ---- Hours for a single day (full duration if overlap) ---- */
  const hoursForDay = (day: string): number =>
    timesheets.reduce((sum, ts) => (overlapsDay(ts, day) ? sum + ts.duration : sum), 0);

  /* ---- TODAY ---- */
  const todayHours = hoursForDay(todayStr);

  /* ---- THIS WEEK – Monday to Sunday of current week ---- */
  const weekStart = new Date(now);
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // go back to Monday
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday

  const weekDays: string[] = [];
  const curWeek = new Date(weekStart);
  while (curWeek <= weekEnd) {
    weekDays.push(formatLocalDate(curWeek));
    curWeek.setDate(curWeek.getDate() + 1);
  }

  const weekHours = weekDays.reduce((sum, d) => sum + hoursForDay(d), 0);

  /* ---- THIS MONTH – 1st to today ---- */
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
console.log('Month End:', monthEnd);
  const monthDays: string[] = [];
  const curMonth = new Date(monthStart);
  while (curMonth <= monthEnd) {
    monthDays.push(formatLocalDate(curMonth));
    curMonth.setDate(curMonth.getDate() + 1);
  }

  const monthHours = monthDays.reduce((sum, d) => sum + hoursForDay(d), 0);

  /* ---- TOTAL ---- */
  const totalHours = timesheets.reduce((sum, ts) => sum + ts.duration, 0);

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "active").length,
    totalHours: formatHHMM(totalHours),
    weekHours: formatHHMM(weekHours),
    todayHours: formatHHMM(todayHours),
    monthHours: formatHHMM(monthHours),
  };
}, [projects, timesheets]);

  /* ---------- 5. Quick actions (unchanged) ---------- */
  const quickActions = [
    {
      title: "Projects",
      description: "View and manage all projects",
      icon: <FolderKanban size={24} className="text-blue-600" />,
      to: "/projects",
      iconBg: "bg-blue-50",
    },
    {
      title: "Calendar",
      description: "Schedule and track time entries",
      icon: <Calendar size={24} className="text-purple-600" />,
      to: "/calendar",
      iconBg: "bg-purple-50",
    },
    {
      title: "Timesheet",
      description: "Review time logs and reports",
      icon: <Clock size={24} className="text-green-600" />,
      to: "/timesheet",
      iconBg: "bg-green-50",
    },
    {
      title: "Users",
      description: "Manage team members",
      icon: <Users size={24} className="text-orange-600" />,
      to: "/user",
      iconBg: "bg-orange-50",
    },
    {
      title: "Clients",
      description: "View and manage clients",
      icon: <Building2 size={24} className="text-pink-600" />,
      to: "/client",
      iconBg: "bg-pink-50",
    },
    {
      title: "Roles",
      description: "Configure user permissions",
      icon: <Shield size={24} className="text-indigo-600" />,
      to: "/role",
      iconBg: "bg-indigo-50",
    },
  ];

  /* ---------- 6. Recent Projects list (with real logged time) ---------- */
  const RecentProjectItem: React.FC<{ project: Project }> = ({ project }) => {
    const logged = projectHoursMap.get(Number(project.id)) ?? 0;
    const h = Math.floor(logged);
    const m = Math.round((logged - h) * 60);
    const statusColor =
      project.status === "active"
        ? "bg-green-100 text-green-700"
        : project.status === "completed"
        ? "bg-blue-100 text-blue-700"
        : "bg-yellow-100 text-yellow-700";

    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <div className="flex items-center flex-1">
          <div
            className="w-3 h-3 rounded-full mr-3"
            style={{ backgroundColor: project.color }}
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{project.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {h}h {m}m logged
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {project.status}
        </span>
      </div>
    );
  };

  const EmptyState: React.FC<{ message: string; linkText: string; linkTo: string }> = ({
    message,
    linkText,
    linkTo,
  }) => (
    <div className="text-center py-8">
      <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
      <Link to={linkTo} className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
        {linkText}
      </Link>
    </div>
  );

  const TimeOverviewCard: React.FC<{
    title: string;
    time: string;
    icon: React.ReactNode;
    bgColor: string;
    iconBgColor: string;
  }> = ({ title, time, icon, bgColor, iconBgColor }) => (
    <div className={`flex items-center justify-between p-4 ${bgColor} rounded-lg`}>
      <div className="flex items-center">
        <div className={`${iconBgColor} p-3 rounded-lg mr-4`}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{time}</p>
        </div>
      </div>
    </div>
  );

  /* ──────────────────────────────── Render ──────────────────────────────── */
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={<FolderKanban size={24} className="text-blue-600" />}
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={<CheckCircle2 size={24} className="text-green-600" />}
            iconBg="bg-green-50"
          />
          <StatCard
            title="Total Hours"
            value={stats.totalHours}
            icon={<Clock size={24} className="text-purple-600" />}
            iconBg="bg-purple-50"
          />
          <StatCard
            title="This Week"
            value={stats.weekHours}
            icon={<TrendingUp size={24} className="text-orange-600" />}
            iconBg="bg-orange-50"
          />
        </div>

        {/* ── Quick Actions ── */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {quickActions.map((a) => (
            <QuickActionCard key={a.to} {...a} />
          ))}
        </div>

        {/* ── Recent Projects + Time Overview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                <Link
                  to="/projects"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  View all
                  <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-0">
                  {projects.slice(0, 5).map((p) => (
                    <RecentProjectItem key={p.id} project={p} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="No projects yet"
                  linkText="Create your first project"
                  linkTo="/projects"
                />
              )}
            </CardContent>
          </Card>

          {/* Time Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Time Overview</h3>
                <Link
                  to="/timesheet"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  View timesheet
                  <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimeOverviewCard
                  title="Today"
                  time={stats.todayHours}
                  icon={<Clock size={20} className="text-blue-600" />}
                  bgColor="bg-blue-50"
                  iconBgColor="bg-blue-100"
                />
                <TimeOverviewCard
                  title="This Week"
                  time={stats.weekHours}
                  icon={<Calendar size={20} className="text-purple-600" />}
                  bgColor="bg-purple-50"
                  iconBgColor="bg-purple-100"
                />
                <TimeOverviewCard
                  title="This Month"
                  time={stats.monthHours}
                  icon={<TrendingUp size={20} className="text-green-600" />}
                  bgColor="bg-green-50"
                  iconBgColor="bg-green-100"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;