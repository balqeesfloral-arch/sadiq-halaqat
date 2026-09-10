import { useState } from "react";
import { Settings } from "lucide-react";

import SettingsSidebar from "../components/settings/SettingsSidebar";
import GeneralSettings from "../components/settings/GeneralSettings";
import PointsSettings from "../components/settings/PointsSettings";
import TVSettings from "../components/settings/TVSettings";
import QuoteManager from "../components/settings/QuoteManager";
import SecuritySettings from "../components/settings/SecuritySettings";
import AboutSystem from "../components/settings/AboutSystem";

import "./SettingsPage.css";

const TABS = [
  {
    key: "general",
    label: "عام",
  },
  {
    key: "points",
    label: "النقاط",
  },
  {
    key: "tv",
    label: "التلفزيون",
  },
  {
    key: "quotes",
    label: "الكلمات التحفيزية",
  },
  {
    key: "security",
    label: "الأمان",
  },
  {
    key: "about",
    label: "حول النظام",
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] =
    useState("general");

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;

      case "points":
        return <PointsSettings />;

      case "tv":
        return <TVSettings />;

      case "quotes":
        return <QuoteManager />;

      case "security":
        return <SecuritySettings />;

      case "about":
        return <AboutSystem />;

      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="page-container settings-page">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">
            <Settings size={28} />
            الإعدادات
          </h1>

          <p className="settings-subtitle">
            إدارة إعدادات نظام الصديق
          </p>
        </div>
      </div>

      <div className="settings-layout">
        <SettingsSidebar
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="settings-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}