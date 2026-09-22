"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ListChecks,
  MapPin,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { theme } from "@/config/theme";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import {
  apiUpload,
  createBusinessProduct,
  deleteBusinessProduct,
  getBusinessProducts,
  getMyAccount,
  getMyListings,
  isBackendConfigured,
  updateBusinessProduct,
  updateListing,
  updateMyAccount,
} from "@/services/api";
import type {
  BusinessProduct,
  BusinessProductInput,
  OwnerAccount,
  OwnerListing,
} from "@/types";
import {
  ListingWizard,
  type RegisterFormData,
} from "@/components/sections/RegisterPage";
import { toRegisterFormData, toUpdatePayload } from "@/lib/listingForm";

type ListingFilter = "all" | OwnerListing["status"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: OwnerListing["status"] }) {
  const labels = {
    approved: "Published",
    published: "Published",
    pending: "Pending review",
    rejected: "Rejected",
  };
  const colors = {
    approved: "bg-green-50 text-green-700",
    published: "bg-green-50 text-green-700",
    pending: "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function DashboardCount({
  active,
  count,
  icon,
  label,
  onClick,
  tone = "gray",
}: {
  active: boolean;
  count: number;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "gray" | "green" | "amber";
}) {
  const iconColors = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-xl border p-5 text-left shadow-sm transition hover:shadow-md ${
        active ? "border-gray-900 bg-gray-100" : "border-gray-200 bg-white"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconColors[tone]}`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-2xl font-extrabold text-gray-950">
          {count}
        </span>
        <span className="block text-sm text-gray-500">{label}</span>
      </span>
    </button>
  );
}

function EditListingPanel({
  listing,
  onCancel,
  onSaved,
}: {
  listing: OwnerListing;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [formData] = useState(() => toRegisterFormData(listing));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Edit listing
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-gray-950">
            {listing.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Saving sends this listing back for admin review.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-bold text-gray-500"
        >
          Cancel
        </button>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          {notice}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-5">
        <ListingWizard
          embedded
          initialValues={formData}
          ownerActions={{
            onSave: async (values) => {
              setError("");
              try {
                await updateListing(listing.id, await toUpdatePayload(values));
                await onSaved();
                setNotice("Listing changes saved and sent for review.");
              } catch (reason) {
                setError(
                  reason instanceof Error
                    ? reason.message
                    : "Could not save your changes.",
                );
              }
            },
          }}
        />
      </div>
    </section>
  );
}

// Same limits the backend enforces on POST /uploads.
const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const emptyProductForm: BusinessProductInput = {
  name: "",
  description: "",
  price: undefined,
  image: "",
  category: "",
  isAvailable: true,
};

function ManageProductsPanel({
  listing,
  onCancel,
}: {
  listing: OwnerListing;
  onCancel: () => void;
}) {
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<BusinessProductInput>(emptyProductForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Uploads as soon as a file is picked; the returned URL is what gets saved
  // on the product, so submitting the form never has to deal with a File.
  async function handleImageFile(file: File | undefined) {
    if (!file) return;
    if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
      setError("That image is over 5 MB. Please choose a smaller one.");
      return;
    }
    setError("");
    setUploadingImage(true);
    try {
      const url = await apiUpload(file);
      setForm((current) => ({ ...current, image: url }));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not upload the image.",
      );
    } finally {
      setUploadingImage(false);
    }
  }

  function loadProducts() {
    setLoading(true);
    return getBusinessProducts(listing.id)
      .then(setProducts)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Could not load products.",
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id]);

  function startEdit(product: BusinessProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      image: product.image ?? "",
      category: product.category ?? "",
      isAvailable: product.isAvailable,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyProductForm);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError("Give the product a name first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (uploadingImage) {
        setError("Wait for the image to finish uploading.");
        setSaving(false);
        return;
      }
      const payload: BusinessProductInput = {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        price: form.price,
        // When editing, "" tells the backend to clear the image; leaving the
        // key out (undefined) would silently keep the old one.
        image: form.image?.trim() || (editingId ? "" : undefined),
        category: form.category?.trim() || undefined,
        isAvailable: form.isAvailable,
      };
      if (editingId) {
        await updateBusinessProduct(listing.id, editingId, payload);
      } else {
        await createBusinessProduct(listing.id, payload);
      }
      resetForm();
      await loadProducts();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save this product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this product?")) return;
    setError("");
    try {
      await deleteBusinessProduct(listing.id, id);
      if (editingId === id) resetForm();
      await loadProducts();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not remove this product.",
      );
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Manage products
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-gray-950">
            {listing.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            These show up on your public listing page.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-bold text-gray-500"
        >
          Close
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {loading ? (
          <p className="col-span-full text-sm text-gray-500">
            Loading products…
          </p>
        ) : products.length ? (
          products.map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-gray-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-900">
                    {product.name}
                  </p>
                  {product.category && (
                    <p className="text-xs text-gray-400">{product.category}</p>
                  )}
                </div>
                {product.price !== undefined && (
                  <span className="whitespace-nowrap text-sm font-bold text-gray-700">
                    Rs {product.price.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(product)}
                  style={{ color: theme.colors.primary }}
                  className="text-xs font-bold hover:opacity-70"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(product.id)}
                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:opacity-70"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-sm text-gray-500">
            No products yet — add your first one below.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-4">
        <p className="text-sm font-bold text-gray-900">
          {editingId ? "Edit product" : "Add a product"}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">
            Name
            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 font-normal"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Category
            <input
              value={form.category ?? ""}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 font-normal"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Price (optional)
            <input
              type="number"
              min={0}
              value={form.price ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  price:
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 font-normal"
            />
          </label>
          <div className="text-sm font-semibold text-gray-700">
            Product image (optional)
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void handleImageFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <div className="mt-1 flex items-center gap-3">
              {form.image ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                  <Image
                    src={form.image}
                    alt="Product preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => setForm({ ...form, image: "" })}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-gray-400 disabled:opacity-50"
              >
                <Upload size={15} />
                {uploadingImage
                  ? "Uploading…"
                  : form.image
                    ? "Change image"
                    : "Upload image"}
              </button>
            </div>
            <p className="mt-1 text-xs font-normal text-gray-400">
              JPG, PNG or WebP, up to 5 MB.
            </p>
          </div>
          <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
            Description
            <textarea
              value={form.description ?? ""}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className="mt-1 min-h-20 w-full rounded-lg border border-gray-200 p-2.5 font-normal"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={form.isAvailable ?? true}
              onChange={(event) =>
                setForm({ ...form, isAvailable: event.target.checked })
              }
              className="h-4 w-4"
            />
            Available
          </label>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            style={{ backgroundColor: theme.colors.primary }}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <Plus size={14} />
            {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700"
            >
              Cancel edit
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function AccountCard() {
  const [account, setAccount] = useState<OwnerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ownerName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMyAccount()
      .then((result) => {
        if (cancelled) return;
        setAccount(result);
        setForm({ ownerName: result.ownerName, phone: result.phone });
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load your account.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateMyAccount(form);
      setAccount(updated);
      setEditing(false);
    } catch (reason) {
      setSaveError(
        reason instanceof Error ? reason.message : "Could not save changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Loading your account…</p>
      </section>
    );
  }

  if (error || !account) {
    return (
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-red-600">
          {error || "Could not load your account."}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Contact details tied to your login.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-sm font-bold hover:opacity-70"
            style={{ color: theme.colors.primary }}
          >
            <Pencil size={14} />
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-gray-700">Name</span>
            <input
              value={form.ownerName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ownerName: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-gray-700">
              Phone
            </span>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </label>

          {saveError && (
            <p role="alert" className="sm:col-span-2 text-sm text-red-600">
              {saveError}
            </p>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              style={{ backgroundColor: theme.colors.primary }}
              className="rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm({ ownerName: account.ownerName, phone: account.phone });
                setSaveError("");
                setEditing(false);
              }}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-gray-400">Name</p>
            <p className="font-semibold text-gray-900">{account.ownerName}</p>
          </div>
          <div>
            <p className="text-gray-400">Email</p>
            <p className="font-semibold text-gray-900">{account.email}</p>
          </div>
          <div>
            <p className="text-gray-400">Phone</p>
            <p className="font-semibold text-gray-900">
              {account.phone || "Not set"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export function DashboardPage() {
  const user = useDemoAuthStore((state) => state.user);
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [activeFilter, setActiveFilter] = useState<ListingFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingListing, setEditingListing] = useState<OwnerListing | null>(
    null,
  );
  const [managingProductsFor, setManagingProductsFor] =
    useState<OwnerListing | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMyListings()
      .then((result) => {
        if (!cancelled) setListings(result);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load your listings.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => ({
      approved: listings.filter(
        (listing) =>
          listing.status === "approved" || listing.status === "published",
      ).length,
      pending: listings.filter((listing) => listing.status === "pending")
        .length,
    }),
    [listings],
  );

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesFilter =
        activeFilter === "all" || listing.status === activeFilter;
      const matchesSearch =
        !query ||
        [
          listing.name,
          listing.category,
          listing.location,
          listing.phone,
          ...listing.services,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, listings, search]);

  function chooseFilter(filter: ListingFilter) {
    setActiveFilter(filter);
    setSearch("");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          My dashboard
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-950 sm:text-4xl">
          Welcome, {user?.name || "business owner"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-gray-500">
            Manage the listings registered under your account.
          </p>
          <Link
            href="/dashboard/bookings"
            style={{ color: theme.colors.primary }}
            className="text-sm font-bold hover:opacity-70"
          >
            View my bookings →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashboardCount
            active={activeFilter === "all"}
            count={listings.length}
            icon={<ListChecks size={20} />}
            label="All listings"
            onClick={() => chooseFilter("all")}
          />
          <DashboardCount
            active={activeFilter === "approved"}
            count={counts.approved}
            icon={<CheckCircle2 size={20} />}
            label="Published"
            onClick={() => chooseFilter("approved")}
            tone="green"
          />
          <DashboardCount
            active={activeFilter === "pending"}
            count={counts.pending}
            icon={<Clock3 size={20} />}
            label="Pending review"
            onClick={() => chooseFilter("pending")}
            tone="amber"
          />
        </div>

        <AccountCard />

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your listings</h2>
              <p className="mt-1 text-sm text-gray-500">
                Live status from your account.
              </p>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <label className="relative flex-1 sm:w-64">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your listings..."
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </label>

              <Link href="/register">
                <span
                  style={{
                    borderColor: theme.colors.primary,
                    color: theme.colors.primary,
                  }}
                  className="inline-flex whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-bold hover:bg-gray-50"
                >
                  + New listing
                </span>
              </Link>
            </div>
          </div>

          {loadError && (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {loadError}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {loading ? (
              <p className="col-span-full p-6 text-sm text-gray-500">
                Loading your listings…
              </p>
            ) : filteredListings.length ? (
              filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-gray-900">
                        {listing.name}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {listing.category}
                      </p>
                    </div>
                    <StatusBadge status={listing.status} />
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {listing.location}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock3 size={13} />
                      Submitted {formatDate(listing.submittedAt)}
                    </p>
                  </div>

                  {(listing.status === "approved" ||
                    listing.status === "published") && (
                    <Link
                      href={`/listings/${listing.slug}`}
                      style={{ color: theme.colors.primary }}
                      className="mt-4 inline-block text-sm font-bold hover:opacity-70"
                    >
                      View public listing →
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingListing(listing)}
                    style={{ color: theme.colors.primary }}
                    className="mt-4 ml-4 text-sm font-bold hover:opacity-70"
                  >
                    Edit listing →
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagingProductsFor(listing)}
                    className="mt-4 ml-4 inline-flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:opacity-70"
                  >
                    <Package size={14} />
                    Products
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                <p className="font-semibold text-gray-700">No listings found</p>
                <p className="mt-1 text-sm text-gray-500">
                  Register a new business to see it here.
                </p>
              </div>
            )}
          </div>
        </section>

        {editingListing && (
          <EditListingPanel
            listing={editingListing}
            onCancel={() => setEditingListing(null)}
            onSaved={async () => {
              const updated = await getMyListings();
              setListings(updated);
            }}
          />
        )}

        {managingProductsFor && (
          <ManageProductsPanel
            listing={managingProductsFor}
            onCancel={() => setManagingProductsFor(null)}
          />
        )}

        {!isBackendConfigured && (
          <p className="mt-4 text-sm text-amber-700">
            The backend URL is not configured, so this page is showing demo
            data.
          </p>
        )}
      </div>
    </main>
  );
}
