// ReviewsSection.tsx — the rating summary + "Leave a Review" form on the

"use client";

import { useMemo, useState } from "react";
import { RatingStars } from "@/components/project/RatingStars";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import { Review } from "@/types";

interface ReviewsSectionProps {
  businessId: string;
  initialReviews?: Review[];
}

// The wireframe groups the 1–5 star scale into 4 rows rather than 5.
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

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const tierCounts = useMemo(
    () =>
      TIERS.map((tier) => {
        const count = reviews.filter(
          (r) => r.rating >= tier.min && r.rating <= tier.max,
        ).length;
        const pct = reviews.length ? (count / reviews.length) * 100 : 0;
        return { ...tier, count, pct };
      }),
    [reviews],
  );

  const canSubmit =
    rating > 0 &&
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // TODO: POST to a real reviews endpoint once one exists. For now this
    // just prepends to local state so the new review shows up immediately.
    const newReview: Review = {
      id: `local-${Date.now()}`,
      businessId,
      rating,
      title: title.trim(),
      message: message.trim(),
      authorName: `${firstName.trim()} ${lastName.trim()}`,
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) => [newReview, ...prev]);
    setRating(0);
    setTitle("");
    setMessage("");
    setFirstName("");
    setLastName("");
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 3000);
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Rating summary */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-8 p-6">
        <div>
          <p className="text-5xl font-extrabold text-gray-900 leading-none">
            {average.toFixed(1)}
          </p>
          <p className="mt-2 text-sm text-gray-500 whitespace-nowrap">
            Based on User Reviews
          </p>
        </div>

        <div className="flex flex-col justify-center gap-2">
          {tierCounts.map((tier) => (
            <div key={tier.label} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 text-gray-600">{tier.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  style={{
                    width: `${tier.pct}%`,
                    backgroundColor: theme.colors.primary,
                  }}
                  className="h-full rounded-full transition-all duration-300 ease-out"
                />
              </div>
              <span className="w-6 shrink-0 text-right text-gray-400">
                {tier.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 px-6 py-3 text-sm text-gray-400 bg-gray-50">
        {reviews.length === 0
          ? "There are currently No Reviews yet!"
          : `${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
      </div>

      {/* Existing reviews */}
      {reviews.length > 0 && (
        <div className="divide-y divide-gray-100">
          {reviews.map((r) => (
            <div key={r.id} className="px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-gray-900">{r.title}</p>
                <RatingStars rating={r.rating} readOnly />
              </div>
              <p className="mt-1 text-sm text-gray-600">{r.message}</p>
              <p className="mt-2 text-xs text-gray-400">{r.authorName}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leave a review */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-6 bg-gray-50"
      >
        <h3 className="text-sm font-bold tracking-wide text-gray-900">
          LEAVE A REVIEW
        </h3>

        <p className="mt-4 text-sm font-medium text-gray-700">
          Your overall Review!!
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <RatingStars
            rating={rating}
            onChange={setRating}
            className="text-xl"
          />
          <span className="text-sm text-gray-400">
            {rating === 0 ? "Select A Rating" : `${rating} / 5`}
          </span>
        </div>

        <label className="mt-5 block text-sm font-semibold text-gray-900">
          Title of the Review
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white"
        />

        <label className="mt-5 block text-sm font-semibold text-gray-900">
          Review
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white resize-none"
        />

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900">
              First Name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">
              Last Name
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-5">
          <Button
            type="submit"
            label="Submit"
            variant="primary"
            disabled={!canSubmit}
          />
          <p className="text-xs text-gray-400">
            {justSubmitted
              ? "Thanks — your review has been posted!"
              : "Pick a rating and fill out the form above to submit."}
          </p>
        </div>
      </form>
    </div>
  );
}
