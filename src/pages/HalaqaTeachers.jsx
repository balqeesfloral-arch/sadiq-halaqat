import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GraduationCap, Crown, UserPlus, UsersRound, Search, Pencil, Unlink, Phone, Hash, Save, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "../components/Toast";
import { saveHalaqaTeacher, removeHalaqaTeacher } from "../services/halaqaManagementService";
import { HalaqaFrame, InitialState, Notice, Metric, SearchField, Empty, PersonStatus, HalaqaDialog, useHalaqaManagement, number, isActive, roleLabel, matchSearch } from "../components/halaqa/HalaqaManagementShared";

export default function HalaqaTeachers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, loading, error, reload } = useHalaqaManagement(id);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ teacherId: "", role: "assistant", full_name: "", phone: "", replacement: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  useEffect(() => { setModal(null); setSearch(""); setRoleFilter("all"); }, [id]);
  const teachers = data?.teachers || [];
  const mainTeachers = teachers.filter((teacher) => teacher.role === "main");
  const filtered = useMemo(() => teachers.filter((teacher) => (roleFilter === "all" || teacher.role === roleFilter) && matchSearch(search, teacher.full_name, teacher.user_number, teacher.phone)), [teachers, search, roleFilter]);
  const candidates = (data?.available_teachers || []).filter((teacher) => isActive(teacher) && !teachers.some((linked) => String(linked.teacher_id) === String(teacher.id)));
  const currentTeacher = modal?.teacher ? teachers.find((teacher) => teacher.teacher_id === modal.teacher.teacher_id) || modal.teacher : null;

  function openModal(type, teacher = null) {
    setFormError("");
    setForm({ teacherId: teacher ? String(teacher.teacher_id) : "", role: teacher?.role || "assistant", full_name: teacher?.full_name || "", phone: teacher?.phone || "", replacement: "" });
    setModal({ type, teacher });
  }
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setFormError("");
    if (modal.type === "remove" && currentTeacher.students_count > 0 && !form.replacement) {
      setFormError("اختر المعلم البديل للطلاب، أو اختر «دون معلم محدد»."); return;
    }
    setSaving(true);
    try {
      if (modal.type === "remove") {
        await removeHalaqaTeacher(id, currentTeacher.teacher_id, form.replacement);
      } else {
        await saveHalaqaTeacher(id, form.teacherId, form.role, modal.type === "edit" ? form : null);
      }
      const message = modal.type === "remove" ? "تم فك ربط المعلم وتحديث إسناد طلابه." : modal.type === "add" ? "تم ربط المعلم بالحلقة." : "تم حفظ بيانات المعلم ودوره في الحلقة.";
      setModal(null);
      showToast(message, "success");
      await reload();
    } catch (cause) {
      setFormError(cause.message);
    } finally { setSaving(false); }
  }

  if (!data) return <InitialState loading={loading} error={error} reload={reload} />;
  const assignedStudents = data.students.filter((student) => student.teacher_id && student.teacher_linked).length;
  return <HalaqaFrame id={id} data={data} tab="teachers" loading={loading || saving} reload={reload}>
    {error && <Notice tone="error">{error}</Notice>}
    <section className="hm-metrics" aria-label="إحصاءات المعلمين">
      <Metric label="فريق الحلقة" value={number(teachers.length)} hint="المعلمون المرتبطون" icon={GraduationCap} />
      <Metric label="المعلم الرئيسي" value={mainTeachers.length === 1 ? mainTeachers[0].full_name : mainTeachers.length ? `${number(mainTeachers.length)} معلمون رئيسيون` : "غير محدد"} hint={mainTeachers.length === 1 ? "المسؤول عن الحلقة" : "يحتاج إلى تحديد"} icon={Crown} gold />
      <Metric label="المعلمون المساعدون" value={number(teachers.filter((teacher) => teacher.role === "assistant").length)} hint="مساندة المتابعة التعليمية" icon={ShieldCheck} />
      <Metric label="طلاب بإسناد واضح" value={number(assignedStudents)} hint={`من أصل ${number(data.students.length)} طالبًا`} icon={UsersRound} />
    </section>
    {mainTeachers.length !== 1 && <Notice>{mainTeachers.length ? "يوجد أكثر من معلم رئيسي. افتح تعديل المعلم الذي تريده رئيسيًا واحفظ دوره؛ سيصبح الباقون مساعدين." : "لم يُحدد معلم رئيسي للحلقة. يمكنك اختياره من تعديل المعلم أو عند ربط معلم جديد."}</Notice>}
    <section className="hm-panel">
      <header className="hm-section-head"><div><span className="hm-section-kicker">الفريق التعليمي</span><h2>معلمو الحلقة <small>{number(teachers.length)}</small></h2><p>بيانات المعلمين وأدوارهم والطلاب المسندون إليهم.</p></div><button type="button" className="hm-button hm-button-primary" disabled={loading || saving} onClick={() => openModal("add")}><UserPlus size={17} /> ربط معلم</button></header>
      <div className="hm-toolbar"><SearchField value={search} onChange={setSearch} placeholder="بحث بالاسم أو الرقم أو الجوال…" /><label className="hm-filter"><span>الدور</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">كل الأدوار</option><option value="main">رئيسي</option><option value="assistant">مساعد</option></select></label></div>
      {filtered.length ? <div className="hm-teacher-grid">{filtered.map((teacher) => <article key={teacher.teacher_id} className={`hm-teacher-card ${teacher.role === "main" ? "is-main" : ""}`}>
        <div className="hm-person-top"><div className="hm-avatar">{teacher.role === "main" ? <Crown size={24} /> : <GraduationCap size={24} />}</div><div className="hm-person-copy"><h3>{teacher.full_name || "معلم غير متاح"}</h3><span className={`hm-badge ${teacher.role === "main" ? "hm-badge-gold" : "hm-badge-green"}`}>{roleLabel(teacher.role)}</span></div><PersonStatus person={teacher} /></div>
        <div className="hm-person-details"><span><Hash size={15} /><bdi>{teacher.user_number || "الرقم غير مسجل"}</bdi></span><span><Phone size={15} /><bdi>{teacher.phone || "الجوال غير مسجل"}</bdi></span></div>
        <div className="hm-teacher-students"><span><UsersRound size={16} /> الطلاب المسندون</span><strong>{number(teacher.students_count)}</strong></div>
        <footer><button type="button" className="hm-button hm-button-quiet" disabled={loading || saving} onClick={() => openModal("edit", teacher)}><Pencil size={15} /> تعديل المعلم</button><button type="button" className="hm-button hm-button-danger-quiet" disabled={loading || saving} onClick={() => openModal("remove", teacher)}><Unlink size={15} /> فك الربط</button></footer>
      </article>)}</div> : <Empty icon={teachers.length ? Search : GraduationCap} title={teachers.length ? "لا توجد نتائج مطابقة" : "فريق الحلقة يبدأ بمعلم"} description={teachers.length ? "جرّب اسمًا آخر أو غيّر فلتر الدور." : "اربط معلمًا، ثم حدد دوره الرئيسي أو المساعد."} />}
      <footer className="hm-panel-footer"><span>عرض {number(filtered.length)} من {number(teachers.length)} معلمًا</span><button type="button" className="hm-text-button" onClick={() => navigate("/admin/teachers")}>إدارة حسابات المعلمين</button></footer>
    </section>
    {modal && <HalaqaDialog title={modal.type === "remove" ? "فك ارتباط المعلم" : modal.type === "edit" ? "تعديل المعلم ودوره" : "ربط معلم بالحلقة"} description={modal.type === "remove" ? currentTeacher.full_name : data.halaqa.name} busy={saving} onClose={() => setModal(null)}>
      <form onSubmit={submit}>
        <fieldset disabled={saving} className="hm-form-fields">
          {modal.type === "remove" ? <>
            <Notice>سيُفك ارتباط المعلم بهذه الحلقة فقط، ويظل حسابه وسجلاته السابقة محفوظة.</Notice>
            <p className="hm-form-description">الطلاب المسندون إليه حاليًا: <strong>{number(currentTeacher.students_count)}</strong>.</p>
            <label className="hm-field"><span>إسناد طلابه بعد فك الربط</span><select data-autofocus value={form.replacement} onChange={(event) => setForm({ ...form, replacement: event.target.value })} required={currentTeacher.students_count > 0}><option value="">اختر المعلم البديل</option>{teachers.filter((teacher) => teacher.teacher_id !== currentTeacher.teacher_id && isActive(teacher)).map((teacher) => <option key={teacher.teacher_id} value={teacher.teacher_id}>{teacher.full_name} — {roleLabel(teacher.role)}</option>)}<option value="unassigned">دون معلم محدد</option></select></label>
            {currentTeacher.role === "main" && <p className="hm-help">إذا لم يبقَ معلم رئيسي بعد فك الربط، يمكنك تعيينه من بطاقة المعلم.</p>}
          </> : <>
            {modal.type === "add" ? <><label className="hm-field"><span>المعلم</span><select data-autofocus required value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })}><option value="">اختر معلمًا من النطاق المتاح</option>{candidates.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.full_name}{teacher.user_number ? ` — ${teacher.user_number}` : ""}</option>)}</select></label>{!candidates.length && <Notice>لا يوجد معلم متاح للربط. أضف المعلم من إدارة المعلمين أو وافق على طلب انضمامه للمسجد.</Notice>}</> : <><label className="hm-field"><span>اسم المعلم</span><input data-autofocus required minLength={2} maxLength={120} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></label><label className="hm-field"><span>رقم الجوال</span><input type="tel" dir="ltr" maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><p className="hm-help">الاسم والجوال يحدَّثان في ملف المعلم.</p></>}
            <fieldset className="hm-role-picker"><legend>دوره في هذه الحلقة</legend>{[{ value: "main", label: "معلم رئيسي", description: "المسؤول عن الحلقة", Icon: Crown }, { value: "assistant", label: "معلم مساعد", description: "مساندة فريق الحلقة", Icon: GraduationCap }].map(({ value, label, description, Icon }) => <label key={value} className={form.role === value ? "is-selected" : ""}><input type="radio" name="teacher-role" value={value} checked={form.role === value} onChange={() => setForm({ ...form, role: value })} /><Icon size={21} /><strong>{label}</strong><small>{description}</small></label>)}</fieldset>
            {form.role === "main" && mainTeachers.some((teacher) => String(teacher.teacher_id) !== form.teacherId) && <Notice>عند الحفظ سيصبح هذا المعلم رئيسيًا، ويتحول المعلمون الرئيسيون الآخرون في الحلقة إلى مساعدين. يبقى إسناد الطلاب كما هو.</Notice>}
          </>}
        </fieldset>
        {formError && <div className="hm-form-error" role="alert">{formError}</div>}
        <footer className="hm-modal-footer"><button type="button" className="hm-button hm-button-quiet" disabled={saving} onClick={() => setModal(null)}>إلغاء</button><button type="submit" className={`hm-button ${modal.type === "remove" ? "hm-button-danger" : "hm-button-primary"}`} disabled={saving || (modal.type === "add" && !candidates.length)}>{saving ? <Loader2 className="hm-spin" size={17} /> : modal.type === "remove" ? <Unlink size={17} /> : <Save size={17} />}{saving ? "جارٍ الحفظ…" : modal.type === "remove" ? "تأكيد فك الربط" : "حفظ التغييرات"}</button></footer>
      </form>
    </HalaqaDialog>}
  </HalaqaFrame>;
}
