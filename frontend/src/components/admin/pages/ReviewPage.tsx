"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveListing,
  adminUpdateListing,
  getAdminListingDetail,
  rejectListing,
} from "@/services/api";
import {
  ListingWizard,
  type RegisterFormData,
} from "@/components/sections/RegisterPage";
import { toRegisterFormData, toUpdatePayload } from "@/lib/listingForm";
import { PageHeader } from "@/components/admin/shared";

export function AdminReviewPage({ id }: { id: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminListingDetail(id)
      .then((listing) => {
        if (!cancelled) setFormData(toRegisterFormData(listing));
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load this listing.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <PageHeader
        eyebrow="Review"
        title="Listing review"
        description="Review every submitted field before approving or rejecting this listing."
      />
      <div className="p-6 sm:p-8">
        {notice && (
          <div className="mb-6 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            {notice}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading listing…</p>
        ) : !formData ? (
          <p className="text-sm text-red-600">
            {error || "Listing not found."}
          </p>
        ) : (
          <ListingWizard
            embedded
            initialValues={formData}
            adminActions={{
              onSave: async (values) => {
                await adminUpdateListing(id, await toUpdatePayload(values));
                setFormData(values);
                setNotice("Listing changes saved.");
              },
              onApprove: async (values) => {
                await adminUpdateListing(id, await toUpdatePayload(values));
                await approveListing(id);
                router.push("/admin/review");
              },
              onReject: async () => {
                // ReviewsubmitStep asks for confirmation before calling this.
                await rejectListing(id);
                router.push("/admin/review");
              },
            }}
          />
        )}

        <button
          type="button"
          onClick={() => router.push("/admin/review")}
          className="mt-5 text-sm font-bold text-primary"
        >
          Back to review queue
        </button>
      </div>
    </>
  );
}
