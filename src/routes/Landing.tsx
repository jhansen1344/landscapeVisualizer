import { Link } from "react-router-dom";
import { Leaf, Sparkles, View, Ruler } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-stone-50 to-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-brand-800">
          <Leaf className="h-6 w-6" />
          Native Plant Landscape Visualizer
        </div>
        <Link
          to="/design"
          className="text-sm font-medium px-4 py-2 rounded-lg bg-brand-700 text-white hover:bg-brand-800"
        >
          Open designer →
        </Link>
      </header>
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-stone-900">
            Design a garden bed with{" "}
            <span className="text-brand-700">native plants</span>.
          </h1>
          <p className="mt-4 text-lg text-stone-600 leading-relaxed">
            Drag and drop regional natives onto a scaled plan, see mature spread,
            generate a planting legend, and preview the finished bed at 1:1
            scale in augmented reality.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/design"
              className="px-5 py-3 rounded-lg bg-brand-700 text-white font-medium hover:bg-brand-800"
            >
              Start designing
            </Link>
            <a
              href="https://en.wikipedia.org/wiki/Native_plant"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              Why native plants?
            </a>
          </div>
        </div>
        <div className="aspect-square rounded-2xl bg-white border border-stone-200 shadow-sm p-6 grid grid-cols-2 gap-4">
          <FeatureCard
            icon={<Ruler className="h-5 w-5" />}
            title="Scaled plan"
            body="Circles match mature spread, measured in feet — like a landscape architect's drawing."
          />
          <FeatureCard
            icon={<Leaf className="h-5 w-5" />}
            title="Region-filtered"
            body="Palette curated to species native to your ecoregion and USDA zone."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Pollinator-first"
            body="Each plant notes sun, moisture, bloom, and wildlife value."
          />
          <FeatureCard
            icon={<View className="h-5 w-5" />}
            title="AR preview"
            body="Place your bed in your yard at 1:1 with WebXR on supported phones."
          />
        </div>
      </section>
      <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-stone-500 border-t border-stone-200">
        Designs save locally in your browser. Share via URL. No accounts, no tracking.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
      <div className="h-8 w-8 rounded-full bg-white grid place-items-center text-brand-700 mb-2">
        {icon}
      </div>
      <div className="font-semibold text-stone-900">{title}</div>
      <div className="text-xs text-stone-600 mt-1 leading-relaxed">{body}</div>
    </div>
  );
}
