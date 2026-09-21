// PrivacyPage.tsx — Privacy Policy. Brand name comes from the active
// vertical. This is starter wording: have it reviewed before launch.

import { getActiveVertical } from "@/features/verticals";

export function PrivacyPage() {
  const vertical = getActiveVertical();
  const brand = vertical.brandName;
  const contactEmail = `hello@${brand.toLowerCase()}.com`;

  const sections = [
    {
      title: "Information We Collect",
      body: `When you create an account, list a ${vertical.labels.business}, make a booking, leave a review or contact us, we collect the details you give us: your name, email address, phone number, business details, photos and messages. If you use "Locate me" or search by location, we use your device location or the address you enter to show nearby results.`,
    },
    {
      title: "How We Use Your Information",
      body: `We use your information to run your account, show and review listings, pass booking requests to the ${vertical.labels.business} you choose, send account emails such as password resets, respond to your messages, and keep ${brand} secure and free of abuse.`,
    },
    {
      title: "What Other People Can See",
      body: "Business listings, including the name, address, phone number, photos and reviews you submit, are public once approved. Booking details are shared only with the business you book. We do not sell your personal information.",
    },
    {
      title: "Third-Party Services",
      body: "We use Google Maps to display maps and search addresses, and you can choose to sign in with Google or Facebook. These providers process data under their own privacy policies.",
    },
    {
      title: "Cookies and Local Storage",
      body: "We store a sign-in token and basic preferences in your browser so you stay logged in and the site works as expected. You can clear this at any time by signing out or clearing your browser data.",
    },
    {
      title: "Data Security and Retention",
      body: "We take reasonable steps to protect your information. We keep your data while your account is active and as long as needed to meet legal obligations, then delete or anonymise it.",
    },
    {
      title: "Your Choices",
      body: `You can update your account details from your dashboard. To request a copy of your data or ask us to delete your account, email ${contactEmail}.`,
    },
    {
      title: "Changes to This Policy",
      body: "We may update this policy from time to time. The latest version is always available on this page, and continued use of the platform means you accept the changes.",
    },
  ];

  return (
    <div className="px-4 pb-16 pt-24 sm:px-6 sm:pt-28 md:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold text-gray-950 sm:text-4xl">
          Privacy Policy
        </h1>

        <p className="mt-4 leading-relaxed text-gray-600">
          This policy explains what personal information {brand} collects and
          how it is used.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-gray-900">
                {index + 1}. {section.title}
              </h2>
              <p className="mt-2 leading-relaxed text-gray-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
