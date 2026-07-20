"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  UserRound,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";
import { isValidCnpj, isValidCpf, maskCnpj, maskCpf } from "./br-docs";
import { getMyKyc, submitBrKyc, type KycSummary } from "./actions";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function Verification() {
  const { lang } = useLanguage();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [kyc, setKyc] = useState<KycSummary | null>(null);
  const [kycLoaded, setKycLoaded] = useState(false);
  const [redoing, setRedoing] = useState(false);

  const [type, setType] = useState<"pf" | "pj" | null>(null);
  // PF
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  // PJ
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [respNome, setRespNome] = useState("");
  const [respCpf, setRespCpf] = useState("");

  const [docFile, setDocFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const label =
    lang === "en"
      ? {
          kicker: "Trust layer",
          title: "Verify your identity",
          intro:
            "One quick step: your details plus a photo of one document. Manual review, no external services.",
          typeQuestion: "Who is being verified?",
          pf: "Individual",
          pfDesc: "Verify with CPF and an ID document",
          pj: "Company",
          pjDesc: "Verify with CNPJ and the responsible person",
          fullName: "Full name",
          cpf: "CPF",
          birthDate: "Date of birth",
          razaoSocial: "Legal company name",
          cnpj: "CNPJ",
          respNome: "Responsible person's name",
          respCpf: "Responsible person's CPF",
          invalidCpf: "Invalid CPF — check the digits.",
          invalidCnpj: "Invalid CNPJ — check the digits.",
          docTitle: "Document",
          docPf: "Photo of your RG or CNH",
          docPj: "CNPJ card (cartão CNPJ)",
          docHint: "Image or PDF, up to 10 MB.",
          chooseFile: "Choose file",
          submit: "Submit for review",
          submitting: "Submitting…",
          requiredError: "Please complete all fields and attach the document.",
          uploadError: "Upload failed. Please try again.",
          submitError: "Something went wrong. Please try again.",
          notConfigured: "Service unavailable right now. Try again later.",
          pendingTitle: "Under review",
          pendingBody: "We'll get back to you within 2 business days.",
          approvedTitle: "Identity verified",
          approvedBody: "Your account now carries the verified badge.",
          rejectedTitle: "We couldn't verify your identity",
          rejectedBody:
            "Some information could not be confirmed. Review your details and try again.",
          redo: "Redo verification",
          backToAccount: "Back to my account",
          signInPrompt: "Sign in to verify your identity.",
          signIn: "Sign in with Google",
        }
      : {
          kicker: "Camada de confiança",
          title: "Verifique sua identidade",
          intro:
            "Um passo rápido: seus dados e a foto de um documento. Revisão manual, sem serviços externos.",
          typeQuestion: "Quem será verificado?",
          pf: "Pessoa física",
          pfDesc: "Verificação com CPF e documento com foto",
          pj: "Empresa",
          pjDesc: "Verificação com CNPJ e responsável",
          fullName: "Nome completo",
          cpf: "CPF",
          birthDate: "Data de nascimento",
          razaoSocial: "Razão social",
          cnpj: "CNPJ",
          respNome: "Nome do responsável",
          respCpf: "CPF do responsável",
          invalidCpf: "CPF inválido — confira os dígitos.",
          invalidCnpj: "CNPJ inválido — confira os dígitos.",
          docTitle: "Documento",
          docPf: "Foto do RG ou da CNH",
          docPj: "Cartão CNPJ",
          docHint: "Imagem ou PDF, até 10 MB.",
          chooseFile: "Escolher arquivo",
          submit: "Enviar para análise",
          submitting: "Enviando…",
          requiredError: "Preencha todos os campos e anexe o documento.",
          uploadError: "Falha no envio do arquivo. Tente de novo.",
          submitError: "Algo deu errado. Tente de novo.",
          notConfigured: "Serviço indisponível no momento. Tente mais tarde.",
          pendingTitle: "Em análise",
          pendingBody: "Retornamos em até 2 dias úteis.",
          approvedTitle: "Identidade verificada",
          approvedBody: "Sua conta agora exibe o selo de verificação.",
          rejectedTitle: "Não conseguimos verificar sua identidade",
          rejectedBody:
            "Alguma informação não pôde ser confirmada. Revise seus dados e tente de novo.",
          redo: "Refazer verificação",
          backToAccount: "Voltar para minha conta",
          signInPrompt: "Entre para verificar sua identidade.",
          signIn: "Entrar com Google",
        };

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
    getMyKyc().then((res) => {
      if (res.ok) setKyc(res.kyc);
      setKycLoaded(true);
    });
  }, [user]);

  if (user === undefined || !kycLoaded) {
    return (
      <div className="rounded-2xl border border-deep/10 bg-white p-8 text-center text-deep/50 shadow-sm">
        …
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="rounded-2xl border border-deep/10 bg-white p-8 text-center shadow-sm">
        <p className="text-deep/70">{label.signInPrompt}</p>
        <button
          onClick={() => {
            getSupabase()?.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/app/verificacao`,
              },
            });
          }}
          className="mt-6 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          {label.signIn}
        </button>
      </div>
    );
  }

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
          href="/app/conta"
          className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep"
        >
          {label.backToAccount}
        </Link>
      </div>
    </div>
  );

  const activeKyc = justSubmitted
    ? ({ tier: type === "pj" ? "pj_br" : "pf_br", status: "pending" } as KycSummary)
    : kyc;

  if (activeKyc && !redoing) {
    if (activeKyc.status === "approved") {
      return statusCard(
        <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />,
        label.approvedTitle,
        label.approvedBody,
        <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {label.approvedTitle}
        </span>,
      );
    }
    if (activeKyc.status === "rejected") {
      return statusCard(
        <XCircle className="h-10 w-10 text-deep/50" aria-hidden="true" />,
        label.rejectedTitle,
        label.rejectedBody,
        <button
          type="button"
          onClick={() => setRedoing(true)}
          className="mt-6 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          {label.redo}
        </button>,
      );
    }
    // pending / in_review
    return statusCard(
      <Clock className="h-10 w-10 text-primary" aria-hidden="true" />,
      label.pendingTitle,
      label.pendingBody,
    );
  }

  const isPj = type === "pj";
  const cpfFilledInvalid = cpf.length >= 14 && !isValidCpf(cpf);
  const cnpjFilledInvalid = cnpj.length >= 18 && !isValidCnpj(cnpj);
  const respCpfFilledInvalid = respCpf.length >= 14 && !isValidCpf(respCpf);

  function validForm(): boolean {
    if (!docFile) return false;
    if (type === "pf")
      return !!(fullName.trim() && isValidCpf(cpf) && birthDate);
    if (type === "pj")
      return !!(
        razaoSocial.trim() &&
        isValidCnpj(cnpj) &&
        respNome.trim() &&
        isValidCpf(respCpf)
      );
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !type) return;
    if (!validForm() || !docFile) {
      setError(label.requiredError);
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setError(label.notConfigured);
      return;
    }
    setSubmitting(true);
    setError(null);

    const ext = (docFile.name.split(".").pop() ?? "bin")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 8);
    const path = `${user.id}/${Date.now()}-doc-${type}.${ext || "bin"}`;
    const { error: upErr } = await supabase.storage
      .from("kyc-docs")
      .upload(path, docFile);
    if (upErr) {
      setError(label.uploadError);
      setSubmitting(false);
      return;
    }

    const res = await submitBrKyc(
      type === "pf"
        ? {
            tier: "pf_br",
            data: { full_name: fullName, cpf, birth_date: birthDate },
            docPaths: [path],
          }
        : {
            tier: "pj_br",
            data: {
              razao_social: razaoSocial,
              cnpj,
              responsavel_nome: respNome,
              responsavel_cpf: respCpf,
            },
            docPaths: [path],
          },
    );

    setSubmitting(false);
    if (!res.ok) {
      setError(
        res.error === "unconfigured" ? label.notConfigured : label.submitError,
      );
      return;
    }
    setJustSubmitted(true);
    setRedoing(false);
  }

  const invalidHint = (msg: string) => (
    <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-deep/60">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {msg}
    </span>
  );

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-primary">
        {label.kicker}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-deep">
        {label.title}
      </h1>
      <p className="mt-2 text-deep/70">{label.intro}</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm"
      >
        <h2 className="font-extrabold text-deep">{label.typeQuestion}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              { key: "pf", icon: UserRound, title: label.pf, desc: label.pfDesc },
              { key: "pj", icon: Building2, title: label.pj, desc: label.pjDesc },
            ] as const
          ).map(({ key, icon: Icon, title, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              aria-pressed={type === key}
              className={`rounded-2xl border p-6 text-left transition-colors ${
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

        {type && (
          <div className="mt-6 space-y-4">
            {!isPj ? (
              <>
                <label className="block text-sm font-bold text-deep">
                  {label.fullName}
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-deep">
                    {label.cpf}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cpf}
                      onChange={(e) => setCpf(maskCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className={inputCls}
                    />
                    {cpfFilledInvalid && invalidHint(label.invalidCpf)}
                  </label>
                  <label className="block text-sm font-bold text-deep">
                    {label.birthDate}
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className={inputCls}
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                <label className="block text-sm font-bold text-deep">
                  {label.razaoSocial}
                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block text-sm font-bold text-deep">
                  {label.cnpj}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cnpj}
                    onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    className={inputCls}
                  />
                  {cnpjFilledInvalid && invalidHint(label.invalidCnpj)}
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-deep">
                    {label.respNome}
                    <input
                      type="text"
                      value={respNome}
                      onChange={(e) => setRespNome(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                  <label className="block text-sm font-bold text-deep">
                    {label.respCpf}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={respCpf}
                      onChange={(e) => setRespCpf(maskCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className={inputCls}
                    />
                    {respCpfFilledInvalid && invalidHint(label.invalidCpf)}
                  </label>
                </div>
              </>
            )}

            <div className="rounded-xl bg-neutral/60 p-4">
              <p className="text-sm font-bold text-deep">{label.docTitle}</p>
              <p className="mt-0.5 text-sm text-deep/60">
                {isPj ? label.docPj : label.docPf} · {label.docHint}
              </p>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark">
                {label.chooseFile}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > MAX_FILE_BYTES) {
                      setError(label.docHint);
                      setDocFile(null);
                      return;
                    }
                    setError(null);
                    setDocFile(f);
                  }}
                />
              </label>
              {docFile && (
                <p className="mt-2 flex items-center gap-1 truncate text-sm text-deep/70">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {docFile.name}
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? label.submitting : label.submit}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
