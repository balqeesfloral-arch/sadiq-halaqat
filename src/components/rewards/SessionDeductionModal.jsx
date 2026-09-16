import { useEffect, useMemo, useState } from "react";
import { MinusCircle, Save, X } from "lucide-react";

import { supabase } from "../../lib/supabase";
import ConfirmModal from "../ConfirmModal";
import { showToast } from "../Toast";

import {
  createPointsSessionId,
  syncStudentCurrentMonthPoints,
} from "../../lib/pointsHijri";

export default function SessionDeductionModal({
  open,
  student,
  penaltyTypes = [],
  selectedDate,
  selectedHalaqa,
  editingSession = null,
  onClose,
  onSaved,
}) {
  const [selectedPenalties, setSelectedPenalties] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isEditing = Boolean(editingSession);

  const visiblePenaltyTypes = useMemo(() => {
    const existingIds = new Set(
      (editingSession?.items || [])
        .map((item) => Number(item.penalty_type_id))
        .filter(Boolean)
    );

    return penaltyTypes.filter(
      (item) =>
        item.type === "penalty" &&
        (item.is_active || existingIds.has(Number(item.id)))
    );
  }, [penaltyTypes, editingSession]);

  useEffect(() => {
    if (!open) return;

    if (editingSession) {
      const ids = new Set(
        editingSession.items
          .map((item) => Number(item.penalty_type_id))
          .filter(Boolean)
      );

      setSelectedPenalties(
        penaltyTypes.filter(
          (item) =>
            item.type === "penalty" &&
            ids.has(Number(item.id))
        )
      );

      setNotes(editingSession.notes || "");
    } else {
      setSelectedPenalties([]);
      setNotes("");
    }

    setShowConfirm(false);
  }, [open, editingSession, penaltyTypes]);

  const totalPoints = useMemo(
    () =>
      selectedPenalties.reduce(
        (sum, item) => sum + Number(item.points || 0),
        0
      ),
    [selectedPenalties]
  );

  if (!open || !student) return null;

  function togglePenalty(penalty) {
    setSelectedPenalties((current) => {
      const exists = current.some(
        (item) => Number(item.id) === Number(penalty.id)
      );

      return exists
        ? current.filter((item) => Number(item.id) !== Number(penalty.id))
        : [...current, penalty];
    });
  }

  async function savePenalty() {
    try {
      setSaving(true);

      const sessionId =
        editingSession?.session_id || createPointsSessionId();

      const existingItems = editingSession?.items || [];
      const selectedIds = new Set(
        selectedPenalties.map((item) => Number(item.id))
      );

      const existingByType = new Map(
        existingItems
          .filter((item) => item.penalty_type_id)
          .map((item) => [Number(item.penalty_type_id), item])
      );

      const removeIds = existingItems
        .filter((item) => !selectedIds.has(Number(item.penalty_type_id)))
        .map((item) => item.id);

      if (removeIds.length) {
        const { error } = await supabase
          .from("points_transactions")
          .delete()
          .in("id", removeIds);

        if (error) throw error;
      }

      const keepIds = existingItems
        .filter((item) => selectedIds.has(Number(item.penalty_type_id)))
        .map((item) => item.id);

      if (keepIds.length) {
        const { error } = await supabase
          .from("points_transactions")
          .update({
            session_id: sessionId,
            notes: notes || "",
          })
          .in("id", keepIds);

        if (error) throw error;
      }

      const added = selectedPenalties.filter(
        (penalty) => !existingByType.has(Number(penalty.id))
      );

      if (added.length) {
        const rows = added.map((penalty) => ({
          session_id: sessionId,
          student_id: student.id,
          points: penalty.points,
          reason: penalty.name,
          penalty_type_id: penalty.id,
          category: "deduction",
          halaqa_id: editingSession?.halaqa_id || selectedHalaqa,
          transaction_date: editingSession?.transaction_date || selectedDate,
          notes: notes || "",
        }));

        const { error } = await supabase
          .from("points_transactions")
          .insert(rows);

        if (error) throw error;
      }

      await syncStudentCurrentMonthPoints(supabase, student.id);

      showToast(
        isEditing ? "تم تحديث جلسة الخصم" : "تم حفظ الخصمة بنجاح",
        "success"
      );

      setShowConfirm(false);
      await onSaved?.();
      onClose?.();
    } catch (error) {
      console.error("SAVE DEDUCTION SESSION:", error);
      showToast(
        isEditing ? "تعذر تحديث جلسة الخصم" : "تعذر حفظ الخصمة",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="tp-modal-overlay">
        <section className="tp-modal-card danger">
          <div className="tp-modal-inner">
            <button
              type="button"
              className="tp-modal-close"
              onClick={() => onClose?.()}
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>

            <header className="tp-modal-head">
              <div className="tp-modal-icon danger">
                <MinusCircle size={29} />
              </div>
              <h2>{isEditing ? "تعديل جلسة الخصم" : "خصم نقاط"}</h2>
              <p>
                {isEditing
                  ? "عدّل الأنواع المحددة بسهولة؛ أزل ما لا تحتاجه أو أضف نوعًا جديدًا."
                  : "اختر أسباب الخصم المسجلة على الطالب في هذه الجلسة."}
              </p>
            </header>

            <div className="tp-modal-meta">
              <Meta label="الطالب" value={student.full_name} />
              <Meta label="الحلقة" value={editingSession?.halaqa_id || selectedHalaqa || "—"} />
              <Meta label="التاريخ" value={editingSession?.transaction_date || selectedDate || "—"} />
            </div>

            <div className="tp-choice-grid">
              {visiblePenaltyTypes.map((penalty) => {
                const selected = selectedPenalties.some(
                  (item) => Number(item.id) === Number(penalty.id)
                );

                return (
                  <button
                    type="button"
                    className={`tp-choice danger ${selected ? "is-selected danger" : ""}`}
                    onClick={() => togglePenalty(penalty)}
                    key={penalty.id}
                  >
                    <div className="tp-choice-top">
                      <MinusCircle size={18} color="#b33d34" />
                      {selected && <span className="tp-choice-check" />}
                    </div>
                    <strong>{penalty.name}</strong>
                    <span>{penalty.points} نقطة</span>
                  </button>
                );
              })}
            </div>

            <textarea
              className="tp-textarea"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="ملاحظات الخصم — اختياري"
            />

            <div className="tp-total-box danger">
              <span>إجمالي خصم الجلسة</span>
              <strong>-{Math.abs(totalPoints)}</strong>
            </div>

            <footer className="tp-modal-actions">
              <button type="button" className="tp-btn" onClick={() => onClose?.()}>
                إلغاء
              </button>

              <button
                type="button"
                className="tp-btn tp-btn-danger"
                disabled={saving}
                onClick={() => setShowConfirm(true)}
              >
                <Save size={15} />
                {isEditing ? "حفظ التعديل" : "حفظ الخصم"}
              </button>
            </footer>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={showConfirm}
        title={isEditing ? "تأكيد تعديل جلسة الخصم" : "تأكيد الخصم"}
        message={
          selectedPenalties.length
            ? `سيصبح مجموع الجلسة ${totalPoints} نقطة للطالب ${student.full_name}.`
            : `تم إلغاء تحديد جميع أنواع الخصم. سيتم حذف جلسة الخصم كاملة للطالب ${student.full_name}.`
        }
        onConfirm={savePenalty}
        onClose={() => setShowConfirm(false)}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

function Meta({ label, value }) {
  return (
    <div className="tp-meta-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
