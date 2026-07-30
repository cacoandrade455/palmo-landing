/**
 * VERIFICAÇÃO DO CAR DE UM ANÚNCIO — a ponte entre as checagens puras, a
 * consulta ao SICAR e a tabela de auditoria.
 *
 * Existe como módulo compartilhado porque DOIS caminhos precisam da mesma
 * lógica: criar anúncio e editar anúncio. Duplicar isso seria criar duas
 * verdades sobre quando o selo nasce, e sumir com uma delas na primeira
 * mudança.
 *
 * ── POR QUE A ESCRITA É DA SERVICE ROLE ──────────────────────────────────────
 * A policy `listings: owner updates own` é `using (owner_id = auth.uid())` SEM
 * `with check` e SEM restrição de coluna: o dono atualiza QUALQUER coluna de
 * `listings`. Se o veredito morasse lá, ele faria
 * `update listings set car_status = 'confirmado_sicar'` pela API REST com a
 * própria sessão e cunharia o próprio selo.
 *
 * Por isso o veredito vive em `listing_car_verifications`, que não tem policy
 * de INSERT/UPDATE/DELETE para ninguém — só a service role escreve. Mesmo
 * desenho de `kyc_reviews`: é a imutabilidade que a torna prova.
 *
 * REGRA GERAL, e vale para o resto do produto: nenhum campo que represente
 * VEREDITO DA PLATAFORMA mora em tabela onde o usuário tem UPDATE, por
 * restritiva que a policy pareça.
 */

import "server-only";

import { getAdminSupabase } from "./supabase-admin";
import { consultarCar } from "./car-sicar";
import { decideCar, parseCar, type CarChecks, type CarSicarLookup } from "./car-checks";

export type VerificarCarEntrada = {
  listingId: string;
  /** O que o dono digitou. Pode ser nulo/vazio: o CAR é opcional. */
  car: string | null | undefined;
  state: string | null | undefined;
  municipalityIbge: number | null | undefined;
  hectares: number | null | undefined;
};

export type VerificarCarResultado = {
  /** `false` só quando a service role não está configurada. */
  gravado: boolean;
  checks: CarChecks;
};

/**
 * Reaproveitamento de consulta, com DATA e não com TTL que expira em silêncio.
 *
 * O mesmo `cod_imovel` consultado duas vezes no mesmo dia consulta a fonte uma
 * vez. Guardamos o RESULTADO com a data em que ele foi obtido, então o selo
 * sempre consegue dizer "conferido em [data]" — nunca fica com um carimbo de
 * frescor que não corresponde a nada.
 */
async function lookupReaproveitado(
  db: NonNullable<ReturnType<typeof getAdminSupabase>>,
  codImovel: string,
): Promise<CarSicarLookup | null> {
  const desde = new Date();
  desde.setUTCHours(0, 0, 0, 0);

  const { data } = await db
    .from("listing_car_verifications")
    .select("checks, checked_at")
    .eq("car_number_consultado", codImovel)
    .gte("checked_at", desde.toISOString())
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sicar = (data?.checks as CarChecks | undefined)?.sicar;
  // Só reaproveitamos consulta que REALMENTE aconteceu. Falha de rede
  // registrada não vira cache de falha — isso condenaria o anúncio a ficar sem
  // selo até o dia seguinte por causa de um timeout.
  return sicar && sicar.consulted ? sicar : null;
}

/**
 * Roda as checagens, consulta o SICAR quando faz sentido, e grava UMA LINHA de
 * auditoria. Nunca lança, e nunca derruba o anúncio: se o SICAR estiver fora do
 * ar, o resultado é `formato_ok` e a próxima edição tenta de novo.
 *
 * ⚠️  Chamado APENAS na criação e na edição de anúncio. NUNCA por pageview.
 */
export async function verificarEGravarCar(
  entrada: VerificarCarEntrada,
): Promise<VerificarCarResultado> {
  const parsed = parseCar(entrada.car);

  // Só falamos com o SICAR se a estrutura for reconhecível. Mandar lixo para a
  // fonte pública seria falta de educação e não traria informação nenhuma.
  let sicar: CarSicarLookup | null = null;
  let geometria: unknown = null;
  let crs: string | null = null;

  const db = getAdminSupabase();

  if (parsed) {
    const reaproveitado = db ? await lookupReaproveitado(db, parsed.normalizado) : null;
    if (reaproveitado) {
      sicar = reaproveitado;
      // Geometria não é rebuscada no reaproveitamento: ela já está gravada na
      // linha anterior daquele mesmo cod_imovel.
    } else {
      const resposta = await consultarCar(parsed.normalizado);
      sicar = resposta.lookup;
      geometria = resposta.geometria;
      crs = resposta.crs;
    }
  }

  const checks = decideCar({
    car: entrada.car,
    state: entrada.state,
    municipalityIbge: entrada.municipalityIbge,
    hectares: entrada.hectares,
    sicar,
  });

  // Sem service role não há como gravar veredito, e é assim que deve ser: o
  // app degrada para "sem selo" em vez de aceitar escrita do cliente.
  if (!db) return { gravado: false, checks };

  // SEMPRE gravamos uma linha, inclusive `nao_informado`.
  //
  // Isto não é excesso de zelo: a view lê a linha MAIS RECENTE. Se o dono
  // apagasse o CAR e nós não gravássemos nada, a linha antiga continuaria sendo
  // a mais recente e o selo sobreviveria a um campo agora vazio. O histórico
  // completo é o que mantém o estado corrente honesto.
  const { error } = await db.from("listing_car_verifications").insert({
    listing_id: entrada.listingId,
    car_number_consultado: parsed?.normalizado ?? null,
    status: checks.status,
    checks,
    area_ha: sicar?.area_ha ?? null,
    municipio_ibge_sicar: sicar?.municipio_ibge ?? null,
    fonte: sicar?.source ?? null,
    geometria: geometria ?? null,
    crs,
    checked_at: sicar?.checked_at ?? null,
  });

  return { gravado: !error, checks };
}
