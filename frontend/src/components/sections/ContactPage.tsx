"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import { heroImages } from "@/data/heroImages";
import { contactSchema } from "@/lib/validation/account";
import type { z } from "zod";
import { sendContactMessage } from "@/services/api";

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      message: "",
      agreed: false,
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setSubmitError("");

    try {
      await sendContactMessage({
        name: values.name,
        email: values.email,
        message: values.message,
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't send your message. Please try again.",
      );
    }
  }
  function sendAnotherMessage() {
    reset();
    setSubmitted(false);
    setSubmitError("");
  }

  return (
    <div className="px-4 pb-16 pt-24 sm:px-6 sm:pt-28 md:px-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 lg:grid-cols-2">
        <div>
          {submitted ? (
            <div className="py-8">
              <CheckCircle2 size={52} style={{ color: theme.colors.primary }} />

              <p
                style={{ color: theme.colors.primary }}
                className="mt-5 text-xs font-semibold uppercase tracking-wide"
              >
                Thank you for reaching out!
              </p>

              <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Message sent
              </h1>

              <p className="mt-3 max-w-md text-gray-600">
                We&apos;ve received your message and will get back to you as
                soon as we can.
              </p>

              <Button
                label="Send Another Message"
                variant="secondary"
                className="mt-6"
                onClick={sendAnotherMessage}
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

              <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Contact Us
              </h1>

              <p className="mt-3 text-gray-600">
                Contact us for any questions or issues.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="mt-8 max-w-md space-y-4"
              >
                <div>
                  <div
                    className={
                      errors.name ? "rounded-xl ring-1 ring-red-500" : ""
                    }
                  >
                    <Input
                      placeholder="Name"
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                      {...register("name")}
                    />
                  </div>

                  {errors.name && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <div
                    className={
                      errors.email ? "rounded-xl ring-1 ring-red-500" : ""
                    }
                  >
                    <Input
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      {...register("email")}
                    />
                  </div>

                  {errors.email && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <textarea
                    placeholder="Type Your Message"
                    rows={4}
                    maxLength={2000}
                    aria-invalid={Boolean(errors.message)}
                    {...register("message")}
                    style={{
                      ["--hover-border" as string]: "#bdbdbd",
                      ["--focus-border" as string]: theme.colors.primary,
                      ["--focus-ring" as string]: theme.colors.primary,
                    }}
                    className={`w-full resize-none rounded-xl border px-5 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 hover:border-[var(--hover-border)] focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-ring)] ${
                      errors.message ? "border-red-500" : "border-gray-300"
                    }`}
                  />

                  {errors.message && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      {...register("agreed")}
                      style={{ accentColor: theme.colors.primary }}
                      className="h-4 w-4 shrink-0"
                    />
                    I agree to be contacted about my message
                  </label>

                  {errors.agreed && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.agreed.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  label={isSubmitting ? "Sending..." : "Send"}
                  disabled={isSubmitting}
                />
              </form>
            </>
          )}
        </div>

        <div className="h-[420px] overflow-hidden rounded-2xl border border-gray-200 lg:h-[520px]">
          <img
            src={heroImages[0]}
            alt="Get in touch"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
