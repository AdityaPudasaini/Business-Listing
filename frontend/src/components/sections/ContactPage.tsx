// ContactPage.tsx — the /contact page. Not wired to a real backend endpoint
// yet (no "contact message" model exists) — submitting just shows a thank
// you state locally. Replace handleSubmit's TODO with a real
// apiPost("/contact", {...}) once that endpoint exists.
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import { heroImages } from "@/data/heroImages";

export function ContactPage() {
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: POST to a real /contact endpoint once one exists.
    setSubmitted(true);
  }

  return (
    <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left — copy + form */}
        <div>
          {submitted ? (
            <div>
              <p
                style={{ color: theme.colors.primary }}
                className="text-xs font-semibold uppercase tracking-wide"
              >
                Thank you for reaching out!
              </p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
                Message Sent
              </h1>
              <p className="mt-3 text-gray-600 max-w-md">
                We've received your message and will get back to you as soon as
                we can.
              </p>
              <Button
                label="Send Another Message"
                variant="secondary"
                className="mt-6"
                onClick={() => setSubmitted(false)}
              />
            </div>
          ) : (
            <>
              <p
                style={{ color: theme.colors.primary }}
                className="text-xs font-semibold uppercase tracking-wide"
              >
                Get In Touch
              </p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
                Contact Us
              </h1>
              <p className="mt-3 text-gray-600">
                Contact us for any questions or issues.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4 max-w-md">
                <Input name="name" placeholder="Name" required />
                <Input type="email" name="email" placeholder="Email" required />

                <textarea
                  name="message"
                  placeholder="Type Your Message"
                  required
                  rows={4}
                  style={{
                    ["--hover-border" as string]: "#bdbdbd",
                    ["--focus-border" as string]: theme.colors.primary,
                    ["--focus-ring" as string]: theme.colors.primary,
                  }}
                  className="w-full rounded-xl border border-gray-300 px-5 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition-all duration-200 hover:border-[var(--hover-border)] focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-ring)]"
                />

                <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    required
                    style={{ accentColor: theme.colors.primary }}
                    className="h-4 w-4 shrink-0"
                  />
                  I agree to be contacted about my message
                </label>

                <Button type="submit" label="Send" />
              </form>
            </>
          )}
        </div>

        {/* Right — image */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 h-[420px] lg:h-[520px]">
          <img
            src={heroImages[0]}
            alt="Get in touch"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
