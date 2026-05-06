import { HashRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Landing } from "./routes/Landing";
import { Designer } from "./routes/Designer";
import { SharedView } from "./routes/SharedView";

// Lazy: three.js + @react-three/* is ~1 MB; only load when user enters AR.
const ArView = lazy(() =>
  import("./routes/ArView").then((m) => ({ default: m.ArView }))
);

function ArFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-black text-white text-sm">
      Loading AR view…
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/design" element={<Designer />} />
        <Route
          path="/ar"
          element={
            <Suspense fallback={<ArFallback />}>
              <ArView />
            </Suspense>
          }
        />
        <Route path="/s/:hash" element={<SharedView />} />
      </Routes>
    </HashRouter>
  );
}
