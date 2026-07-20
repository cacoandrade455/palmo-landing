"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Building2,
  CheckCircle2,
  Clock,
  Plus,
  UserRound,
  XCircle,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import type { GlobalDict } from "@/lib/i18n-global";
import { GlobalTopBar, useGlobalLang } from "../GlobalChrome";
import {
  getMyKycStatus,
  submitIntlKyc,
  type IntlUbo,
  type KycSummary,
} from "./actions";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const RANGE_VALUES = ["under_100k", "100k_500k", "500k_1m", "over_1m"] as const;

function rangeLabel(g: GlobalDict, value: string): string {
  const map: Record<string, string> = {
    under_100k: g.range1,
    "100k_500k": g.range2,
    "500k_1m": g.range3,
    over_1m: g.range4,
  };
  return map[value] ?? value;
}

/** Uploads one file to the caller's private folder in the kyc-docs bucket. */
async function uploadKycDoc(
  userId: string,
  kind: string,
  file: File,
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const ext = (file.name.split(".").pop() ?? "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  const path = `${userId}/${Date.now()}-${kind}.${ext || "bin"}`;
  const { error } = await supabase.storage.from("kyc-docs").upload(path, file);
  return error ? null : path;
}

export function GlobalKycWizard() {
  const { lang, setLang, g, dir } = useGlobalLang();

  // undefined = checking session; null = signed out
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [kyc, setKyc] = useState<KycSummary | null>(null);
  const [kycLoaded, setKycLoaded] = useState(false);
  const [redoing, setRedoing] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<"individual" | "entity" | null>(null);

  // Step 2 — details (T1)
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [address, setAddress] = useState("");
  const [range, setRange] = useState("");
  const [source, setSource] = useState("");
  const [pep, setPep] = useState<"yes" | "no" | null>(null);
  // T2 extras
  const [entityName, setEntityName] = useState("");
  const [entityCountry, setEntityCountry] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [ubos, setUbos] = useState<IntlUbo[]>([
    { name: "", country: "", passport: "" },
  ]);

  // Step 3 — documents
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [incFile, setIncFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      queueMicrotask(() => {
        setUser(null);
        setKycLoaded(true);
      });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      queueMicrotask(() => setKycLoaded(true));
      return;
    }
    getMyKycStatus().then((res) => {
      if (res.ok) setKyc(res.kyc);
      setKycLoaded(true);
    });
  }, [user]);

  const shell = (children: React.ReactNode) => (
    <div dir={dir} className="min-h-screen bg-neutral/40">
      <GlobalTopBar lang={lang} setLang={setLang} g={g} />
      <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
    </div>
  );

  const statusCard = (
    icon: React.ReactNode,
    title: string,
    body: string,
    extra?: React.ReactNode,
  ) => (
    <div className="rounded-2xl border border-deep/10 bg-white p-6 text-center shadow-sm">
      <div className="flex justify-center">{icon}</div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-deep">
        {title}
      </h1>
      <p className="mt-2 text-deep/70">{body}</p>
      {extra}
      <div className="mt-6">
        <Link
          href="/global"
          className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep"
        >
          {g.backHome}
        </Link>
      </div>
    </div>
  );

  // ── Loading session / existing application ──
  if (user === undefined || !kycLoaded) {
    return shell(
      <div className="rounded-2xl border border-deep/10 bg-white p-8 text-center text-deep/50 shadow-sm">
        …
      </div>,
    );
  }

  // ── Existing application → status screens (funnel ends here) ──
  const activeKyc = justSubmitted
    ? ({ tier: type === "entity" ? "pj_intl" : "pf_intl", status: "pending" } as KycSummary)
    : kyc;

  if (activeKyc && !redoing) {
    if (activeKyc.status === "approved") {
      return shell(
        statusCard(
          <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />,
          g.approvedTitle,
          g.approvedBody,
        ),
      );
    }
    if (activeKyc.status === "rejected") {
      return shell(
        statusCard(
          <XCircle className="h-10 w-10 text-deep/50" aria-hidden="true" />,
          g.rejectedTitle,
          g.rejectedBody,
          <button
            type="button"
            onClick={() => setRedoing(true)}
            className="mt-6 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            {g.redo}
          </button>,
        ),
      );
    }
    // pending / in_review
    return shell(
      statusCard(
        <Clock className="h-10 w-10 text-primary" aria-hidden="true" />,
        g.reviewTitle,
        g.reviewBody,
      ),
    );
  }

  // ── Wizard ──
  const steps = [g.stepType, g.stepDetails, g.stepDocs];

  const stepper = (
    <ol className="mb-6 flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={
              step === i + 1
                ? "rounded-full bg-primary px-3 py-1 text-xs font-bold text-white"
                : "rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
            }
          >
            {i + 1}. {s}
          </span>
          {i < steps.length - 1 && (
            <span className="h-px w-4 bg-deep/20" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );

  const heading = (
    <div className="mb-6">
      <p className="text-sm font-bold uppercase tracking-wide text-primary">
        Palmo {g.brandTag}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-deep">
        {g.kycTitle}
      </h1>
      <p className="mt-2 text-deep/70">{g.kycIntro}</p>
    </div>
  );

  // Step 1 — type
  if (step === 1) {
    return shell(
      <>
        {heading}
        {stepper}
        <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
          <h2 className="font-extrabold text-deep">{g.typeQuestion}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: "individual", icon: UserRound, title: g.individual, desc: g.individualDesc },
                { key: "entity", icon: Building2, title: g.entity, desc: g.entityDesc },
              ] as const
            ).map(({ key, icon: Icon, title, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => setType(key)}
                aria-pressed={type === key}
                className={`rounded-2xl border p-6 text-start transition-colors ${
                  type === key
                    ? "border-primary bg-primary/10"
                    : "border-deep/10 bg-white hover:border-primary"
                }`}
              >
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-3 font-extrabold text-deep">{title}</p>
                <p className="mt-1 text-sm text-deep/60">{desc}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={!type}
              onClick={() => {
                setError(null);
                setStep(2);
              }}
              className="rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {g.continueBtn}
            </button>
          </div>
        </div>
      </>,
    );
  }

  // Google sign-in required from step 2 onward
  if (user === null) {
    return shell(
      <>
        {heading}
        {stepper}
        <div className="rounded-2xl border border-deep/10 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-extrabold text-deep">{g.signInTitle}</h2>
          <p className="mt-2 text-deep/70">{g.signInBody}</p>
          <button
            type="button"
            onClick={() => {
              getSupabase()?.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}/global/kyc` },
              });
            }}
            className="mt-6 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            {g.signInGoogle}
          </button>
        </div>
      </>,
    );
  }

  const isEntity = type === "entity";

  function validStep2(): boolean {
    const base =
      fullName.trim() &&
      country.trim() &&
      passportNumber.trim() &&
      address.trim() &&
      range &&
      source.trim() &&
      pep !== null;
    if (!base) return false;
    if (!isEntity) return true;
    return !!(
      entityName.trim() &&
      entityCountry.trim() &&
      regNumber.trim() &&
      ubos.some((u) => u.name.trim())
    );
  }

  function setUbo(i: number, patch: Partial<IntlUbo>) {
    setUbos((cur) => cur.map((u, j) => (j === i ? { ...u, ...patch } : u)));
  }

  // Step 2 — details
  if (step === 2) {
    return shell(
      <>
        {heading}
        {stepper}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!validStep2()) {
              setError(g.requiredError);
              return;
            }
            setError(null);
            setStep(3);
          }}
          className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <label className="block text-sm font-bold text-deep">
              {g.fullName}
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputCls}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-deep">
                {g.country}
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block text-sm font-bold text-deep">
                {g.passportNumber}
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>
            <label className="block text-sm font-bold text-deep">
              {g.address}
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block text-sm font-bold text-deep">
              {g.investmentRange}
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className={inputCls}
              >
                <option value="">{g.rangeSelect}</option>
                {RANGE_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {rangeLabel(g, v)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-deep">
              {g.sourceOfFunds}
              <textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={g.sourceOfFundsPh}
                rows={3}
                className={inputCls}
              />
            </label>
            <fieldset>
              <legend className="text-sm font-bold text-deep">{g.pepQuestion}</legend>
              <div className="mt-2 flex gap-2">
                {(["yes", "no"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPep(v)}
                    aria-pressed={pep === v}
                    className={
                      pep === v
                        ? "rounded-full border border-transparent bg-primary px-4 py-2 text-sm font-bold text-white"
                        : "rounded-full border border-deep/20 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary"
                    }
                  >
                    {v === "yes" ? g.yes : g.no}
                  </button>
                ))}
              </div>
            </fieldset>

            {isEntity && (
              <>
                <hr className="border-deep/10" />
                <label className="block text-sm font-bold text-deep">
                  {g.entityName}
                  <input
                    type="text"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-deep">
                    {g.entityCountry}
                    <input
                      type="text"
                      value={entityCountry}
                      onChange={(e) => setEntityCountry(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                  <label className="block text-sm font-bold text-deep">
                    {g.registrationNumber}
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-bold text-deep">{g.ubosTitle}</p>
                  <div className="mt-2 space-y-3">
                    {ubos.map((u, i) => (
                      <div key={i} className="rounded-xl bg-neutral/60 p-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <label className="block text-xs font-bold text-deep/70">
                            {g.uboName}
                            <input
                              type="text"
                              value={u.name}
                              onChange={(e) => setUbo(i, { name: e.target.value })}
                              className={inputCls}
                            />
                          </label>
                          <label className="block text-xs font-bold text-deep/70">
                            {g.uboCountry}
                            <input
                              type="text"
                              value={u.country}
                              onChange={(e) => setUbo(i, { country: e.target.value })}
                              className={inputCls}
                            />
                          </label>
                          <label className="block text-xs font-bold text-deep/70">
                            {g.uboPassport}
                            <input
                              type="text"
                              value={u.passport}
                              onChange={(e) => setUbo(i, { passport: e.target.value })}
                              className={inputCls}
                            />
                          </label>
                        </div>
                        {ubos.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setUbos((cur) => cur.filter((_, j) => j !== i))
                            }
                            className="mt-2 rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep"
                          >
                            {g.removeUbo}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setUbos((cur) => [...cur, { name: "", country: "", passport: "" }])
                    }
                    className="mt-3 inline-flex items-center gap-1 rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {g.addUbo}
                  </button>
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep"
            >
              {g.backBtn}
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {g.continueBtn}
            </button>
          </div>
        </form>
      </>,
    );
  }

  // Step 3 — documents + submit
  const filePick = (
    label: string,
    file: File | null,
    onPick: (f: File | null) => void,
  ) => (
    <div className="rounded-xl bg-neutral/60 p-4">
      <p className="text-sm font-bold text-deep">{label}</p>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark">
        {g.chooseFile}
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > MAX_FILE_BYTES) {
              setError(g.docsHint);
              onPick(null);
              return;
            }
            setError(null);
            onPick(f);
          }}
        />
      </label>
      {file && (
        <p className="mt-2 flex items-center gap-1 truncate text-sm text-deep/70">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          {file.name}
        </p>
      )}
    </div>
  );

  async function handleSubmit() {
    if (!user) return;
    if (!passportFile || (isEntity && !incFile)) {
      setError(g.requiredError);
      return;
    }
    if (!getSupabase()) {
      setError(g.notConfigured);
      return;
    }
    setSubmitting(true);
    setError(null);

    const docPaths: string[] = [];
    const passportPath = await uploadKycDoc(user.id, "passport", passportFile);
    if (!passportPath) {
      setError(g.uploadError);
      setSubmitting(false);
      return;
    }
    docPaths.push(passportPath);
    if (isEntity && incFile) {
      const incPath = await uploadKycDoc(user.id, "incorporation", incFile);
      if (!incPath) {
        setError(g.uploadError);
        setSubmitting(false);
        return;
      }
      docPaths.push(incPath);
    }

    const res = await submitIntlKyc({
      tier: isEntity ? "pj_intl" : "pf_intl",
      country: country.trim(),
      data: {
        full_name: fullName,
        country,
        passport_number: passportNumber,
        address,
        investment_range: range,
        source_of_funds: source,
        pep: pep === "yes",
        ...(isEntity
          ? {
              entity_name: entityName,
              incorporation_country: entityCountry,
              registration_number: regNumber,
              ubos,
            }
          : {}),
      },
      docPaths,
    });

    setSubmitting(false);
    if (!res.ok) {
      setError(res.error === "unconfigured" ? g.notConfigured : g.submitError);
      return;
    }
    setJustSubmitted(true);
    setRedoing(false);
  }

  return shell(
    <>
      {heading}
      {stepper}
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
        <h2 className="font-extrabold text-deep">{g.docsTitle}</h2>
        <p className="mt-1 text-sm text-deep/60">{g.docsHint}</p>
        <div className="mt-4 space-y-3">
          {filePick(g.passportDoc, passportFile, setPassportFile)}
          {isEntity && filePick(g.incorporationDoc, incFile, setIncFile)}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep(2);
            }}
            className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep"
          >
            {g.backBtn}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? g.submitting : g.submitBtn}
          </button>
        </div>
      </div>
    </>,
  );
}
