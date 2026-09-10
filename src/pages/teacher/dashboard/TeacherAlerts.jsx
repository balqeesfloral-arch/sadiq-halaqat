import {
  AlertTriangle,
  CalendarClock,
  UserX,
  ClipboardCheck,
} from "lucide-react";

export default function TeacherAlerts({
  alerts = [],
}) {
  if (!alerts.length) {
    return (
      <div
        className="
        bg-white
        rounded-[30px]
        border
        border-slate-200
        p-8
        shadow-sm
      "
      >
        <div
          className="
          flex
          flex-col
          items-center
          justify-center
          text-center
        "
        >
          <div
            className="
            w-16
            h-16
            rounded-3xl
            bg-emerald-100
            flex
            items-center
            justify-center
            mb-4
          "
          >
            <ClipboardCheck
              size={28}
              className="text-emerald-700"
            />
          </div>

          <h3
            className="
            text-xl
            font-black
          "
          >
            لا توجد تنبيهات
          </h3>

          <p
            className="
            text-slate-500
            mt-2
          "
          >
            جميع الأمور تسير بشكل ممتاز
          </p>
        </div>
      </div>
    );
  }

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
      <div
        className="
        p-6
        border-b
      "
      >
        <h3
          className="
          text-xl
          font-black
        "
        >
          التنبيهات الذكية
        </h3>

        <p
          className="
          text-sm
          text-slate-500
          mt-1
        "
        >
          تحتاج متابعة منك
        </p>
      </div>

      <div className="divide-y">

        {alerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
          />
        ))}

      </div>
    </div>
  );
}

function AlertItem({
  alert,
}) {
  const styles = {
    absent: {
      icon: (
        <UserX size={20} />
      ),
      bg: "bg-red-100",
      color:
        "text-red-700",
      title:
        "غياب طالب",
    },

    recitation_delay: {
      icon: (
        <AlertTriangle
          size={20}
        />
      ),
      bg: "bg-amber-100",
      color:
        "text-amber-700",
      title:
        "تأخر تسميع",
    },

    monthly_plan: {
      icon: (
        <ClipboardCheck
          size={20}
        />
      ),
      bg: "bg-orange-100",
      color:
        "text-orange-700",
      title:
        "خطة شهرية",
    },

    exam: {
      icon: (
        <CalendarClock
          size={20}
        />
      ),
      bg: "bg-blue-100",
      color:
        "text-blue-700",
      title:
        "اختبار قريب",
    },
  };

  const current =
    styles[alert.type];

  return (
    <div
      className="
      p-4
      hover:bg-slate-50
      transition-all
      flex
      items-center
      gap-4
    "
    >
      <div
        className={`
          w-12
          h-12
          rounded-2xl
          flex
          items-center
          justify-center
          ${current.bg}
          ${current.color}
        `}
      >
        {current.icon}
      </div>

      <div className="flex-1">
        <div
          className="
          font-bold
        "
        >
          {current.title}
        </div>

        <div
          className="
          text-sm
          text-slate-500
        "
        >
          {alert.message}
        </div>
      </div>
    </div>
  );
}