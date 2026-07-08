"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Info } from "lucide-react";
import { submitWaitlist, type WaitlistResult } from "@/app/actions";
import { useLanguage } from "@/lib/language-context";
import {
  compareUses,
  estimateLease,
  formatBRL,
  UFS,
  type Estimate,
} from "@/lib/appraisal-data";

type Query = {
  uf: string;
  municipality: string;
  hectares: number;
  purpose: string;
  crop: string;
};

function LeadSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Appraiser() {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState<Query | null>(null);
  const [purposeSel, setPurposeSel] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [leadState, leadAction] = useActionState<WaitlistResult | null, FormData>(
    async (_prev, formData) => submitWaitlist(formData),
    null,
  );

  const a = t.appraiser;

  function handleCalculate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q: Query = {
      uf: String(fd.get("uf") ?? ""),
      municipality: String(fd.get("municipality") ?? "").trim(),
      hectares: Number(fd.get("hectares") ?? 0),
      purpose: String(fd.get("purpose") ?? ""),
      crop: String(fd.get("crop") ?? ""),
    };
    if (!q.uf || !q.purpose || !q.hectares || q.hectares <= 0) return;
    setQuery(q);
    setEstimate(estimateLease(q.purpose, q.uf, q.crop || undefined));
  }

  const purposeLabel =
    query &&
    (t.waitlist.purposeOptions.find((o) => o.value === query.purpose)?.label ??
      query.purpose);

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-2xl px-6">
        <p className="text-center text-sm font-bold uppercase tracking-wide text-primary">
          {a.eyebrow}
        </p>
        <h1 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
          {a.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-base text-deep/70">
          {a.subtitle}
        </p>

        <form
          onSubmit={handleCalculate}
          className="mt-8 space-y-4 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="uf" className="text-sm font-semibold text-deep">
                {a.stateLabel}
              </label>
              <select id="uf" name="uf" required defaultValue="" className={inputCls}>
                <option value="" disabled>
                  UF
                </option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="ap-municipality"
                className="text-sm font-semibold text-deep"
              >
                {a.municipalityLabel}
              </label>
              <input
                id="ap-municipality"
                name="municipality"
                type="text"
                required
                placeholder={a.municipalityPlaceholder}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="hectares" className="text-sm font-semibold text-deep">
                {a.hectaresLabel}
              </label>
              <input
                id="hectares"
                name="hectares"
                type="number"
                min="1"
                step="any"
                required
                placeholder={a.hectaresPlaceholder}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="ap-purpose" className="text-sm font-semibold text-deep">
                {a.purposeLabel}
              </label>
              <select
                id="ap-purpose"
                name="purpose"
                required
                value={purposeSel}
                onChange={(e) => setPurposeSel(e.target.value)}
                className={inputCls}
              >
                <option value="" disabled>
                  {a.purposePlaceholder}
                </option>
                {t.waitlist.purposeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {a.crops[purposeSel] && (
            <div>
              <label htmlFor="ap-crop" className="text-sm font-semibold text-deep">
                {a.cropLabel}
              </label>
              <select
                id="ap-crop"
                name="crop"
                key={purposeSel}
                defaultValue=""
                className={inputCls}
              >
                <option value="">{a.cropPlaceholder}</option>
                {a.crops[purposeSel].map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-accent px-6 py-3.5 text-base font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
          >
            {a.submit}
          </button>
        </form>

        {query && estimate && (
          <div className="mt-8 rounded-2xl bg-neutral p-6 sm:p-8">
            {estimate.kind === "range" ? (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
                  {a.resultTitle}
                </h2>
                <p className="mt-1 text-sm text-deep/60">
                  {(query.crop &&
                    a.crops[query.purpose]?.find((c) => c.value === query.crop)
                      ?.label) ||
                    purposeLabel}{" "}
                  · {query.municipality}, {query.uf} · {query.hectares} ha
                </p>
                <p className="mt-4 text-3xl font-extrabold text-deep sm:text-5xl">
                  {formatBRL(estimate.minPerHa * query.hectares)} –{" "}
                  {formatBRL(estimate.maxPerHa * query.hectares)}
                  <span className="ml-2 text-lg font-bold text-deep/50">
                    /{lang === "en" ? "year" : "ano"}
                  </span>
                </p>
                <p className="mt-2 text-base font-semibold text-deep/70">
                  {formatBRL(estimate.minPerHa)} – {formatBRL(estimate.maxPerHa)}{" "}
                  {a.perHaYear}
                </p>
                {query.crop && a.cropNotes[query.crop] && (
                  <p className="mt-2 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
                    🌱 {a.cropNotes[query.crop]}
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg font-extrabold text-deep">{a.consultTitle}</h2>
                <p className="mt-2 text-sm leading-relaxed text-deep/70">
                  {a.consultBody}
                </p>
                {query.crop && a.cropNotes[query.crop] && (
                  <p className="mt-3 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
                    🌱 {a.cropNotes[query.crop]}
                  </p>
                )}
                {(() => {
                  const comps = compareUses(query.uf);
                  const top = comps.find((c) => !c.selective) ?? comps[0];
                  if (!top) return null;
                  const labelOf = (p: string) =>
                    t.waitlist.purposeOptions.find((o) => o.value === p)?.label ?? p;
                  return (
                    <>
                      <p className="mt-4 text-sm font-semibold text-deep/70">
                        {a.consultPotential.replace("{use}", labelOf(top.purpose))}
                      </p>
                      <p className="mt-2 text-3xl font-extrabold text-deep sm:text-5xl">
                        {formatBRL(top.minPerHa * query.hectares)} –{" "}
                        {formatBRL(top.maxPerHa * query.hectares)}
                        <span className="ml-2 text-lg font-bold text-deep/50">
                          /{lang === "en" ? "year" : "ano"}
                        </span>
                      </p>
                    </>
                  );
                })()}
              </>
            )}

            {/* Regional use comparison */}
            {(() => {
              const comps = compareUses(query.uf)
                .filter((c) => !c.selective || c.purpose === query.purpose)
                .slice(0, 4);
              if (comps.length < 2) return null;
              const chosen = comps.find((c) => c.purpose === query.purpose);
              const topRealistic = comps.find(
                (c) => !c.selective && c.purpose !== query.purpose,
              );
              const showUpsell =
                estimate.kind === "range" &&
                chosen &&
                !!topRealistic &&
                topRealistic.mid >= chosen.mid * 1.5;
              const labelOf = (p: string) =>
                t.waitlist.purposeOptions.find((o) => o.value === p)?.label ?? p;
              return (
                <div className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-deep/60">
                    {a.compareTitle}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {comps.map((c) => {
                      const isChosen = c.purpose === query.purpose;
                      return (
                        <li
                          key={c.purpose}
                          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm ${
                            isChosen
                              ? "bg-primary/10 font-bold text-deep ring-1 ring-primary/30"
                              : "bg-white text-deep/75"
                          }`}
                        >
                          <span>
                            {labelOf(c.purpose)}
                            {isChosen && (
                              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                                {a.compareYourChoice}
                              </span>
                            )}
                            {c.selective && (
                              <span className="mt-0.5 block text-xs font-normal text-deep/50">
                                {a.selectiveTag}
                              </span>
                            )}
                          </span>
                          <span className="whitespace-nowrap font-semibold">
                            {formatBRL(c.minPerHa)}–{formatBRL(c.maxPerHa)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {showUpsell && chosen && topRealistic && (
                    <p className="mt-3 rounded-xl bg-accent/20 px-4 py-3 text-sm font-semibold text-deep">
                      💡{" "}
                      {a.compareUpsell
                        .replace("{use}", labelOf(topRealistic.purpose))
                        .replace(
                          "{ratio}",
                          (
                            Math.round((topRealistic.mid / chosen.mid) * 10) / 10
                          ).toLocaleString(lang === "en" ? "en-US" : "pt-BR"),
                        )}
                    </p>
                  )}
                  <p className="mt-2 text-xs leading-relaxed text-deep/55">
                    {a.compareCaveat}
                  </p>
                </div>
              );
            })()}

            <p className="mt-5 flex gap-2 text-xs leading-relaxed text-deep/55">
              <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {a.disclaimer}
                {estimate.kind === "range" && <> {a.legalNote}</>}
              </span>
            </p>

            {/* Lead capture — posts to the same waitlist sheet */}
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              {leadState?.ok ? (
                <div className="flex items-center gap-2 text-deep">
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <p className="font-semibold">{t.waitlist.success}</p>
                </div>
              ) : (
                <>
                  <h3 className="text-base font-extrabold text-deep">{a.leadTitle}</h3>
                  <p className="mt-1 text-sm text-deep/60">{a.leadSubtitle}</p>
                  <form action={leadAction} className="mt-4 space-y-3">
                    <input type="hidden" name="language" value={lang} />
                    <input type="hidden" name="country" value={lang === "en" ? "Brazil" : "Brasil"} />
                    <input type="hidden" name="state" value={query.uf} />
                    <input type="hidden" name="municipality" value={query.municipality} />
                    <input type="hidden" name="purpose" value={query.purpose} />
                    {query.crop && (
                      <input
                        type="hidden"
                        name="purposeDetail"
                        value={
                          a.crops[query.purpose]?.find((c) => c.value === query.crop)
                            ?.label ?? query.crop
                        }
                      />
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder={t.waitlist.namePlaceholder}
                        aria-label={t.waitlist.nameLabel}
                        className={inputCls}
                      />
                      <input
                        name="phone"
                        type="tel"
                        required
                        placeholder={t.waitlist.phonePlaceholder}
                        aria-label={t.waitlist.phoneLabel}
                        className={inputCls}
                      />
                    </div>
                    <select
                      name="role"
                      required
                      defaultValue="have"
                      aria-label={t.waitlist.roleLabel}
                      className={inputCls}
                    >
                      <option value="have">{t.waitlist.roleHave}</option>
                      <option value="want">{t.waitlist.roleWant}</option>
                    </select>
                    {leadState && !leadState.ok && (
                      <p className="text-sm font-semibold text-red-600">
                        {t.waitlist.error}
                      </p>
                    )}
                    <LeadSubmit
                      label={t.waitlist.submit}
                      pendingLabel={t.waitlist.submitting}
                    />
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
