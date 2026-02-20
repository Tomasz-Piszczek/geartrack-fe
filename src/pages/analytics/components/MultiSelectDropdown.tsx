import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

interface MultiSelectDropdownProps {
  options: { id: string; name: string }[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  placeholder: string;
}

export default function MultiSelectDropdown({ options, selected, onChange, placeholder }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options
    .filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleOption = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const selectAll = () => {
    onChange(new Set(options.map(o => o.id)));
  };

  const clearAll = () => {
    onChange(new Set());
  };

  const displayText = selected.size === 0
    ? placeholder
    : selected.size === options.length
      ? "Wszystkie produkty"
      : `${selected.size} wybranych`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-section-grey text-white border border-grey-outline rounded-lg px-4 py-2 text-sm flex items-center gap-2 min-w-[200px] justify-between"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-power-grey transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 bg-section-grey border border-grey-outline rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-grey-outline">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-power-grey" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Szukaj..."
                className="w-full bg-section-grey-dark text-white border border-grey-outline rounded-lg pl-9 pr-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="p-2 border-b border-grey-outline flex gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1 rounded text-xs font-semibold bg-dark-green text-white hover:bg-dark-green/80"
            >
              Zaznacz wszystkie
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1 rounded text-xs font-semibold bg-section-grey-dark text-power-grey hover:bg-jet-color border border-grey-outline"
            >
              Odznacz wszystkie
            </button>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.map(option => (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-jet-color flex items-center gap-2"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selected.has(option.id) ? "bg-dark-green border-dark-green" : "border-grey-outline"
                }`}>
                  {selected.has(option.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-white whitespace-normal break-words">{option.name}</span>
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-center text-power-grey text-sm">Brak wynikow</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
