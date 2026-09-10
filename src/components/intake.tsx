"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock3,
  Layers,
  ShoppingBag,
  PanelTop,
  MousePointer2,
  GalleryHorizontalEnd,
  RefreshCw,
  Sparkles,
  LockKeyhole,
} from "lucide-react";
import * as c from "@/lib/config";
import {
  draftSchema,
  initialBrief,
  validateStep,
  type Brief,
} from "@/lib/schema";
import {
  SelectionCard,
  MultiSelect,
  TextInput,
  URLInput,
  ProgressIndicator,
  FormNavigation,
  ReviewSection,
} from "./form-controls";
const STORAGE = "dolphy-project-start-v1";
const headlines = [
  "",
  "First, a little about you.",
  "What are we building?",
  "Find your kind of feeling.",
  "Let’s see what’s ready.",
  "The practical details.",
  "Looks good?",
];
const subtitles = [
  "",
  "The people and the story behind the brand.",
  "A new beginning, a fresh perspective, or something in between.",
  "There’s no right answer. Just what feels like your brand.",
  "We’ll meet you wherever you are in the process.",
  "A little context helps us find the right approach.",
  "Here’s the starting point for our conversation. Make it yours.",
];
const typeDescriptions = [
  "Sell products directly online.",
  "Bring your brand and services to life.",
  "One focused page. One clear purpose.",
  "Give your work a place to shine.",
  "A fresh start for an existing website.",
  "Let’s find the right fit together.",
];
const icons = [
  ShoppingBag,
  PanelTop,
  MousePointer2,
  GalleryHorizontalEnd,
  RefreshCw,
  Sparkles,
];
function Question({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="question">
      <h2>{title}</h2>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </section>
  );
}
export default function Intake() {
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [resume, setResume] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let id = crypto.randomUUID();
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const saved = JSON.parse(raw);
        const parsed = draftSchema.safeParse(saved.brief);
        if (parsed.success && Date.now() - saved.savedAt < 7 * 86400000) {
          setBrief({
            ...parsed.data,
            budget: c.budgetConfig.options.includes(parsed.data.budget)
              ? parsed.data.budget
              : "",
          });
          setResume(Math.max(1, Math.min(6, Number(saved.step) || 1)));
          if (typeof saved.id === "string" && /^[0-9a-f-]{36}$/i.test(saved.id))
            id = saved.id;
        } else localStorage.removeItem(STORAGE);
      }
    } catch {
      setStorageError(true);
    }
    setSubmissionId(id);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || success || step === 0) return;
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({ brief, step, id: submissionId, savedAt: Date.now() }),
      );
    } catch {
      setStorageError(true);
    }
  }, [brief, step, ready, success, submissionId]);
  useEffect(() => {
    if (step > 0 || success) {
      heading.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [step, success]);
  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((prev) => ({ ...prev, [key]: value }));
    setErrors({});
  }
  function go(n: number) {
    setErrors({});
    setServerError("");
    setStep(n);
  }
  async function next() {
    if (step < 6) {
      const e = validateStep(brief, step);
      setErrors(e);
      if (Object.keys(e).length) {
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLElement>('[aria-invalid="true"], .error-summary')
            ?.focus(),
        );
        return;
      }
      go(step + 1);
      return;
    }
    for (let s = 1; s <= 5; s++) {
      const e = validateStep(brief, s);
      if (Object.keys(e).length) {
        go(s);
        setErrors(e);
        return;
      }
    }
    setBusy(true);
    setServerError("");
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brief, honeypot, submissionId }),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(
          result.error || "Your brief could not be sent. Please try again.",
        );
      setSuccess(true);
      try {
        localStorage.removeItem(STORAGE);
      } catch {
        setStorageError(true);
      }
    } catch (error) {
      setServerError(
        error instanceof Error && error.name === "TimeoutError"
          ? "The connection took too long. Your answers are saved; please try again."
          : error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const text = (
    key: keyof Brief,
    label: string,
    required = false,
    placeholder = "",
    type = "text",
  ) => (
    <TextInput
      label={label}
      name={key}
      value={String(brief[key])}
      onChange={(e) => update(key, e.target.value as never)}
      required={required}
      placeholder={placeholder}
      type={type}
      maxLength={300}
      error={errors[key]}
      autoComplete={
        key === "name"
          ? "name"
          : key === "email"
            ? "email"
            : key === "phone"
              ? "tel"
              : key === "brand"
                ? "organization"
                : undefined
      }
    />
  );
  const area = (
    key: "description" | "avoid" | "notes",
    label: string,
    placeholder: string,
  ) => (
    <label className="field">
      <span>{label}</span>
      <textarea
        value={brief[key]}
        maxLength={1800}
        rows={3}
        placeholder={placeholder}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );
  const multi = (
    key: "industry" | "features" | "assets" | "services",
    options: string[],
    exclusive?: string,
  ) => (
    <MultiSelect
      label={key}
      value={brief[key]}
      options={options}
      onChange={(v) => update(key, v)}
      exclusive={exclusive}
    />
  );
  const single = (key: "size" | "timeline" | "budget", options: string[]) => (
    <div className="single-options" role="group" aria-label={key}>
      {options.map((o) => (
        <SelectionCard
          key={o}
          label={o}
          selected={brief[key] === o}
          onClick={() => update(key, o)}
        />
      ))}
    </div>
  );
  const reviewItems: [string, [string, string][]][] = [
    [
      "01 / You & your brand",
      [
        ["Name", brief.name],
        ["Email", brief.email],
        ["WhatsApp", brief.phone],
        ["Location", brief.location],
        ["Brand", brief.brand],
        ["Website", brief.website],
        ["Social", brief.social],
        ["Industry", brief.industry.join(", ")],
        ["About the brand", brief.description],
      ],
    ],
    [
      "02 / Your website",
      [
        ["Website type", brief.websiteType],
        ["Features", brief.features.join(", ")],
        [
          "Other feature",
          brief.features.includes("Other") ? brief.otherFeature : "",
        ],
        ["Approximate size", brief.size],
      ],
    ],
    [
      "03 / Creative direction",
      [
        ["Feeling", brief.moods.join(", ") || "Open to your direction"],
        ["References", brief.references.filter(Boolean).join("\n")],
        ["Please avoid", brief.avoid],
      ],
    ],
    [
      "04 / Assets & support",
      [
        ["Already ready", brief.assets.join(", ") || "Let’s discuss"],
        ["DOLPHY can help with", brief.services.join(", ") || "Let’s discuss"],
      ],
    ],
    [
      "05 / The project",
      [
        ["Launch", brief.timeline],
        [
          "Budget",
          brief.budget && brief.budget !== "Let’s discuss"
            ? `${brief.budget} · ${c.budgetConfig.currency}`
            : "Let’s discuss",
        ],
        ["Additional notes", brief.notes],
      ],
    ],
  ];
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="DOLPHY Project Start home">
          DOLPHY
        </a>
        <div className="header-title">
          <span /> PROJECT START
        </div>
        <a
          className="studio-link"
          href="https://thedolphy.com"
          target="_blank"
          rel="noreferrer"
        >
          Visit the studio <ArrowUpRight size={15} />
        </a>
      </header>
      {success ? (
        <main className="success">
          <div className="success-mark">
            <Check size={36} />
          </div>
          <p className="eyebrow">A NEW BEGINNING</p>
          <h1 ref={heading} tabIndex={-1}>
            You’re all set.
          </h1>
          <h2>Thanks, {brief.name.split(" ")[0]}.</h2>
          <p>
            We’ve received your project brief. We’ll review everything before
            our conversation so we can spend less time gathering information and
            more time talking about the right direction for your project.
          </p>
          <span className="signature">— DOLPHY</span>
        </main>
      ) : step === 0 ? (
        <main className="welcome">
          <div className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="tiny-line" /> GOOD THINGS START HERE
              </p>
              <h1>
                Let’s shape
                <br />
                your <span className="serif">website.</span>
                <span className="blue-dot">*</span>
              </h1>
              <p className="hero-description">
                A few quick questions will help us understand your brand, your
                goals, and what you’re looking to build.
              </p>
              <div className="hero-action">
                <button
                  className="primary"
                  disabled={!ready}
                  onClick={() => go(resume || 1)}
                >
                  {resume ? "Continue your project" : "Start Project"}
                  <ArrowUpRight size={19} />
                </button>
                <span>
                  <Clock3 size={15} /> About 3–5 minutes
                </span>
              </div>
              <p className="no-tech">
                No technical knowledge needed. Just your ideas.
              </p>
              {resume > 0 && (
                <button
                  className="reset-link"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Clear your saved answers and start a new brief?",
                      )
                    ) {
                      setBrief(initialBrief);
                      setResume(0);
                      setSubmissionId(crypto.randomUUID());
                      try {
                        localStorage.removeItem(STORAGE);
                      } catch {}
                      go(1);
                    }
                  }}
                >
                  Or start fresh
                </button>
              )}
            </div>
            <div
              className="hero-art"
              aria-label="Abstract blue folded ribbon with a project note"
              role="img"
            >
              <div className="art-grid" />
              <div className="art-caption">
                <span>YOUR NEXT CHAPTER</span>
                <span>001 — ∞</span>
              </div>
              <div className="ribbon ribbon-one" />
              <div className="ribbon ribbon-two" />
              <div className="ribbon ribbon-three" />
              <span className="art-spark">✳</span>
              <div className="floating-note">
                <span className="note-icon">
                  <Layers size={19} />
                </span>
                <div>
                  <strong>
                    A little clarity.
                    <br />A lot of possibility.
                  </strong>
                  <span>YOUR IDEAS, TAKING SHAPE.</span>
                </div>
              </div>
              <div className="art-bottom">
                A starting point for something great.
                <ArrowUpRight size={17} />
              </div>
            </div>
          </div>
          <section className="journey">
            <div className="journey-intro">
              <span className="eyebrow">THE SHORT VERSION</span>
              <h2>
                Your idea.
                <br />
                Our next conversation.
              </h2>
            </div>
            <div className="journey-step">
              <span>01</span>
              <h3>A little about you</h3>
              <p>
                Your brand, your world,
                <br />
                and what makes it yours.
              </p>
            </div>
            <div className="journey-step">
              <span>02</span>
              <h3>The bigger picture</h3>
              <p>
                What you need and
                <br />
                how it should feel.
              </p>
            </div>
            <div className="journey-step">
              <span>03</span>
              <h3>A clear starting point</h3>
              <p>
                We’ll bring it all together
                <br />
                before our first call.
              </p>
            </div>
          </section>
        </main>
      ) : (
        <main className="intake">
          <ProgressIndicator step={step} onNavigate={go} />
          <div className="form-layout">
            <aside className="form-aside">
              <span className="eyebrow">
                {step === 6
                  ? "THE BIG PICTURE"
                  : `CHAPTER ${String(step).padStart(2, "0")} OF 05`}
              </span>
              <div className="aside-symbol" aria-hidden="true">
                {["", "✳", "↗", "◒", "▧", "◷", "✓"][step]}
              </div>
              <p>
                {
                  [
                    "",
                    "Every great website starts with a story. This one is yours.",
                    "Let’s make room for what your website could become.",
                    "Different brands. Different feelings. Yours should feel like you.",
                    "A head start is great. A blank canvas is, too.",
                    "No perfect answers needed. A rough idea is a great start.",
                    "Your ideas, all in one place. Ready for what’s next.",
                  ][step]
                }
              </p>
              <span className="aside-signature">MADE OF POSSIBILITIES.</span>
            </aside>
            <form
              className="form-content"
              onSubmit={(e) => {
                e.preventDefault();
                void next();
              }}
              noValidate
            >
              <div className="section-heading">
                <span className="eyebrow">
                  {step === 6
                    ? "YOUR PROJECT BRIEF"
                    : `${String(step).padStart(2, "0")} / ${c.sections[step - 1].toUpperCase()}`}
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  {headlines[step]}
                </h1>
                <p>{subtitles[step]}</p>
              </div>
              {Object.keys(errors).length > 0 && (
                <div className="error-summary" role="alert" tabIndex={-1}>
                  Let’s check a couple of things.
                  <ul>
                    {Object.entries(errors).map(([key, v]) => (
                      <li key={key}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
              {step === 1 && (
                <>
                  <div className="input-grid">
                    {text("name", "Full name", true, "Alex Morgan")}
                    {text(
                      "email",
                      "Email address",
                      true,
                      "alex@yourbrand.com",
                      "email",
                    )}
                    {text("phone", "Phone / WhatsApp", false, "+1", "tel")}
                    {text(
                      "location",
                      "City + country",
                      false,
                      "New York, United States",
                    )}
                    {text("brand", "Brand / business name", true, "Your brand")}
                    <URLInput
                      label="Current website (optional)"
                      name="website"
                      value={brief.website}
                      onChange={(e) => update("website", e.target.value)}
                      error={errors.website}
                    />
                    <URLInput
                      label="Social media link (optional)"
                      name="social"
                      value={brief.social}
                      onChange={(e) => update("social", e.target.value)}
                      error={errors.social}
                    />
                  </div>
                  <Question
                    title="What world does your brand live in?"
                    hint="Pick the ones that feel right."
                  >
                    {multi("industry", c.industries)}
                  </Question>
                  <Question title="The brand, in a sentence or two.">
                    {area(
                      "description",
                      "What do you sell, create, or provide?",
                      "A little context goes a long way…",
                    )}
                  </Question>
                </>
              )}
              {step === 2 && (
                <>
                  <Question title="What are you looking to build?">
                    <div className="type-grid">
                      {c.websiteTypes.map((type, i) => {
                        const Icon = icons[i];
                        return (
                          <SelectionCard
                            key={type}
                            label={type}
                            description={typeDescriptions[i]}
                            selected={brief.websiteType === type}
                            onClick={() => update("websiteType", type)}
                          >
                            <Icon size={23} strokeWidth={1.5} />
                          </SelectionCard>
                        );
                      })}
                    </div>
                  </Question>
                  <Question
                    title="What should people be able to do?"
                    hint="Choose as many as you need."
                  >
                    {multi("features", c.features)}
                    {brief.features.includes("Other") && (
                      <div className="reveal">
                        {text(
                          "otherFeature",
                          "What else should people be able to do?",
                          true,
                        )}
                      </div>
                    )}
                  </Question>
                  <Question
                    title={`Approximately how many ${brief.websiteType === "Online Store" ? "products" : brief.websiteType === "Portfolio" ? "projects" : "pages or services"}?`}
                  >
                    {single("size", c.sizes)}
                  </Question>
                </>
              )}
              {step === 3 && (
                <>
                  <Question
                    title="How should your brand feel?"
                    hint={`Choose up to three directions. ${brief.moods.length}/3 selected.`}
                  >
                    <div className="mood-grid">
                      {c.moods.map((mood, i) => (
                        <SelectionCard
                          key={mood}
                          label={mood}
                          selected={brief.moods.includes(mood)}
                          disabled={
                            brief.moods.length >= 3 &&
                            !brief.moods.includes(mood)
                          }
                          onClick={() =>
                            update(
                              "moods",
                              brief.moods.includes(mood)
                                ? brief.moods.filter((v) => v !== mood)
                                : [...brief.moods, mood],
                            )
                          }
                        >
                          <div
                            className={`mood-sample mood-${i}`}
                            aria-hidden="true"
                          >
                            {
                              [
                                "less.",
                                "Élan",
                                "BOLD.",
                                "Aa",
                                "hello!",
                                "The Edit",
                                "[ NEXT ]",
                                "grow.",
                                "é",
                                "FORM_",
                                "softly",
                                "crafted.",
                              ][i]
                            }
                          </div>
                        </SelectionCard>
                      ))}
                    </div>
                  </Question>
                  <Question
                    title="Any websites or brands you like?"
                    hint="They don’t have to be competitors — any look, feeling, or experience you like is useful."
                  >
                    <div className="references">
                      {brief.references.map((url, i) => (
                        <URLInput
                          key={i}
                          label={`Reference ${i + 1} (optional)`}
                          name={`reference-${i}`}
                          value={url}
                          error={errors[`references.${i}`]}
                          onChange={(e) =>
                            update(
                              "references",
                              brief.references.map((v, n) =>
                                n === i ? e.target.value : v,
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  </Question>
                  {area(
                    "avoid",
                    "Anything you definitely don’t want? (optional)",
                    "A style, a colour, a feeling — anything to steer clear of.",
                  )}
                </>
              )}
              {step === 4 && (
                <>
                  <Question
                    title="What is already ready?"
                    hint="A few pieces or a blank canvas — both are a good place to start."
                  >
                    {multi("assets", c.assets, "Nothing Yet")}
                  </Question>
                  <Question
                    title="What would you like DOLPHY to help with?"
                    hint="Think beyond the website, if you like."
                  >
                    {multi("services", c.services)}
                  </Question>
                  <div className="gentle-note">
                    <Sparkles size={20} />
                    <p>
                      You don’t need to have it all figured out.
                      <br />
                      <strong>That’s what our conversation is for.</strong>
                    </p>
                  </div>
                </>
              )}
              {step === 5 && (
                <>
                  <Question title="When would you like to launch?">
                    {single("timeline", c.timelines)}
                  </Question>
                  <Question
                    title="What budget feels comfortable? (optional)"
                    hint={`A rough idea is enough. Choose a range for the website design and build, or leave this for our conversation. ${c.budgetConfig.currency}, one-time project budget.`}
                  >
                    {single("budget", c.budgetConfig.options)}
                    <p className="budget-reassurance">
                      This isn’t a quote or a commitment. We’ll agree on the
                      scope and price together. Hosting and any ongoing costs
                      will be discussed separately.
                    </p>
                  </Question>
                  <Question title="Anything else before we talk?">
                    {area(
                      "notes",
                      "Additional notes (optional)",
                      "An idea, a question, or something we haven’t asked…",
                    )}
                  </Question>
                </>
              )}
              {step === 6 && (
                <>
                  <div className="review-list">
                    {reviewItems.map(([title, items], i) => (
                      <ReviewSection
                        key={title}
                        title={title}
                        items={items}
                        onEdit={() => go(i + 1)}
                      />
                    ))}
                  </div>
                  <p className="privacy-note">
                    <LockKeyhole size={15} /> Your details will be shared with
                    DOLPHY and stored in its private project dashboard to
                    prepare for your conversation. This isn’t a commitment or a
                    payment.
                  </p>
                </>
              )}
              <div className="honeypot" aria-hidden="true">
                <label>
                  Leave this field empty
                  <input
                    name="company_fax"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </label>
              </div>
              {serverError && (
                <p className="error-summary" role="alert">
                  {serverError}
                </p>
              )}
              <FormNavigation
                step={step}
                busy={busy}
                onBack={() => go(step - 1)}
                onNext={() => void next()}
              />
              <p className="saved-note" role="status">
                {storageError
                  ? "Your browser could not save progress. Keep this tab open until you finish."
                  : "Your progress is saved on this device for 7 days. Cleared after sending."}
              </p>
            </form>
          </div>
        </main>
      )}
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} DOLPHY</span>
        <span>Thoughtful websites. Meaningful beginnings.</span>
        <span>
          DESIGNED TO CONNECT <span className="footer-star">✳</span>
        </span>
      </footer>
    </div>
  );
}
