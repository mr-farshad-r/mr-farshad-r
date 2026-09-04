import { Activity, useState } from "react";
import { LiveNotifications, type Theme } from "./LiveNotifications";

type Tab = "feed" | "about";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [theme, setTheme] = useState<Theme>("cyan");

  return (
    <main className={`app theme-${theme}`}>
      <section className="dashboard" aria-labelledby="page-title">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">React 19.2 feature lab</p>
            <h1 id="page-title">Release monitor</h1>
          </div>

          <label className="theme-picker">
            Accent
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as Theme)}
            >
              <option value="cyan">Cyan</option>
              <option value="violet">Violet</option>
              <option value="coral">Coral</option>
            </select>
          </label>
        </header>

        <nav className="tabs" aria-label="Dashboard views">
          <button
            className={activeTab === "feed" ? "active" : ""}
            onClick={() => setActiveTab("feed")}
          >
            Live feed
          </button>
          <button
            className={activeTab === "about" ? "active" : ""}
            onClick={() => setActiveTab("about")}
          >
            How it works
          </button>
        </nav>

        <Activity mode={activeTab === "feed" ? "visible" : "hidden"}>
          <LiveNotifications channel="releases" theme={theme} />
        </Activity>

        <Activity mode={activeTab === "about" ? "visible" : "hidden"}>
          <article className="about-panel">
            <h2>The feed is hidden, not unmounted</h2>
            <p>
              Return to the Live feed: its messages and filter are preserved by
              Activity, while its connection Effect restarts cleanly.
            </p>
            <p>
              Change the accent here first. The next feed event reads that latest
              value through useEffectEvent without reconnecting just for a theme
              change.
            </p>
          </article>
        </Activity>
      </section>
    </main>
  );
}
