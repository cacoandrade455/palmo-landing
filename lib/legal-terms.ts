import type { LegalDocument } from "./legal";

/**
 * TERMOS DE USO — versão canônica em português (`termsPt`) e tradução de
 * cortesia em inglês (`termsEn`). Nada aqui é dado de mercado: números que
 * aparecem no texto são parâmetros do NEGÓCIO (taxa de 5%, multa de 10%,
 * prazo de 12 meses) e da LEI (artigos citados).
 *
 * A seção 3 é a cláusula central do modelo (gate de contato + não
 * circunvenção + cláusula penal) e é renderizada com destaque próprio.
 */

export const termsPt: LegalDocument = {
  title: "Termos de Uso",
  intro:
    "Estes Termos regulam o uso da plataforma Palmo. Ao criar uma conta ou usar a plataforma, você declara que leu, entendeu e aceita estas condições. Se não concordar com alguma delas, não use a plataforma.",
  sections: [
    {
      id: "quem-somos",
      title: "Quem somos e o que a plataforma faz",
      blocks: [
        {
          kind: "p",
          text: "A Palmo é uma plataforma digital operada por Suipump Inc., sociedade constituída no estado de Delaware, Estados Unidos (C-Corp, file number 10637185), que atua sob a marca Palmo. A empresa não possui, neste momento, inscrição no CNPJ brasileiro. Sua atividade é dirigida ao Brasil e observa a legislação brasileira aplicável, na forma da seção 12.",
        },
        {
          kind: "p",
          text: "A Palmo é um marketplace: conecta donos de terra ociosa a produtores que querem plantar, criar ou explorar essa terra. O que a plataforma oferece é a CONEXÃO e as ferramentas em torno dela.",
        },
        {
          kind: "p",
          text: "Definições usadas em todos os documentos da plataforma: PROPRIETÁRIO é a parte que oferece a terra: o arrendador, no contrato de arrendamento, ou o parceiro-outorgante, no contrato de parceria. PRODUTOR é a parte que toma a terra para produzir: o arrendatário ou o parceiro-outorgado.",
        },
        {
          kind: "list",
          items: [
            "Publicação de anúncios de terra disponível.",
            "Verificação de identidade das contas, com documentos.",
            "Canal de mensagens entre as partes, com propostas estruturadas.",
            "Geração de minutas-modelo de contrato para discussão entre as partes.",
            "Liberação recíproca dos dados de contato quando o negócio é fechado.",
            "Calculadora pública de faixas de referência de arrendamento.",
          ],
        },
        {
          kind: "p",
          text: "A Palmo NÃO é parte do contrato agrário celebrado entre o dono da terra e o produtor. A Palmo não é corretora nem intermediária imobiliária, não presta consultoria agronômica, não presta serviços advocatícios e não representa nenhuma das partes na negociação.",
        },
        {
          kind: "p",
          text: "A Palmo também não vistoria a terra, não confere a titularidade do imóvel, não assina o contrato pelas partes e não garante a celebração, o cumprimento ou o resultado econômico de qualquer negócio.",
        },
        {
          kind: "note",
          text: "Recursos que a plataforma ainda NÃO oferece nesta versão: assinatura eletrônica integrada e monitoramento por satélite. Quando existirem, estes Termos serão atualizados.",
        },
      ],
    },
    {
      id: "cadastro",
      title: "Cadastro, verificação de identidade e responsabilidade pelos dados",
      blocks: [
        {
          kind: "p",
          text: "O cadastro é feito com uma conta Google. Você é responsável por manter a segurança do seu acesso e por tudo que for feito na sua conta. A conta é pessoal e intransferível.",
        },
        {
          kind: "p",
          text: "Para usar as funcionalidades que envolvem negociação, a conta passa por verificação de identidade com documentos (CPF, para pessoa física, ou CNPJ e dados do responsável, para pessoa jurídica). A verificação confirma QUEM É a pessoa por trás da conta. Ela não confirma a titularidade da terra anunciada, nem a exatidão das informações do anúncio.",
        },
        {
          kind: "p",
          text: "Você declara que as informações fornecidas são verdadeiras, completas e atuais, e se compromete a mantê-las atualizadas. Informação falsa, documento adulterado ou identidade de terceiro autorizam a suspensão imediata da conta, sem prejuízo das responsabilidades civil e penal.",
        },
        {
          kind: "p",
          text: "A plataforma não é destinada a menores de 18 anos. Ao usá-la, você declara ser maior de 18 anos e civilmente capaz, ou representar validamente a pessoa jurídica em nome da qual atua.",
        },
        {
          kind: "p",
          text: "O aceite destes Termos é registrado em camadas, no momento em que cada regra passa a valer para você: no cadastro (Termos e Política de Privacidade), ao publicar um anúncio (a Taxa), ao enviar uma proposta formal (regras de conduta da seção 3) e no fechamento do negócio (termo específico da taxa). De cada aceite guardamos o documento, a versão, a data e hora, o endereço IP, o user agent e o anúncio ou negócio a que ele se refere (ver a seção 2 da Política de Privacidade).",
        },
      ],
    },
    {
      id: "conduta",
      title: "Regras de conduta e uso do chat",
      blocks: [
        {
          kind: "p",
          text: "A Palmo é gratuita até o fechamento do negócio. Isso só é possível porque a plataforma remunera-se da Taxa devida quando o negócio fecha (definida na seção 5), e porque o contato direto entre as partes é liberado no fechamento. As regras desta seção são condição essencial do uso da plataforma e cada usuário as aceita expressamente.",
        },
        {
          kind: "clause",
          ref: "3.1",
          title: "Proibição de troca de contato antes do fechamento",
          text: "É ESTRITAMENTE PROIBIDO compartilhar, solicitar ou tentar obter dados de contato pessoal (telefone, e-mail, redes sociais, endereço, links de contato direto ou qualquer outro meio de comunicação fora da plataforma) por meio do chat, da descrição do anúncio, das fotos ou de qualquer campo livre da plataforma, antes do fechamento formal do negócio.",
        },
        {
          kind: "clause",
          ref: "3.2",
          title: "Liberação do contato",
          text: "O contato entre as partes é liberado pela plataforma no fechamento do negócio. A partir desse momento, dono e produtor recebem os dados de contato um do outro e podem se comunicar livremente pelos canais que escolherem.",
        },
        {
          kind: "clause",
          ref: "3.3",
          title: "Não circunvenção",
          text: "As partes que se conheceram por meio da Palmo não podem celebrar, por fora da plataforma, negócio sobre a mesma terra (direta ou indiretamente, em nome próprio ou de terceiros, inclusive por meio de cônjuge, companheiro, parentes, sócios ou pessoas jurídicas ligadas) pelo prazo de 12 (doze) meses contados da última interação na plataforma.",
        },
        {
          kind: "clause",
          ref: "3.4",
          title: "Cláusula penal",
          text: "O descumprimento das cláusulas 3.1 ou 3.3 sujeita a parte infratora ao pagamento de multa equivalente ao DOBRO da Taxa que seria devida sobre o negócio, correspondente a 10% (dez por cento) do valor total do contrato firmado ou pretendido, sem prejuízo da suspensão ou do encerramento da conta. Esta multa vincula AMBAS as partes (proprietário e produtor), ainda que a Taxa seja devida apenas pelo proprietário: quem burla a regra responde por ela. A multa é convencionada como cláusula penal, nos termos dos arts. 408 e seguintes do Código Civil, tem natureza compensatória e é proporcional ao proveito econômico do negócio que se pretendeu subtrair à plataforma. Observado o art. 412 do Código Civil, seu valor não excede o da obrigação principal; e, nos termos do art. 413, poderá ser reduzida equitativamente se a obrigação tiver sido cumprida em parte ou se o montante se mostrar manifestamente excessivo diante da natureza e da finalidade do negócio.",
        },
        {
          kind: "clause",
          ref: "3.5",
          title: "Apuração e prova",
          text: "A Palmo pode suspender contas, remover anúncios e reter as conversas, propostas e demais registros da plataforma como prova, para apurar infrações a estas regras e para exercer seus direitos, observada a Política de Privacidade.",
        },
        {
          kind: "p",
          text: "Também é vedado: publicar conteúdo ilícito, ofensivo ou discriminatório; anunciar terra que não lhe pertence nem lhe foi autorizada; usar a plataforma para spam, fraude ou coleta automatizada de dados; e tentar contornar, por qualquer meio técnico, as travas de contato descritas nesta seção.",
        },
      ],
    },
    {
      id: "anuncios",
      title: "Anúncios: responsabilidade pelas informações da terra",
      blocks: [
        {
          kind: "p",
          text: "Quem anuncia declara ser o proprietário do imóvel ou estar autorizado a oferecê-lo, e é o único responsável pela veracidade e pela atualização das informações publicadas: localização, área, finalidade, cultura, presença de água, preço pretendido, registro no CAR, matrícula, fotos e descrição.",
        },
        {
          kind: "p",
          text: "A Palmo verifica a IDENTIDADE das contas, não a TITULARIDADE dos imóveis. O selo “Verificado” exibido em um anúncio indica apenas que o anúncio informou o registro no Cadastro Ambiental Rural (CAR): não é atestado de propriedade, de regularidade ambiental ou fundiária, nem de exatidão das demais informações. A conferência de documentos e da situação do imóvel é responsabilidade das partes e de seus assessores.",
        },
        {
          kind: "p",
          text: "A Palmo pode, a qualquer tempo, remover ou suspender anúncios que violem estes Termos, que contenham informação aparentemente falsa ou que sejam objeto de reclamação fundamentada.",
        },
      ],
    },
    {
      id: "taxa",
      title: "A Taxa devida à Palmo",
      blocks: [
        {
          kind: "p",
          text: "O uso da plataforma é gratuito até o fechamento do negócio: anunciar, buscar, conversar e negociar não custam nada, para nenhuma das partes.",
        },
        {
          kind: "p",
          text: "Chama-se TAXA (a “Taxa”) a quantia devida à Palmo pelo PROPRIETÁRIO quando um negócio é fechado por meio da plataforma. A Taxa corresponde a 5% (cinco por cento) sobre o valor total do contrato celebrado entre as partes e é cobrada proporcionalmente a cada pagamento anual: ou seja, 5% de cada parcela anual, à medida que o contrato for sendo pago.",
        },
        {
          kind: "p",
          text: "A Taxa NÃO é um acréscimo ao valor do arrendamento nem é cobrada do produtor: ela é um percentual do valor do próprio contrato, conhecido por ambas as partes antes da negociação e exibido na plataforma durante a discussão da minuta. O preço combinado entre proprietário e produtor não muda por causa dela.",
        },
        {
          kind: "p",
          text: "O valor total do contrato, para efeito de cálculo, é o resultado do preço acordado multiplicado pela área contratada e pelo prazo em anos. Quando o contrato prever remuneração variável (parceria), a base de cálculo é o valor efetivamente devido ao proprietário em cada período.",
        },
        {
          kind: "p",
          text: "A cobrança da Taxa é feita por meio do documento de cobrança informado pela plataforma, com vencimento vinculado a cada pagamento anual do contrato. O proprietário declara conhecer e aceitar essa estrutura no momento do fechamento, por meio de termo específico registrado na plataforma.",
        },
        {
          kind: "p",
          text: "A Palmo poderá, no futuro, processar o pagamento do contrato dentro da plataforma e reter a Taxa na fonte, repassando ao proprietário o valor líquido. Essa mudança só valerá mediante aviso prévio e nova aceitação, na forma da seção 11.",
        },
        {
          kind: "p",
          text: "O atraso no pagamento da Taxa sujeita o devedor a atualização monetária pelo IPCA, juros de mora de 1% (um por cento) ao mês e multa moratória de 2% (dois por cento) sobre o valor em atraso, além de autorizar a suspensão da conta e a cobrança pelos meios legais cabíveis. Negócio não fechado não gera Taxa.",
        },
        {
          kind: "p",
          text: "Os encargos de mora deste item NÃO se cumulam com a cláusula penal de 10% prevista na cláusula 3.4 pelo mesmo fato. São coisas distintas: a cláusula penal sanciona a circunvenção da plataforma (descumprimento das cláusulas 3.1 ou 3.3), enquanto os encargos de mora remuneram o atraso no pagamento de uma taxa efetivamente devida. Um mesmo inadimplemento não gera as duas cobranças.",
        },
      ],
    },
    {
      id: "calculadora",
      title: "Conteúdo e dados da calculadora",
      blocks: [
        {
          kind: "p",
          text: "A calculadora pública e os retratos regionais apresentam ESTIMATIVAS construídas a partir de fontes públicas (entre elas IBGE, CONAB, Embrapa e CEPEA) e de referências públicas de mercado. Os valores são faixas de referência regionais, não avaliação individual do seu imóvel.",
        },
        {
          kind: "p",
          text: "Nenhum resultado da calculadora constitui laudo de avaliação, promessa de renda ou garantia de resultado. Solo, água, logística, clima, manejo e a própria negociação alteram o valor real. A decisão de anunciar, arrendar, plantar ou investir é exclusivamente sua e deve ser tomada com o apoio do seu agrônomo, contador e advogado.",
        },
        {
          kind: "p",
          text: "As fontes públicas são atualizadas periodicamente e podem sofrer revisão pelos órgãos que as publicam. A Palmo não responde por divergências entre a estimativa exibida e o valor efetivamente praticado no mercado.",
        },
      ],
    },
    {
      id: "minutas",
      title: "Minutas de contrato",
      blocks: [
        {
          kind: "p",
          text: "A plataforma gera MINUTAS-MODELO de contrato de arrendamento ou de parceria, preenchidas automaticamente com os dados informados pelas partes e ancoradas no Estatuto da Terra (Lei 4.504/64) e no Decreto 59.566/66.",
        },
        {
          kind: "p",
          text: "A minuta é ponto de partida para a negociação, não peça jurídica personalizada. Cada parte deve submetê-la à revisão de advogado de sua confiança antes de assinar. A Palmo não presta serviços advocatícios, não emite parecer jurídico e não figura como parte, testemunha, fiadora ou garantidora do contrato.",
        },
        {
          kind: "p",
          text: "Nesta versão, a plataforma não oferece assinatura eletrônica integrada: concluída a discussão, as partes assinam o contrato pelos meios que escolherem, por sua conta e risco.",
        },
      ],
    },
    {
      id: "propriedade-intelectual",
      title: "Propriedade intelectual",
      blocks: [
        {
          kind: "p",
          text: "A plataforma, a marca Palmo, o software, o design, os textos, os modelos de contrato, a calculadora e as bases de dados próprias são de titularidade da Suipump Inc. e protegidos pela legislação brasileira e internacional.",
        },
        {
          kind: "p",
          text: "Você recebe uma licença limitada, pessoal, revogável e não exclusiva para usar a plataforma conforme estes Termos. É vedado copiar, modificar, distribuir, fazer engenharia reversa, raspar (scraping) ou explorar comercialmente qualquer parte da plataforma sem autorização escrita.",
        },
        {
          kind: "p",
          text: "O conteúdo que você publica (fotos, descrições e demais informações do anúncio) continua seu. Ao publicá-lo, você concede à Palmo licença não exclusiva e gratuita para exibi-lo na plataforma e em materiais de divulgação do próprio anúncio, enquanto ele estiver ativo.",
        },
      ],
    },
    {
      id: "responsabilidade",
      title: "Limitação de responsabilidade e indenização",
      blocks: [
        {
          kind: "p",
          text: "A plataforma é oferecida no estado em que se encontra. Apesar do nosso empenho, não garantimos funcionamento ininterrupto ou livre de falhas, nem que o conteúdo publicado por outros usuários seja verdadeiro.",
        },
        {
          kind: "p",
          text: "A Palmo não responde pela celebração, pelo cumprimento, pela rescisão ou pelo resultado econômico do contrato entre dono e produtor; pela conduta dos usuários dentro ou fora da plataforma; nem por perdas decorrentes de decisões tomadas com base nas estimativas da calculadora.",
        },
        {
          kind: "p",
          text: "Na máxima extensão permitida pela lei aplicável, e ressalvadas as hipóteses de responsabilidade que o Código de Defesa do Consumidor não permite afastar, a responsabilidade total da Palmo perante você fica limitada ao valor das taxas efetivamente pagas por você à plataforma nos 12 (doze) meses anteriores ao fato gerador.",
        },
        {
          kind: "p",
          text: "Você concorda em indenizar a Palmo por perdas, custos e honorários decorrentes do uso indevido da plataforma, da violação destes Termos ou de direitos de terceiros.",
        },
      ],
    },
    {
      id: "encerramento",
      title: "Suspensão e encerramento de conta",
      blocks: [
        {
          kind: "p",
          text: "A Palmo pode suspender ou encerrar contas, com aviso sempre que possível, em caso de violação destes Termos (especialmente das cláusulas 3.1 e 3.3), de fraude, de informação falsa, de risco à segurança da plataforma ou de determinação legal.",
        },
        {
          kind: "p",
          text: "Você pode encerrar sua conta a qualquer momento, pelo canal de contato da seção 13. O encerramento não extingue obrigações já constituídas, especialmente a Taxa devida sobre negócio já fechado e as consequências da cláusula penal.",
        },
        {
          kind: "p",
          text: "Sobrevivem ao encerramento, pelo prazo de sua eficácia, as cláusulas 3.3 e 3.4 e as seções 5, 8, 9 e 12.",
        },
      ],
    },
    {
      id: "alteracoes",
      title: "Alteração destes Termos",
      blocks: [
        {
          kind: "p",
          text: "Estes Termos podem ser alterados para refletir mudanças na plataforma ou na legislação. A versão vigente e sua data estão sempre no topo desta página.",
        },
        {
          kind: "p",
          text: "Alterações materiais (que afetem seus direitos, suas obrigações ou a estrutura da taxa) serão comunicadas com antecedência razoável e exigirão NOVA ACEITAÇÃO no seu próximo acesso. Continuar usando a plataforma após alterações não materiais significa concordar com elas.",
        },
      ],
    },
    {
      id: "lei-e-foro",
      title: "Lei aplicável e foro",
      blocks: [
        {
          kind: "p",
          text: "Estes Termos são regidos e interpretados pela lei brasileira, inclusive o Código Civil, o Código de Defesa do Consumidor, o Marco Civil da Internet (Lei 12.965/2014), a Lei Geral de Proteção de Dados (Lei 13.709/2018) e, no que couber, o Estatuto da Terra.",
        },
        {
          kind: "p",
          text: "Fica eleito o foro do domicílio do usuário no Brasil para dirimir controvérsias decorrentes destes Termos. Sendo o usuário consumidor, o foro competente é sempre o do seu domicílio, nos termos do art. 101, I, do Código de Defesa do Consumidor. Nenhuma disposição destes Termos submete o usuário brasileiro à jurisdição do estado de Delaware ou de qualquer outro foro estrangeiro.",
        },
      ],
    },
    {
      id: "contato",
      title: "Contato",
      blocks: [
        {
          kind: "p",
          text: "Para assuntos de privacidade e proteção de dados, inclusive o exercício dos direitos previstos na LGPD, fale com o nosso encarregado: privacidade@palmo.lat.",
        },
        {
          kind: "p",
          text: "Para os demais assuntos (dúvidas sobre a plataforma, denúncias de violação destes Termos e pedidos de encerramento de conta), use os canais de atendimento indicados no site, incluindo o WhatsApp no rodapé.",
        },
      ],
    },
  ],
};

export const termsEn: LegalDocument = {
  title: "Terms of Use",
  intro:
    "These Terms govern the use of the Palmo platform. By creating an account or using the platform, you confirm that you have read, understood and accepted them. If you do not agree with any of them, do not use the platform.",
  sections: [
    {
      id: "quem-somos",
      title: "Who we are and what the platform does",
      blocks: [
        {
          kind: "p",
          text: "Palmo is a digital platform operated by Suipump Inc., a company incorporated in the state of Delaware, United States (C-Corp, file number 10637185), doing business under the Palmo brand. The company currently has no Brazilian CNPJ registration. Its activity is directed at Brazil and follows the applicable Brazilian legislation, as set out in section 12.",
        },
        {
          kind: "p",
          text: "Palmo is a marketplace: it connects owners of idle land with producers who want to farm, raise livestock or otherwise put that land to work. What the platform offers is the CONNECTION and the tools around it.",
        },
        {
          kind: "p",
          text: "Definitions used across all platform documents: the LANDOWNER is the party offering the land: the lessor, in a lease contract, or the granting partner, in a partnership contract. The PRODUCER is the party taking the land to work it: the lessee or the grantee partner.",
        },
        {
          kind: "list",
          items: [
            "Publication of listings for available land.",
            "Identity verification of accounts, with documents.",
            "A messaging channel between the parties, with structured offers.",
            "Generation of model contract drafts for the parties to discuss.",
            "Mutual release of contact details when the deal closes.",
            "A public calculator of reference lease ranges.",
          ],
        },
        {
          kind: "p",
          text: "Palmo is NOT a party to the rural contract signed between the landowner and the producer. Palmo is not a broker or real-estate intermediary, does not provide agronomic consulting, does not provide legal services and does not represent either party in the negotiation.",
        },
        {
          kind: "p",
          text: "Palmo also does not inspect the land, does not confirm title to the property, does not sign the contract on behalf of the parties and does not guarantee the signing, the performance or the economic outcome of any deal.",
        },
        {
          kind: "note",
          text: "Features the platform does NOT offer in this version: integrated electronic signature and satellite monitoring. When they exist, these Terms will be updated.",
        },
      ],
    },
    {
      id: "cadastro",
      title: "Sign-up, identity verification and responsibility for your data",
      blocks: [
        {
          kind: "p",
          text: "Sign-up is done with a Google account. You are responsible for keeping your access secure and for everything done through your account. The account is personal and non-transferable.",
        },
        {
          kind: "p",
          text: "To use the features that involve negotiation, the account goes through identity verification with documents (CPF for individuals, or CNPJ and the details of the responsible person for companies). Verification confirms WHO is behind the account. It does not confirm title to the advertised land, nor the accuracy of the listing information.",
        },
        {
          kind: "p",
          text: "You represent that the information you provide is true, complete and current, and you undertake to keep it up to date. False information, altered documents or the use of someone else's identity authorise the immediate suspension of the account, without prejudice to civil and criminal liability.",
        },
        {
          kind: "p",
          text: "The platform is not intended for anyone under 18. By using it, you represent that you are over 18 and legally capable, or that you validly represent the company on whose behalf you act.",
        },
        {
          kind: "p",
          text: "Acceptance of these Terms is recorded in layers, at the moment each rule starts to apply to you: at sign-up (Terms and Privacy Policy), when publishing a listing (success fee), when sending a formal offer (the conduct rules in section 3) and at closing (the specific fee acceptance). For each acceptance we keep the document, the version, the date and time, the IP address, the user agent and the listing or deal it refers to (see section 2 of the Privacy Policy).",
        },
      ],
    },
    {
      id: "conduta",
      title: "Rules of conduct and use of the chat",
      blocks: [
        {
          kind: "p",
          text: "Palmo is free until the deal closes. That is only possible because the platform is paid through a success fee charged when the deal happens, and because direct contact between the parties is released at closing. The rules in this section are an essential condition of using the platform and every user expressly accepts them.",
        },
        {
          kind: "clause",
          ref: "3.1",
          title: "Ban on exchanging contact details before closing",
          text: "It is STRICTLY FORBIDDEN to share, request or attempt to obtain personal contact details (phone number, e-mail, social media, address, direct contact links or any other means of communication outside the platform) through the chat, the listing description, the photos or any free-text field of the platform, before the formal closing of the deal.",
        },
        {
          kind: "clause",
          ref: "3.2",
          title: "Release of contact details",
          text: "Contact between the parties is released by the platform when the deal closes. From that moment on, owner and producer receive each other's contact details and may communicate freely through the channels they choose.",
        },
        {
          kind: "clause",
          ref: "3.3",
          title: "Non-circumvention",
          text: "Parties who met through Palmo may not close, outside the platform, a deal concerning the same land (directly or indirectly, in their own name or through third parties, including spouses, partners, relatives, business associates or related legal entities) for a period of 12 (twelve) months counted from the last interaction on the platform.",
        },
        {
          kind: "clause",
          ref: "3.4",
          title: "Penalty clause",
          text: "Breach of clauses 3.1 or 3.3 subjects the infringing party to a penalty equal to TWICE the success fee that would be due on the deal, corresponding to 10% (ten per cent) of the total value of the contract signed or intended, without prejudice to the suspension or termination of the account. This penalty binds BOTH parties (landowner and producer) even though the success fee is owed by the landowner alone: whoever breaks the rule answers for it. The penalty is agreed as a penalty clause under articles 408 et seq. of the Brazilian Civil Code, is compensatory in nature and is proportional to the economic benefit of the deal that the party sought to divert from the platform. In accordance with article 412 of the Civil Code, its amount does not exceed that of the main obligation; and, under article 413, it may be reduced equitably if the obligation has been partly performed or if the amount proves manifestly excessive given the nature and purpose of the deal.",
        },
        {
          kind: "clause",
          ref: "3.5",
          title: "Investigation and evidence",
          text: "Palmo may suspend accounts, remove listings and retain conversations, offers and other platform records as evidence, in order to investigate breaches of these rules and to exercise its rights, subject to the Privacy Policy.",
        },
        {
          kind: "p",
          text: "It is also forbidden to: publish unlawful, offensive or discriminatory content; advertise land you neither own nor were authorised to offer; use the platform for spam, fraud or automated data collection; and attempt to circumvent, by any technical means, the contact controls described in this section.",
        },
      ],
    },
    {
      id: "anuncios",
      title: "Listings: responsibility for the land information",
      blocks: [
        {
          kind: "p",
          text: "Whoever posts a listing represents that they own the property or are authorised to offer it, and is solely responsible for the truthfulness and the updating of the published information: location, area, intended use, crop, water availability, asking price, CAR registration, title record, photos and description.",
        },
        {
          kind: "p",
          text: "Palmo verifies the IDENTITY of accounts, not TITLE to properties. The “Verified” badge shown on a listing means only that the listing provided its Rural Environmental Registry (CAR) number: it is not proof of ownership, of environmental or land-tenure compliance, nor of the accuracy of the remaining information. Checking documents and the legal status of the property is the responsibility of the parties and their advisers.",
        },
        {
          kind: "p",
          text: "Palmo may, at any time, remove or suspend listings that breach these Terms, that contain apparently false information or that are the subject of a substantiated complaint.",
        },
      ],
    },
    {
      id: "taxa",
      title: "Success fee",
      blocks: [
        {
          kind: "p",
          text: "Using the platform is free until the deal closes: listing, searching, chatting and negotiating cost nothing, for either party.",
        },
        {
          kind: "p",
          text: "Once the deal closes, a success fee of 5% (five per cent) of the total value of the contract signed between the parties is due to Palmo, charged proportionally with each annual payment: that is, 5% of each annual instalment, as the contract is paid. The fee is owed by the LANDOWNER, the party offering the land.",
        },
        {
          kind: "p",
          text: "The fee is NOT an addition to the lease price, and it is not charged to the producer: it is a percentage of the contract value itself, known to both parties before the negotiation and displayed on the platform while the draft is discussed. The price agreed between landowner and producer does not change because of it.",
        },
        {
          kind: "p",
          text: "For calculation purposes, the total contract value is the agreed price multiplied by the contracted area and by the term in years. Where the contract provides for variable consideration (partnership), the calculation base is the amount actually due to the owner in each period.",
        },
        {
          kind: "p",
          text: "Charging is done through the billing document indicated by the platform, falling due together with each annual payment under the contract. The landowner acknowledges and accepts this structure at closing, through a specific acceptance recorded on the platform.",
        },
        {
          kind: "p",
          text: "Palmo may, in the future, process the contract payment inside the platform and withhold the fee at source, passing the net amount on to the landowner. Any such change will only take effect upon prior notice and a new acceptance, as set out in section 11.",
        },
        {
          kind: "p",
          text: "Late payment of the fee subjects the debtor to monetary restatement by the IPCA index, default interest of 1% (one per cent) per month and a late-payment penalty of 2% (two per cent) on the overdue amount, and authorises suspension of the account and collection through the appropriate legal means. A deal that does not close generates no fee.",
        },
        {
          kind: "p",
          text: "The default charges in this item do NOT cumulate with the 10% penalty clause set out in clause 3.4 for the same fact. They are different things: the penalty clause sanctions circumventing the platform (breach of clauses 3.1 or 3.3), while the default charges compensate for late payment of a fee that is actually owed. The same breach does not trigger both.",
        },
      ],
    },
    {
      id: "calculadora",
      title: "Calculator content and data",
      blocks: [
        {
          kind: "p",
          text: "The public calculator and the regional profiles present ESTIMATES built from public sources (among them IBGE, CONAB, Embrapa and CEPEA) and public market references. The figures are regional reference ranges, not an individual appraisal of your property.",
        },
        {
          kind: "p",
          text: "No calculator result constitutes an appraisal report, a promise of income or a guarantee of outcome. Soil, water, logistics, climate, management and the negotiation itself change the actual value. The decision to list, lease, plant or invest is exclusively yours and should be taken with the support of your agronomist, accountant and lawyer.",
        },
        {
          kind: "p",
          text: "Public sources are updated periodically and may be revised by the bodies that publish them. Palmo is not liable for differences between the estimate shown and the value actually practised in the market.",
        },
      ],
    },
    {
      id: "minutas",
      title: "Contract drafts",
      blocks: [
        {
          kind: "p",
          text: "The platform generates MODEL contract drafts for lease or partnership, automatically filled with the data provided by the parties and anchored in the Land Statute (Law 4.504/64) and Decree 59.566/66.",
        },
        {
          kind: "p",
          text: "The draft is a starting point for negotiation, not a bespoke legal instrument. Each party should submit it to a lawyer of their choice before signing. Palmo does not provide legal services, does not issue legal opinions and is not a party, witness, surety or guarantor of the contract.",
        },
        {
          kind: "p",
          text: "In this version the platform does not offer an integrated electronic signature: once the discussion is over, the parties sign the contract through the means they choose, at their own risk.",
        },
      ],
    },
    {
      id: "propriedade-intelectual",
      title: "Intellectual property",
      blocks: [
        {
          kind: "p",
          text: "The platform, the Palmo brand, the software, the design, the texts, the contract models, the calculator and our own databases belong to Suipump Inc. and are protected by Brazilian and international law.",
        },
        {
          kind: "p",
          text: "You receive a limited, personal, revocable and non-exclusive licence to use the platform in accordance with these Terms. Copying, modifying, distributing, reverse engineering, scraping or commercially exploiting any part of the platform without written authorisation is forbidden.",
        },
        {
          kind: "p",
          text: "The content you publish (photos, descriptions and other listing information) remains yours. By publishing it, you grant Palmo a non-exclusive, royalty-free licence to display it on the platform and in materials promoting that listing, for as long as it is active.",
        },
      ],
    },
    {
      id: "responsabilidade",
      title: "Limitation of liability and indemnity",
      blocks: [
        {
          kind: "p",
          text: "The platform is provided as is. Despite our efforts, we do not guarantee uninterrupted or error-free operation, nor that content published by other users is truthful.",
        },
        {
          kind: "p",
          text: "Palmo is not liable for the signing, performance, termination or economic outcome of the contract between owner and producer; for the conduct of users inside or outside the platform; nor for losses arising from decisions taken on the basis of the calculator's estimates.",
        },
        {
          kind: "p",
          text: "To the maximum extent permitted by applicable law, and except for the liability that the Brazilian Consumer Protection Code does not allow to be excluded, Palmo's total liability towards you is limited to the amount of fees you actually paid to the platform in the 12 (twelve) months preceding the triggering event.",
        },
        {
          kind: "p",
          text: "You agree to indemnify Palmo for losses, costs and legal fees arising from misuse of the platform, breach of these Terms or infringement of third-party rights.",
        },
      ],
    },
    {
      id: "encerramento",
      title: "Suspension and termination of the account",
      blocks: [
        {
          kind: "p",
          text: "Palmo may suspend or terminate accounts, with notice whenever possible, in the event of breach of these Terms (particularly clauses 3.1 and 3.3), fraud, false information, risk to the security of the platform or legal determination.",
        },
        {
          kind: "p",
          text: "You may close your account at any time through the contact channel in section 13. Closing does not extinguish obligations already incurred, particularly the success fee due on a deal already closed and the consequences of the penalty clause.",
        },
        {
          kind: "p",
          text: "Clauses 3.3 and 3.4 and sections 5, 8, 9 and 12 survive termination for as long as they remain effective.",
        },
      ],
    },
    {
      id: "alteracoes",
      title: "Changes to these Terms",
      blocks: [
        {
          kind: "p",
          text: "These Terms may be changed to reflect changes in the platform or in the law. The version in force and its date are always shown at the top of this page.",
        },
        {
          kind: "p",
          text: "Material changes (those affecting your rights, your obligations or the fee structure) will be announced with reasonable notice and will require A NEW ACCEPTANCE on your next visit. Continuing to use the platform after non-material changes means you agree with them.",
        },
      ],
    },
    {
      id: "lei-e-foro",
      title: "Governing law and jurisdiction",
      blocks: [
        {
          kind: "p",
          text: "These Terms are governed by and construed under Brazilian law, including the Civil Code, the Consumer Protection Code, the Brazilian Internet Act (Law 12.965/2014), the General Data Protection Law (Law 13.709/2018) and, where applicable, the Land Statute.",
        },
        {
          kind: "p",
          text: "The courts of the user's domicile in Brazil are elected to settle disputes arising from these Terms. Where the user is a consumer, the competent court is always that of their domicile, under article 101, I, of the Consumer Protection Code. No provision of these Terms subjects the Brazilian user to the jurisdiction of the state of Delaware or of any other foreign court.",
        },
      ],
    },
    {
      id: "contato",
      title: "Contact",
      blocks: [
        {
          kind: "p",
          text: "For privacy and data protection matters, including the exercise of the rights provided for in the LGPD, contact our data protection officer: privacidade@palmo.lat.",
        },
        {
          kind: "p",
          text: "For everything else (questions about the platform, reports of breaches of these Terms and account closure requests), use the support channels indicated on the site, including the WhatsApp link in the footer.",
        },
      ],
    },
  ],
};
