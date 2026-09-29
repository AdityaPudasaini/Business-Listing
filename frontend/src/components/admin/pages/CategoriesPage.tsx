"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Layers3,
  Pencil,
  Plus, Trash2
} from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from "@/services/api";
import type { AdminCategory } from "@/types";
import { CATEGORY_ICON_KEYS, resolveCategoryIcon } from "@/lib/categoryIcons";
import { PageHeader
} from "@/components/admin/shared";

function useLiveCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    return getAdminCategories()
      .then(setCategories)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load categories.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { categories, loading, error, refresh };
}

function CategoryIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const Preview = resolveCategoryIcon(value);
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
        {Preview ? <Preview size={16} /> : <span className="text-xs">—</span>}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">No icon</option>
        {CATEGORY_ICON_KEYS.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    </div>
  );
}

// Shared by both the "add category" form and each row's inline edit —
// same fields either way, just different submit behavior.
function CategoryForm({
  initialLabel = "",
  initialIcon = "",
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initialLabel?: string;
  initialIcon?: string;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: { label: string; icon: string }) => Promise<void>;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [icon, setIcon] = useState(initialIcon);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!label.trim()) {
      setError("Label is required.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await onSubmit({ label: label.trim(), icon });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save this category.",
      );
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">
          Label
        </label>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="e.g. Auto Garage"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">
          Icon (only shown for sub-categories on the public site)
        </label>
        <CategoryIconPicker value={icon} onChange={setIcon} />
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="text-xs font-bold text-gray-500 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function CategoryDeleteButton({
  category,
  onChanged,
}: {
  category: AdminCategory;
  onChanged: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setPending(true);
    setError("");
    try {
      await deleteCategory(category.id);
      await onChanged();
    } catch (reason) {
      // The backend blocks this with a message naming exactly how many
      // listings/products are still on it — surface that verbatim rather
      // than a generic "couldn't delete".
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not delete this category.",
      );
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600"
      >
        <Trash2 size={13} />
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">Delete permanently?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => void remove()}
        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setConfirming(false);
          setError("");
        }}
        className="text-xs font-bold text-gray-500 hover:text-gray-800"
      >
        Cancel
      </button>
      {error && (
        <p className="w-full text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  indent,
  onChanged,
}: {
  category: AdminCategory;
  indent: boolean;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const Icon = resolveCategoryIcon(category.icon);

  if (editing) {
    return (
      <div className={indent ? "ml-6" : undefined}>
        <CategoryForm
          initialLabel={category.label}
          initialIcon={category.icon ?? ""}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async ({ label, icon }) => {
            await updateCategory(category.id, {
              label,
              icon: icon || undefined,
            });
            setEditing(false);
            await onChanged();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm ${
        indent ? "ml-6" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
          {Icon ? <Icon size={16} /> : <Layers3 size={16} />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">
            {category.label}
          </p>
          <p className="truncate text-xs text-gray-400">{category.id}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800"
        >
          <Pencil size={13} />
          Edit
        </button>
        <CategoryDeleteButton category={category} onChanged={onChanged} />
      </div>
    </div>
  );
}

export function AdminCategoriesPage() {
  const { categories, loading, error, refresh } = useLiveCategories();
  const [addingUnder, setAddingUnder] = useState<string | null | "none">(
    "none",
  );

  const topLevel = categories.filter((item) => !item.parentId);
  const childrenOf = (id: string) =>
    categories.filter((item) => item.parentId === id);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Categories"
        description="Manage the categories businesses can register under. A category's id is locked once created — editing only changes its label and icon, since existing listings are matched against that id directly."
      />
      <div className="space-y-6 p-6 sm:p-8">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Loading categories…</p>
        ) : (
          <div className="space-y-4">
            {topLevel.map((parent) => (
              <div key={parent.id} className="space-y-2">
                <CategoryRow
                  category={parent}
                  indent={false}
                  onChanged={refresh}
                />
                {childrenOf(parent.id).map((child) => (
                  <CategoryRow
                    key={child.id}
                    category={child}
                    indent
                    onChanged={refresh}
                  />
                ))}

                {addingUnder === parent.id ? (
                  <div className="ml-6">
                    <CategoryForm
                      submitLabel="Add sub-category"
                      onCancel={() => setAddingUnder("none")}
                      onSubmit={async ({ label, icon }) => {
                        await createCategory({
                          label,
                          icon: icon || undefined,
                          parentId: parent.id,
                        });
                        setAddingUnder("none");
                        await refresh();
                      }}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingUnder(parent.id)}
                    className="ml-6 inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800"
                  >
                    <Plus size={13} />
                    Add sub-category
                  </button>
                )}
              </div>
            ))}

            {!topLevel.length && (
              <p className="text-sm text-gray-500">
                No categories yet — add the first top-level category below.
              </p>
            )}
          </div>
        )}

        {addingUnder === null ? (
          <CategoryForm
            submitLabel="Add category"
            onCancel={() => setAddingUnder("none")}
            onSubmit={async ({ label, icon }) => {
              await createCategory({ label, icon: icon || undefined });
              setAddingUnder("none");
              await refresh();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingUnder(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white"
          >
            <Plus size={15} />
            Add top-level category
          </button>
        )}
      </div>
    </>
  );
}
