import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { decodeDesignFromHash } from "../store/persistence";
import { useDesignStore } from "../store/useDesignStore";
import { Designer } from "./Designer";

export function SharedView() {
  const { hash } = useParams();
  const loadShared = useDesignStore((s) => s.loadSharedDesign);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) {
      setErr("Missing share code");
      return;
    }
    const d = decodeDesignFromHash(hash);
    if (!d) {
      setErr("Invalid or corrupted share link");
      return;
    }
    loadShared(d);
  }, [hash, loadShared]);

  if (err) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Can't open this design</h1>
          <p className="text-sm text-stone-500 mt-1">{err}</p>
          <a href="#/" className="mt-4 inline-block text-brand-700 hover:underline">
            Go home
          </a>
        </div>
      </div>
    );
  }

  return <Designer />;
}
