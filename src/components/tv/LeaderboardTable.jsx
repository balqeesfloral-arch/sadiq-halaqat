import {
  Award,
  BookOpenText,
  Trophy,
} from "lucide-react";

function RankBadge({
  rank,
}) {
  if (rank === 1) {
    return (
      <span className="tv-rank tv-rank--gold">
        1
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="tv-rank tv-rank--silver">
        2
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="tv-rank tv-rank--bronze">
        3
      </span>
    );
  }

  return (
    <span className="tv-rank">
      {rank}
    </span>
  );
}

export default function LeaderboardTable({
  students = [],
  compact = false,
}) {
  if (!students.length) {
    return null;
  }

  return (
    <section
      className={`tv-leaderboard ${
        compact
          ? "tv-leaderboard--compact"
          : ""
      }`}
    >
      <div className="tv-leaderboard__title">
        <div>
          <Award size={19} />

          <span>
            ترتيب الطلاب
          </span>
        </div>

        <small>
          حسب إجمالي النقاط
        </small>
      </div>

      <div className="tv-table">
        <div className="tv-table__head">
          <div>
            الترتيب
          </div>

          <div>
            الطالب
          </div>

          <div>
            الحلقة
          </div>

          <div>
            النقاط
          </div>
        </div>

        <div className="tv-table__body">
          {students.map(
            (student) => (
              <div
                className="tv-table__row"
                key={student.id}
              >
                <div className="tv-table__rank-cell">
                  <RankBadge
                    rank={
                      student.rank
                    }
                  />
                </div>

                <div className="tv-table__student">
                  <div className="tv-table__avatar">
                    {student.full_name
                      ?.trim()
                      ?.charAt(0) ||
                      "ط"}
                  </div>

                  <strong>
                    {
                      student.full_name
                    }
                  </strong>
                </div>

                <div className="tv-table__halaqa">
                  <BookOpenText
                    size={17}
                  />

                  <span>
                    {
                      student.halaqa_name
                    }
                  </span>
                </div>

                <div className="tv-table__points">
                  <Trophy
                    size={17}
                  />

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
            )
          )}
        </div>
      </div>
    </section>
  );
}