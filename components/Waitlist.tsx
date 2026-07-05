"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { submitWaitlist, type WaitlistResult } from "@/app/actions";
import { useLanguage } from "@/lib/language-context";

const initialState: WaitlistResult | null = null;

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Waitlist() {
  const { t, lang } = useLanguage();
  const [state, formAction] = useActionState<WaitlistResult | null, FormData>(
    async (_prev, formData) => submitWaitlist(formData),
    initialState,
  );

  return (
    <section id="lista-de-espera" className="bg-primary py-20">
      <div className="mx-auto max-w-xl px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-accent">
          {t.waitlist.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {t.waitlist.title}
        </h2>
        <p className="mt-3 text-base text-white/80">{t.waitlist.subtitle}</p>

        {state?.ok ? (
          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-8 text-deep shadow-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="font-semibold">{t.waitlist.success}</p>
          </div>
        ) : (
          <form
            action={formAction}
            className="mt-8 space-y-4 rounded-2xl bg-white p-6 text-left shadow-sm sm:p-8"
          >
            <input type="hidden" name="language" value={lang} />
            <div>
              <label htmlFor="name" className="text-sm font-semibold text-deep">
                {t.waitlist.nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder={t.waitlist.namePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-deep/15 px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-semibold text-deep">
                {t.waitlist.phoneLabel}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder={t.waitlist.phonePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-deep/15 px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="country" className="text-sm font-semibold text-deep">
                {t.waitlist.countryLabel}
              </label>
              <input
                id="country"
                name="country"
                type="text"
                required
                defaultValue={lang === "en" ? "Brazil" : "Brasil"}
                className="mt-1.5 w-full rounded-xl border border-deep/15 px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="state" className="text-sm font-semibold text-deep">
                  {t.waitlist.stateLabel}
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  placeholder={t.waitlist.statePlaceholder}
                  className="mt-1.5 w-full rounded-xl border border-deep/15 px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="municipality" className="text-sm font-semibold text-deep">
                  {t.waitlist.municipalityLabel}
                </label>
                <input
                  id="municipality"
                  name="municipality"
                  type="text"
                  required
                  placeholder={t.waitlist.municipalityPlaceholder}
                  className="mt-1.5 w-full rounded-xl border border-deep/15 px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-deep">
                {t.waitlist.roleLabel}
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                  <input
                    type="radio"
                    name="role"
                    value="have"
                    defaultChecked
                    className="accent-primary"
                  />
                  {t.waitlist.roleHave}
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                  <input type="radio" name="role" value="want" className="accent-primary" />
                  {t.waitlist.roleWant}
                </label>
              </div>
            </fieldset>

            {state && !state.ok && (
              <p className="text-sm font-semibold text-red-600">{t.waitlist.error}</p>
            )}

            <SubmitButton label={t.waitlist.submit} pendingLabel={t.waitlist.submitting} />
          </form>
        )}
      </div>
    </section>
  );
}
