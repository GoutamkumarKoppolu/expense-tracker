import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import InfoButton from "./InfoButton";

// One UI "large title": a tall, read-only header in the top third of the
// screen that collapses into a compact sticky app bar once scrolled past.
// `info` is an optional HELP topic shown as an ⓘ next to the title.
export default function PageHeader({ title, subtitle, onBack, actions, info }) {
  const titleRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting), {
      rootMargin: "-56px 0px 0px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className={`app-bar ${collapsed ? "is-collapsed" : ""}`}>
        {onBack && (
          <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={22} />
          </button>
        )}
        <span className="app-bar-title" aria-hidden={!collapsed}>
          {title}
        </span>
        <div className="app-bar-actions">{actions}</div>
      </div>
      <header className="page-header">
        <div className="page-title-row">
          <h1 ref={titleRef}>{title}</h1>
          {info && <InfoButton topic={info} />}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </header>
    </>
  );
}
