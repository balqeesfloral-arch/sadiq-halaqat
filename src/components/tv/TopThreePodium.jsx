import {
  Crown,
  Medal,
  Star,
} from "lucide-react";

function PodiumCard({
  student,
  rank,
}) {
  if (!student) return null;

  const rankConfig = {
    1: {
      label: "المركز الأول",
      className: "first",
      icon: (
        <Crown
          size={29}
          strokeWidth={1.8}
        />
      ),
    },

    2: {
      label: "المركز الثاني",
      className: "second",
      icon: (
        <Medal
          size={27}
          strokeWidth={1.8}
        />
      ),
    },

    3: {
      label: "المركز الثالث",
      className: "third",
      icon: (
        <Star
          size={27}
          strokeWidth={1.8}
        />
      ),
    },
  };

  const config =
    rankConfig[rank];

  return (
    <article
      className={`tv-podium-card tv-podium-card--${config.className}`}
    >
      <div className="tv-podium-card__halo" />

      <div className="tv-podium-card__rank-icon">
        {config.icon}
      </div>

      <div className="tv-podium-card__rank">
        {rank}
      </div>

      <div className="tv-podium-card__content">
        <span className="tv-podium-card__label">
          {config.label}
        </span>

        <h3>
          {student.full_name}
        </h3>

        <div className="tv-podium-card__halaqa">
          {student.halaqa_name}
        </div>

        <div className="tv-podium-card__points">
          <strong>
            {student.total_points.toLocaleString(
              "ar-SA"
            )}
          </strong>

          <span>
            نقطة
          </span>
        </div>
      </div>
    </article>
  );
}

export default function TopThreePodium({
  students = [],
}) {
  const first = students[0];
  const second = students[1];
  const third = students[2];

  return (
    <section className="tv-podium">
      <div className="tv-podium__heading">
        <div>
          <span>
            منصة التتويج
          </span>

          <h2>
            فرسان الصدارة
          </h2>
        </div>

        <div className="tv-podium__line" />
      </div>

      <div className="tv-podium__grid">
        <div className="tv-podium__slot tv-podium__slot--second">
          <PodiumCard
            student={second}
            rank={2}
          />
        </div>

        <div className="tv-podium__slot tv-podium__slot--first">
          <PodiumCard
            student={first}
            rank={1}
          />
        </div>

        <div className="tv-podium__slot tv-podium__slot--third">
          <PodiumCard
            student={third}
            rank={3}
          />
        </div>
      </div>
    </section>
  );
}