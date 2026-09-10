import {
  BookOpen,
  CalendarDays,
  Star,
  ChevronLeft,
} from "lucide-react";

export default function LatestRecitations({
  recitations = [],
}) {
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
        justify-between
      "
      >
        <div
          className="
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
            bg-emerald-100
            flex
            items-center
            justify-center
            text-emerald-700
          "
          >
            <BookOpen size={22} />
          </div>

          <div>
            <h3
              className="
              text-xl
              font-black
            "
            >
              آخر التسميعات
            </h3>

            <p
              className="
              text-sm
              text-slate-500
            "
            >
              أحدث النشاطات المسجلة
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y">

        {recitations
          .slice(0, 8)
          .map((item) => (
            <RecitationRow
              key={item.id}
              item={item}
            />
          ))}

      </div>
    </div>
  );
}

function RecitationRow({
  item,
}) {
  return (
    <div
      className="
      p-4
      hover:bg-slate-50
      transition-all
    "
    >
      <div
        className="
        flex
        items-center
        justify-between
      "
      >
        <div>

          <div
            className="
            font-bold
            text-slate-900
          "
          >
            {
              item.profiles
                ?.full_name
            }
          </div>

          <div
            className="
            text-sm
            text-slate-500
            mt-1
          "
          >
            {item.from_surah}
            {" "}
            →
            {" "}
            {item.to_surah}
          </div>

        </div>

        <div
          className="
          flex
          items-center
          gap-2
        "
        >
          <div
            className="
            flex
            items-center
            gap-1
            text-slate-500
            text-sm
          "
          >
            <CalendarDays
              size={14}
            />

            {
              item.recitation_date
            }
          </div>

          <ChevronLeft
            size={18}
            className="
            text-slate-400
            "
          />
        </div>
      </div>

      <div
        className="
        mt-3
        flex
        gap-2
        flex-wrap
      "
      >
        <Badge
          value={
            item.lesson_evaluation
          }
        />

        <Points
          value={item.points}
        />
      </div>
    </div>
  );
}

function Badge({
  value,
}) {
  if (!value) return null;

  return (
    <div
      className="
      px-3
      py-1
      rounded-xl
      bg-emerald-50
      text-emerald-700
      text-xs
      font-bold
    "
    >
      {value}
    </div>
  );
}

function Points({
  value,
}) {
  return (
    <div
      className="
      px-3
      py-1
      rounded-xl
      bg-amber-50
      text-amber-700
      text-xs
      font-bold
      flex
      items-center
      gap-1
    "
    >
      <Star size={12} />

      {value || 0}
      نقطة
    </div>
  );
}