import AppSelect from "../AppSelect";
import { CalendarDays, Search } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function formatHijri(dateString) {
  try {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(date);
  } catch {
    return "-";
  }
}

function formatGregorian(dateString) {
  try {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat(
      "ar-SA",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(date);
  } catch {
    return "-";
  }
}

export default function RewardsFilters({
  selectedDate,
  setSelectedDate,

  selectedHalaqa,
  setSelectedHalaqa,

  selectedTeacher,
  setSelectedTeacher,

  halaqat = [],
  teachers = [],

  search,
  setSearch,
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "20px",
        border: "1px solid #E2E8F0",
        marginBottom: "24px",
      }}
    >
      

      {/* الفلاتر */}

    <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "320px 1fr 1fr 1fr",
    gap: "16px",
    alignItems: "start",
  }}
>

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "320px",
  }}
>
  <DatePicker
    selected={
      selectedDate
        ? new Date(selectedDate)
        : new Date()
    }
    onChange={(date) => {

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

      setSelectedDate(
        `${year}-${month}-${day}`
      );

    }}
    customInput={
      <button
        type="button"
        style={{
          width: "100%",
          border: "none",
          cursor: "pointer",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "14px",
          borderRadius: "16px",
          border:
            "1px solid #E2E8F0",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background:
              "linear-gradient(135deg,#0F766E,#115E59)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CalendarDays size={22} />
        </div>

        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontWeight: "800",
              fontSize: "18px",
            }}
          >
            {formatHijri(
              selectedDate
            )}
          </div>

          <div
            style={{
              color: "#64748B",
              fontSize: "14px",
            }}
          >
            {formatGregorian(
              selectedDate
            )}
          </div>
        </div>
      </button>
    }
  />
</div>

        
        <div>
          <label
  style={{
    display: "block",
    marginBottom: "12px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
    lineHeight: "20px",
    height: "20px",
  }}
>
  الحلقة
</label>

          <AppSelect
            value={selectedHalaqa}
            onChange={
              setSelectedHalaqa
            }
            options={halaqat.map(
              (item) => ({
                value: item.id,
                label: item.name,
              })
            )}
          />
        </div>

        <div>
         <label
  style={{
    display: "block",
    marginBottom: "12px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
    lineHeight: "20px",
    height: "20px",
  }}
>
  المعلم
</label>

          <AppSelect
            value={selectedTeacher}
            onChange={
              setSelectedTeacher
            }
            options={teachers.map(
              (item) => ({
                value: item.id,
                label:
                  item.full_name,
              })
            )}
          />
        </div>

        <div>
  <label
  style={{
    display: "block",
    marginBottom: "12px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
    lineHeight: "20px",
    height: "20px",
  }}
>
  البحث
</label>

  <div
    style={{
      position: "relative",
    }}
  >
    <Search
      size={18}
      style={{
        position: "absolute",
        top: "50%",
        right: "14px",
        transform: "translateY(-50%)",
        color: "#94A3B8",
      }}
    />

    <input
      type="text"
      value={search}
      onChange={(e) =>
        setSearch(
          e.target.value
        )
      }
      placeholder="ابحث باسم الطالب..."
      style={{
width: "100%",
    height: "54px",
        border: "1px solid #CBD5E1",
        borderRadius: "14px",
        paddingRight: "42px",
        paddingLeft: "14px",
        fontSize: "14px",
        outline: "none",
      }}
    />
  </div>
</div>
      </div>
    </div>
  );
}