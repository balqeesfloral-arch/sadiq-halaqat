import {
  Settings,
  Trophy,
  Tv,
  Quote,
  Shield,
  Info,
} from "lucide-react";

const ICONS = {
  general: Settings,
  points: Trophy,
  tv: Tv,
  quotes: Quote,
  security: Shield,
  about: Info,
};

export default function SettingsSidebar({
  tabs,
  activeTab,
  onChange,
}) {
  return (
    <aside className="settings-sidebar">
      {tabs.map((tab) => {
        const Icon =
          ICONS[tab.key] || Settings;

        return (
          <button
            key={tab.key}
            className={`settings-tab ${
              activeTab === tab.key
                ? "active"
                : ""
            }`}
            onClick={() =>
              onChange(tab.key)
            }
          >
            <Icon size={18} />

            <span>
              {tab.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}