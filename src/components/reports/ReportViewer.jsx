import {
  FileText,
  BarChart3,
} from "lucide-react";
import {
  Building2,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";

import { theme } from "../../styles/theme";

export default function ReportViewer({
  selectedReport,
  reportData,
  isPrint = false,
}) {
  if (!selectedReport) {
    return (
      <div
        style={{
          background:
            theme.colors.surface ||
            theme.colors.card,

          borderRadius:
            theme.radius.lg,

          border: `1px solid ${theme.colors.border}`,

          boxShadow:
            theme.shadows.card,

          minHeight: "420px",

          display: "flex",
          flexDirection: "column",

          alignItems: "center",
          justifyContent: "center",

          gap: "18px",
        }}
      >
        <div
          style={{
            width: "90px",
            height: "90px",

            borderRadius: "24px",

            background: "#eef7f1",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BarChart3
            size={42}
            color={
              theme.colors.primary
            }
          />
        </div>

        <h3
          style={{
            margin: 0,

            color:
              theme.colors.text,
          }}
        >
          اختر نوع التقرير
        </h3>

        <p
          style={{
            margin: 0,

            color:
              theme.colors.textSecondary,

            textAlign: "center",

            maxWidth: "400px",

            lineHeight: 1.8,
          }}
        >
          اختر أحد التقارير من الأعلى
          ثم اضغط على زر عرض التقرير
          لعرض النتائج والإحصائيات.
        </p>
      </div>
    );
  }

const reportRows =
  Array.isArray(reportData)
    ? reportData
    : [];

const totalRecords =
  reportRows.length;

const presentCount =
  reportRows.filter(
    x => x.status === "present"
  ).length;

const absentCount =
  reportRows.filter(
    x => x.status === "absent"
  ).length;

const lateCount =
  reportRows.filter(
    x => x.status === "late"
  ).length;

const excusedCount =
  reportRows.filter(
    x => x.status === "excused"
  ).length;

  return (
    <div
      style={{
        background:
          theme.colors.surface ||
          theme.colors.card,

        borderRadius:
          theme.radius.lg,

        border: `1px solid ${theme.colors.border}`,

        boxShadow:
          theme.shadows.card,

        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "22px 24px",

          borderBottom: `1px solid ${theme.colors.border}`,

          display: "flex",
          alignItems: "center",

          gap: "14px",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",

            borderRadius: "14px",

            background: "#eef7f1",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileText
            size={24}
            color={
              theme.colors.primary
            }
          />
        </div>

        <div>
          <div
            style={{
              fontWeight: "800",

              fontSize: "18px",

              color:
                theme.colors.text,
            }}
          >
            معاينة التقرير
          </div>

          <div
            style={{
              color:
                theme.colors.textSecondary,

              fontSize: "13px",
            }}
          >
            التقرير المحدد حالياً
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "30px",

          minHeight: "350px",
        }}
      >
        <div
          style={{
            padding: "18px",

            borderRadius: "16px",

            background: "#f8faf8",

            border:
              "1px dashed #cfd8d3",
          }}
        >
          <strong>
            التقرير المحدد:
          </strong>

          <div
            style={{
              marginTop: "10px",

              fontSize: "18px",

              color:
                theme.colors.primary,

              fontWeight: "700",
            }}
          >
            {selectedReport}
          </div>
        </div>

{selectedReport === "full" && (

<>
  <div
    style={{
      marginTop: "25px",
      borderRadius: "28px",
      overflow: "hidden",
      background:
        "linear-gradient(135deg,#0F5132 0%,#1A6B47 100%)",
      color: "#fff",
      position: "relative",
    }}
  >
    <div
      style={{
        padding: "35px",
      }}
    >
      <div
        style={{
          fontSize: "30px",
          fontWeight: "900",
        }}
      >
        التقرير الشامل
      </div>

      <div
        style={{
          marginTop: "10px",
          opacity: .85,
          fontSize: "15px",
        }}
      >
        لوحة المؤشرات الرئيسية لمنظومة الصديق
      </div>
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(240px,1fr))",
      gap: "20px",
      marginTop: "25px",
    }}
  >
    <DashboardCard
      icon={<Building2 size={24} />}
      title="المساجد"
      value={reportData?.mosques || 0}
    />

    <DashboardCard
      icon={<BookOpen size={24} />}
      title="الحلقات"
      value={reportData?.halaqat || 0}
    />

    <DashboardCard
      icon={<GraduationCap size={24} />}
      title="الطلاب"
      value={reportData?.students || 0}
    />

    <DashboardCard
      icon={<Users size={24} />}
      title="المعلمين"
      value={reportData?.teachers || 0}
    />
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(320px,1fr))",
      gap: "20px",
      marginTop: "25px",
    }}
  >

    <div
      style={{
        background: "#fff",
        borderRadius: "24px",
        padding: "28px",
        border:
          "1px solid #E6ECE8",
        boxShadow:
          "0 10px 25px rgba(0,0,0,.04)",
      }}
    >
      <div
        style={{
          fontSize: "18px",
          fontWeight: "800",
          marginBottom: "20px",
          color: "#0F5132",
        }}
      >
        النشاط العام
      </div>

      <ReportRow
        label="إجمالي التسميعات"
        value={
          reportData?.recitations || 0
        }
      />

      <ReportRow
        label="سجلات الحضور"
        value={
          reportData?.attendance || 0
        }
      />
    </div>

    <div
      style={{
        background: "#fff",
        borderRadius: "24px",
        padding: "28px",
        border:
          "1px solid #E6ECE8",
        boxShadow:
          "0 10px 25px rgba(0,0,0,.04)",
      }}
    >
      <div
        style={{
          fontSize: "18px",
          fontWeight: "800",
          marginBottom: "20px",
          color: "#0F5132",
        }}
      >
        مؤشرات الأداء
      </div>

      <ReportRow
        label="أفضل حلقة"
        value="—"
      />

      <ReportRow
        label="أكثر معلم نشاطاً"
        value="—"
      />

      <ReportRow
        label="أعلى طالب نقاطاً"
        value="—"
      />
    </div>

  </div>

  <div
    style={{
      marginTop: "25px",
      background: "#fff",
      borderRadius: "24px",
      padding: "30px",
      border:
        "1px solid #E6ECE8",
      boxShadow:
        "0 10px 25px rgba(0,0,0,.04)",
    }}
  >
    <div
      style={{
        fontSize: "18px",
        fontWeight: "800",
        color: "#0F5132",
        marginBottom: "16px",
      }}
    >
      الملخص التنفيذي
    </div>

    <div
      style={{
        lineHeight: "2.2",
        color: "#475569",
      }}
    >
      يضم النظام حالياً
      <strong>
        {" "}
        {reportData?.students || 0}
        {" "}
      </strong>
      طالباً موزعين على
      <strong>
        {" "}
        {reportData?.halaqat || 0}
        {" "}
      </strong>
      حلقات يشرف عليها
      <strong>
        {" "}
        {reportData?.teachers || 0}
        {" "}
      </strong>
      معلماً داخل
      <strong>
        {" "}
        {reportData?.mosques || 0}
        {" "}
      </strong>
      مساجد.

      <br />

      تم تسجيل
      <strong>
        {" "}
        {reportData?.recitations || 0}
        {" "}
      </strong>
      عملية تسميع و
      <strong>
        {" "}
        {reportData?.attendance || 0}
        {" "}
      </strong>
      سجل حضور داخل المنظومة.
    </div>
  </div>

</>

)}


{selectedReport === "attendance" && (

<div
  style={{
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(160px,1fr))",
    gap:"15px",
    marginTop:"25px",
    marginBottom:"25px",
  }}
>

  <StatCard
    title="إجمالي السجلات"
    value={totalRecords}
  />

  <StatCard
    title="حاضر"
    value={presentCount}
  />

  <StatCard
    title="غائب"
    value={absentCount}
  />

  <StatCard
    title="متأخر"
    value={lateCount}
  />

  <StatCard
    title="بعذر"
    value={excusedCount}
  />

</div>

)}

{selectedReport === "attendance" &&
 reportData?.length > 0 && (

<>
  <div
    style={{
      marginTop:"25px",
      borderRadius:"24px",
      overflow:"hidden",
      background:"#fff",
      border:"1px solid #E7ECE9",
      boxShadow:
        "0 12px 30px rgba(0,0,0,.05)",
    }}
  >

    <div
      style={{
        padding:"24px",
        background:
          "linear-gradient(135deg,#0F5132,#1B6B46)",
        color:"#fff",
      }}
    >
      <div
        style={{
          fontSize:"24px",
          fontWeight:"800",
        }}
      >
        سجل الحضور
      </div>

      <div
        style={{
          opacity:.85,
          marginTop:"6px",
        }}
      >
        جميع سجلات حضور الطلاب
      </div>
    </div>

    <div
      style={{
        overflowX:"auto",
      }}
    >

      <table
        style={{
          width:"100%",
          borderCollapse:"collapse",
          minWidth:"900px",
        }}
      >

        <thead>

          <tr
            style={{
              background:"#F8FAF8",
            }}
          >

            <th style={thStyle}>
              الطالب
            </th>

            <th style={thStyle}>
              الحلقة
            </th>

            <th style={thStyle}>
              التاريخ
            </th>

            <th style={thStyle}>
              حالة الحضور
            </th>

          </tr>

        </thead>

        <tbody>

          {reportData.map((row)=>(

            <tr
              key={row.id}
              style={{
                borderBottom:
                  "1px solid #EEF2F7",
              }}
            >

              <td style={tdStyle}>
                <strong>
                  {row.profiles?.full_name}
                </strong>
              </td>

              <td style={tdStyle}>
                {row.halaqat?.name}
              </td>

              <td style={tdStyle}>
                {row.attendance_date}
              </td>

              <td style={tdStyle}>

                <AttendanceBadge
                  status={row.status}
                />

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  </div>
</>

)}
{selectedReport === "recitations" &&
 reportData?.length > 0 && (

<>
  {/* الإحصائيات */}

  <div
    style={{
      display:"grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(220px,1fr))",
      gap:"18px",
      marginTop:"25px",
      marginBottom:"25px",
    }}
  >

    <StatCard
      title="إجمالي التسميعات"
      value={reportData.length}
    />

    <StatCard
      title="إجمالي النقاط"
      value={
        reportData.reduce(
          (sum,row)=>
            sum + (row.points || 0),
          0
        )
      }
    />

    <StatCard
      title="متوسط النقاط"
      value={
        Math.round(
          reportData.reduce(
            (sum,row)=>
              sum + (row.points || 0),
            0
          ) / reportData.length
        ) || 0
      }
    />

    <StatCard
      title="أعلى نقاط"
      value={
        Math.max(
          ...reportData.map(
            x => x.points || 0
          )
        )
      }
    />

  </div>

  <div
    style={{
      marginTop:"10px",
      borderRadius:"24px",
      overflow:"hidden",
      border:"1px solid #E7ECE9",
      background:"#fff",
      boxShadow:
        "0 12px 30px rgba(0,0,0,.05)",
    }}
  >

    {/* العنوان */}

    <div
      style={{
        padding:"24px",
        background:
          "linear-gradient(135deg,#0F5132,#1B6B46)",
        color:"#fff",
      }}
    >
      <div
        style={{
          fontSize:"24px",
          fontWeight:"800",
        }}
      >
        سجل التسميعات
      </div>

      <div
        style={{
          opacity:.85,
          marginTop:"6px",
        }}
      >
        جميع التسميعات المسجلة بالنظام
      </div>
    </div>

    <div
      style={{
        overflowX:"auto",
      }}
    >

      <table
        style={{
          width:"100%",
          minWidth:"1300px",
          borderCollapse:"collapse",
        }}
      >

        <thead>

          <tr
            style={{
              background:"#F8FAF8",
            }}
          >
            <th style={thStyle}>
              الطالب
            </th>

            <th style={thStyle}>
              الحلقة
            </th>

            <th style={thStyle}>
              التاريخ
            </th>

            <th style={thStyle}>
              الدرس
            </th>

            <th style={thStyle}>
              تقييم الدرس
            </th>

            <th style={thStyle}>
              جنب الدرس الاول
            </th>

<th style={thStyle}>
             تقييم جنب الدرس الاول
            </th>

<th style={thStyle}>
              جنب الدرس الثاني
            </th>

<th style={thStyle}>
             تقييم جنب الدرس الثاني
            </th>

            <th style={thStyle}>
              المراجعة
            </th>

            <th style={thStyle}>
              تقييم المراجعة
            </th>

            <th style={thStyle}>
              النقاط
            </th>

          </tr>

        </thead>

        <tbody>

          {reportData.map((row)=>(

            <tr
              key={row.id}
              style={{
                borderBottom:
                  "1px solid #EEF2F7",
              }}
            >

              <td style={tdStyle}>
                <strong>
                  {row.profiles?.full_name}
                </strong>
              </td>

              <td style={tdStyle}>
                {row.halaqat?.name}
              </td>

              <td style={tdStyle}>
                {row.recitation_date}
              </td>

              <td style={tdStyle}>
                <div>
                  {row.from_surah}
                </div>

                <small
                  style={{
                    color:"#64748B",
                  }}
                >
                  {row.from_ayah}
                  {" - "}
                  {row.to_ayah}
                </small>
              </td>

            <td style={tdStyle}>
  <EvaluationBadge
    value={row.lesson_evaluation}
  />
</td>

{/* جنب الدرس الأول */}

<td style={tdStyle}>
  <div>
    {row.next_surah || "-"}
  </div>

  <small
    style={{
      color:"#64748B",
    }}
  >
    {row.next_from_ayah || "-"}
    {" - "}
    {row.next_to_ayah || "-"}
  </small>
</td>

<td style={tdStyle}>
  <EvaluationBadge
    value={row.next_evaluation}
  />
</td>

{/* جنب الدرس الثاني */}

<td style={tdStyle}>
  <div>
    {row.next2_surah || "-"}
  </div>

  <small
    style={{
      color:"#64748B",
    }}
  >
    {row.next2_from_ayah || "-"}
    {" - "}
    {row.next2_to_ayah || "-"}
  </small>
</td>

<td style={tdStyle}>
  <EvaluationBadge
    value={row.next2_evaluation}
  />
</td>

{/* المراجعة */}

<td style={tdStyle}>
  <div>
    {row.review_surah || "-"}
  </div>

  <small
    style={{
      color:"#64748B",
    }}
  >
    {row.review_from_ayah || "-"}
    {" - "}
    {row.review_to_ayah || "-"}
  </small>
</td>

<td style={tdStyle}>
  <EvaluationBadge
    value={row.review_evaluation}
  />
</td>

              <td style={tdStyle}>
                <div
                  style={{
                    background:"#EEF7F1",
                    color:"#0F5132",
                    fontWeight:"800",
                    padding:"8px 14px",
                    borderRadius:"999px",
                    display:"inline-block",
                  }}
                >
                  {row.points || 0}
                </div>
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  </div>
</>

)}
{selectedReport === "students" &&
 reportData?.length > 0 && (

<div
  style={{
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(340px,1fr))",
    gap:"22px",
    marginTop:"25px",
  }}
>

  {reportData.map((row)=>(

    <div
      key={row.id}
      style={{
        background:"#fff",
        borderRadius:"24px",
        overflow:"hidden",
        border:"1px solid #E7ECE9",
        boxShadow:
          "0 10px 25px rgba(0,0,0,.05)",
        transition:"0.3s",
      }}
    >

      <div
        style={{
          padding:"24px",
          background:
            "linear-gradient(135deg,#0F5132,#1B6B46)",
          color:"#fff",
        }}
      >
        <div
          style={{
            fontSize:"22px",
            fontWeight:"800",
          }}
        >
          {row.full_name}
        </div>

        <div
          style={{
            marginTop:"6px",
            opacity:.85,
            fontSize:"14px",
          }}
        >
          طالب قرآن
        </div>
      </div>

      <div
        style={{
          padding:"22px",
        }}
      >

        <ReportRow
          label="رقم الطالب"
          value={row.id}
        />

        <ReportRow
          label="الدور"
          value="طالب"
        />

        <ReportRow
          label="الحالة"
          value="نشط"
        />

      </div>

    </div>

  ))}

</div>

)}

{selectedReport === "teachers" &&
 reportData?.length > 0 && (

<div
  style={{
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(360px,1fr))",
    gap:"22px",
    marginTop:"25px",
  }}
>

  {reportData.map((row)=>(

    <div
      key={row.id}
      style={{
        background:"#fff",
        borderRadius:"24px",
        overflow:"hidden",
        border:"1px solid #E6ECE8",
        boxShadow:
          "0 10px 25px rgba(0,0,0,.05)",
      }}
    >

      <div
        style={{
          padding:"24px",
          background:
            "linear-gradient(135deg,#0F5132,#1A6B47)",
          color:"#fff",
        }}
      >
        <div
          style={{
            fontSize:"22px",
            fontWeight:"800",
          }}
        >
          {row.full_name}
        </div>

        <div
          style={{
            opacity:.8,
            marginTop:"6px",
          }}
        >
          معلم حلقات
        </div>
      </div>

      <div
        style={{
          padding:"22px",
        }}
      >

        <ReportRow
          label="رقم المعلم"
          value={row.id}
        />

        <ReportRow
          label="الدور"
          value={row.role}
        />

        <ReportRow
          label="تاريخ الإنشاء"
          value={
            row.created_at
              ?.split("T")[0]
          }
        />

      </div>

    </div>

  ))}

</div>

)}

{selectedReport === "halaqat" &&
 reportData?.length > 0 && (

<div
  style={{
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(380px,1fr))",
    gap:"22px",
    marginTop:"25px",
  }}
>

  {reportData.map((row)=>(

    <div
      key={row.id}
      style={{
        background:"#fff",
        borderRadius:"24px",
        border:"1px solid #E6ECE8",
        boxShadow:
          "0 10px 25px rgba(0,0,0,.04)",
        overflow:"hidden",
      }}
    >

      <div
        style={{
          padding:"24px",
          background:
            "linear-gradient(135deg,#0F5132,#1A6B47)",
          color:"#fff",
        }}
      >
        <div
          style={{
            fontSize:"22px",
            fontWeight:"800",
          }}
        >
          {row.name}
        </div>

        <div
          style={{
            marginTop:"6px",
            opacity:.85,
          }}
        >
          الحلقة رقم #{row.id}
        </div>
      </div>

      <div
        style={{
          padding:"24px",
        }}
      >

        <ReportRow
          label="المسجد"
          value={
            row.mosques?.name || "-"
          }
        />

        <ReportRow
          label="المعلم الأساسي"
          value={
            row.main_teacher
              ?.full_name || "-"
          }
        />

        <ReportRow
          label="المعلم المساعد"
          value={
            row.assistant_teacher
              ?.full_name || "-"
          }
        />

        <ReportRow
          label="السعة"
          value={
            row.capacity || "-"
          }
        />

        <ReportRow
          label="الحالة"
          value={
            row.status || "-"
          }
        />

        <div
          style={{
            marginTop:"18px",
            padding:"14px",
            borderRadius:"14px",
            background:"#F8FAF8",
          }}
        >
          <div
            style={{
              fontWeight:"700",
              marginBottom:"8px",
            }}
          >
            الوصف
          </div>

          <div
            style={{
              color:"#64748B",
              lineHeight:"1.9",
            }}
          >
            {row.description || "-"}
          </div>
        </div>

      </div>

    </div>

  ))}

</div>

)}
{selectedReport === "monthly-progress" &&
 reportData?.length > 0 && (

<div
  style={{
    marginTop:"25px",
    background:"#fff",
    borderRadius:"22px",
    overflow:"hidden",
    border:"1px solid #E6ECE8",
    boxShadow:"0 10px 25px rgba(0,0,0,.04)",
  }}
>

  <div
    style={{
      padding:"20px 24px",
      borderBottom:"1px solid #EEF2F7",
      fontSize:"18px",
      fontWeight:"800",
      color:"#0F5132",
    }}
  >
    تقرير الإنجاز الشهري
  </div>

  <table
    style={{
      width:"100%",
      borderCollapse:"collapse",
    }}
  >
    <thead>
      <tr
        style={{
          background:"#F7FAF8",
        }}
      >
        <th style={thStyle}>الطالب</th>
        <th style={thStyle}>الحلقة</th>
        <th style={thStyle}>الشهر</th>
        <th style={thStyle}>صفحات الحفظ</th>
<th style={thStyle}>إنجاز الحفظ</th>
        <th style={thStyle}>صفحات المراجعة</th>
<th style={thStyle}>إنجاز المراجعة</th>

        <th style={thStyle}>الاعتماد</th>
      </tr>
    </thead>

    <tbody>

      {reportData.map((row) => (

        <tr
          key={row.id}
          style={{
            borderBottom:
              "1px solid #F1F5F9",
          }}
        >

       <td>
  {row.profiles?.full_name}
</td>

<td>
  {row.halaqat?.name}
</td>

          <td style={tdStyle}>
            {row.progress_month}
          </td>

          <td style={tdStyle}>
            {row.memorization_pages}
          </td>

          <td style={tdStyle}>
            {row.revision_pages}
          </td>
<td>
  <span
    style={{
      padding:"6px 12px",
      borderRadius:"999px",
      fontWeight:"700",
      background:
        row.memorization_completed
          ? "#DCFCE7"
          : "#FEE2E2",
      color:
        row.memorization_completed
          ? "#166534"
          : "#991B1B",
    }}
  >
    {
      row.memorization_completed
        ? "منجز"
        : "لم ينجز"
    }
  </span>
</td>

<td>
  <span
    style={{
      padding:"6px 12px",
      borderRadius:"999px",
      fontWeight:"700",
      background:
        row.revision_completed
          ? "#DCFCE7"
          : "#FEE2E2",
      color:
        row.revision_completed
          ? "#166534"
          : "#991B1B",
    }}
  >
    {
      row.revision_completed
        ? "منجز"
        : "لم ينجز"
    }
  </span>
</td>
          <td style={tdStyle}>

            <span
              style={{
                padding:
                  "6px 12px",

                borderRadius:
                  "999px",

                fontSize:"12px",

                fontWeight:"700",

                background:
                  row.approved
                  ? "#DCFCE7"
                  : "#FEE2E2",

                color:
                  row.approved
                  ? "#166534"
                  : "#991B1B",
              }}
            >
              {row.approved
                ? "معتمد"
                : "غير معتمد"}
            </span>

          </td>

        </tr>

      ))}

    </tbody>

  </table>

</div>

)}
      </div>
    </div>
  );
}
function StatCard({
  title,
  value,
}) {
  return (
    <div
      style={{
        padding: "20px",

        borderRadius: "16px",

        background: "#ffffff",

        border:
          "1px solid #e5e7eb",

        textAlign: "center",

        boxShadow:
          "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: "30px",

          fontWeight: "800",

          color: "#0f5132",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "8px",

          fontSize: "13px",

          color: "#64748b",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon,
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "24px",
        padding: "26px",
        border:
          "1px solid #E6ECE8",
        boxShadow:
          "0 10px 25px rgba(0,0,0,.04)",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "16px",
          background: "#F4F8F5",
          color: "#0F5132",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: "18px",
          fontSize: "38px",
          fontWeight: "900",
          color: "#0F5132",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "8px",
          color: "#64748B",
          fontSize: "14px",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function ReportRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        padding: "12px 0",
        borderBottom:
          "1px solid #EDF2F7",
      }}
    >
      <span>{label}</span>

      <strong
        style={{
          color: "#0F5132",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const thStyle = {
  padding:"16px",
  textAlign:"right",
  fontWeight:"800",
  color:"#0F172A",
  borderBottom:"1px solid #E5E7EB",
  whiteSpace:"nowrap",
};

const tdStyle = {
  padding:"16px",
  textAlign:"right",
  verticalAlign:"top",
};
function EvaluationBadge({ value }) {

  let bg = "#F1F5F9";
  let color = "#334155";

  if (value === "ممتاز") {
    bg = "#DCFCE7";
    color = "#166534";
  }

  if (value === "جيد جداً") {
    bg = "#DBEAFE";
    color = "#1D4ED8";
  }

  if (value === "جيد") {
    bg = "#FEF3C7";
    color = "#B45309";
  }

  if (value === "ضعيف") {
    bg = "#FEE2E2";
    color = "#B91C1C";
  }

  return (
    <span
      style={{
        background:bg,
        color:color,
        padding:"6px 12px",
        borderRadius:"999px",
        fontWeight:"700",
        fontSize:"13px",
      }}
    >
      {value || "-"}
    </span>
  );
}
function AttendanceBadge({
  status
}) {

  let bg = "#F1F5F9";
  let color = "#475569";
  let text = status;

  if(status === "present"){
    bg = "#DCFCE7";
    color = "#166534";
    text = "حاضر";
  }

  if(status === "absent"){
    bg = "#FEE2E2";
    color = "#B91C1C";
    text = "غائب";
  }

  if(status === "late"){
    bg = "#FEF3C7";
    color = "#B45309";
    text = "متأخر";
  }

  if(status === "excused"){
    bg = "#DBEAFE";
    color = "#1D4ED8";
    text = "بعذر";
  }

  return (
    <span
      style={{
        background:bg,
        color:color,
        padding:"8px 14px",
        borderRadius:"999px",
        fontWeight:"700",
        fontSize:"13px",
      }}
    >
      {text}
    </span>
  );
}