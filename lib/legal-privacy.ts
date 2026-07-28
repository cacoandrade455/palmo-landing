import type { LegalDocument } from "./legal";

/**
 * POLÍTICA DE PRIVACIDADE (LGPD) — versão canônica em português
 * (`privacyPt`) e tradução de cortesia em inglês (`privacyEn`).
 *
 * A seção de cookies lista SOMENTE o que existe no código:
 *   • cookie `palmo-lang` (lib/language-context.tsx, lido em app/layout.tsx)
 *   • cookies de sessão do Supabase (@supabase/ssr, renovados em proxy.ts)
 *   • localStorage `palmo-lang` e `palmo-global-lang`
 *   • Vercel Web Analytics — sem cookies
 * Nenhum cookie de publicidade ou de rastreamento entre sites é usado.
 */

export const privacyPt: LegalDocument = {
  title: "Política de Privacidade",
  intro:
    "Esta Política explica quais dados pessoais a Palmo coleta, por que coleta, com quem compartilha e como você exerce seus direitos. Ela segue a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD) e o Marco Civil da Internet (Lei 12.965/2014).",
  sections: [
    {
      id: "controlador",
      title: "Controlador e encarregado",
      blocks: [
        {
          kind: "p",
          text: "O controlador dos dados é a Suipump Inc., sociedade constituída no estado de Delaware, Estados Unidos (C-Corp, file number 10637185), que opera a plataforma sob a marca Palmo. A empresa não possui, neste momento, inscrição no CNPJ brasileiro.",
        },
        {
          kind: "p",
          text: "Ainda que sediada fora do Brasil, a atividade de tratamento é dirigida a pessoas no território nacional e, por isso, submete-se à LGPD, nos termos do art. 3º, II e III, da lei.",
        },
        {
          kind: "p",
          text: "Encarregado pelo tratamento de dados pessoais (art. 41 da LGPD) — canal para dúvidas, pedidos e reclamações: privacidade@palmo.lat.",
        },
      ],
    },
    {
      id: "dados",
      title: "Dados que coletamos, por categoria e origem",
      blocks: [
        {
          kind: "p",
          text: "Coletamos apenas o necessário para conectar dono e produtor com segurança:",
        },
        {
          kind: "list",
          items: [
            "Cadastro e login: nome, endereço de e-mail e foto de perfil, fornecidos pelo Google quando você entra com a conta Google.",
            "Verificação de identidade (KYC): nome completo, CPF (pessoa física) ou CNPJ e dados do responsável (pessoa jurídica), data de nascimento e os arquivos de documentos que você envia.",
            "Anúncios: município e UF, área, finalidade, cultura, presença de água, preço pretendido, número do CAR, matrícula, descrição e fotos que você publica.",
            "Mensagens e propostas: o conteúdo das conversas na plataforma, as propostas (preço, prazo e mensagem) e o status do negócio.",
            "Contratos: os blocos da minuta, comentários, propostas de redação e aprovações registradas na Sala do Contrato.",
            "Aceites legais: documento aceito, versão, data e hora, ENDEREÇO IP e USER AGENT do dispositivo, e o contexto do aceite (o anúncio ou o negócio a que ele se refere, quando houver) — coletados como prova dos aceites feitos no cadastro, ao publicar um anúncio, ao enviar uma proposta e no fechamento.",
            "Uso e registros de acesso: data, hora, endereço IP e user agent das requisições, registrados pela infraestrutura de hospedagem e de banco de dados (Marco Civil, art. 15).",
            "Audiência: métricas agregadas de visitação, sem cookies e sem identificação individual.",
          ],
        },
        {
          kind: "p",
          text: "Não coletamos dados pessoais sensíveis (art. 5º, II, da LGPD) e pedimos que você não os inclua em campos livres, como a descrição do anúncio ou as mensagens.",
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookies e armazenamento local",
      blocks: [
        {
          kind: "p",
          text: "Usamos o mínimo necessário para o site funcionar. Esta é a lista completa:",
        },
        {
          kind: "list",
          items: [
            "palmo-lang (cookie funcional, validade de 12 meses): guarda o idioma que você escolheu. É lido no servidor para que a página já chegue no idioma certo, sem piscar.",
            "Cookies de sessão do Supabase (essenciais): mantêm você autenticado entre as páginas e são renovados a cada requisição. Sem eles, não é possível entrar na conta.",
            "Armazenamento local (localStorage) palmo-lang e palmo-global-lang: cópia da preferência de idioma, guardada no seu navegador.",
            "Medição de audiência (Vercel Web Analytics): não utiliza cookies. As visitas são contabilizadas de forma agregada pelo provedor de hospedagem.",
          ],
        },
        {
          kind: "p",
          text: "Não usamos cookies de publicidade, de perfilamento comportamental ou de rastreamento entre sites. Você pode bloquear ou apagar cookies nas configurações do navegador — bloqueando os essenciais, a área logada deixa de funcionar.",
        },
      ],
    },
    {
      id: "finalidades",
      title: "Finalidades e bases legais",
      blocks: [
        {
          kind: "p",
          text: "Cada tratamento tem uma finalidade e uma base legal da LGPD:",
        },
        {
          kind: "list",
          items: [
            "Criar e manter sua conta e autenticar seu acesso — execução de contrato (art. 7º, V).",
            "Publicar anúncios, viabilizar mensagens, propostas e a Sala do Contrato — execução de contrato (art. 7º, V).",
            "Verificar identidade com documentos (KYC) — execução de contrato (art. 7º, V) e legítimo interesse na prevenção a fraudes (art. 7º, IX); quando exigido por lei, cumprimento de obrigação legal (art. 7º, II).",
            "Liberar os dados de contato à contraparte no fechamento do negócio — execução de contrato (art. 7º, V).",
            "Calcular e cobrar a taxa de sucesso — execução de contrato (art. 7º, V) e exercício regular de direitos (art. 7º, VI).",
            "Registrar o aceite dos documentos legais, com IP e user agent — cumprimento de obrigação legal e exercício regular de direitos (art. 7º, II e VI).",
            "Segurança, prevenção a fraude e apuração de infrações às regras de conduta, inclusive as cláusulas 3.1 e 3.3 dos Termos — legítimo interesse (art. 7º, IX) e exercício regular de direitos (art. 7º, VI).",
            "Guardar registros de acesso — cumprimento de obrigação legal (art. 7º, II, c/c Marco Civil, art. 15).",
            "Medir audiência de forma agregada para melhorar o produto — legítimo interesse (art. 7º, IX).",
            "Enviar comunicações operacionais sobre negociações e conta — execução de contrato (art. 7º, V). Comunicações de marketing, quando houver, dependem do seu consentimento (art. 7º, I), revogável a qualquer tempo.",
          ],
        },
      ],
    },
    {
      id: "compartilhamento",
      title: "Com quem compartilhamos",
      blocks: [
        {
          kind: "p",
          text: "Com a CONTRAPARTE, no fechamento: quando o negócio é fechado, seu nome, telefone e e-mail são liberados à outra parte daquela negociação — e os dela, a você. Antes do fechamento, esses dados não são acessíveis à contraparte nem a terceiros: o bloqueio é técnico, aplicado no próprio banco de dados.",
        },
        {
          kind: "p",
          text: "Com OPERADORES que tratam dados em nosso nome e sob nossas instruções (art. 39 da LGPD): Supabase (banco de dados, autenticação e armazenamento de arquivos), Vercel (hospedagem da aplicação) e Google (login OAuth). Eles não usam seus dados para finalidades próprias.",
        },
        {
          kind: "p",
          text: "Com AUTORIDADES, mediante requisição fundamentada ou ordem judicial, e para exercer ou defender direitos em processo. O uso compartilhado de dados pessoais pelo Poder Público observa a LGPD, inclusive o art. 26.",
        },
        {
          kind: "p",
          text: "Não vendemos dados pessoais e não os compartilhamos com anunciantes.",
        },
      ],
    },
    {
      id: "transferencia",
      title: "Transferência internacional de dados",
      blocks: [
        {
          kind: "p",
          text: "O controlador está sediado nos Estados Unidos e os operadores citados na seção 5 processam dados fora do Brasil, principalmente em território norte-americano. Isso significa que seus dados são transferidos internacionalmente.",
        },
        {
          kind: "p",
          text: "A transferência tem por fundamento o art. 33 da LGPD: inciso V, por ser necessária à execução do contrato do qual você é parte, e inciso II, pelas garantias de cumprimento dos princípios e direitos da LGPD assumidas nos instrumentos de proteção de dados firmados com os operadores.",
        },
        {
          kind: "p",
          text: "Independentemente do país onde os dados estejam, a LGPD continua sendo aplicada a este tratamento e você mantém todos os direitos descritos na seção 8.",
        },
      ],
    },
    {
      id: "retencao",
      title: "Por quanto tempo guardamos",
      blocks: [
        {
          kind: "list",
          items: [
            "Conta, perfil e anúncios: enquanto sua conta existir.",
            "Mensagens, propostas e contratos: enquanto a conta existir e, após o encerramento, pelo prazo necessário ao exercício regular de direitos, inclusive para apurar infrações às cláusulas 3.1 e 3.3 dos Termos.",
            "Documentos de verificação de identidade: pelo tempo necessário à finalidade da verificação e aos prazos legais aplicáveis.",
            "Aceites legais (documento, versão, data, IP e user agent): enquanto durar a relação e pelos prazos de prescrição aplicáveis, por serem a prova do consentimento contratual.",
            "Registros de acesso (data, hora, IP e user agent das requisições): hoje não mantemos base própria desses registros — eles existem nos logs da nossa infraestrutura de hospedagem e de banco de dados e ficam disponíveis pelo período técnico de retenção praticado por esses provedores. Quando a guarda for exigida, ela se dá com fundamento no art. 15 do Marco Civil da Internet e alcança os registros que estiverem sob nossa custódia, podendo ser estendida por determinação judicial.",
            "Registros de eventos relevantes (cadastro, aceites legais, propostas e fechamentos): ficam na nossa base de dados enquanto a conta existir e pelo prazo necessário ao cumprimento de obrigações legais e ao exercício regular de direitos.",
          ],
        },
        {
          kind: "note",
          text: "Preferimos dizer o que de fato praticamos: não prometemos um prazo de guarda de registros de acesso maior do que a infraestrutura atual entrega. Se passarmos a manter uma base própria com prazo fixo, esta Política será atualizada antes.",
        },
        {
          kind: "p",
          text: "Encerrados os prazos, os dados são eliminados ou anonimizados, ressalvadas as hipóteses do art. 16 da LGPD.",
        },
      ],
    },
    {
      id: "direitos",
      title: "Seus direitos e como exercê-los",
      blocks: [
        {
          kind: "p",
          text: "A LGPD garante a você, a qualquer momento e gratuitamente (art. 18):",
        },
        {
          kind: "list",
          items: [
            "confirmação da existência de tratamento e acesso aos dados;",
            "correção de dados incompletos, inexatos ou desatualizados;",
            "anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei;",
            "portabilidade a outro fornecedor, mediante requisição expressa;",
            "eliminação dos dados tratados com base no consentimento;",
            "informação sobre com quem compartilhamos seus dados;",
            "informação sobre a possibilidade de não consentir e as consequências da negativa;",
            "revogação do consentimento;",
            "oposição a tratamento fundado em legítimo interesse, quando houver descumprimento da lei.",
          ],
        },
        {
          kind: "p",
          text: "Para exercer qualquer desses direitos, escreva para privacidade@palmo.lat. Responderemos em até 15 (quinze) dias, prazo do art. 19, II, da LGPD, podendo antes disso enviar uma resposta em formato simplificado. Podemos pedir informações adicionais para confirmar sua identidade antes de atender ao pedido.",
        },
        {
          kind: "p",
          text: "Alguns pedidos podem ser recusados quando houver obrigação legal de guarda ou necessidade de exercício regular de direitos — nesses casos, explicamos o motivo. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).",
        },
      ],
    },
    {
      id: "seguranca",
      title: "Segurança",
      blocks: [
        {
          kind: "p",
          text: "Adotamos medidas técnicas e administrativas para proteger seus dados, entre elas:",
        },
        {
          kind: "list",
          items: [
            "segurança em nível de linha no banco de dados (Row-Level Security): cada usuário só alcança os próprios dados e o que é público;",
            "gate de contato aplicado no banco: os dados de contato da contraparte só são devolvidos por uma função de segurança quando o negócio está com status de fechado — nem mesmo o acesso técnico direto à API contorna essa regra;",
            "criptografia em trânsito (HTTPS/TLS) em toda a plataforma;",
            "armazenamento dos documentos de verificação em área privada, com acesso restrito à pasta do próprio usuário;",
            "autenticação delegada ao Google, sem que a Palmo armazene sua senha.",
          ],
        },
        {
          kind: "p",
          text: "Nenhum sistema é totalmente imune. Se ocorrer incidente de segurança com risco relevante aos seus direitos, comunicaremos você e a ANPD, na forma do art. 48 da LGPD.",
        },
      ],
    },
    {
      id: "criancas",
      title: "Crianças e adolescentes",
      blocks: [
        {
          kind: "p",
          text: "A plataforma não é destinada a menores de 18 anos e não coletamos intencionalmente dados de crianças e adolescentes. Se identificarmos uma conta criada por menor, ela será encerrada e os dados, eliminados. Responsáveis que identificarem esse uso podem escrever para privacidade@palmo.lat.",
        },
      ],
    },
    {
      id: "alteracoes",
      title: "Alterações e histórico de versões",
      blocks: [
        {
          kind: "p",
          text: "Esta Política pode ser atualizada para refletir mudanças na plataforma ou na legislação. A versão vigente e sua data estão sempre no topo desta página. Alterações materiais serão comunicadas e exigirão nova aceitação no seu próximo acesso.",
        },
        {
          kind: "list",
          items: [
            "Versão 1.0 — versão inicial, publicada com a abertura do marketplace ao público.",
          ],
        },
      ],
    },
  ],
};

export const privacyEn: LegalDocument = {
  title: "Privacy Policy",
  intro:
    "This Policy explains which personal data Palmo collects, why we collect it, whom we share it with and how you exercise your rights. It follows the Brazilian General Data Protection Law (Law 13.709/2018 — LGPD) and the Brazilian Internet Act (Law 12.965/2014).",
  sections: [
    {
      id: "controlador",
      title: "Controller and data protection officer",
      blocks: [
        {
          kind: "p",
          text: "The data controller is Suipump Inc., a company incorporated in the state of Delaware, United States (C-Corp, file number 10637185), which operates the platform under the Palmo brand. The company currently has no Brazilian CNPJ registration.",
        },
        {
          kind: "p",
          text: "Although based outside Brazil, the processing activity is directed at people located in Brazil and is therefore subject to the LGPD, under article 3, II and III, of that law.",
        },
        {
          kind: "p",
          text: "Data protection officer (article 41 of the LGPD) — channel for questions, requests and complaints: privacidade@palmo.lat.",
        },
      ],
    },
    {
      id: "dados",
      title: "Data we collect, by category and source",
      blocks: [
        {
          kind: "p",
          text: "We collect only what is needed to connect owner and producer safely:",
        },
        {
          kind: "list",
          items: [
            "Sign-up and login: name, e-mail address and profile picture, provided by Google when you sign in with your Google account.",
            "Identity verification (KYC): full name, CPF (individuals) or CNPJ and details of the responsible person (companies), date of birth and the document files you upload.",
            "Listings: municipality and state, area, intended use, crop, water availability, asking price, CAR number, title record, description and photos you publish.",
            "Messages and offers: the content of conversations on the platform, the offers (price, term and message) and the status of the deal.",
            "Contracts: the draft blocks, comments, wording proposals and approvals recorded in the Contract Room.",
            "Legal acceptances: the document accepted, its version, date and time, the IP ADDRESS and the USER AGENT of the device, and the context of the acceptance (the listing or the deal it refers to, where applicable) — collected as evidence of the acceptances made at sign-up, when publishing a listing, when sending an offer and at closing.",
            "Usage and access logs: date, time, IP address and user agent of requests, recorded by the hosting and database infrastructure (Brazilian Internet Act, article 15).",
            "Audience: aggregated visit metrics, without cookies and without individual identification.",
          ],
        },
        {
          kind: "p",
          text: "We do not collect sensitive personal data (article 5, II, of the LGPD) and we ask you not to include it in free-text fields, such as the listing description or messages.",
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      blocks: [
        {
          kind: "p",
          text: "We use the minimum needed for the site to work. This is the complete list:",
        },
        {
          kind: "list",
          items: [
            "palmo-lang (functional cookie, valid for 12 months): stores the language you chose. It is read on the server so the page already arrives in the right language, without flashing.",
            "Supabase session cookies (essential): keep you authenticated across pages and are refreshed on each request. Without them, signing in is not possible.",
            "Local storage (localStorage) palmo-lang and palmo-global-lang: a copy of your language preference, kept in your browser.",
            "Audience measurement (Vercel Web Analytics): uses no cookies. Visits are counted in aggregate by the hosting provider.",
          ],
        },
        {
          kind: "p",
          text: "We use no advertising, behavioural profiling or cross-site tracking cookies. You can block or delete cookies in your browser settings — blocking the essential ones stops the signed-in area from working.",
        },
      ],
    },
    {
      id: "finalidades",
      title: "Purposes and legal bases",
      blocks: [
        {
          kind: "p",
          text: "Each processing activity has a purpose and an LGPD legal basis:",
        },
        {
          kind: "list",
          items: [
            "Creating and maintaining your account and authenticating your access — performance of a contract (article 7, V).",
            "Publishing listings and enabling messages, offers and the Contract Room — performance of a contract (article 7, V).",
            "Verifying identity with documents (KYC) — performance of a contract (article 7, V) and legitimate interest in fraud prevention (article 7, IX); where required by law, compliance with a legal obligation (article 7, II).",
            "Releasing contact details to the counterparty when the deal closes — performance of a contract (article 7, V).",
            "Calculating and charging the success fee — performance of a contract (article 7, V) and regular exercise of rights (article 7, VI).",
            "Recording acceptance of the legal documents, with IP address and user agent — compliance with a legal obligation and regular exercise of rights (article 7, II and VI).",
            "Security, fraud prevention and investigation of breaches of the rules of conduct, including clauses 3.1 and 3.3 of the Terms — legitimate interest (article 7, IX) and regular exercise of rights (article 7, VI).",
            "Keeping access logs — compliance with a legal obligation (article 7, II, together with article 15 of the Brazilian Internet Act).",
            "Measuring audience in aggregate to improve the product — legitimate interest (article 7, IX).",
            "Sending operational communications about negotiations and your account — performance of a contract (article 7, V). Marketing communications, if any, depend on your consent (article 7, I), revocable at any time.",
          ],
        },
      ],
    },
    {
      id: "compartilhamento",
      title: "Whom we share data with",
      blocks: [
        {
          kind: "p",
          text: "With the COUNTERPARTY, at closing: when the deal closes, your name, phone number and e-mail are released to the other party in that negotiation — and theirs to you. Before closing, this data is not accessible to the counterparty or to third parties: the block is technical, enforced in the database itself.",
        },
        {
          kind: "p",
          text: "With PROCESSORS that handle data on our behalf and under our instructions (article 39 of the LGPD): Supabase (database, authentication and file storage), Vercel (application hosting) and Google (OAuth login). They do not use your data for their own purposes.",
        },
        {
          kind: "p",
          text: "With AUTHORITIES, upon a substantiated request or court order, and to exercise or defend rights in proceedings. Shared use of personal data by public authorities is subject to the LGPD, including article 26.",
        },
        {
          kind: "p",
          text: "We do not sell personal data and we do not share it with advertisers.",
        },
      ],
    },
    {
      id: "transferencia",
      title: "International data transfers",
      blocks: [
        {
          kind: "p",
          text: "The controller is based in the United States and the processors listed in section 5 handle data outside Brazil, mainly on United States territory. This means your data is transferred internationally.",
        },
        {
          kind: "p",
          text: "The transfer is based on article 33 of the LGPD: item V, as it is necessary for the performance of the contract to which you are a party, and item II, through the guarantees of compliance with the principles and rights of the LGPD undertaken in the data protection instruments signed with the processors.",
        },
        {
          kind: "p",
          text: "Regardless of the country where the data is held, the LGPD continues to apply to this processing and you keep all the rights described in section 8.",
        },
      ],
    },
    {
      id: "retencao",
      title: "How long we keep data",
      blocks: [
        {
          kind: "list",
          items: [
            "Account, profile and listings: for as long as your account exists.",
            "Messages, offers and contracts: while the account exists and, after closure, for the period needed for the regular exercise of rights, including investigating breaches of clauses 3.1 and 3.3 of the Terms.",
            "Identity verification documents: for the time needed for the verification purpose and for the applicable legal periods.",
            "Legal acceptances (document, version, date, IP and user agent): for the duration of the relationship and the applicable limitation periods, as they are the evidence of contractual consent.",
            "Access logs (date, time, IP address and user agent of requests): today we keep no dedicated store for these records — they live in the logs of our hosting and database infrastructure and remain available for the technical retention period those providers offer. Where retention is required, it rests on article 15 of the Brazilian Internet Act and covers the records under our custody, and may be extended by court order.",
            "Records of relevant events (sign-up, legal acceptances, offers and closings): kept in our database for as long as the account exists and for the period needed to comply with legal obligations and to exercise rights.",
          ],
        },
        {
          kind: "note",
          text: "We would rather state what we actually do: we do not promise an access-log retention period longer than what the current infrastructure delivers. If we start keeping a dedicated store with a fixed period, this Policy will be updated first.",
        },
        {
          kind: "p",
          text: "Once these periods end, data is deleted or anonymised, except in the cases of article 16 of the LGPD.",
        },
      ],
    },
    {
      id: "direitos",
      title: "Your rights and how to exercise them",
      blocks: [
        {
          kind: "p",
          text: "The LGPD guarantees you, at any time and free of charge (article 18):",
        },
        {
          kind: "list",
          items: [
            "confirmation that processing exists and access to the data;",
            "correction of incomplete, inaccurate or outdated data;",
            "anonymisation, blocking or deletion of unnecessary or excessive data, or data processed in breach of the law;",
            "portability to another provider, upon express request;",
            "deletion of data processed on the basis of consent;",
            "information about whom we share your data with;",
            "information about the possibility of refusing consent and the consequences of refusal;",
            "withdrawal of consent;",
            "objection to processing based on legitimate interest, where the law has not been complied with.",
          ],
        },
        {
          kind: "p",
          text: "To exercise any of these rights, write to privacidade@palmo.lat. We will reply within 15 (fifteen) days, the period set by article 19, II, of the LGPD, and may send a simplified answer before that. We may ask for additional information to confirm your identity before fulfilling the request.",
        },
        {
          kind: "p",
          text: "Some requests may be refused where there is a legal retention duty or a need for the regular exercise of rights — in those cases, we explain why. You may also file a complaint with the Brazilian National Data Protection Authority (ANPD).",
        },
      ],
    },
    {
      id: "seguranca",
      title: "Security",
      blocks: [
        {
          kind: "p",
          text: "We adopt technical and administrative measures to protect your data, including:",
        },
        {
          kind: "list",
          items: [
            "row-level security in the database: each user only reaches their own data and what is public;",
            "a contact gate enforced in the database: the counterparty's contact details are only returned by a security function when the deal status is closed — not even direct technical access to the API bypasses this rule;",
            "encryption in transit (HTTPS/TLS) across the whole platform;",
            "storage of verification documents in a private area, with access restricted to the user's own folder;",
            "authentication delegated to Google, so Palmo never stores your password.",
          ],
        },
        {
          kind: "p",
          text: "No system is completely immune. If a security incident occurs with relevant risk to your rights, we will notify you and the ANPD, as set out in article 48 of the LGPD.",
        },
      ],
    },
    {
      id: "criancas",
      title: "Children and adolescents",
      blocks: [
        {
          kind: "p",
          text: "The platform is not intended for anyone under 18 and we do not knowingly collect data from children or adolescents. If we identify an account created by a minor, it will be closed and the data deleted. Guardians who identify such use may write to privacidade@palmo.lat.",
        },
      ],
    },
    {
      id: "alteracoes",
      title: "Changes and version history",
      blocks: [
        {
          kind: "p",
          text: "This Policy may be updated to reflect changes in the platform or in the law. The version in force and its date are always shown at the top of this page. Material changes will be announced and will require a new acceptance on your next visit.",
        },
        {
          kind: "list",
          items: [
            "Version 1.0 — initial version, published when the marketplace opened to the public.",
          ],
        },
      ],
    },
  ],
};
