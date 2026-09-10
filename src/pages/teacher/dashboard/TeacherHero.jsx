import {
  BookOpen,
  Building2,
  Users,
  ClipboardCheck,
  Award,
  Sparkles,
} from "lucide-react";

export default function TeacherHero({
  teacherName,
  halaqaName,
  mosqueName,
  studentsCount,
  attendanceCount,
  recitationsCount,
}) {
  const today =
    new Date().toLocaleDateString(
      "ar-SA",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

  return (
    <div
      className="
      relative
      overflow-hidden
      rounded-[32px]
      bg-gradient-to-l
      from-emerald-900
      via-emerald-800
      to-emerald-700
      p-8
      text-white
      shadow-xl
    "
    >
      {/* زخرفة */}

      <div
        className="
        absolute
        -top-20
        -left-20
        w-72
        h-72
        rounded-full
        bg-white/5
      "
      />

      <div
        className="
        absolute
        -bottom-24
        -right-24
        w-96
        h-96
        rounded-full
        bg-yellow-300/10
      "
      />

      <div
        className="
        relative
        z-10
        flex
        flex-col
        xl:flex-row
        gap-8
        justify-between
      "
      >
        {/* معلومات */}

        <div>

          <div
            className="
            inline-flex
            items-center
            gap-2
            bg-white/10
            px-4
            py-2
            rounded-full
            mb-5
          "
          >
            <Sparkles size={16} />
            <span>
              لوحة المعلم
            </span>
          </div>

          <h1
            className="
            text-4xl
            font-black
          "
          >
            السلام عليكم
          </h1>

          <h2
            className="
            text-2xl
            mt-2
            font-bold
            text-yellow-200
          "
          >
            {teacherName}
          </h2>

          <div
            className="
            mt-6
            space-y-3
          "
          >
            <div className="flex items-center gap-3">
              <BookOpen size={18} />
              <span>
                {halaqaName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Building2 size={18} />
              <span>
                {mosqueName}
              </span>
            </div>

            <div className="text-emerald-100">
              {today}
            </div>
          </div>

        </div>

        {/* إحصائيات */}

        <div
          className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-4
          w-full
xl:w-auto
        "
        >
          <StatCard
            icon={<Users size={24} />}
            title="الطلاب"
            value={studentsCount}
          />

          <StatCard
            icon={
              <ClipboardCheck size={24} />
            }
            title="الحضور"
            value={attendanceCount}
          />

          <StatCard
            icon={<Award size={24} />}
            title="التسميعات"
            value={recitationsCount}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      className="
      bg-white/10
      backdrop-blur-md
      rounded-3xl
      p-5
      border
      border-white/10
    "
    >
      <div
        className="
        w-12
        h-12
        rounded-2xl
        bg-white/10
        flex
        items-center
        justify-center
      "
      >
        {icon}
      </div>

      <div
        className="
        mt-5
        text-4xl
        font-black
      "
      >
        {value}
      </div>

      <div
        className="
        text-white/70
        mt-1
      "
      >
        {title}
      </div>
    </div>
  );
}