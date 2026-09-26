import { useEffect, useMemo, useState } from "react";
import { Gift, Save, X } from "lucide-react";

import { supabase } from "../../lib/supabase";
import ConfirmModal from "../ConfirmModal";
import { showToast } from "../Toast";

import {
  createPointsSessionId,
  syncStudentCurrentMonthPoints,
} from "../../lib/pointsHijri";

export default function SessionGrantModal({
  open,
  student,
  rewardTypes = [],
  selectedDate,
  selectedHalaqa,
  editingSession = null,
  onClose,
  onSaved,
}) {
  const [selectedRewards, setSelectedRewards] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isEditing = Boolean(editingSession);

  const visibleRewardTypes = useMemo(() => {
    const existingIds = new Set(
      (editingSession?.items || [])
        .map((item) => Number(item.reward_type_id))
        .filter(Boolean)
    );

    return rewardTypes.filter(
      (item) =>
        item.type === "reward" &&
        (item.is_active || existingIds.has(Number(item.id)))
    );
  }, [rewardTypes, editingSession]);

  useEffect(() => {
    if (!open) return;

    if (editingSession) {
      const ids = new Set(
        editingSession.items
          .map((item) => Number(item.reward_type_id))
          .filter(Boolean)
      );

      setSelectedRewards(
        rewardTypes.filter(
          (item) =>
            item.type === "reward" &&
            ids.has(Number(item.id))
        )
      );

      setNotes(editingSession.notes || "");
    } else {
      setSelectedRewards([]);
      setNotes("");
    }

    setShowConfirm(false);
  }, [open, editingSession, rewardTypes]);

  const totalPoints = useMemo(
    () =>
      selectedRewards.reduce(
        (sum, item) => sum + Number(item.points || 0),
        0
      ),
    [selectedRewards]
  );

  if (!open || !student) return null;

  function toggleReward(reward) {
    setSelectedRewards((current) => {
      const exists = current.some(
        (item) => Number(item.id) === Number(reward.id)
      );

      return exists
        ? current.filter((item) => Number(item.id) !== Number(reward.id))
        : [...current, reward];
    });
  }

  async function saveGrant() {
    try {
      setSaving(true);

      const sessionId =
        editingSession?.session_id || createPointsSessionId();

      const existingItems = editingSession?.items || [];
      const selectedIds = new Set(
        selectedRewards.map((item) => Number(item.id))
      );

      const existingByType = new Map(
        existingItems
          .filter((item) => item.reward_type_id)
          .map((item) => [Number(item.reward_type_id), item])
      );

      const removeIds = existingItems
        .filter((item) => !selectedIds.has(Number(item.reward_type_id)))
        .map((item) => item.id);

      if (removeIds.length) {
        const { error } = await supabase
          .from("points_transactions")
          .delete()
          .in("id", removeIds);

        if (error) throw error;
      }

      const keepIds = existingItems
        .filter((item) => selectedIds.has(Number(item.reward_type_id)))
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

      const added = selectedRewards.filter(
        (reward) => !existingByType.has(Number(reward.id))
      );

      if (added.length) {
        const rows = added.map((reward) => ({
          session_id: sessionId,
          student_id: student.id,
          points: reward.points,
          reason: reward.name,
          reward_type_id: reward.id,
          category: "grant",
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
        isEditing ? "تم تحديث جلسة المنح" : "تم حفظ المنحة بنجاح",
        "success"
      );

      setShowConfirm(false);
      await onSaved?.();
      onClose?.();
    } catch (error) {
      console.error("SAVE GRANT SESSION:", error);
      showToast(
        isEditing ? "تعذر تحديث جلسة المنح" : "تعذر حفظ المنحة",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="tp-modal-overlay">
        <section className="tp-modal-card">
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
              <div className="tp-modal-icon">
                <Gift size={29} />
              </div>
              <h2>{isEditing ? "تعديل جلسة المنح" : "منح نقاط"}</h2>
              <p>
                {isEditing
                  ? "عدّل الأنواع المحددة بسهولة؛ أزل ما لا تحتاجه أو أضف نوعًا جديدًا."
                  : "اختر أنواع المنح التي يستحقها الطالب في هذه الجلسة."}
              </p>
            </header>

            <div className="tp-modal-meta">
              <Meta label="الطالب" value={student.full_name} />
              <Meta label="الحلقة" value={editingSession?.halaqa_id || selectedHalaqa || "—"} />
              <Meta label="التاريخ" value={editingSession?.transaction_date || selectedDate || "—"} />
            </div>

            <div className="tp-choice-grid">
              {visibleRewardTypes.map((reward) => {
                const selected = selectedRewards.some(
                  (item) => Number(item.id) === Number(reward.id)
                );

                return (
                  <button
                    type="button"
                    className={`tp-choice ${selected ? "is-selected" : ""}`}
                    onClick={() => toggleReward(reward)}
                    key={reward.id}
                  >
                    <div className="tp-choice-top">
                      <Gift size={18} color="#12665a" />
                      {selected && <span className="tp-choice-check" />}
                    </div>
                    <strong>{reward.name}</strong>
                    <span>+{reward.points} نقطة</span>
                  </button>
                );
              })}
            </div>

            <textarea
              className="tp-textarea"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="ملاحظات الجلسة — اختياري"
            />

            <div className="tp-total-box">
              <span>إجمالي نقاط الجلسة</span>
              <strong>+{totalPoints}</strong>
            </div>

            <footer className="tp-modal-actions">
              <button type="button" className="tp-btn" onClick={() => onClose?.()}>
                إلغاء
              </button>

              <button
                type="button"
                className="tp-btn tp-btn-primary"
                disabled={saving}
                onClick={() => setShowConfirm(true)}
              >
                <Save size={15} />
                {isEditing ? "حفظ التعديل" : "حفظ الجلسة"}
              </button>
            </footer>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={showConfirm}
        title={isEditing ? "تأكيد تعديل جلسة المنح" : "تأكيد المنح"}
        message={
          selectedRewards.length
            ? `سيصبح مجموع الجلسة ${totalPoints} نقطة للطالب ${student.full_name}.`
            : `تم إلغاء تحديد جميع أنواع المنح. سيتم حذف جلسة المنح كاملة للطالب ${student.full_name}.`
        }
        onConfirm={saveGrant}
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
