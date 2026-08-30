export default function TagFilter({ availableTags, selectedTags, onChange }) {
  function toggle(tag) {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  }

  if (!availableTags.length) {
    return null;
  }

  return (
    <div className="chip-group">
      {availableTags.map((tag) => (
        <button
          type="button"
          key={tag}
          className={`chip ${selectedTags.includes(tag) ? "chip-active" : ""}`}
          onClick={() => toggle(tag)}
        >
          {tag}
        </button>
      ))}
      {selectedTags.length > 0 && (
        <button type="button" className="chip chip-clear" onClick={() => onChange([])}>
          Clear tags
        </button>
      )}
    </div>
  );
}
