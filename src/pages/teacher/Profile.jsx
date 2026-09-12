import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabase";

import {
  useToast,
} from "../../components/Toast";

import {
  useConfirm,
} from "../../context/ConfirmContext";

/* =========================================================
   Constants
========================================================= */

const ROLE_LABELS = {
  admin: "مدير النظام",
  supervisor: "المشرف",
  teacher: "المعلم",
  student: "الطالب",
};

const PERIOD_LABELS = {
  after_fajr: "بعد الفجر",
  after_dhuhr: "بعد الظهر",
  after_asr: "بعد العصر",
  after_maghrib: "بعد المغرب",
  after_isha: "بعد العشاء",
};

/* =========================================================
   Helpers
========================================================= */

function todayString() {
  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function daysAgoString(days) {
  const date = new Date();

  date.setDate(
    date.getDate() - days
  );

  return todayStringFromDate(date);
}

function todayStringFromDate(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatGregorianDate(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-gregory",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return "—";
  }
}

function formatHijriDate(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic-umalqura",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return "—";
  }
}

function cleanPhone(value) {
  return String(
    value || ""
  )
    .replace(/[^\d+]/g, "")
    .trim();
}

function getPasswordStrength(password) {
  const value =
    String(password || "");

  let score = 0;

  if (value.length >= 8) {
    score += 1;
  }

  if (value.length >= 12) {
    score += 1;
  }

  if (/[A-Za-z]/.test(value)) {
    score += 1;
  }

  if (/\d/.test(value)) {
    score += 1;
  }

  if (
    /[^A-Za-z0-9]/.test(value)
  ) {
    score += 1;
  }

  if (!value) {
    return {
      score: 0,
      label: "لم تكتب كلمة مرور",
      className: "empty",
    };
  }

  if (score <= 2) {
    return {
      score,
      label: "ضعيفة",
      className: "weak",
    };
  }

  if (score <= 3) {
    return {
      score,
      label: "جيدة",
      className: "good",
    };
  }

  return {
    score,
    label: "قوية",
    className: "strong",
  };
}

/* =========================================================
   Page
========================================================= */

export default function Profile() {
  const navigate =
    useNavigate();

  const {
    showToast,
  } =
    useToast();

  const {
    confirm,
  } =
    useConfirm();

  /* =====================================================
     Auth / Profile
  ===================================================== */

  const [
    user,
    setUser,
  ] =
    useState(null);

  const [
    profile,
    setProfile,
  ] =
    useState(null);

  /* =====================================================
     Editable fields
  ===================================================== */

  const [
    fullName,
    setFullName,
  ] =
    useState("");

  const [
    displayName,
    setDisplayName,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    avatarUrl,
    setAvatarUrl,
  ] =
    useState("");

  /* =====================================================
     Teacher context
  ===================================================== */

  const [
    teacherHalaqat,
    setTeacherHalaqat,
  ] =
    useState([]);

  const [
    stats,
    setStats,
  ] =
    useState({
      halaqat: 0,
      students: 0,
      recitations30: 0,
      attendanceRate30: 0,
    });

  /* =====================================================
     UI
  ===================================================== */

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    signingOut,
    setSigningOut,
  ] =
    useState(false);

  const [
    showPasswordModal,
    setShowPasswordModal,
  ] =
    useState(false);

  const [
    changingPassword,
    setChangingPassword,
  ] =
    useState(false);

  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] =
    useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] =
    useState(false);

  /* =====================================================
     Derived
  ===================================================== */

  const roleLabel =
    ROLE_LABELS[
      profile?.role
    ] ||
    "مستخدم النظام";

  const passwordStrength =
    useMemo(
      () =>
        getPasswordStrength(
          newPassword
        ),
      [newPassword]
    );

  const hasProfileChanges =
    useMemo(() => {
      if (!profile) {
        return false;
      }

      return (
        fullName.trim() !==
          String(
            profile.full_name ||
              ""
          ).trim() ||
        displayName.trim() !==
          String(
            profile.display_name ||
              ""
          ).trim() ||
        cleanPhone(phone) !==
          cleanPhone(
            profile.phone
          ) ||
        avatarUrl.trim() !==
          String(
            profile.avatar_url ||
              ""
          ).trim()
      );
    }, [
      profile,
      fullName,
      displayName,
      phone,
      avatarUrl,
    ]);

  /* =====================================================
     Start
  ===================================================== */

  useEffect(() => {
    loadProfile();
  }, []);

  /* =====================================================
     Load Profile
  ===================================================== */

  async function loadProfile() {
    setLoading(true);

    try {
      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const authUser =
        authData?.user;

      if (!authUser) {
        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }

      setUser(
        authUser
      );

      const {
        data: profileData,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            role,
            user_number,
            full_name,
            phone,
            status,
            created_at,
            display_name,
            avatar_url,
            auth_user_id,
            login_type,
            gender,
            education_stage,
            education_grade,
            education_level,
            is_active
          `)
          .eq(
            "auth_user_id",
            authUser.id
          )
          .maybeSingle();

      if (
        profileError
      ) {
        throw profileError;
      }

      if (
        !profileData
      ) {
        showToast(
          "لم يتم العثور على ملف المستخدم المرتبط بهذا الحساب.",
          "error"
        );

        return;
      }

      setProfile(
        profileData
      );

      setFullName(
        profileData.full_name ||
          ""
      );

      setDisplayName(
        profileData.display_name ||
          ""
      );

      setPhone(
        profileData.phone ||
          ""
      );

      setAvatarUrl(
        profileData.avatar_url ||
          ""
      );

      if (
        profileData.role ===
        "teacher"
      ) {
        await loadTeacherContext(
          profileData.id
        );
      }

    } catch (error) {
      console.error(
        "PROFILE LOAD:",
        error
      );

      showToast(
        error.message ||
          "تعذر تحميل الملف الشخصي.",
        "error"
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /* =====================================================
     Teacher Context
  ===================================================== */

  async function loadTeacherContext(
    teacherId
  ) {
    try {
      const {
        data: links,
        error: linksError,
      } =
        await supabase
          .from(
            "teacher_halaqat"
          )
          .select(`
            halaqa_id,
            role
          `)
          .eq(
            "teacher_id",
            teacherId
          );

      if (
        linksError
      ) {
        throw linksError;
      }

      const halaqaIds = [
        ...new Set(
          (
            links || []
          ).map(
            (item) =>
              Number(
                item.halaqa_id
              )
          )
        ),
      ];

      if (
        halaqaIds.length ===
        0
      ) {
        setTeacherHalaqat(
          []
        );

        setStats({
          halaqat: 0,
          students: 0,
          recitations30: 0,
          attendanceRate30: 0,
        });

        return;
      }

      const {
        data: halaqatRows,
        error: halaqatError,
      } =
        await supabase
          .from("halaqat")
          .select(`
            id,
            name,
            mosque_id,
            halaqa_period,
            status
          `)
          .in(
            "id",
            halaqaIds
          )
          .order(
            "name",
            {
              ascending:
                true,
            }
          );

      if (
        halaqatError
      ) {
        throw halaqatError;
      }

      const mosqueIds = [
        ...new Set(
          (
            halaqatRows ||
            []
          )
            .map(
              (item) =>
                item.mosque_id
            )
            .filter(Boolean)
            .map(Number)
        ),
      ];

      let mosqueRows =
        [];

      if (
        mosqueIds.length >
        0
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from("mosques")
            .select(`
              id,
              name
            `)
            .in(
              "id",
              mosqueIds
            );

        if (error) {
          throw error;
        }

        mosqueRows =
          data || [];
      }

      const mosqueMap =
        new Map(
          mosqueRows.map(
            (mosque) => [
              Number(
                mosque.id
              ),
              mosque.name,
            ]
          )
        );

      const roleMap =
        new Map(
          (
            links || []
          ).map(
            (link) => [
              Number(
                link.halaqa_id
              ),
              link.role,
            ]
          )
        );

      const preparedHalaqat =
        (
          halaqatRows ||
          []
        ).map(
          (halaqa) => ({
            ...halaqa,

            teacher_role:
              roleMap.get(
                Number(
                  halaqa.id
                )
              ) ||
              "main",

            mosque_name:
              mosqueMap.get(
                Number(
                  halaqa.mosque_id
                )
              ) ||
              "مسجد غير محدد",
          })
        );

      setTeacherHalaqat(
        preparedHalaqat
      );

      const since =
        daysAgoString(29);

      const today =
        todayString();

      const [
        studentLinksResult,
        recitationsResult,
        attendanceResult,
      ] =
        await Promise.all([
          supabase
            .from(
              "student_halaqat"
            )
            .select(`
              student_id,
              halaqa_id
            `)
            .in(
              "halaqa_id",
              halaqaIds
            )
            .eq(
              "is_current",
              true
            ),

          supabase
            .from(
              "recitations"
            )
            .select(
              "id",
              {
                count: "exact",
                head: true,
              }
            )
            .in(
              "halaqa_id",
              halaqaIds
            )
            .gte(
              "recitation_date",
              since
            )
            .lte(
              "recitation_date",
              today
            ),

          supabase
            .from(
              "attendance"
            )
            .select(`
              status
            `)
            .in(
              "halaqa_id",
              halaqaIds
            )
            .gte(
              "attendance_date",
              since
            )
            .lte(
              "attendance_date",
              today
            ),
        ]);

      if (
        studentLinksResult.error
      ) {
        throw studentLinksResult.error;
      }

      if (
        recitationsResult.error
      ) {
        console.error(
          "PROFILE RECITATIONS:",
          recitationsResult.error
        );
      }

      if (
        attendanceResult.error
      ) {
        console.error(
          "PROFILE ATTENDANCE:",
          attendanceResult.error
        );
      }

      const studentIds =
        [
          ...new Set(
            (
              studentLinksResult.data ||
              []
            ).map(
              (item) =>
                Number(
                  item.student_id
                )
            )
          ),
        ];

      const attendanceRows =
        attendanceResult.data ||
        [];

      const attended =
        attendanceRows.filter(
          (item) =>
            item.status ===
              "present" ||
            item.status ===
              "late"
        ).length;

      const attendanceBase =
        attendanceRows.filter(
          (item) =>
            [
              "present",
              "late",
              "absent",
            ].includes(
              item.status
            )
        ).length;

      setStats({
        halaqat:
          preparedHalaqat.length,

        students:
          studentIds.length,

        recitations30:
          recitationsResult.count ||
          0,

        attendanceRate30:
          attendanceBase > 0
            ? Math.round(
                (
                  attended /
                  attendanceBase
                ) *
                  100
              )
            : 0,
      });

    } catch (error) {
      console.error(
        "PROFILE CONTEXT:",
        error
      );

      showToast(
        "تم تحميل الملف، لكن تعذر تحميل بعض إحصائيات المعلم.",
        "info"
      );
    }
  }

  /* =====================================================
     Save Profile
  ===================================================== */

  async function saveProfile() {
    if (
      !profile?.id
    ) {
      return;
    }

    if (
      !fullName.trim()
    ) {
      showToast(
        "أدخل الاسم الكامل.",
        "error"
      );

      return;
    }

    const normalizedPhone =
      cleanPhone(phone);

    if (
      normalizedPhone &&
      normalizedPhone.length <
        9
    ) {
      showToast(
        "تحقق من رقم الجوال.",
        "error"
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        full_name:
          fullName.trim(),

        display_name:
          displayName.trim() ||
          null,

        phone:
          normalizedPhone ||
          null,

        avatar_url:
          avatarUrl.trim() ||
          null,
      };

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .update(
            payload
          )
          .eq(
            "id",
            profile.id
          )
          .select()
          .single();

      if (error) {
        throw error;
      }

      setProfile(
        data
      );

      setFullName(
        data.full_name ||
          ""
      );

      setDisplayName(
        data.display_name ||
          ""
      );

      setPhone(
        data.phone ||
          ""
      );

      setAvatarUrl(
        data.avatar_url ||
          ""
      );

      showToast(
        "تم حفظ بيانات الملف الشخصي بنجاح.",
        "success"
      );

    } catch (error) {
      console.error(
        "PROFILE SAVE:",
        error
      );

      showToast(
        error.message ||
          "تعذر حفظ التغييرات.",
        "error"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =====================================================
     Change Password

     1) Re-authenticate with the current password.
     2) Update the password in Supabase Auth.

     We do NOT use profiles.password_plain.
  ===================================================== */

  async function changePassword() {
    if (
      changingPassword
    ) {
      return;
    }

    if (
      !user?.email
    ) {
      showToast(
        "هذا الحساب لا يحتوي على بريد Auth صالح لتغيير كلمة المرور من هذه الصفحة.",
        "error"
      );

      return;
    }

    if (
      !currentPassword
    ) {
      showToast(
        "أدخل كلمة المرور الحالية.",
        "error"
      );

      return;
    }

    if (
      newPassword.length < 8
    ) {
      showToast(
        "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.",
        "error"
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      showToast(
        "تأكيد كلمة المرور الجديدة غير مطابق.",
        "error"
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      showToast(
        "كلمة المرور الجديدة يجب أن تختلف عن الحالية.",
        "error"
      );

      return;
    }

    setChangingPassword(
      true
    );

    try {
      /*
        التحقق من كلمة المرور الحالية.
        هذه الخطوة تجعل التغيير من داخل
        الملف الشخصي أكثر أمانًا من مجرد
        updateUser بدون تحقق.
      */

      const {
        error:
          reauthError,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              user.email,

            password:
              currentPassword,
          });

      if (
        reauthError
      ) {
        showToast(
          "كلمة المرور الحالية غير صحيحة.",
          "error"
        );

        return;
      }

      const {
        error:
          updateError,
      } =
        await supabase.auth
          .updateUser({
            password:
              newPassword,
          });

      if (
        updateError
      ) {
        throw updateError;
      }

      showToast(
        "تم تغيير كلمة المرور بنجاح.",
        "success"
      );

      closePasswordModal();

    } catch (error) {
      console.error(
        "CHANGE PASSWORD:",
        error
      );

      showToast(
        error.message ||
          "تعذر تغيير كلمة المرور.",
        "error"
      );
    } finally {
      setChangingPassword(
        false
      );
    }
  }

  function closePasswordModal() {
    if (
      changingPassword
    ) {
      return;
    }

    setShowPasswordModal(
      false
    );

    setCurrentPassword(
      ""
    );

    setNewPassword(
      ""
    );

    setConfirmPassword(
      ""
    );

    setShowCurrentPassword(
      false
    );

    setShowNewPassword(
      false
    );
  }

  /* =====================================================
     Logout
  ===================================================== */

  async function handleLogout() {
    const confirmed =
      await confirm({
        title:
          "تسجيل الخروج",

        message:
          "هل أنت متأكد من تسجيل الخروج من حسابك؟",

        confirmText:
          "تسجيل الخروج",

        cancelText:
          "البقاء",

        type:
          "danger",
      });

    if (
      !confirmed
    ) {
      return;
    }

    setSigningOut(true);

    try {
      const {
        error,
      } =
        await supabase.auth
          .signOut();

      if (error) {
        throw error;
      }

      navigate(
        "/login",
        {
          replace: true,
        }
      );

    } catch (error) {
      console.error(
        "LOGOUT:",
        error
      );

      showToast(
        "تعذر تسجيل الخروج.",
        "error"
      );

      setSigningOut(
        false
      );
    }
  }

  /* =====================================================
     Loading
  ===================================================== */

  if (loading) {
    return (
      <div
        className="teacher-profile-page"
        dir="rtl"
      >
        <ProfileStyles />

        <div
          className="profile-page-loading"
        >
          <Loader2
            size={29}
            className="profile-spin"
          />

          <strong>
            جارٍ تجهيز ملفك الشخصي...
          </strong>
        </div>
      </div>
    );
  }

  /* =====================================================
     Render
  ===================================================== */

  return (
    <div
      className="teacher-profile-page"
      dir="rtl"
    >
      <ProfileStyles />

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="profile-hero"
      >
        <div
          className="profile-identity"
        >
          <div
            className="profile-avatar-wrap"
          >
            <div
              className="profile-avatar"
            >
              {avatarUrl ? (
                <img
                  src={
                    avatarUrl
                  }
                  alt="الصورة الشخصية"
                  onError={(
                    event
                  ) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <UserRound
                  size={42}
                  strokeWidth={
                    1.5
                  }
                />
              )}
            </div>

            <div
              className="profile-camera"
              title="يتم تغيير الصورة من بيانات الحساب"
            >
              <Camera
                size={14}
              />
            </div>
          </div>

          <div
            className="profile-identity-text"
          >
            <div
              className="profile-eyebrow"
            >
              <Sparkles
                size={13}
              />

              ملف المستخدم
            </div>

            <div
              className="profile-name-row"
            >
              <h1>
                {profile?.display_name ||
                  profile?.full_name ||
                  roleLabel}
              </h1>

              <span
                className={
                  profile?.status ===
                  "active"
                    ? "profile-status active"
                    : "profile-status inactive"
                }
              >
                <CheckCircle2
                  size={13}
                />

                {profile?.status ===
                "active"
                  ? "حساب نشط"
                  : "حساب غير نشط"}
              </span>
            </div>

            <p>
              {roleLabel}
              {" • "}
              رقم المستخدم:
              {" "}
              {profile?.user_number ||
                "—"}
            </p>

            <div
              className="profile-meta"
            >
              <span>
                <Mail
                  size={13}
                />

                {user?.email ||
                  "لا يوجد بريد"}
              </span>

              <span>
                <Phone
                  size={13}
                />

                {profile?.phone ||
                  "لا يوجد جوال"}
              </span>
            </div>
          </div>
        </div>

        <div
          className="profile-hero-actions"
        >
          <button
            type="button"
            className="profile-security-btn"
            onClick={() =>
              setShowPasswordModal(
                true
              )
            }
          >
            <LockKeyhole
              size={16}
            />

            تغيير كلمة المرور
          </button>

          <button
            type="button"
            className="profile-logout-btn"
            onClick={
              handleLogout
            }
            disabled={
              signingOut
            }
          >
            {signingOut ? (
              <Loader2
                size={16}
                className="profile-spin"
              />
            ) : (
              <LogOut
                size={16}
              />
            )}

            تسجيل الخروج
          </button>
        </div>
      </section>

      {/* =================================================
          STATS
      ================================================= */}

      {profile?.role ===
        "teacher" && (
        <section
          className="profile-stats"
        >
          <ProfileStat
            icon={
              BookOpen
            }
            title="حلقاتي"
            value={
              stats.halaqat
            }
            subtitle="الحلقات المرتبطة بك"
            tone="green"
          />

          <ProfileStat
            icon={
              Users
            }
            title="طلابي"
            value={
              stats.students
            }
            subtitle="الطلاب الحاليون"
            tone="teal"
          />

          <ProfileStat
            icon={
              GraduationCap
            }
            title="التسميع"
            value={
              stats.recitations30
            }
            subtitle="خلال آخر 30 يومًا"
            tone="gold"
          />

          <ProfileStat
            icon={
              Activity
            }
            title="نسبة الحضور"
            value={`${stats.attendanceRate30}%`}
            subtitle="آخر 30 يومًا"
            tone="blue"
          />
        </section>
      )}

      {/* =================================================
          MAIN GRID
      ================================================= */}

      <div
        className="profile-main-grid"
      >
        {/* ===============================================
            EDIT CARD
        =============================================== */}

        <section
          className="profile-card profile-edit-card"
        >
          <CardHeading
            icon={
              UserRound
            }
            title="المعلومات الشخصية"
            description="حدّث البيانات التي تظهر داخل نظام الصديق."
          />

          <div
            className="profile-form-grid"
          >
            <ProfileField
              label="الاسم الكامل"
              value={
                fullName
              }
              onChange={
                setFullName
              }
              icon={
                UserRound
              }
              placeholder="الاسم الكامل"
              required
            />

            <ProfileField
              label="الاسم الظاهر"
              value={
                displayName
              }
              onChange={
                setDisplayName
              }
              icon={
                UserRound
              }
              placeholder="الاسم المختصر داخل النظام"
            />

            <ProfileField
              label="رقم الجوال"
              value={
                phone
              }
              onChange={
                setPhone
              }
              icon={
                Phone
              }
              placeholder="05xxxxxxxx"
              inputMode="tel"
            />

            <ProfileField
              label="البريد الإلكتروني"
              value={
                user?.email ||
                ""
              }
              icon={
                Mail
              }
              disabled
              help="البريد مرتبط بحساب Supabase Auth."
            />
          </div>

          <div
            className="profile-avatar-field"
          >
            <ProfileField
              label="رابط الصورة الشخصية"
              value={
                avatarUrl
              }
              onChange={
                setAvatarUrl
              }
              icon={
                Camera
              }
              placeholder="https://..."
              help="يمكننا لاحقًا استبدال الرابط برفع صورة مباشر إلى Supabase Storage."
            />
          </div>

          <div
            className="profile-save-row"
          >
            <div>
              {hasProfileChanges ? (
                <span
                  className="profile-change-hint changed"
                >
                  توجد تغييرات غير محفوظة
                </span>
              ) : (
                <span
                  className="profile-change-hint"
                >
                  جميع التغييرات محفوظة
                </span>
              )}
            </div>

            <button
              type="button"
              className="profile-save-btn"
              onClick={
                saveProfile
              }
              disabled={
                saving ||
                !hasProfileChanges
              }
            >
              {saving ? (
                <Loader2
                  size={16}
                  className="profile-spin"
                />
              ) : (
                <Save
                  size={16}
                />
              )}

              {saving
                ? "جارٍ الحفظ..."
                : "حفظ التغييرات"}
            </button>
          </div>
        </section>

        {/* ===============================================
            ACCOUNT CARD
        =============================================== */}

        <section
          className="profile-card"
        >
          <CardHeading
            icon={
              ShieldCheck
            }
            title="بيانات الحساب"
            description="معلومات النظام والصلاحية المرتبطة بحسابك."
          />

          <div
            className="account-info-list"
          >
            <AccountInfo
              icon={
                ShieldCheck
              }
              title="نوع الحساب"
              value={
                roleLabel
              }
            />

            <AccountInfo
              icon={
                KeyRound
              }
              title="رقم المستخدم"
              value={
                profile?.user_number ||
                "—"
              }
            />

            <AccountInfo
              icon={
                CalendarDays
              }
              title="تاريخ إنشاء الحساب"
              value={
                formatGregorianDate(
                  profile?.created_at
                )
              }
              secondary={
                formatHijriDate(
                  profile?.created_at
                )
              }
            />

            <AccountInfo
              icon={
                CheckCircle2
              }
              title="حالة الحساب"
              value={
                profile?.status ===
                "active"
                  ? "نشط"
                  : profile?.status ===
                    "archived"
                    ? "مؤرشف"
                    : "غير نشط"
              }
            />
          </div>
        </section>
      </div>

      {/* =================================================
          HALAQAT
      ================================================= */}

      {profile?.role ===
        "teacher" && (
        <section
          className="profile-card profile-halaqat-card"
        >
          <CardHeading
            icon={
              BookOpen
            }
            title="حلقاتي"
            description="الحلقات المرتبطة بحسابك حاليًا."
          />

          {teacherHalaqat.length ===
          0 ? (
            <div
              className="profile-empty"
            >
              لا توجد حلقات مرتبطة
              بهذا الحساب حاليًا.
            </div>
          ) : (
            <div
              className="profile-halaqat-grid"
            >
              {teacherHalaqat.map(
                (halaqa) => (
                  <div
                    className="profile-halaqa-item"
                    key={
                      halaqa.id
                    }
                  >
                    <div
                      className="halaqa-icon"
                    >
                      <BookOpen
                        size={18}
                      />
                    </div>

                    <div
                      className="halaqa-content"
                    >
                      <strong>
                        {
                          halaqa.name
                        }
                      </strong>

                      <span>
                        <Building2
                          size={12}
                        />

                        {
                          halaqa.mosque_name
                        }
                      </span>

                      <small>
                        {PERIOD_LABELS[
                          halaqa.halaqa_period
                        ] ||
                          "الفترة غير محددة"}

                        {" • "}

                        {halaqa.teacher_role ===
                        "main"
                          ? "معلم رئيسي"
                          : "معلم مساعد"}
                      </small>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}

      {/* =================================================
          SECURITY
      ================================================= */}

      <section
        className="profile-card profile-security-card"
      >
        <CardHeading
          icon={
            LockKeyhole
          }
          title="الأمان والحساب"
          description="تحكم بكلمة مرور حسابك وتسجيل الخروج."
        />

        <div
          className="security-actions"
        >
          <button
            type="button"
            className="security-action"
            onClick={() =>
              setShowPasswordModal(
                true
              )
            }
          >
            <div
              className="security-action-icon"
            >
              <LockKeyhole
                size={18}
              />
            </div>

            <div>
              <strong>
                تغيير كلمة المرور
              </strong>

              <span>
                تغيير مباشر وآمن بعد التحقق من كلمة المرور الحالية.
              </span>
            </div>
          </button>

          <button
            type="button"
            className="security-action danger"
            onClick={
              handleLogout
            }
            disabled={
              signingOut
            }
          >
            <div
              className="security-action-icon"
            >
              <LogOut
                size={18}
              />
            </div>

            <div>
              <strong>
                تسجيل الخروج
              </strong>

              <span>
                إنهاء جلسة الاستخدام الحالية والعودة لصفحة الدخول.
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* =================================================
          PASSWORD MODAL
      ================================================= */}

      {showPasswordModal && (
        <div
          className="password-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePasswordModal();
            }
          }}
        >
          <div
            className="password-modal"
          >
            <div
              className="password-modal-header"
            >
              <div>
                <div
                  className="password-modal-icon"
                >
                  <LockKeyhole
                    size={20}
                  />
                </div>

                <div>
                  <h2>
                    تغيير كلمة المرور
                  </h2>

                  <p>
                    سيتم التحقق من كلمة المرور الحالية أولًا ثم حفظ الجديدة في Supabase Auth.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closePasswordModal
                }
                disabled={
                  changingPassword
                }
              >
                <X
                  size={17}
                />
              </button>
            </div>

            <div
              className="password-modal-body"
            >
              <PasswordField
                label="كلمة المرور الحالية"
                value={
                  currentPassword
                }
                onChange={
                  setCurrentPassword
                }
                visible={
                  showCurrentPassword
                }
                onToggle={() =>
                  setShowCurrentPassword(
                    (value) =>
                      !value
                  )
                }
                autoComplete="current-password"
              />

              <PasswordField
                label="كلمة المرور الجديدة"
                value={
                  newPassword
                }
                onChange={
                  setNewPassword
                }
                visible={
                  showNewPassword
                }
                onToggle={() =>
                  setShowNewPassword(
                    (value) =>
                      !value
                  )
                }
                autoComplete="new-password"
              />

              <div
                className="password-strength"
              >
                <div
                  className="password-strength-header"
                >
                  <span>
                    قوة كلمة المرور
                  </span>

                  <strong
                    className={
                      passwordStrength.className
                    }
                  >
                    {
                      passwordStrength.label
                    }
                  </strong>
                </div>

                <div
                  className="password-strength-bars"
                >
                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <span
                        key={
                          item
                        }
                        className={
                          item <=
                          passwordStrength.score
                            ? `filled ${passwordStrength.className}`
                            : ""
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <PasswordField
                label="تأكيد كلمة المرور الجديدة"
                value={
                  confirmPassword
                }
                onChange={
                  setConfirmPassword
                }
                visible={
                  showNewPassword
                }
                onToggle={() =>
                  setShowNewPassword(
                    (value) =>
                      !value
                  )
                }
                autoComplete="new-password"
              />

              {confirmPassword &&
                newPassword !==
                  confirmPassword && (
                  <div
                    className="password-warning"
                  >
                    كلمتا المرور غير متطابقتين.
                  </div>
                )}

              <div
                className="password-security-note"
              >
                <ShieldCheck
                  size={15}
                />

                <span>
                  كلمة المرور لا تحفظ في جدول profiles، بل في نظام Supabase Auth فقط.
                </span>
              </div>
            </div>

            <div
              className="password-modal-footer"
            >
              <button
                type="button"
                className="password-cancel"
                onClick={
                  closePasswordModal
                }
                disabled={
                  changingPassword
                }
              >
                إلغاء
              </button>

              <button
                type="button"
                className="password-submit"
                onClick={
                  changePassword
                }
                disabled={
                  changingPassword
                }
              >
                {changingPassword ? (
                  <Loader2
                    size={16}
                    className="profile-spin"
                  />
                ) : (
                  <KeyRound
                    size={16}
                  />
                )}

                {changingPassword
                  ? "جارٍ التغيير..."
                  : "تغيير كلمة المرور"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Profile Stat
========================================================= */

function ProfileStat({
  icon: Icon,
  title,
  value,
  subtitle,
  tone,
}) {
  return (
    <div
      className={
        `profile-stat ${tone}`
      }
    >
      <div
        className="profile-stat-icon"
      >
        <Icon
          size={19}
        />
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>
      </div>
    </div>
  );
}

/* =========================================================
   Card Heading
========================================================= */

function CardHeading({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div
      className="profile-card-heading"
    >
      <div
        className="profile-card-heading-icon"
      >
        <Icon
          size={17}
        />
      </div>

      <div>
        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   Profile Field
========================================================= */

function ProfileField({
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  disabled,
  help,
  required,
  inputMode,
}) {
  return (
    <div
      className="profile-field"
    >
      <label>
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      <div
        className="profile-field-shell"
      >
        {Icon && (
          <Icon
            size={15}
          />
        )}

        <input
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange?.(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
          disabled={
            disabled
          }
          inputMode={
            inputMode
          }
        />
      </div>

      {help && (
        <small>
          {help}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   Account Info
========================================================= */

function AccountInfo({
  icon: Icon,
  title,
  value,
  secondary,
}) {
  return (
    <div
      className="account-info"
    >
      <div
        className="account-info-icon"
      >
        <Icon
          size={17}
        />
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        {secondary && (
          <small>
            {secondary}
          </small>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Password Field
========================================================= */

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}) {
  return (
    <div
      className="password-field"
    >
      <label>
        {label}
      </label>

      <div
        className="password-field-shell"
      >
        <LockKeyhole
          size={16}
        />

        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          autoComplete={
            autoComplete
          }
        />

        <button
          type="button"
          onClick={
            onToggle
          }
          aria-label={
            visible
              ? "إخفاء كلمة المرور"
              : "إظهار كلمة المرور"
          }
        >
          {visible ? (
            <EyeOff
              size={17}
            />
          ) : (
            <Eye
              size={17}
            />
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   CSS
========================================================= */

function ProfileStyles() {
  return (
    <style>
      {`
        .teacher-profile-page {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          color: #0f172a;
        }

        .teacher-profile-page * {
          box-sizing: border-box;
        }

        .teacher-profile-page button,
        .teacher-profile-page input,
        .teacher-profile-page textarea,
        .teacher-profile-page select {
          font-family: inherit;
        }

        /* =============================================
           HERO
        ============================================= */

        .profile-hero {
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 18px;

          padding: 22px 24px;
          margin-bottom: 14px;

          border: 1px solid rgba(15,81,50,.10);
          border-radius: 23px;

          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f4faf6 62%,
              #fffaf0 100%
            );

          box-shadow:
            0 13px 37px
            rgba(15,81,50,.05);
        }

        .profile-hero::before {
          content: "";

          position: absolute;
          left: -145px;
          top: -170px;

          width: 280px;
          height: 280px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(201,162,39,.15),
              transparent 70%
            );

          pointer-events: none;
        }

        .profile-identity {
          position: relative;
          z-index: 2;

          min-width: 0;

          display: flex;
          align-items: center;

          gap: 14px;
        }

        .profile-avatar-wrap {
          position: relative;
          flex: 0 0 auto;
        }

        .profile-avatar {
          width: 86px;
          height: 86px;

          overflow: hidden;

          border: 1px solid #dce8df;
          border-radius: 24px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;

          background:
            linear-gradient(
              145deg,
              #eaf3ed,
              #ffffff
            );

          box-shadow:
            0 10px 26px
            rgba(15,81,50,.08);
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-camera {
          position: absolute;
          left: -4px;
          bottom: -4px;

          width: 30px;
          height: 30px;

          border: 3px solid #fff;
          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #fff;
          background: #0f5132;
        }

        .profile-identity-text {
          min-width: 0;
        }

        .profile-eyebrow {
          display: flex;
          align-items: center;

          gap: 5px;

          margin-bottom: 3px;

          color: #927536;

          font-size: 8px;
          font-weight: 900;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;

          gap: 7px;
        }

        .profile-name-row h1 {
          margin: 0;

          color: #173d2b;

          font-size: 24px;
          font-weight: 950;
        }

        .profile-status {
          min-height: 25px;

          padding: 0 8px;

          border-radius: 999px;

          display: inline-flex;
          align-items: center;

          gap: 4px;

          font-size: 6px;
          font-weight: 900;
        }

        .profile-status.active {
          color: #166534;
          background: #dcfce7;
        }

        .profile-status.inactive {
          color: #9f1239;
          background: #fff1f2;
        }

        .profile-identity-text > p {
          margin: 5px 0 0;

          color: #77827b;

          font-size: 8px;
        }

        .profile-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;

          gap: 9px;

          margin-top: 7px;
        }

        .profile-meta span {
          display: inline-flex;
          align-items: center;

          gap: 4px;

          color: #87928b;

          font-size: 7px;
        }

        .profile-hero-actions {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;
          flex-wrap: wrap;

          gap: 6px;
        }

        .profile-security-btn,
        .profile-logout-btn {
          min-height: 40px;

          padding: 0 11px;

          border-radius: 10px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 5px;

          font-size: 7px;
          font-weight: 900;

          cursor: pointer;
        }

        .profile-security-btn {
          border: none;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #0f5132,
              #0f766e
            );
        }

        .profile-logout-btn {
          border: 1px solid #efd9d6;

          color: #b42318;
          background: #fff9f8;
        }

        /* =============================================
           STATS
        ============================================= */

        .profile-stats {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0,1fr)
            );

          gap: 9px;

          margin-bottom: 14px;
        }

        .profile-stat {
          display: flex;
          align-items: center;

          gap: 8px;

          padding: 12px;

          border: 1px solid #e5ebe7;
          border-radius: 16px;

          background: #fff;

          box-shadow:
            0 6px 20px
            rgba(15,23,42,.025);
        }

        .profile-stat-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-stat.green .profile-stat-icon {
          color: #0f5132;
          background: #edf7f1;
        }

        .profile-stat.teal .profile-stat-icon {
          color: #0f766e;
          background: #edf8f7;
        }

        .profile-stat.gold .profile-stat-icon {
          color: #927536;
          background: #fff8e7;
        }

        .profile-stat.blue .profile-stat-icon {
          color: #1d4ed8;
          background: #eff6ff;
        }

        .profile-stat span {
          display: block;

          color: #7f8a83;

          font-size: 7px;
        }

        .profile-stat strong {
          display: block;

          margin-top: 1px;

          color: #173d2b;

          font-size: 18px;
          font-weight: 950;
        }

        .profile-stat small {
          display: block;

          margin-top: 1px;

          color: #9ba39e;

          font-size: 6px;
        }

        /* =============================================
           MAIN
        ============================================= */

        .profile-main-grid {
          display: grid;

          grid-template-columns:
            minmax(0,1.5fr)
            minmax(280px,.7fr);

          gap: 12px;

          margin-bottom: 12px;
        }

        .profile-card {
          padding: 16px;

          border: 1px solid #e4eae6;
          border-radius: 19px;

          background: #fff;

          box-shadow:
            0 7px 24px
            rgba(15,23,42,.03);
        }

        .profile-card-heading {
          display: flex;
          align-items: center;

          gap: 8px;

          margin-bottom: 14px;
        }

        .profile-card-heading-icon {
          width: 36px;
          height: 36px;

          flex: 0 0 36px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .profile-card-heading h2 {
          margin: 0;

          color: #2f4036;

          font-size: 12px;
          font-weight: 950;
        }

        .profile-card-heading p {
          margin: 2px 0 0;

          color: #919a94;

          font-size: 6px;
        }

        /* =============================================
           FORM
        ============================================= */

        .profile-form-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );

          gap: 9px;
        }

        .profile-avatar-field {
          margin-top: 9px;
        }

        .profile-field label {
          display: block;

          margin-bottom: 4px;

          color: #66736b;

          font-size: 6px;
          font-weight: 850;
        }

        .profile-field label span {
          color: #b42318;
        }

        .profile-field-shell {
          position: relative;
        }

        .profile-field-shell > svg {
          position: absolute;
          right: 10px;
          top: 50%;

          transform: translateY(-50%);

          color: #89938c;
        }

        .profile-field-shell input {
          width: 100%;
          height: 39px;

          padding:
            0 34px 0 9px;

          border: 1px solid #dce4df;
          border-radius: 10px;

          outline: none;

          color: #33443a;
          background: #fbfdfc;

          font-size: 8px;
        }

        .profile-field-shell input:focus {
          border-color: #9fc5ae;

          box-shadow:
            0 0 0 3px
            rgba(15,81,50,.05);
        }

        .profile-field-shell input:disabled {
          color: #859089;
          background: #f1f4f2;
          cursor: not-allowed;
        }

        .profile-field > small {
          display: block;

          margin-top: 3px;

          color: #9aa29d;

          font-size: 5.7px;
          line-height: 1.5;
        }

        .profile-save-row {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          margin-top: 13px;
          padding-top: 12px;

          border-top: 1px solid #edf1ee;
        }

        .profile-change-hint {
          color: #8b958f;
          font-size: 6px;
        }

        .profile-change-hint.changed {
          color: #9a741f;
          font-weight: 850;
        }

        .profile-save-btn {
          min-height: 38px;

          padding: 0 13px;

          border: none;
          border-radius: 9px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 5px;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #0f5132,
              #0f766e
            );

          font-size: 7px;
          font-weight: 900;

          cursor: pointer;
        }

        .profile-save-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        /* =============================================
           ACCOUNT
        ============================================= */

        .account-info-list {
          display: grid;
          gap: 7px;
        }

        .account-info {
          display: flex;
          align-items: center;

          gap: 8px;

          padding: 9px;

          border: 1px solid #e8edea;
          border-radius: 11px;

          background: #fbfdfc;
        }

        .account-info-icon {
          width: 33px;
          height: 33px;

          flex: 0 0 33px;

          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .account-info span {
          display: block;

          color: #8b958f;

          font-size: 5.7px;
        }

        .account-info strong {
          display: block;

          margin-top: 1px;

          color: #3d4b42;

          font-size: 7px;
        }

        .account-info small {
          display: block;

          margin-top: 2px;

          color: #927536;

          font-size: 5.5px;
        }

        /* =============================================
           HALAQAT
        ============================================= */

        .profile-halaqat-card {
          margin-bottom: 12px;
        }

        .profile-halaqat-grid {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                min(100%,250px),
                1fr
              )
            );

          gap: 8px;
        }

        .profile-halaqa-item {
          display: flex;
          align-items: center;

          gap: 8px;

          padding: 10px;

          border: 1px solid #e6ece8;
          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #fbfdfc,
              #fffdf8
            );
        }

        .halaqa-icon {
          width: 37px;
          height: 37px;

          flex: 0 0 37px;

          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .halaqa-content {
          min-width: 0;
        }

        .halaqa-content strong {
          display: block;

          overflow: hidden;

          color: #33443a;

          font-size: 8px;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .halaqa-content span {
          display: flex;
          align-items: center;

          gap: 3px;

          margin-top: 2px;

          color: #818c85;

          font-size: 6px;
        }

        .halaqa-content small {
          display: block;

          margin-top: 2px;

          color: #9a7b30;

          font-size: 5.7px;
        }

        .profile-empty {
          padding: 25px;

          border: 1px dashed #d5ddd8;
          border-radius: 12px;

          text-align: center;

          color: #8a958e;
          background: #fbfdfc;

          font-size: 7px;
        }

        /* =============================================
           SECURITY CARD
        ============================================= */

        .profile-security-card {
          margin-bottom: 20px;
        }

        .security-actions {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );

          gap: 8px;
        }

        .security-action {
          min-height: 67px;

          padding: 10px;

          border: 1px solid #dfe7e2;
          border-radius: 12px;

          display: flex;
          align-items: center;

          gap: 9px;

          text-align: right;

          color: #0f5132;
          background: #fbfdfc;

          cursor: pointer;
        }

        .security-action.danger {
          border-color: #efd9d6;

          color: #b42318;
          background: #fff9f8;
        }

        .security-action-icon {
          width: 37px;
          height: 37px;

          flex: 0 0 37px;

          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: rgba(15,81,50,.06);
        }

        .security-action.danger
        .security-action-icon {
          background: rgba(180,35,24,.06);
        }

        .security-action strong {
          display: block;

          font-size: 8px;
        }

        .security-action span {
          display: block;

          margin-top: 2px;

          color: #89948d;

          font-size: 6px;
          line-height: 1.5;
        }

        /* =============================================
           PASSWORD MODAL
        ============================================= */

        .password-overlay {
          position: fixed;
          inset: 0;

          z-index: 8000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 16px;

          background: rgba(15,23,42,.58);

          backdrop-filter: blur(5px);
        }

        .password-modal {
          width: min(520px,100%);

          overflow: hidden;

          border-radius: 21px;

          background: #fff;

          box-shadow:
            0 30px 90px
            rgba(15,23,42,.28);
        }

        .password-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 10px;

          padding: 15px 16px;

          border-bottom: 1px solid #e8edea;
        }

        .password-modal-header
        > div:first-child {
          display: flex;
          align-items: flex-start;

          gap: 9px;
        }

        .password-modal-icon {
          width: 39px;
          height: 39px;

          flex: 0 0 39px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .password-modal-header h2 {
          margin: 0;

          color: #2f4036;

          font-size: 13px;
        }

        .password-modal-header p {
          margin: 3px 0 0;

          color: #8c9690;

          font-size: 6px;
          line-height: 1.5;
        }

        .password-modal-header
        > button {
          width: 34px;
          height: 34px;

          border: none;
          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #64748b;
          background: #f1f5f3;

          cursor: pointer;
        }

        .password-modal-body {
          padding: 15px;
        }

        .password-field {
          margin-bottom: 10px;
        }

        .password-field label {
          display: block;

          margin-bottom: 4px;

          color: #66736b;

          font-size: 6px;
          font-weight: 850;
        }

        .password-field-shell {
          position: relative;
        }

        .password-field-shell
        > svg {
          position: absolute;
          right: 10px;
          top: 50%;

          transform: translateY(-50%);

          color: #87928b;
        }

        .password-field-shell input {
          width: 100%;
          height: 40px;

          padding:
            0 35px 0 40px;

          border: 1px solid #dce4df;
          border-radius: 10px;

          outline: none;

          color: #33443a;
          background: #fbfdfc;

          font-size: 8px;
        }

        .password-field-shell button {
          position: absolute;
          left: 5px;
          top: 50%;

          width: 30px;
          height: 30px;

          transform: translateY(-50%);

          border: none;
          border-radius: 8px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #7b8780;
          background: transparent;

          cursor: pointer;
        }

        .password-strength {
          margin: -2px 0 10px;
        }

        .password-strength-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 5px;

          font-size: 5.7px;
        }

        .password-strength-header
        span {
          color: #8b958f;
        }

        .password-strength-header
        strong.weak {
          color: #b42318;
        }

        .password-strength-header
        strong.good {
          color: #a06e12;
        }

        .password-strength-header
        strong.strong {
          color: #166534;
        }

        .password-strength-bars {
          display: grid;

          grid-template-columns:
            repeat(5,1fr);

          gap: 4px;
        }

        .password-strength-bars span {
          height: 4px;

          border-radius: 999px;

          background: #e8edea;
        }

        .password-strength-bars
        span.filled.weak {
          background: #dc665d;
        }

        .password-strength-bars
        span.filled.good {
          background: #d5ad52;
        }

        .password-strength-bars
        span.filled.strong {
          background: #16a36d;
        }

        .password-warning {
          margin-top: -2px;
          margin-bottom: 9px;

          color: #b42318;

          font-size: 6px;
        }

        .password-security-note {
          display: flex;
          align-items: flex-start;

          gap: 5px;

          padding: 8px;

          border: 1px solid #dcebe3;
          border-radius: 9px;

          color: #37624c;
          background: #f4faf6;

          font-size: 6px;
          line-height: 1.5;
        }

        .password-modal-footer {
          display: flex;
          justify-content: flex-end;

          gap: 6px;

          padding: 11px 15px;

          border-top: 1px solid #e8edea;

          background: #fbfdfc;
        }

        .password-modal-footer
        button {
          min-height: 37px;

          padding: 0 12px;

          border-radius: 9px;

          font-size: 7px;
          font-weight: 900;

          cursor: pointer;
        }

        .password-cancel {
          border: 1px solid #dce3df;

          color: #657169;
          background: #fff;
        }

        .password-submit {
          border: none;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 5px;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #0f5132,
              #0f766e
            );
        }

        .password-modal-footer
        button:disabled {
          opacity: .5;
          cursor: wait;
        }

        /* =============================================
           LOADING
        ============================================= */

        .profile-page-loading {
          min-height: 60vh;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: 8px;

          color: #718077;

          font-size: 8px;
        }

        @keyframes profileSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .profile-spin {
          animation:
            profileSpin
            .8s linear infinite;
        }

        /* =============================================
           TABLET
        ============================================= */

        @media (
          max-width: 1000px
        ) {
          .profile-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );
          }

          .profile-main-grid {
            grid-template-columns:
              1fr;
          }
        }

        /* =============================================
           MOBILE
        ============================================= */

        @media (
          max-width: 680px
        ) {
          .profile-hero {
            align-items: flex-start;

            padding: 15px;
          }

          .profile-avatar {
            width: 67px;
            height: 67px;

            border-radius: 19px;
          }

          .profile-camera {
            width: 26px;
            height: 26px;
          }

          .profile-name-row h1 {
            font-size: 18px;
          }

          .profile-meta {
            align-items: flex-start;
            flex-direction: column;

            gap: 4px;
          }

          .profile-hero-actions {
            gap: 4px;
          }

          .profile-security-btn,
          .profile-logout-btn {
            width: 38px;
            min-height: 38px;

            padding: 0;

            font-size: 0;
          }

          .profile-form-grid {
            grid-template-columns:
              1fr;
          }

          .security-actions {
            grid-template-columns:
              1fr;
          }

          .profile-save-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .profile-save-btn {
            width: 100%;
          }

          .password-overlay {
            align-items: flex-end;

            padding: 7px;
          }

          .password-modal {
            border-radius:
              20px 20px
              8px 8px;
          }
        }

        @media (
          max-width: 430px
        ) {
          .profile-stats {
            grid-template-columns:
              1fr 1fr;
          }

          .profile-stat strong {
            font-size: 15px;
          }

          .profile-identity {
            align-items: flex-start;
          }
        }
      `}
    </style>
  );
}
