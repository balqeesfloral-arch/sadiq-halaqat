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

import {
  BarChart3,
  Activity,
} from "lucide-react";

export default function TeacherCharts({
  attendanceData = [],
  recitationData = [],
}) {
  return (
    <div
      className="
      grid
      grid-cols-1
      xl:grid-cols-2
      gap-6
    "
    >
      <AttendanceChart
        data={attendanceData}
      />

      <RecitationChart
        data={recitationData}
      />
    </div>
  );
}

function AttendanceChart({
  data,
}) {
  return (
    <div
      className="
      bg-white
      rounded-[30px]
      border
      border-slate-200
      shadow-sm
      p-6
    "
    >
      <div
        className="
        flex
        items-center
        gap-3
        mb-6
      "
      >
        <div
          className="
          w-12
          h-12
          rounded-2xl
          bg-emerald-100
          flex
          items-center
          justify-center
          text-emerald-700
        "
        >
          <Activity size={22} />
        </div>

        <div>
          <h3
            className="
            font-black
            text-xl
          "
          >
            الحضور
          </h3>

          <p
            className="
            text-slate-500
            text-sm
          "
          >
            آخر 30 يوم
          </p>
        </div>
      </div>

      <div className="h-[320px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="date"
            />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="attendance"
              stroke="#0F766E"
              strokeWidth={4}
              dot={false}
            />

          </LineChart>
        </ResponsiveContainer>

      </div>
    </div>
  );
}

function RecitationChart({
  data,
}) {
  return (
    <div
      className="
      bg-white
      rounded-[30px]
      border
      border-slate-200
      shadow-sm
      p-6
    "
    >
      <div
        className="
        flex
        items-center
        gap-3
        mb-6
      "
      >
        <div
          className="
          w-12
          h-12
          rounded-2xl
          bg-amber-100
          flex
          items-center
          justify-center
          text-amber-700
        "
        >
          <BarChart3 size={22} />
        </div>

        <div>
          <h3
            className="
            font-black
            text-xl
          "
          >
            التسميعات
          </h3>

          <p
            className="
            text-slate-500
            text-sm
          "
          >
            آخر 30 يوم
          </p>
        </div>
      </div>

      <div className="h-[320px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="date"
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="recitations"
              radius={[10,10,0,0]}
              fill="#D6C28A"
            />

          </BarChart>
        </ResponsiveContainer>

      </div>
    </div>
  );
}