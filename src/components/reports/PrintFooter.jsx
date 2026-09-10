export default function PrintFooter() {
  return (
    <div
      style={{
        marginTop: "40px",
        paddingTop: "20px",
        borderTop: "2px solid #D6C28A",
        textAlign: "center",
        position: "relative",
      }}
    >

      <img
        src="/patterns/Z-5.png"
        alt=""
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: "70px",
          opacity: 0.12,
        }}
      />

      <img
        src="/patterns/Z-1.png"
        alt=""
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "70px",
          opacity: 0.12,
        }}
      />

      <div
        style={{
          color: "#64748B",
        }}
      >
        تم إنشاء التقرير بواسطة
        نظام الصديق لإدارة الحلقات القرآنية
      </div>

    </div>
  );
}