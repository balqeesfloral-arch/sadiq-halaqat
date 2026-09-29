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
        src="/ornaments/sadiq/gold/07-rukn-tr.svg"
        alt=""
        style={{
          position: "absolute",
          right: 0,
          transform: "scaleY(-1)",
          bottom: 0,
          width: "70px",
          opacity: 0.22,
        }}
      />

      <img
        src="/ornaments/sadiq/gold/07-rukn-tr.svg"
        alt=""
        style={{
          position: "absolute",
          left: 0,
          transform: "scale(-1)",
          bottom: 0,
          width: "70px",
          opacity: 0.22,
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