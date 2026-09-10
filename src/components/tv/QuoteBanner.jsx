import {
  Quote,
  Sparkles,
} from "lucide-react";

export default function QuoteBanner({
  quote,
}) {
  return (
    <section className="tv-quote">
      <div className="tv-quote__ornament tv-quote__ornament--right">
        <Sparkles size={19} />
      </div>

      <Quote
        className="tv-quote__icon"
        size={28}
        strokeWidth={1.5}
      />

      <p>
        {quote}
      </p>

      <div className="tv-quote__divider" />

      <span>
        نفحات قرآنية
      </span>

      <div className="tv-quote__ornament tv-quote__ornament--left">
        <Sparkles size={19} />
      </div>
    </section>
  );
}