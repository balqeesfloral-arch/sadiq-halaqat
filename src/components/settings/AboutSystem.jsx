import { useEffect, useState } from "react";
import { Info } from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AboutSystem() {
  const [stats, setStats] =
    useState({
      students: 0,
      teachers: 0,
      halaqat: 0,
      mosques: 0,
    });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const [
      students,
      teachers,
      halaqat,
      mosques,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("role", "student"),

      supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("role", "teacher"),

      supabase
        .from("halaqat")
        .select("*", {
          count: "exact",
          head: true,
        }),

      supabase
        .from("mosques")
        .select("*", {
          count: "exact",
          head: true,
        }),
    ]);

    setStats({
      students:
        students.count || 0,

      teachers:
        teachers.count || 0,

      halaqat:
        halaqat.count || 0,

      mosques:
        mosques.count || 0,
    });
  }

  return (
    <div className="settings-card">

      <div className="section-title">
        <Info size={22} />
        <h2>
          حول النظام
        </h2>
      </div>

      <div className="about-box">

        <h3>
          برنامج الصديق
        </h3>

        <p>
          نظام إدارة حلقات
          القرآن الكريم
        </p>

        <p>
          الإصدار 1.0.0
        </p>

      </div>

      <div className="stats-grid">

        <div className="stat-card">
          <span>
            الطلاب
          </span>

          <strong>
            {stats.students}
          </strong>
        </div>

        <div className="stat-card">
          <span>
            المعلمون
          </span>

          <strong>
            {stats.teachers}
          </strong>
        </div>

        <div className="stat-card">
          <span>
            الحلقات
          </span>

          <strong>
            {stats.halaqat}
          </strong>
        </div>

        <div className="stat-card">
          <span>
            المساجد
          </span>

          <strong>
            {stats.mosques}
          </strong>
        </div>

      </div>

    </div>
  );
}