// SearchFilterBar.tsx
// A search + filter bar (category, location, rating, price, open-now).
// Used in: The top of the listing search page.

import { Button } from "@/components/ui/Button";

interface FilterState {
  category?: string;
  location?: string;
  rating?: number;
  openNow?: boolean;
}

interface SearchFilterBarProps {
  filters: FilterState;
  onFilterChange: (f: FilterState) => void;
  onSearch: () => void;
}

export function SearchFilterBar({
  filters,
  onFilterChange,
  onSearch,
}: SearchFilterBarProps) {
  return (
    <div className="flex gap-2 flex-wrap items-center p-3 border rounded-lg bg-white">
      <input
        placeholder="Search location"
        value={filters.location ?? ""}
        onChange={(e) =>
          onFilterChange({ ...filters, location: e.target.value })
        }
        className="border rounded-md px-3 py-2 text-sm"
      />
      <select
        value={filters.category ?? ""}
        onChange={(e) =>
          onFilterChange({ ...filters, category: e.target.value })
        }
        className="border rounded-md px-3 py-2 text-sm"
      >
        <option value="">All Categories</option>
      </select>
      <label className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={filters.openNow ?? false}
          onChange={(e) =>
            onFilterChange({ ...filters, openNow: e.target.checked })
          }
        />
        Open Now
      </label>
      <Button label="Search" onClick={onSearch} />
    </div>
  );
}
