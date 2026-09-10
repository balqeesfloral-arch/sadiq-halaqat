export default function SystemAdminComingSoon() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8FAFC",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          width: "100%",
          background: "#fff",
          borderRadius: "24px",
          padding: "48px",
          textAlign: "center",
          boxShadow:
            "0 20px 40px rgba(0,0,0,.08)",
        }}
      >
        <div
          style={{
            fontSize: "72px",
            marginBottom: "20px",
          }}
        >
          🚧
        </div>

        <h1
          style={{
            color: "#14532D",
            fontSize: "36px",
            marginBottom: "12px",
          }}
        >
          لوحة مدير النظام
        </h1>

        <p
          style={{
            color: "#64748B",
            fontSize: "18px",
            marginBottom: "30px",
          }}
        >
          هذه الصفحة قيد التطوير حالياً
        </p>

        <div
          style={{
            textAlign: "right",
            background: "#F8FAFC",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              marginBottom: "16px",
              color: "#14532D",
            }}
          >
            قريباً:
          </h3>

          <ul
            style={{
              lineHeight: "2",
              color: "#334155",
            }}
          >
            <li>إدارة المساجد</li>
            <li>إدارة مشرفي المساجد</li>
            <li>التقارير العامة</li>
            <li>إحصائيات النظام</li>
            <li>إعدادات النظام</li>
          </ul>
        </div>
      </div>
    </div>
  );
}