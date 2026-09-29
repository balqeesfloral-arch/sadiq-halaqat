export default function PrintHeader() {
  return (
    <div
      style={{
        position: "relative",
        marginBottom: "30px",
        paddingBottom: "25px",
        borderBottom: "3px solid #D6C28A",
      }}
    >

      <img
        src="/ornaments/sadiq/gold/07-rukn-tr.svg"
        alt=""
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "90px",
          opacity: 0.28,
        }}
      />

      <img
        src="/ornaments/sadiq/gold/07-rukn-tr.svg"
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: "scaleX(-1)",
          width: "90px",
          opacity: 0.28,
        }}
      />

      <div
        style={{
          textAlign: "center",
        }}
      >

        <img
          src="/logo.png"
          alt="الصديق"
          style={{
            width: "120px",
            marginBottom: "10px",
          }}
        />

        <div
          style={{
            fontSize: "38px",
            fontWeight: "900",
            color: "#0F5132",
          }}
        >
          الصديق
        </div>

        <div
          style={{
            color: "#64748B",
            marginTop: "6px",
          }}
        >
          نظام إدارة الحلقات القرآنية
        </div>

      </div>

    </div>
  );
}