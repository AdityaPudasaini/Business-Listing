// HowItWorks.tsx — "How it works": an image collage on the left, a vertical
// timeline of steps on the right. Content lives in data/howItWorks.ts.
import { theme } from "@/config/theme";
import { howItWorksSteps, howItWorksImages } from "@/data/howItWorks";

export function HowItWorks() {
  return (
    <section
      style={{ backgroundColor: theme.colors.surface }}
      className="px-6 md:px-14 py-20"
    >
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Image collage */}
        <div className="relative max-w-lg mx-auto md:mx-0">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={howItWorksImages.main}
              alt="Mechanic servicing a vehicle"
              className="w-full h-[26rem] object-cover"
            />
          </div>
          <div className="hidden sm:block absolute -bottom-8 -right-8 w-52 h-40 rounded-xl overflow-hidden shadow-lg ring-4 ring-white">
            <img
              src={howItWorksImages.overlay}
              alt="Mechanic at work"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            How it works
          </h2>

          <div className="relative mt-10 space-y-12">
            <div className="absolute left-7 top-7 bottom-7 w-1.5 -translate-x-1/2 rounded-full bg-gray-900" />
            {howItWorksSteps.map((step) => (
              <div key={step.title} className="relative flex gap-5">
                <div
                  style={{ ["--hover-bg" as string]: theme.colors.primary }}
                  className="relative z-10 h-14 w-14 shrink-0 rounded-xl bg-white text-gray-900 flex items-center justify-center shadow-sm transition-colors duration-300 hover:bg-[var(--hover-bg)] hover:text-white"
                >
                  <step.icon size={26} />
                </div>
                <div className="pt-2">
                  <h4 className="text-lg font-bold text-gray-900">
                    {step.title}
                  </h4>
                  <p className="mt-1.5 text-base text-gray-500 max-w-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
