import Ornament from '../ornaments/Ornament';
import {
  Quote,
} from "lucide-react";

export default function QuoteBanner({
  quote,
}) {
  return (
    <section className="tv-quote">
      <div className="tv-quote__ornament tv-quote__ornament--right">
        <Ornament name="01-noor" />
      </div>

      <Quote
        className="tv-quote__icon"
        size={28}
        strokeWidth={1.5}
      />

      <p>
        {quote}
      </p>

      <Ornament name="10-ittizan" className="sq-quote-divider" />

      <span>
        نفحات قرآنية
      </span>

      <div className="tv-quote__ornament tv-quote__ornament--left">
        <Ornament name="01-noor" />
      </div>
    </section>
  );
}