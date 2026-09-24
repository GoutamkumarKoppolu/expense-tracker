export default function EmptyState({ icon: Icon, children }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={28} aria-hidden="true" />}
      <p>{children}</p>
    </div>
  );
}
