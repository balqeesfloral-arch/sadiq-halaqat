import { Heart, MoonStar, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getSeasonalMessage } from "../../lib/studentPortalUtils";

export default function SeasonalGreeting() {
  const message = useMemo(() => getSeasonalMessage(), []);
  const [visible, setVisible] = useState(true);

  if (!message || !visible) return null;

  const Icon =
    message.icon === "crescent"
      ? MoonStar
      : message.icon === "heart"
        ? Heart
        : Sparkles;

  return (
    <section className={`student-seasonal student-seasonal-${message.tone}`}>
      <div className="student-seasonal-glow" />
      <div className="student-seasonal-icon">
        <Icon size={22} />
      </div>
      <div className="student-seasonal-copy">
        <strong>{message.title}</strong>
        <span>{message.body}</span>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="إخفاء الرسالة"
      >
        <X size={17} />
      </button>
    </section>
  );
}
