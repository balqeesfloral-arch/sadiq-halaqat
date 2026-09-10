import { Outlet, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
  Building2,
  ClipboardCheck,
  Mic2,
  FileCheck,
  Trophy,
  Award,
  Gift,
  Tv,
  BarChart3,
  ShieldCheck,
  Bell,
  ScrollText,
  Settings,
  UserCircle,
  Search,
Menu,
} from "lucide-react";

const sections = [
  {
    title: "النظام",
    items: [{ name: "لوحة التحكم", path: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "الإدارة",
    items: [
      { name: "الطلاب", path: "/admin/students", icon: Users },
      { name: "المعلمون", path: "/admin/teachers", icon: GraduationCap },
      
      { name: "المستخدمون", path: "/admin/users", icon: Users },
      { name: "الصلاحيات", path: "/admin/permissions", icon: ShieldCheck },
    ],
  },
  {
    title: "الحلقات",
    items: [
      { name: "الحلقات", path: "/admin/halaqat", icon: BookOpen },

    ],
  },
  {
    title: "المتابعة",
    items: [
      { name: "الحضور", path: "/admin/attendance", icon: ClipboardCheck },
      { name: "التسميع", path: "/admin/recitations", icon: Mic2 },
      { name: "الاختبارات", path: "/admin/exams", icon: FileCheck },
    ],
  },
  {
    title: "التحفيز",
    items: [
      { name: "الإنجاز الشهري", path: "/admin/monthly-achievement", icon: Trophy },

     {
  name: "النقاط",
  path: "/admin/points-transactions",
  icon: Gift,
},
    ],
  },
  {
    title: "العرض",
    items: [{ name: "العرض على التلفزيون", path: "/admin/tv-leaderboard", icon: Tv }],
  },
  {
    title: "التقارير",
    items: [{ name: "التقارير", path: "/admin/reports", icon: BarChart3 }],
  },
  {
    title: "النظام والإعدادات",
    items: [
     

      { name: "الإعدادات", path: "/admin/settings", icon: Settings },
      { name: "الملف الشخصي", path: "/admin/profile", icon: UserCircle },
    ],
  },
];

const todayHijri =
new Intl.DateTimeFormat(
  "ar-SA-u-ca-islamic",
  {
    weekday:"long",
    year:"numeric",
    month:"long",
    day:"numeric"
  }
).format(new Date());

const todayGregorian =
new Intl.DateTimeFormat(
  "ar-SA",
  {
    year:"numeric",
    month:"long",
    day:"numeric"
  }
).format(new Date());



export default function AdminLayout() {



const [collapsed, setCollapsed] = useState(
  localStorage.getItem("sidebarCollapsed") === "true"
);

useEffect(() => {
  localStorage.setItem(
    "sidebarCollapsed",
    collapsed
  );
}, [collapsed]);

const [search,setSearch] = useState(""); 


  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        direction: "rtl",
        background: "linear-gradient(180deg,#f8fafc,#eef6f4)",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.04,
          backgroundImage:
            "radial-gradient(circle,#0F766E 2px,transparent 2px)",
          backgroundSize: "70px 70px",
        }}
      />

      <aside

        style={{
          width: collapsed ? 120 : 320,
transition: "all .3s ease",
          height: "100vh",
          overflowY: "auto",
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,.88)",
          backdropFilter: "blur(18px)",
          borderLeft: "1px solid rgba(15,118,110,.12)",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
       <div
  style={{
    display:"flex",
    alignItems:"center",
    gap:"10px"
  }}
>
  <div
    style={{
      width:"42px",
      height:"42px",
      borderRadius:"12px",
      background:
        "linear-gradient(135deg,#0F766E,#115E59)",
      color:"#fff",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      fontWeight:"900"
    }}
  >
    ص
  </div>

  {!collapsed && (
    <h2
      style={{
        margin:0,
        color:"#0F766E",
        fontWeight:"900"
      }}
    >
      الصديق
    </h2>
  )}
</div>

{!collapsed && (
  <p
    style={{
      color:"#64748B",
      marginBottom:"24px"
    }}
  >
    إدارة حلقات التحفيظ
  </p>
)}

       <div
  style={{
    display:"flex",
    alignItems:"center",
    gap:10,
    background:"#F8FAFC",
    borderRadius:14,
    padding:"12px 14px",
    marginBottom:20
  }}
>
  <Search
    size={18}
    color="#64748B"
  />

  {!collapsed && (
    <input
      value={search}
      onChange={(e)=>
        setSearch(e.target.value)
      }
      placeholder="بحث سريع..."
      style={{
        border:"none",
        background:"transparent",
        outline:"none",
        width:"100%",
        fontSize:"14px"
      }}
    />
  )}
</div>

        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: "#94A3B8",
                marginBottom: 8,
                fontWeight: 800,
              }}
            >
              {!collapsed && section.title}
            </div>

            {section.items
.filter(item =>
  item.name
    .toLowerCase()
    .includes(
      search.toLowerCase()
    )
)
.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  style={({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  padding: "14px",
  marginBottom: 8,
  borderRadius: 14,
  textDecoration: "none",
  color: isActive ? "#0F766E" : "#334155",
  background: isActive ? "#ECFDF5" : "transparent",
  fontWeight: 700,
})}
                >
                  <Icon size={22} />
                  {!collapsed && item.name}
                </NavLink>
              );
            })}
          </div>
        ))}

       {!collapsed && (
  <div
    style={{
      marginTop: 20,
      borderRadius: 18,
      padding: 18,
      background:
        "linear-gradient(135deg,#0F766E,#115E59)",
      color: "#fff",
    }}
  >
    <strong>نظام الصديق</strong>

    <div
      style={{
        opacity: 0.8
      }}
    >
      النسخة الاحترافية
    </div>
  </div>
)}
      </aside>

      <main style={{ flex: 1 }}>
     <div
  style={{
    height:"90px",
    background:"rgba(255,255,255,.9)",
    backdropFilter:"blur(12px)",
    borderBottom:"1px solid #E2E8F0",
    display:"flex",
    alignItems:"center",
    justifyContent:"space-between",
    padding:"0 30px"
  }}
>

  <div
    style={{
      display:"flex",
      alignItems:"center",
      gap:"16px"
    }}
  >

    <button
      onClick={() =>
        setCollapsed(!collapsed)
      }
      style={{
        border:"none",
        background:"#F8FAFC",
        width:"46px",
        height:"46px",
        borderRadius:"14px",
        cursor:"pointer"
      }}
    >
      <Menu size={20}/>
    </button>

    <div>

      <div
        style={{
          fontSize:"24px",
          fontWeight:"900",
          color:"#0F172A"
        }}
      >
        نظام الصديق
      </div>

      <div
        style={{
          color:"#64748B",
          fontSize:"14px"
        }}
      >
        إدارة حلقات تحفيظ القرآن الكريم
      </div>

    </div>

  </div>

  <div
    style={{
      textAlign:"left"
    }}
  >

    <div
  style={{
    color:"#0F766E",
    fontWeight:"800",
    fontSize:"15px",
    lineHeight:"1.8"
  }}
>
  {todayHijri}
</div>

<div
  style={{
    color:"#64748B",
    fontSize:"13px"
  }}
>
  {todayGregorian}
</div>

<div
  style={{
    color:"#94A3B8",
    fontSize:"12px",
    marginTop:"4px"
  }}
>
  لوحة الإدارة
</div>

  </div>

</div>

        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}