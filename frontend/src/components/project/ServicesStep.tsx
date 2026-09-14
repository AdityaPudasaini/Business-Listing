// ServicesStep.tsx — Step 3 of the /register wizard: a checklist of
// services the business offers, grouped by category. Selections are stored
// as the plain service label strings (matching Business.services'
// ServiceCategory shape in types/index.ts) rather than separate ids, so
// there's no translation layer between what's selected here and what a
// real business record would eventually store.
"use client";

import { theme } from "@/config/theme";
import { serviceCatalog } from "@/data/services";
import { RegisterFormData } from "@/components/sections/RegisterPage";

interface ServicesStepProps {
  values: RegisterFormData;
  onChange: (patch: Partial<RegisterFormData>) => void;
  navButtons: React.ReactNode;
}

export function ServicesStep({
  values,
  onChange,
  navButtons,
}: ServicesStepProps) {
  function toggleService(item: string) {
    const selected = values.services.includes(item)
      ? values.services.filter((s) => s !== item)
      : [...values.services, item];
    onChange({ services: selected });
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Select every service your business offers. This helps customers find you
        when they search for something specific.
      </p>

      <div className="space-y-6 max-w-3xl">
        {serviceCatalog.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-semibold text-gray-900 mb-2.5">
              {group.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(group.items ?? []).map((item) => {
                const checked = values.services.includes(item);
                return (
                  <label
                    key={item}
                    style={{
                      ["--accent-tint" as string]: `${theme.colors.primary}0D`,
                      ["--accent-border" as string]: `${theme.colors.primary}55`,
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-colors duration-150 ${
                      checked
                        ? "bg-[var(--accent-tint)] border-[var(--accent-border)] text-gray-900"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(item)}
                      style={{ accentColor: theme.colors.primary }}
                      className="h-4 w-4 shrink-0"
                    />
                    {item}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {navButtons}
    </div>
  );
}
