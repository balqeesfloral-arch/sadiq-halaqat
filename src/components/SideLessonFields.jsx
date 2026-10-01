import { evaluations } from "../data/surahList";
import "./SideLessonFields.css";

export default function SideLessonFields({ faces, lines, evaluation, onFaces, onLines, onEvaluation, linesPerFace = 15, disabled = false }) {
  return <div className="simple-side-lesson">
    <div className="simple-side-lesson-amount">
      <label>الأوجه<input type="number" inputMode="numeric" min="0" step="1" value={faces} onChange={event => onFaces(event.target.value)} disabled={disabled} placeholder="0" /></label>
      <label>الأسطر<input type="number" inputMode="numeric" min="0" step="1" value={lines} onChange={event => onLines(event.target.value)} disabled={disabled} placeholder="0" /></label>
    </div>
    <div className="simple-side-lesson-evaluation" role="group" aria-label="تقييم جنب الدرس">
      <span>التقييم</span>
      <div>{evaluations.map(value => <button type="button" key={value} aria-pressed={evaluation === value} disabled={disabled}
        onClick={() => onEvaluation(evaluation === value ? "" : value)}>{value}</button>)}</div>
    </div>
    <small>الوجه {linesPerFace} سطرًا. يُضاف المقدار المقبول تلقائيًا إلى الإنجاز الشهري، و«إعادة» لا تُحسب إنجازًا.</small>
  </div>;
}
