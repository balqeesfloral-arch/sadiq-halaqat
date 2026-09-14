import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Activity, BarChart3 } from "lucide-react";

function EmptyChart({ text }) {
  return (
    <div className="td-chart-empty">
      <span>{text}</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="td-chart-tooltip">
      <strong>{label}</strong>
      <span>
        {payload[0]?.value ?? 0}
        {suffix}
      </span>
    </div>
  );
}

export default function TeacherCharts({
  attendanceData = [],
  recitationData = [],
}) {
  return (
    <section className="td-two-column">
      <article className="td-panel">
        <header className="td-panel-header">
          <div className="td-panel-icon td-panel-icon--green">
            <Activity size={20} />
          </div>
          <div>
            <span>آخر 30 يومًا</span>
            <h3>نسبة الحضور المسجلة</h3>
          </div>
        </header>

        <div className="td-chart">
          {!attendanceData.length ? (
            <EmptyChart text="لا توجد بيانات حضور بعد" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceData}
                margin={{ top: 10, right: 4, left: -22, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e8eeeb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#718079" }}
                  minTickGap={30}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#718079" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>

      <article className="td-panel">
        <header className="td-panel-header">
          <div className="td-panel-icon td-panel-icon--gold">
            <BarChart3 size={20} />
          </div>
          <div>
            <span>آخر 30 يومًا</span>
            <h3>نشاط التسميع</h3>
          </div>
        </header>

        <div className="td-chart">
          {!recitationData.length ? (
            <EmptyChart text="لا توجد بيانات تسميع بعد" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={recitationData}
                margin={{ top: 10, right: 4, left: -22, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e8eeeb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#718079" }}
                  minTickGap={30}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#718079" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="recitations"
                  fill="#c9a83f"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>
    </section>
  );
}
