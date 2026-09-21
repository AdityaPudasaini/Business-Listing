"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { RatingStars } from "@/components/project/RatingStars";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import type { Review } from "@/types";
import {
  createReview,
  deleteReview,
  getReviews,
  getSession,
  isBackendConfigured,
} from "@/services/api";
import { reviewSchema } from "@/lib/validation/interaction";
import type { z } from "zod";

interface ReviewsSectionProps {
  businessId: string;
  initialReviews?: Review[];
}

type ReviewFormValues = z.infer<typeof reviewSchema>;

const TIERS: { label: string; min: number; max: number }[] = [
  { label: "Excellent", min: 5, max: 5 },
  { label: "Great", min: 4, max: 4 },
  { label: "Average", min: 3, max: 3 },
  { label: "Poor", min: 1, max: 2 },
];

export function ReviewsSection({
  businessId,
  initialReviews = [],
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!isBackendConfigured) return;

    let cancelled = false;

    getReviews(businessId)
      .then((loadedReviews) => {
        if (!cancelled) setReviews(loadedReviews);
      })
      .catch(() => {
        // Keep the server-rendered/demo reviews visible if the API is offline.
      });

    getSession()
      .then((session) => {
        if (!cancelled) setCurrentUserId(session?.userId ?? null);
      })
      .catch(() => {
        // Not logged in / session lookup failed — delete action just stays hidden.
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  async function handleDelete(reviewId: string) {
    setDeleteError("");
    setDeletingId(reviewId);
    try {
      await deleteReview(reviewId);
      setReviews((current) => current.filter((r) => r.id !== reviewId));
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "We could not delete that review. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      rating: 0,
      title: "",
      message: "",
      firstName: "",
      lastName: "",
    },
  });

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const tierCounts = useMemo(
    () =>
      TIERS.map((tier) => {
        const count = reviews.filter(
          (review) => review.rating >= tier.min && review.rating <= tier.max,
        ).length;

        const pct = reviews.length ? (count / reviews.length) * 100 : 0;

        return { ...tier, count, pct };
      }),
    [reviews],
  );

  async function onSubmit(values: ReviewFormValues) {
    setSubmitError("");

    try {
      const input = {
        rating: values.rating,
        title: values.title.trim(),
        message: values.message.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      };

      const newReview: Review = isBackendConfigured
        ? await createReview(businessId, input)
        : {
            id: `local-review-${Date.now()}`,
            businessId,
            rating: input.rating,
            title: input.title,
            message: input.message,
            authorName: `${input.firstName} ${input.lastName}`,
            createdAt: new Date().toISOString(),
          };

      setReviews((current) => [newReview, ...current]);

      reset();
      setJustSubmitted(true);

      window.setTimeout(() => {
        setJustSubmitted(false);
      }, 3000);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not post your review. Please try again.",
      );
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="grid grid-cols-1 gap-8 p-6 sm:grid-cols-[auto_1fr]">
        <div>
          <p className="text-5xl font-extrabold leading-none text-gray-900">
            {average.toFixed(1)}
          </p>

          <p className="mt-2 whitespace-nowrap text-sm text-gray-500">
            Based on User Reviews
          </p>
        </div>

        <div className="flex flex-col justify-center gap-2">
          {TIERS.map((tier) => {
            const tierData = tierCounts.find(
              (item) => item.label === tier.label,
            );

            return (
              <div key={tier.label} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-gray-600">
                  {tier.label}
                </span>

                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    style={{
                      width: `${tierData?.pct ?? 0}%`,
                      backgroundColor: theme.colors.primary,
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>

                <span className="w-6 shrink-0 text-right text-gray-400">
                  {tierData?.count ?? 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-sm text-gray-400">
        {reviews.length === 0
          ? "There are currently no reviews yet!"
          : `${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
      </div>

      {reviews.length > 0 && (
        <div className="divide-y divide-gray-100">
          {reviews.map((review) => (
            <div key={review.id} className="px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-gray-900">{review.title}</p>

                <div className="flex items-center gap-3 shrink-0">
                  <RatingStars rating={review.rating} readOnly />

                  {review.userId && review.userId === currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      aria-label="Delete your review"
                      className="text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-1 text-sm text-gray-600">{review.message}</p>

              <p className="mt-2 text-xs text-gray-400">{review.authorName}</p>
            </div>
          ))}
        </div>
      )}

      {deleteError && (
        <p
          role="alert"
          className="border-t border-gray-100 px-6 py-3 text-sm text-red-600"
        >
          {deleteError}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="border-t border-gray-200 bg-gray-50 p-6"
      >
        <h3 className="text-sm font-bold tracking-wide text-gray-900">
          LEAVE A REVIEW
        </h3>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">
            Your overall review
          </p>

          <div className="mt-1.5 flex items-center gap-3">
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <RatingStars
                  rating={field.value}
                  onChange={field.onChange}
                  className="text-xl"
                />
              )}
            />

            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <span className="text-sm text-gray-400">
                  {field.value === 0 ? "Select a rating" : `${field.value} / 5`}
                </span>
              )}
            />
          </div>

          {errors.rating && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.rating.message}
            </p>
          )}
        </div>

        <div className="mt-5">
          <label className="block text-sm font-semibold text-gray-900">
            Title of the Review
          </label>

          <input
            placeholder="Title"
            maxLength={100}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
            className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
              errors.title
                ? "border-red-500 focus:ring-red-100"
                : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"
            }`}
          />

          {errors.title && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="mt-5">
          <label className="block text-sm font-semibold text-gray-900">
            Review
          </label>

          <textarea
            placeholder="Message"
            rows={3}
            maxLength={1000}
            aria-invalid={Boolean(errors.message)}
            {...register("message")}
            className={`mt-1.5 w-full resize-none rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
              errors.message
                ? "border-red-500 focus:ring-red-100"
                : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"
            }`}
          />

          {errors.message && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.message.message}
            </p>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-900">
              First Name
            </label>

            <input
              placeholder="First Name"
              maxLength={50}
              autoComplete="given-name"
              aria-invalid={Boolean(errors.firstName)}
              {...register("firstName")}
              className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                errors.firstName
                  ? "border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"
              }`}
            />

            {errors.firstName && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900">
              Last Name
            </label>

            <input
              placeholder="Last Name"
              maxLength={50}
              autoComplete="family-name"
              aria-invalid={Boolean(errors.lastName)}
              {...register("lastName")}
              className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                errors.lastName
                  ? "border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"
              }`}
            />

            {errors.lastName && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-5">
          <Button
            type="submit"
            label={isSubmitting ? "Submitting..." : "Submit"}
            variant="primary"
            disabled={isSubmitting}
          />

          <p className="text-xs text-gray-400">
            {justSubmitted
              ? "Thanks — your review has been posted!"
              : "Choose a rating and complete the fields above to submit."}
          </p>
        </div>

        {submitError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {submitError}
          </p>
        )}
      </form>
    </div>
  );
}
