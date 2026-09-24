import { ChevronRight } from "lucide-react";

// Tappable settings-style row: icon, title, optional subtitle, chevron.
export default function ListRow({ icon: Icon, tone = "accent", title, subtitle, onClick, trailing }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className="list-row" onClick={onClick}>
      {Icon && (
        <span className={`icon-badge tone-${tone}`}>
          <Icon size={18} />
        </span>
      )}
      <span className="list-row-text">
        <span className="list-row-title">{title}</span>
        {subtitle && <span className="list-row-subtitle">{subtitle}</span>}
      </span>
      {trailing ?? (onClick && <ChevronRight size={18} className="list-row-chevron" />)}
    </Tag>
  );
}
