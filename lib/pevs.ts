/**
 * PEVS layer — preço médio pago ao produtor (IBGE PEVS) por produto do
 * extrativismo, por município/UF/Brasil. Os dados vivem em lib/pevs.json,
 * gerado por `node scripts/ingest-pevs.mjs` (rodado LOCALMENTE — o SIDRA
 * não é acessível do sandbox). Antes da primeira ingestão o arquivo é um
 * stub vazio e este módulo retorna null — a UI simplesmente não mostra a
 * linha de preço até os dados chegarem.
 */
import pevsJson from "./pevs.json";

type PevsProduct = {
  label: string;
  year: string;
  /** R$/kg médio nacional */
  national?: number;
  /** R$/kg por UF (sigla) */
  byUf?: Record<string, number>;
  /** R$/kg por município, chave "Nome (UF)" */
  byMuni?: Record<string, number>;
};

type PevsFile = {
  updatedAt: string;
  products: Record<string, PevsProduct>;
};

const DATA = pevsJson as PevsFile;

export type PevsRef = {
  price: number;
  scope: "muni" | "uf" | "br";
  year: string;
};

/** Best-available official producer price for an extractive product. */
export function pevsPriceRef(
  crop: string,
  uf: string,
  municipality: string,
): PevsRef | null {
  const p = DATA.products[crop];
  if (!p) return null;
  const muniKey = `${municipality} (${uf})`;
  const muni = p.byMuni?.[muniKey];
  if (typeof muni === "number" && muni > 0)
    return { price: muni, scope: "muni", year: p.year };
  const ufP = p.byUf?.[uf];
  if (typeof ufP === "number" && ufP > 0)
    return { price: ufP, scope: "uf", year: p.year };
  if (typeof p.national === "number" && p.national > 0)
    return { price: p.national, scope: "br", year: p.year };
  return null;
}

export function formatKg(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}
