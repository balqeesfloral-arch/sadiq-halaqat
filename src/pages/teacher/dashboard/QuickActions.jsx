import {
  ClipboardCheck,
  BookOpen,
  Users,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";

import { useNavigate }
from "react-router-dom";

export default function QuickActions() {
  const navigate =
    useNavigate();

  const actions = [
    {
      title:
        "تسجيل الحضور",
      icon:
        ClipboardCheck,
      path:
        "/teacher/attendance",
      color:
        "emerald",
    },

    {
      title:
        "إضافة تسميع",
      icon:
        BookOpen,
      path:
        "/teacher/recitations",
      color:
        "amber",
    },

    {
      title:
        "إدارة الطلاب",
      icon:
        Users,
      path:
        "/teacher/students",
      color:
        "blue",
    },

    {
      title:
        "الاختبارات",
      icon:
        GraduationCap,
      path:
        "/teacher/exams",
      color:
        "violet",
    },
  ];

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
      <h3
        className="
        text-xl
        font-black
        mb-6
      "
      >
        إجراءات سريعة
      </h3>

      <div
        className="
        grid
        sm:grid-cols-2
        xl:grid-cols-4
        gap-4
      "
      >
        {actions.map(
          (action) => (
            <ActionCard
              key={
                action.title
              }
              action={
                action
              }
              navigate={
                navigate
              }
            />
          )
        )}
      </div>
    </div>
  );
}

function ActionCard({
  action,
  navigate,
}) {
  const Icon =
    action.icon;

  return (
    <button
      onClick={() =>
        navigate(
          action.path
        )
      }
      className="
      group
      text-right
      p-5
      rounded-3xl
      border
      border-slate-200
      hover:border-emerald-300
      hover:shadow-lg
      transition-all
      "
    >
      <div
        className="
        flex
        items-center
        justify-between
        mb-6
      "
      >
        <div
          className="
          w-14
          h-14
          rounded-2xl
          bg-slate-100
          flex
          items-center
          justify-center
          "
        >
          <Icon size={24} />
        </div>

        <ArrowLeft
          size={18}
          className="
          opacity-0
          group-hover:opacity-100
          transition-all
          "
        />
      </div>

      <h4
        className="
        font-black
        text-lg
        "
      >
        {action.title}
      </h4>
    </button>
  );
}