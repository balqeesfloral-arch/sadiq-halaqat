export default function StudentDashboard() {
  return (
    <div style={{ minHeight: "100vh", direction: "rtl", padding: "calc(30px * var(--app-density,1))" }}>
      <h1>لوحة الطالب</h1>
      <div style={{ marginTop: "20px", background: "#fff", padding: "calc(20px * var(--app-density,1))", borderRadius: "calc(12px * var(--app-radius-scale,1))" }}>
        قريباً سيتم عرض بيانات الطالب.
      </div>
    </div>
  );
}
