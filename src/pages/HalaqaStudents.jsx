import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UsersRound, UserCheck, UserRound, GraduationCap, CircleHelp, Search, Pencil, Save, Loader2, Hash, Phone, CheckSquare, X } from "lucide-react";
import { useToast } from "../components/Toast";
import { assignHalaqaStudents } from "../services/halaqaManagementService";
import { HalaqaFrame, InitialState, Notice, Metric, SearchField, Empty, PersonStatus, JoinedDate, HalaqaDialog, useHalaqaManagement, number, isActive, roleLabel, matchSearch } from "../components/halaqa/HalaqaManagementShared";

export default function HalaqaStudents() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, loading, error, reload } = useHalaqaManagement(id);
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [modalIds, setModalIds] = useState(null);
  const [teacherId, setTeacherId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const selectAllRef = useRef(null);
  const students = data?.students || [];
  const teachers = data?.teachers || [];
  const filtered = useMemo(() => students.filter((student) => {
    const teacherMatches = teacherFilter === "all" || (teacherFilter === "unassigned" ? !student.teacher_id || !student.teacher_linked : String(student.teacher_id) === teacherFilter);
    const statusMatches = statusFilter === "all" || (statusFilter === "active" ? isActive(student) : !isActive(student));
    return teacherMatches && statusMatches && matchSearch(search, student.full_name, student.user_number, student.phone, student.guardian_phone);
  }), [students, search, teacherFilter, statusFilter]);
  const visibleIds = filtered.map((student) => student.id);
  const selectedVisible = visibleIds.filter((value) => selected.includes(value)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisible === visibleIds.length;
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = selectedVisible > 0 && !allVisibleSelected; }, [selectedVisible, allVisibleSelected]);
  useEffect(() => { setSelected([]); setModalIds(null); setSearch(""); setTeacherFilter("all"); setStatusFilter("all"); }, [id]);
  useEffect(() => { if (data) setSelected((current) => current.filter((value) => data.students.some((student) => student.id === value))); }, [data]);
  function toggle(value) { setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  function openAssign(ids) { setModalIds(ids); setTeacherId(""); setFormError(""); }
  async function submit(event) {
    event.preventDefault();
    if (saving || !teacherId) return;
    setSaving(true); setFormError("");
    try {
      const count = await assignHalaqaStudents(id, modalIds, teacherId === "unassigned" ? null : teacherId);
      setModalIds(null); setSelected([]);
      showToast(`تم تحديث إسناد ${number(count)} طالبًا.`, "success");
      await reload();
    } catch (cause) { setFormError(cause.message); }
    finally { setSaving(false); }
  }
  if (!data) return <InitialState loading={loading} error={error} reload={reload} />;
  const assigned = students.filter((student) => student.teacher_id && student.teacher_linked).length;
  const unassigned = students.length - assigned;
  const chosenStudents = students.filter((student) => modalIds?.includes(student.id));
  return <HalaqaFrame id={id} data={data} tab="students" loading={loading || saving} reload={reload}>
    {error && <Notice tone="error">{error}</Notice>}
    <section className="hm-metrics" aria-label="إحصاءات الطلاب"><Metric label="طلاب الحلقة" value={number(students.length)} hint="الارتباطات الحالية" icon={UsersRound} /><Metric label="مسندون إلى معلم" value={number(assigned)} hint="ضمن فريق الحلقة" icon={UserCheck} /><Metric label="بحاجة إلى إسناد" value={number(unassigned)} hint="دون معلم مرتبط بالحلقة" icon={CircleHelp} gold /><Metric label="سعة الحلقة" value={data.halaqa.capacity == null ? "غير محددة" : number(data.halaqa.capacity)} hint={data.halaqa.capacity ? `${number(students.length)} طالبًا مسجلًا` : "يمكن ضبطها من إدارة الحلقات"} icon={GraduationCap} /></section>
    {unassigned > 0 && <Notice>يوجد {number(unassigned)} طالبًا بحاجة إلى إسناد. استخدم فلتر «بحاجة إلى إسناد» ثم حدد الطلاب واختر المعلم.</Notice>}
    <section className="hm-panel">
      <header className="hm-section-head"><div><span className="hm-section-kicker">المتابعة التعليمية</span><h2>طلاب الحلقة <small>{number(students.length)}</small></h2><p>إسناد فردي أو جماعي إلى المعلم الرئيسي أو أحد المساعدين.</p></div><button type="button" className="hm-button hm-button-quiet" onClick={() => navigate("/admin/students")}><UsersRound size={17} /> إدارة الطلاب</button></header>
      <div className="hm-toolbar"><SearchField value={search} onChange={setSearch} placeholder="بحث باسم الطالب أو رقمه أو الجوال…" /><label className="hm-filter"><span>المعلم</span><select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}><option value="all">كل المعلمين</option><option value="unassigned">بحاجة إلى إسناد</option>{teachers.map((teacher) => <option value={teacher.teacher_id} key={teacher.teacher_id}>{teacher.full_name}</option>)}</select></label><label className="hm-filter"><span>الحساب</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">كل الحالات</option><option value="active">نشط</option><option value="inactive">غير نشط</option></select></label></div>
      <div className={`hm-selection-bar ${selected.length ? "has-selection" : ""}`}><label><input ref={selectAllRef} type="checkbox" checked={allVisibleSelected} disabled={!visibleIds.length || saving || loading} onChange={() => setSelected((current) => allVisibleSelected ? current.filter((value) => !visibleIds.includes(value)) : [...new Set([...current, ...visibleIds])])} /> تحديد الظاهر <span>({number(filtered.length)})</span></label><div><span>{selected.length ? `${number(selected.length)} محدد` : "اختر الطلاب لتحديث إسنادهم معًا"}</span>{selected.length > 0 && <button type="button" className="hm-clear-selection" aria-label="مسح تحديد الطلاب" onClick={() => setSelected([])} disabled={saving}><X size={16} /></button>}<button type="button" className="hm-button hm-button-primary hm-button-small" disabled={!selected.length || saving || loading} onClick={() => openAssign(selected)}><CheckSquare size={16} /> تعيين المعلم</button></div></div>
      {filtered.length ? <div className="hm-students-list">{filtered.map((student) => <article key={student.id} className={`hm-student-row ${selected.includes(student.id) ? "is-selected" : ""}`}>
        <label className="hm-row-select"><input type="checkbox" aria-label={`تحديد ${student.full_name || "الطالب"}`} checked={selected.includes(student.id)} disabled={saving || loading} onChange={() => toggle(student.id)} /></label>
        <div className="hm-student-identity"><span className="hm-avatar hm-avatar-small"><UserRound size={20} /></span><div><h3>{student.full_name || "اسم غير متاح"}</h3><span className="hm-subline"><Hash size={13} /><bdi>{student.user_number || "الرقم غير مسجل"}</bdi></span><PersonStatus person={student} /></div></div>
        <div className="hm-student-teacher"><small>المعلم المسؤول</small>{student.teacher_id && student.teacher_linked ? <strong><GraduationCap size={15} /> {student.teacher_name || "اسم المعلم غير متاح"}</strong> : <span className="hm-badge hm-badge-gold">{student.teacher_id ? "المعلم غير مرتبط بالحلقة" : "لم يُسند بعد"}</span>}</div>
        <div className="hm-student-contact"><JoinedDate date={student.start_date} /><span className="hm-subline"><Phone size={14} /><span>ولي الأمر: <bdi>{student.guardian_phone || "غير مسجل"}</bdi></span></span></div>
        <button type="button" className="hm-button hm-button-quiet hm-student-edit" disabled={saving || loading} onClick={() => openAssign([student.id])} aria-label={`تعديل معلم ${student.full_name || "الطالب"}`}><Pencil size={15} /> تعديل الإسناد</button>
      </article>)}</div> : <Empty icon={students.length ? Search : UsersRound} title={students.length ? "لا توجد نتائج مطابقة" : "لا يوجد طلاب حاليون"} description={students.length ? "عدّل البحث أو الفلاتر لإظهار الطلاب." : "يمكن ربط الطلاب بالحلقة من صفحة إدارة الطلاب."} />}
      <footer className="hm-panel-footer"><span>عرض {number(filtered.length)} من {number(students.length)} طالبًا</span><span>تظهر الارتباطات الحالية فقط</span></footer>
    </section>
    {modalIds && <HalaqaDialog title={modalIds.length === 1 ? "تعديل معلم الطالب" : "تعيين معلم للطلاب"} description={`الطلاب المحددون: ${number(modalIds.length)}`} busy={saving} onClose={() => setModalIds(null)}><form onSubmit={submit}><fieldset disabled={saving} className="hm-form-fields"><div className="hm-selected-names">{chosenStudents.slice(0, 5).map((student) => <span key={student.id}>{student.full_name || student.user_number}</span>)}{chosenStudents.length > 5 && <span>+{number(chosenStudents.length - 5)}</span>}</div><label className="hm-field"><span>المعلم المسؤول عن المتابعة</span><select data-autofocus required value={teacherId} onChange={(event) => setTeacherId(event.target.value)}><option value="">اختر المعلم</option>{teachers.filter(isActive).map((teacher) => <option key={teacher.teacher_id} value={teacher.teacher_id}>{teacher.full_name} — {roleLabel(teacher.role)}</option>)}<option value="unassigned">دون معلم محدد</option></select></label>{!teachers.some(isActive) && <Notice>لا يوجد معلم نشط مرتبط بهذه الحلقة. يمكنك ربطه من تبويب المعلمين.</Notice>}<p className="hm-help">يُحدّث معلم المتابعة للطلاب المحددين داخل هذه الحلقة.</p></fieldset>{formError && <div className="hm-form-error" role="alert">{formError}</div>}<footer className="hm-modal-footer"><button type="button" className="hm-button hm-button-quiet" disabled={saving} onClick={() => setModalIds(null)}>إلغاء</button><button type="submit" className="hm-button hm-button-primary" disabled={saving || !teacherId}>{saving ? <Loader2 className="hm-spin" size={17} /> : <Save size={17} />}{saving ? "جارٍ الحفظ…" : "حفظ الإسناد"}</button></footer></form></HalaqaDialog>}
  </HalaqaFrame>;
}
