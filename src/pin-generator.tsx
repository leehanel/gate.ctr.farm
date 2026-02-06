import { useState, useRef } from "react";
import "./index.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./language-switch";

const CLOUDFLARE_API = "https://pin-api.ctr-gate.workers.dev"; // Replace with your deployed URL

function GuestPinGenerator() {
  const { t } = useTranslation();
  const [adminPin, setAdminPin] = useState(["", "", "", ""]);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const updatePin = (index: number, value: string) => {
    if (value.length > 1) return;
    const updated = [...adminPin];
    updated[index] = value;
    setAdminPin(updated);
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !adminPin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setGeneratedPin(null);
    const pin = adminPin.join("");
    if (pin.length !== 4) {
      setError(t("admin_pin_incomplete"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${CLOUDFLARE_API}/generate-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPin: pin }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.reason || t("error_unknown"));
        setAdminPin(["", "", "", ""]);
        pinRefs.current[0]?.focus();
        return;
      }

      setGeneratedPin(data.pin);
      setAdminPin(["", "", "", ""]);
      pinRefs.current[0]?.focus();
    } catch (err) {
      setError(t("error_network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 bg-gradient-to-b from-slate-50 to-slate-200 font-sans text-gray-800">
      {/* Header */}
      <header className="relative w-full h-40 bg-white shadow-2xl flex flex-col justify-center items-center rounded-b-3xl overflow-hidden">
        <img
          src="header.png"
          alt={t("header_image_alt")}
          className="absolute w-full h-full object-cover opacity-60"
        />
        <div className="absolute top-3 right-4 z-20">
          <LanguageSwitcher />
        </div>
        <h1 className="relative z-10 text-4xl font-extrabold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          {t("title")}
        </h1>
        <Link
          to="/"
          className="absolute left-4 top-4 text-sm font-semibold text-white bg-black/30 backdrop-blur px-3 py-1 rounded-full hover:bg-black/50 transition"
        >
          ← {t("back")}
        </Link>
      </header>

      <main className="py-8 max-w-xl mx-auto space-y-8 pl-2 pr-2">
        <section className="bg-white rounded-3xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
          <h2 className="text-2xl font-semibold mb-2 text-slate-700">
            🔑 {t("generate_guest_pin_title")}
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            {t("generate_guest_pin_description")}
          </p>

          <div className="flex justify-center gap-3 mb-5">
            {adminPin.map((val, i) => (
              <input
                key={i}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={val}
                onChange={(e) => updatePin(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => {
                  pinRefs.current[i] = el;
                }}
                className="w-12 h-12 text-center border-2 border-slate-300 rounded-xl text-xl bg-slate-50"
              />
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={adminPin.some((digit) => digit === "") || loading}
            className="w-full py-3 rounded-full font-bold text-lg shadow-md bg-gradient-to-r from-emerald-500 to-lime-400 text-white hover:from-emerald-600 hover:to-lime-500 transition-all disabled:opacity-40"
          >
            {loading ? t("generating") : t("generate_button")}
          </button>

          {generatedPin && (
            <div className="mt-4 text-center">
              <p className="text-green-600 text-lg font-semibold">
                {t("pin_generated")}:{" "}
                <span className="font-mono text-xl">{generatedPin}</span>
              </p>

              <div className="mt-2 flex justify-center gap-3 items-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPin);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full transition-colors"
                >
                  📋 {t("copy_pin")}
                </button>
                {copied && (
                  <span className="text-green-600 text-sm font-medium">
                    ✅ {t("copied")}
                  </span>
                )}
              </div>

              <p className="text-sm mt-2 text-slate-600">
                {t("pin_expiration_note")}
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-center gap-3 items-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://your-github-pages-domain.github.io/guests"
                );
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full transition-colors"
            >
              🔗 {t("copy_guest_link")}
            </button>
            {linkCopied && (
              <span className="text-green-600 text-sm font-medium">
                ✅ {t("copied")}
              </span>
            )}
          </div>

          {error && (
            <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default GuestPinGenerator;
