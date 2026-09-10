import {
  Users,
  ClipboardCheck,
  XCircle,
  Award,
  GraduationCap,
  Target,
  TrendingUp,
} from "lucide-react";

export default function TeacherStats({
  studentsCount = 0,
  presentCount = 0,
  absentCount = 0,
  recitationsCount = 0,
  examsCount = 0,
  achievementRate = 0,
}) {
  const cards = [
    {
      title: "الطلاب",
      value: studentsCount,
      icon: Users,
      color:
        "from-blue-500 to-cyan-500",
    },

    {
      title: "الحضور اليوم",
      value: presentCount,
      icon: ClipboardCheck,
      color:
        "from-emerald-500 to-green-500",
    },

    {
      title: "الغياب اليوم",
      value: absentCount,
      icon: XCircle,
      color:
        "from-red-500 to-rose-500",
    },

    {
      title: "التسميعات",
      value: recitationsCount,
      icon: Award,
      color:
        "from-amber-500 to-yellow-500",
    },

    {
      title: "الاختبارات",
      value: examsCount,
      icon: GraduationCap,
      color:
        "from-violet-500 to-purple-500",
    },

    {
      title: "الإنجاز الشهري",
      value: `${achievementRate}%`,
      icon: Target,
      color:
        "from-teal-500 to-emerald-500",
    },
  ];

  return (
    <div
      className="
      grid
      grid-cols-1
      md:grid-cols-2
    xl:grid-cols-6
      gap-6
    "
    >
      {cards.map((card) => (
        <StatsCard
          key={card.title}
          {...card}
        />
      ))}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}) {
  return (
    <div
      className="
      relative
      overflow-hidden
      rounded-[28px]
      bg-white
      border
      border-slate-200
      shadow-sm
      hover:shadow-xl
      transition-all
      duration-300
      group
    "
    >
      {/* خلفية زخرفية */}

      <div
        className={`
          absolute
          top-0
          right-0
          w-40
          h-40
          rounded-full
          blur-3xl
          opacity-10
          bg-gradient-to-br
          ${color}
        `}
      />

      <div className="relative p-6">

        <div
          className="
          flex
          items-start
          justify-between
        "
        >
          <div>

            <div
              className="
              text-slate-500
              text-sm
              font-medium
            "
            >
              {title}
            </div>

            <div
              className="
              mt-3
              text-5xl
              font-black
              text-slate-900
            "
            >
              {value}
            </div>

          </div>

          <div
            className={`
              w-16
              h-16
              rounded-3xl
              bg-gradient-to-br
              ${color}
              text-white
              flex
              items-center
              justify-center
              shadow-lg
            `}
          >
            <Icon size={30} />
          </div>
        </div>

        <div
          className="
          mt-6
          flex
          items-center
          gap-2
          text-emerald-600
          text-sm
          font-medium
        "
        >
          <TrendingUp size={15} />

          <span>
            أداء مستقر
          </span>
        </div>

      </div>
    </div>
  );
}