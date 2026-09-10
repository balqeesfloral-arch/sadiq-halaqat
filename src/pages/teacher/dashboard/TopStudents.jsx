import {
  Trophy,
  Medal,
  Star,
  Crown,
} from "lucide-react";

export default function TopStudents({
  students = [],
}) {
  const topStudents =
    [...students]
      .sort(
        (a, b) =>
          (b.profiles?.total_points || 0) -
          (a.profiles?.total_points || 0)
      )
      .slice(0, 5);

  return (
    <div
      className="
      bg-white
      rounded-[30px]
      border
      border-slate-200
      shadow-sm
      overflow-hidden
    "
    >
      {/* Header */}

      <div
        className="
        px-6
        py-5
        border-b
        border-slate-100
        flex
        items-center
        gap-3
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
          text-amber-600
        "
        >
          <Trophy size={22} />
        </div>

        <div>
          <h3
            className="
            text-xl
            font-black
          "
          >
            أفضل الطلاب
          </h3>

          <p
            className="
            text-sm
            text-slate-500
          "
          >
            الأعلى نقاطاً
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {topStudents.map(
          (student, index) => (
            <StudentCard
              key={student.student_id}
              student={student}
              rank={index + 1}
            />
          )
        )}

      </div>
    </div>
  );
}

function StudentCard({
  student,
  rank,
}) {
  const points =
    student.profiles?.total_points || 0;

  const name =
    student.profiles?.full_name ||
    "طالب";

  const medals = {
    1: (
      <Crown
        size={22}
        className="text-yellow-500"
      />
    ),

    2: (
      <Medal
        size={22}
        className="text-slate-400"
      />
    ),

    3: (
      <Medal
        size={22}
        className="text-amber-700"
      />
    ),
  };

  return (
    <div
      className="
      flex
      items-center
      justify-between
      p-4
      rounded-2xl
      border
      border-slate-100
      hover:border-emerald-200
      hover:bg-emerald-50/30
      transition-all
    "
    >
      <div
        className="
        flex
        items-center
        gap-4
      "
      >
        <div
          className="
          w-12
          h-12
          rounded-2xl
          bg-slate-100
          flex
          items-center
          justify-center
          font-black
        "
        >
          {medals[rank] || rank}
        </div>

        <div>
          <div
            className="
            font-bold
            text-slate-900
          "
          >
            {name}
          </div>

          <div
            className="
            text-sm
            text-slate-500
          "
          >
            المركز #{rank}
          </div>
        </div>
      </div>

      <div
        className="
        flex
        items-center
        gap-2
        bg-emerald-50
        px-4
        py-2
        rounded-xl
      "
      >
        <Star
          size={16}
          className="
            text-amber-500
          "
        />

        <span
          className="
          font-black
          text-emerald-700
        "
        >
          {points}
        </span>
      </div>
    </div>
  );
}