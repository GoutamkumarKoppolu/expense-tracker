import { Check, Moon, PiggyBank, Smartphone, Sun, Circle } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Money from "../../components/ui/Money";
import { useTheme } from "../../theme/useTheme";
import { ACCENTS, BACKGROUNDS } from "../../theme/palettes";

const BACKGROUND_ICONS = { system: Smartphone, light: Sun, dark: Moon, black: Circle };

// Live preview built from the real tokens, so it always matches the app.
function ThemePreview() {
  return (
    <div className="theme-preview" aria-hidden="true">
      <div className="theme-preview-hero">
        <span className="theme-preview-label">Current balance</span>
        <Money value={48250.5} className="theme-preview-amount" />
      </div>
      <div className="theme-preview-body">
        <div className="theme-preview-row">
          <span className="icon-badge tone-savings">
            <PiggyBank size={16} />
          </span>
          <span className="theme-preview-lines">
            <span />
            <span />
          </span>
          <span className="pill tone-accent">Saving</span>
        </div>
        <div className="theme-preview-actions">
          <span className="chip is-active">Active</span>
          <span className="btn btn-primary theme-preview-btn">Button</span>
        </div>
      </div>
    </div>
  );
}

export default function AppearancePage({ navigate }) {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <PageHeader title="Appearance" subtitle="Background and accent colour" onBack={() => navigate("more")} />
      <div className="page-body">
        <ThemePreview />

        <section className="settings-group">
          <h2 className="settings-group-title">Background</h2>
          <div className="option-grid option-grid-4" role="radiogroup" aria-label="Background">
            {BACKGROUNDS.map((b) => {
              const Icon = BACKGROUND_ICONS[b.id];
              const active = theme.background === b.id;
              return (
                <button
                  type="button"
                  key={b.id}
                  role="radio"
                  aria-checked={active}
                  className={`option-tile ${active ? "is-active" : ""}`}
                  onClick={() => setTheme({ background: b.id })}
                >
                  <span className={`bg-swatch bg-swatch-${b.id}`}>
                    <Icon size={18} fill={b.id === "black" ? "currentColor" : "none"} />
                  </span>
                  <span>{b.label}</span>
                </button>
              );
            })}
          </div>
          {theme.background === "system" && <p className="field-hint">Follows your phone&apos;s light/dark setting.</p>}
          {theme.background === "black" && <p className="field-hint">Pure black saves battery on AMOLED screens.</p>}
        </section>

        <section className="settings-group">
          <h2 className="settings-group-title">Accent colour</h2>
          <div className="option-grid option-grid-3" role="radiogroup" aria-label="Accent colour">
            {ACCENTS.map((a) => {
              const active = theme.accent === a.id;
              return (
                <button
                  type="button"
                  key={a.id}
                  role="radio"
                  aria-checked={active}
                  data-accent={a.id}
                  className={`option-tile ${active ? "is-active" : ""}`}
                  onClick={() => setTheme({ accent: a.id })}
                >
                  <span className="accent-swatch">{active && <Check size={18} strokeWidth={3} />}</span>
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
