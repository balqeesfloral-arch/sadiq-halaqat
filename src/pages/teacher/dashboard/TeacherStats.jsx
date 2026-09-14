import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Target,
  UserX,
  Users,
} from "lucide-react";

const CARDS = [
  {
    key: "studentsCount",
    title: "طلاب الحلقة",
    subtitle: "المسجلون حاليًا",
    icon: Users,
    tone: "blue",
  },
  {
    key: "presentCount",
    title: "الحضور اليوم",
    subtitle: "حاضر + متأخر",
    icon: ClipboardCheck,
    tone: "green",
  },
  {
    key: "absentCount",
    title: "الغياب اليوم",
    subtitle: "يحتاج متابعة",
    icon: UserX,
    tone: "red",
  },
  {
    key: "recitationsCount",
    title: "تسميع اليوم",
    subtitle: "المسجل حتى الآن",
    icon: Award,
    tone: "gold",
  },
  {
    key: "examsCount",
    title: "الاختبارات",
    subtitle: "المرتبطة بالمعلم",
    icon: GraduationCap,
    tone: "violet",
  },
  {
    key: "achievementRate",
    title: "الإنجاز الشهري",
    subtitle: "اكتمال الحفظ والمراجعة",
    icon: Target,
    tone: "teal",
    suffix: "%",
  },
];

export default function TeacherStats({ stats = {} }) {
  return (
    <section className="td-stats-grid">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key] ?? 0;

        return (
          <article className={`td-stat-card td-tone-${card.tone}`} key={card.key}>
            <div className="td-stat-icon">
              <Icon size={21} />
            </div>

            <div className="td-stat-body">
              <span>{card.title}</span>
              <strong>
                {value}
                {card.suffix || ""}
              </strong>
              <small>{card.subtitle}</small>
            </div>

            <CheckCircle2 className="td-stat-mark" size={16} />
          </article>
        );
      })}
    </section>
  );
}
