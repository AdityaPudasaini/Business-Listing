// TermsPage.tsx — Terms and Conditions. Brand name and vertical-specific
// clauses come from the active vertical, so nothing here is hardcoded to Auto.

import { getActiveVertical } from "@/features/verticals";

export function TermsPage() {
  const vertical = getActiveVertical();
  const brand = vertical.brandName;

  const sections = [
    {
      title: "Terms Agreement Requirement",
      body: `When listing your ${vertical.labels.business} on ${brand}, you must accept all the terms and conditions mentioned here. The listing process cannot be completed without agreeing to these terms.`,
    },
    {
      title: "Listing Review and Approval",
      body: `All listings will be reviewed by ${brand}. Listings that do not meet our standards or are deemed inappropriate will be rejected.`,
    },
    // The lubricant distribution clause only applies to the Auto deployment.
    ...(vertical.id === "auto"
      ? [
          {
            title: "Lubricant Sales",
            body: `${brand} is an authorized distributor of high-quality lubricant brands Bluefish and Powerex. After your listing is approved, you can purchase and sell these lubricants through our platform free of service charges. If any fees apply, you must pay them according to company policies.`,
          },
        ]
      : []),
    {
      title: "User Responsibility",
      body: "Users must provide accurate and truthful information in their listings. Listings containing false or misleading information may be removed or disabled.",
    },
    {
      title: "Intellectual Property Rights",
      body: "All content must respect intellectual property rights. Use of trademarks or copyrighted materials without permission is prohibited.",
    },
    {
      title: "Limitation of Liability",
      body: `${brand} is not responsible for any disputes arising between listed businesses and users on the platform.`,
    },
    {
      title: "Amendments to Terms",
      body: "We reserve the right to modify these terms and conditions at any time without prior notice. Continued use of the platform constitutes acceptance of any changes.",
    },
  ];

  return (
    <div className="px-4 pb-16 pt-24 sm:px-6 sm:pt-28 md:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold text-gray-950 sm:text-4xl">
          Terms and Conditions
        </h1>

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
