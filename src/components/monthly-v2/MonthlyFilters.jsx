import AppSelect from "../AppSelect";
import { Search } from "lucide-react";

const hijriMonths = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة"
];

const currentHijriYear =
  parseInt(
    new Intl.DateTimeFormat(
      "en-TN-u-ca-islamic",
      {
        year:"numeric"
      }
    ).format(new Date()),
    10
  );

const hijriYears = [];

for(
  let year = currentHijriYear - 1;
  year <= currentHijriYear + 2;
  year++
){
  hijriYears.push(year);
}

export default function MonthlyFilters({

  
  halaqat,


  selectedHalaqa,

  selectedYear,
  selectedMonth,

  onMosqueChange,
  onHalaqaChange,

  onYearChange,
  onMonthChange,

  onLoad

}) {

  return (

    <div
      style={{
        background:"#fff",
        borderRadius:"22px",
        padding:"24px",
        border:"1px solid #E2E8F0",
        marginBottom:"24px"
      }}
    >

      <div
        style={{
          display:"grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(260px,1fr))",
          gap:"16px"
        }}
      >

       

        <AppSelect
          label="الحلقة"
          value={selectedHalaqa}
          onChange={onHalaqaChange}
          options={halaqat.map(x=>({
            label:x.name,
            value:x.id
          }))}
        />

 <AppSelect
  label="السنة الهجرية"
  value={selectedYear}
  onChange={onYearChange}
  options={Array.from(
    { length: 101 },
    (_, i) => ({
      label: String(1400 + i),
      value: String(1400 + i)
    })
  )}
/>

<AppSelect
  label="الشهر الهجري"
  value={selectedMonth}
  onChange={onMonthChange}
  options={hijriMonths.map((month,index)=>({
    label: month,
    value: String(index + 1).padStart(2,"0")
  }))}
/>

        <button
          onClick={onLoad}
          style={{
            border:"none",
            borderRadius:"14px",
            background:
              "linear-gradient(135deg,#0F766E,#115E59)",
            color:"#fff",
            fontWeight:"900",
            cursor:"pointer",
            minHeight:"54px",
            alignSelf:"end",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            gap:"8px"
          }}
        >
          <Search size={18}/>
          تحميل البيانات
        </button>

      </div>

    </div>
  );
}