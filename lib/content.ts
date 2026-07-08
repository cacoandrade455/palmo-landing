export type Lang = "pt" | "en";

export type Content = {
  header: {
    navHow: string;
    navTrust: string;
    navPricing: string;
    cta: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaHave: string;
    ctaWant: string;
    trustLine: string;
    card: {
      photoLabel: string;
      name: string;
      area: string;
      location: string;
      verified: string;
    };
  };
  how: {
    eyebrow: string;
    title: string;
    steps: { title: string; desc: string }[];
  };
  trust: {
    eyebrow: string;
    title: string;
    badges: { title: string; desc: string }[];
  };
  appraiser: {
    navLabel: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    stateLabel: string;
    municipalityLabel: string;
    municipalityPlaceholder: string;
    municipalitySelectState: string;
    municipalityLoading: string;
    hectaresLabel: string;
    hectaresPlaceholder: string;
    purposeLabel: string;
    purposePlaceholder: string;
    submit: string;
    resultTitle: string;
    perHaYear: string;
    totalForArea: string;
    consultTitle: string;
    consultBody: string;
    consultPotential: string;
    disclaimer: string;
    legalNote: string;
    leadTitle: string;
    leadSubtitle: string;
    heroLink: string;
    compareTitle: string;
    compareUnit: string;
    compareYourChoice: string;
    compareUpsell: string;
    compareCaveat: string;
    selectiveTag: string;
    cropLabel: string;
    cropPlaceholder: string;
    cropRefPotential: string;
    vtnPotential: string;
    vtnPotentialApprox: string;
    vtnLine: string;
    vtnLineApprox: string;
    crops: Record<string, { value: string; label: string }[]>;
    cropNotes: Record<string, string>;
  };
  auth: {
    signIn: string;
    signInGoogle: string;
    signOut: string;
    myAccount: string;
    accountTitle: string;
    accountSubtitle: string;
    notSignedIn: string;
    signedInAs: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tiers: {
      name: string;
      price: string;
      priceNote?: string;
      desc: string;
      highlight?: boolean;
    }[];
    footnote: string;
  };
  waitlist: {
    eyebrow: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    countryLabel: string;
    stateLabel: string;
    statePlaceholder: string;
    municipalityLabel: string;
    municipalityPlaceholder: string;
    roleLabel: string;
    rolePlaceholder: string;
    roleHave: string;
    roleWant: string;
    purposeLabel: string;
    purposePlaceholder: string;
    purposeOptions: { value: string; label: string }[];
    submit: string;
    submitting: string;
    success: string;
    error: string;
  };
  footer: {
    tagline: string;
    whatsapp: string;
    instagram: string;
    rights: string;
    terms: string;
    privacy: string;
  };
};

export const content: Record<Lang, Content> = {
  pt: {
    header: {
      navHow: "Como funciona",
      navTrust: "Confiança",
      navPricing: "Preços",
      cta: "Anunciar minha terra",
    },
    hero: {
      title: "Cada palmo de terra produzindo",
      subtitle:
        "Conectamos donos de terras paradas a quem quer produzir nelas — com verificação, contrato e acompanhamento.",
      ctaHave: "Tenho terra",
      ctaWant: "Procuro terra",
      trustLine: "Grátis até fechar negócio",
      card: {
        photoLabel: "foto aérea da fazenda",
        name: "Fazenda Boa Vista",
        area: "128 ha",
        location: "Rio Verde, GO",
        verified: "Verificado",
      },
    },
    how: {
      eyebrow: "Como funciona",
      title: "Do anúncio à assinatura, em três passos",
      steps: [
        {
          title: "Anuncie com verificação",
          desc: "Documentos e dados da terra conferidos antes de publicar.",
        },
        {
          title: "Encontre o parceiro ideal",
          desc: "Produtores, pecuária, solar e reflorestamento entram em contato. Você conversa e compara.",
        },
        {
          title: "Feche com segurança",
          desc: "Contrato padronizado, assinatura digital e relatórios de acompanhamento.",
        },
      ],
    },
    trust: {
      eyebrow: "Confiança",
      title: "Feito para dar segurança aos dois lados",
      badges: [
        {
          title: "Anúncios verificados",
          desc: "Toda terra publicada passa por checagem de documentos e do CAR.",
        },
        {
          title: "Contratos padronizados",
          desc: "Modelos revisados por advogados do agro, com termos claros de arrendamento ou parceria.",
        },
        {
          title: "Acompanhamento por satélite",
          desc: "O dono recebe relatórios periódicos mostrando como a terra está sendo usada.",
        },
      ],
    },
    appraiser: {
      navLabel: "Quanto vale",
      eyebrow: "Calculadora",
      title: "Quanto vale sua terra parada?",
      subtitle:
        "Descubra em 1 minuto a faixa de valores de arrendamento praticada na sua região.",
      stateLabel: "Estado",
      municipalityLabel: "Município",
      municipalityPlaceholder: "Selecione o município...",
      municipalitySelectState: "Escolha o estado primeiro",
      municipalityLoading: "Carregando municípios...",
      hectaresLabel: "Área (hectares)",
      hectaresPlaceholder: "Ex.: 128",
      purposeLabel: "Uso da terra",
      purposePlaceholder: "Selecione o uso...",
      submit: "Calcular valor",
      resultTitle: "Faixa de referência para sua terra",
      perHaYear: "por hectare/ano",
      totalForArea: "Para sua área, algo em torno de",
      consultTitle: "Esse mercado é muito específico",
      consultBody:
        "Para esse uso, os valores variam demais de região para região para darmos uma faixa confiável. Deixe seu contato e avisamos quando tivermos propostas reais na sua região.",
      consultPotential:
        "Potencial da sua área com {use} — o uso mais valorizado com referência na sua região:",
      disclaimer:
        "Valores de referência baseados em fontes públicas do mercado (sindicatos rurais, IMEA, CNA, consultorias). Não constituem avaliação formal — o valor real depende de solo, logística, água e negociação.",
      legalNote:
        "Pela lei (Estatuto da Terra), o arrendamento é limitado a 15% do valor do imóvel por ano (30% em zonas de exploração intensiva).",
      leadTitle: "Quer receber propostas reais nessa faixa?",
      leadSubtitle: "Entre na lista de espera — é grátis.",
      heroLink: "Quanto vale minha terra? →",
      compareTitle: "Outros usos na sua região",
      compareUnit: "/ha/ano",
      compareYourChoice: "sua escolha",
      compareUpsell:
        "Na sua região, terras para {use} chegam a arrendar por até {ratio}x o valor da sua escolha atual.",
      compareCaveat:
        "A comparação usa faixas regionais de mercado. Se um uso mais valorizado é viável na sua terra depende de solo, relevo, água e logística — a Palmo pode ajudar a verificar isso.",
      selectiveTag: "mercado seletivo — depende de projeto e rede elétrica na região",
      cropLabel: "Cultura específica (opcional)",
      cropPlaceholder: "Todas / não sei ainda",
      cropRefPotential:
        "Estimativa com base no valor de mercado de {source} — R$ {landMin} a {landMax} mil/ha — convertido a 2,5–6% ao ano:",
      vtnPotential:
        "Estimativa pelo valor oficial da terra no seu município (VTN {year} da Receita Federal × 2,5–6% ao ano):",
      vtnPotentialApprox:
        "Seu município não informou VTN à Receita Federal. Estimativa pela média oficial do seu estado (VTN {year} × 2,5–6% ao ano):",
      vtnLine:
        "Valor oficial da terra (VTN {year}, Receita Federal) no seu município: {value}/ha.",
      vtnLineApprox:
        "Média oficial da terra no seu estado (VTN {year}, Receita Federal): {value}/ha — seu município não informou valor próprio.",
      crops: {
        graos: [
          { value: "soja", label: "Soja" },
          { value: "milho", label: "Milho" },
          { value: "algodao", label: "Algodão" },
          { value: "arroz", label: "Arroz irrigado" },
          { value: "feijao", label: "Feijão" },
          { value: "sorgo", label: "Sorgo" },
          { value: "trigo", label: "Trigo" },
        ],
        lavoura_permanente: [
          { value: "cafe", label: "Café" },
          { value: "cacau", label: "Cacau" },
          { value: "citros", label: "Citros (laranja, limão...)" },
          { value: "seringueira", label: "Seringueira" },
          { value: "dende", label: "Dendê" },
        ],
        fruticultura: [
          { value: "banana", label: "Banana" },
          { value: "manga", label: "Manga" },
          { value: "uva", label: "Uva" },
          { value: "melao", label: "Melão" },
          { value: "acai", label: "Açaí" },
        ],
        horticultura: [
          { value: "hortalicas", label: "Hortaliças em geral" },
          { value: "batata", label: "Batata" },
          { value: "tomate", label: "Tomate" },
          { value: "cebola", label: "Cebola" },
        ],
      },
      cropNotes: {
        soja: "Contratos de grãos são normalmente fixados em sacas de soja por hectare/ano.",
        milho: "Mesmo para milho, os contratos costumam ser fixados em sacas de soja por hectare/ano (rotação soja/milho).",
        algodao: "Áreas aptas a algodão costumam negociar no topo da faixa de grãos da região.",
        arroz: "Arroz irrigado tem mercado próprio: normalmente 18–25 sacas de arroz/ha/ano por terra e água (referência RS).",
        cafe: "Café costuma ser negociado em parceria (meação), não em valor fixo por hectare — os valores variam muito por região e produtividade.",
        cacau: "Cacau costuma ser negociado em parceria, com partilha da produção — valores fixos por hectare são raros.",
      },
    },
    auth: {
      signIn: "Entrar",
      signInGoogle: "Entrar com Google",
      signOut: "Sair",
      myAccount: "Minha conta",
      accountTitle: "Minha conta",
      accountSubtitle: "Sua conta na Palmo. Em breve: seus anúncios e propostas.",
      notSignedIn: "Você ainda não entrou. Entre para salvar seus dados e acompanhar seus anúncios.",
      signedInAs: "Conectado como",
    },
    pricing: {
      eyebrow: "Preços",
      title: "Preços transparentes",
      subtitle:
        "Você só paga quando fecha negócio. Sem mensalidade e sem taxa de anúncio.",
      tiers: [
        {
          name: "Anunciar e buscar",
          price: "Grátis",
          desc: "Cadastre sua terra, veja anúncios, converse e negocie. De graça para os dois lados.",
        },
        {
          name: "Taxa de sucesso",
          price: "5%",
          priceNote: "do 1º ano de contrato",
          desc: "Cobrada só na assinatura e paga por quem vai produzir na terra. Inclui contrato padronizado, verificação e assinatura digital.",
          highlight: true,
        },
        {
          name: "Monitoramento por satélite",
          price: "Assinatura mensal",
          desc: "Para o dono acompanhar como a terra está sendo usada, por imagens de satélite da Hexagon. Cancele quando quiser.",
        },
      ],
      footnote: "Sem taxas escondidas. O dono nunca paga para anunciar.",
    },
    waitlist: {
      eyebrow: "Seja um dos primeiros",
      title: "Entre para a lista de espera",
      subtitle:
        "Avisamos você pelo WhatsApp assim que a Palmo abrir na sua região.",
      nameLabel: "Nome",
      namePlaceholder: "Seu nome completo",
      phoneLabel: "WhatsApp",
      phonePlaceholder: "(00) 00000-0000",
      countryLabel: "País",
      stateLabel: "Estado",
      statePlaceholder: "Ex.: Bahia",
      municipalityLabel: "Município",
      municipalityPlaceholder: "Ex.: Salvador",
      roleLabel: "Você é...",
      rolePlaceholder: "Selecione...",
      roleHave: "Tenho terra",
      roleWant: "Procuro terra",
      purposeLabel: "Finalidade de uso da terra",
      purposePlaceholder: "Selecione a finalidade...",
      purposeOptions: [
        { value: "graos", label: "Grãos (soja, milho, algodão...)" },
        { value: "cana", label: "Cana-de-açúcar" },
        { value: "lavoura_permanente", label: "Lavoura permanente (café, citros, cacau...)" },
        { value: "fruticultura", label: "Fruticultura" },
        { value: "horticultura", label: "Horticultura e hortaliças" },
        { value: "pecuaria_corte", label: "Pecuária de corte" },
        { value: "pecuaria_leite", label: "Pecuária leiteira" },
        { value: "avicultura_suinocultura", label: "Avicultura / suinocultura" },
        { value: "aquicultura", label: "Aquicultura" },
        { value: "silvicultura", label: "Silvicultura (eucalipto, pinus...)" },
        { value: "reflorestamento_carbono", label: "Reflorestamento / crédito de carbono" },
        { value: "energia_solar", label: "Energia solar" },
        { value: "energia_eolica", label: "Energia eólica" },
        { value: "outro", label: "Outro" },
      ],
      submit: "Quero entrar na lista",
      submitting: "Enviando...",
      success: "Recebido! Entraremos em contato pelo WhatsApp.",
      error: "Algo deu errado. Tente novamente em instantes.",
    },
    footer: {
      tagline: "De palmo em palmo, a terra volta a produzir.",
      whatsapp: "Falar no WhatsApp",
      instagram: "Instagram",
      rights: "© 2026 Palmo. Palmo no Brasil.",
      terms: "Termos",
      privacy: "Privacidade",
    },
  },
  en: {
    header: {
      navHow: "How it works",
      navTrust: "Trust",
      navPricing: "Pricing",
      cta: "List my land",
    },
    hero: {
      title: "Every inch of land, working",
      subtitle:
        "We connect idle-land owners with the people ready to make it produce — verified, contracted, monitored.",
      ctaHave: "I have land",
      ctaWant: "I'm looking for land",
      trustLine: "Free until the deal closes",
      card: {
        photoLabel: "aerial photo of the farm",
        name: "Fazenda Boa Vista",
        area: "128 ha",
        location: "Rio Verde, GO",
        verified: "Verified",
      },
    },
    how: {
      eyebrow: "How it works",
      title: "From listing to signature, in three steps",
      steps: [
        {
          title: "List with verification",
          desc: "Documents and land data checked before it goes live.",
        },
        {
          title: "Find the right partner",
          desc: "Farmers, cattle operations, solar and reforestation projects reach out. You talk and compare.",
        },
        {
          title: "Close with confidence",
          desc: "Standard contract, digital signature, and ongoing monitoring reports.",
        },
      ],
    },
    trust: {
      eyebrow: "Trust",
      title: "Built to protect both sides",
      badges: [
        {
          title: "Verified listings",
          desc: "Every listed property is checked against documents and the CAR registry.",
        },
        {
          title: "Standard contracts",
          desc: "Templates reviewed by agricultural lawyers, with clear lease or partnership terms.",
        },
        {
          title: "Satellite monitoring",
          desc: "Owners receive periodic reports showing exactly how their land is being used.",
        },
      ],
    },
    appraiser: {
      navLabel: "Land value",
      eyebrow: "Calculator",
      title: "How much is your idle land worth?",
      subtitle:
        "Find out in 1 minute the lease value range practiced in your region.",
      stateLabel: "State",
      municipalityLabel: "Municipality",
      municipalityPlaceholder: "Select the municipality...",
      municipalitySelectState: "Pick the state first",
      municipalityLoading: "Loading municipalities...",
      hectaresLabel: "Area (hectares)",
      hectaresPlaceholder: "e.g. 128",
      purposeLabel: "Land use",
      purposePlaceholder: "Select a use...",
      submit: "Calculate value",
      resultTitle: "Reference range for your land",
      perHaYear: "per hectare/year",
      totalForArea: "For your area, roughly",
      consultTitle: "This market is very specific",
      consultBody:
        "For this use, values vary too much between regions for a reliable range. Leave your contact and we'll let you know when there are real offers in your region.",
      consultPotential:
        "Your area's potential with {use} — the highest-value benchmarked use in your region:",
      disclaimer:
        "Reference values based on public market sources (rural unions, IMEA, CNA, consultancies). Not a formal appraisal — actual value depends on soil, logistics, water and negotiation.",
      legalNote:
        "By law (Estatuto da Terra), rural rent is capped at 15% of the property value per year (30% in intensive-use zones).",
      leadTitle: "Want to receive real offers in this range?",
      leadSubtitle: "Join the waitlist — it's free.",
      heroLink: "How much is my land worth? →",
      compareTitle: "Other uses in your region",
      compareUnit: "/ha/yr",
      compareYourChoice: "your choice",
      compareUpsell:
        "In your region, land for {use} leases for up to {ratio}x the value of your current choice.",
      compareCaveat:
        "This comparison uses regional market ranges. Whether a higher-value use is viable on your land depends on soil, terrain, water and logistics — Palmo can help you verify that.",
      selectiveTag: "selective market — depends on projects and grid access in the region",
      cropLabel: "Specific crop (optional)",
      cropPlaceholder: "All / not sure yet",
      cropRefPotential:
        "Estimate based on the market value of {source} — R$ {landMin} to {landMax} thousand/ha — converted at 2.5–6%/year:",
      vtnPotential:
        "Estimate from your municipality's official land value (Federal Revenue VTN {year} × 2.5–6%/year):",
      vtnPotentialApprox:
        "Your municipality hasn't reported a VTN. Estimate from your state's official average (VTN {year} × 2.5–6%/year):",
      vtnLine:
        "Official land value (VTN {year}, Federal Revenue) in your municipality: {value}/ha.",
      vtnLineApprox:
        "Official state-average land value (VTN {year}, Federal Revenue): {value}/ha — your municipality hasn't reported its own value.",
      crops: {
        graos: [
          { value: "soja", label: "Soybean" },
          { value: "milho", label: "Corn" },
          { value: "algodao", label: "Cotton" },
          { value: "arroz", label: "Irrigated rice" },
          { value: "feijao", label: "Beans" },
          { value: "sorgo", label: "Sorghum" },
          { value: "trigo", label: "Wheat" },
        ],
        lavoura_permanente: [
          { value: "cafe", label: "Coffee" },
          { value: "cacau", label: "Cocoa" },
          { value: "citros", label: "Citrus (orange, lime...)" },
          { value: "seringueira", label: "Rubber tree" },
          { value: "dende", label: "Oil palm" },
        ],
        fruticultura: [
          { value: "banana", label: "Banana" },
          { value: "manga", label: "Mango" },
          { value: "uva", label: "Grapes" },
          { value: "melao", label: "Melon" },
          { value: "acai", label: "Açaí" },
        ],
        horticultura: [
          { value: "hortalicas", label: "General vegetables" },
          { value: "batata", label: "Potato" },
          { value: "tomate", label: "Tomato" },
          { value: "cebola", label: "Onion" },
        ],
      },
      cropNotes: {
        soja: "Grain contracts are typically fixed in sacas of soybean per hectare/year.",
        milho: "Even for corn, contracts are usually fixed in sacas of soybean per hectare/year (soy/corn rotation).",
        algodao: "Cotton-suitable areas usually negotiate at the top of the region's grain range.",
        arroz: "Irrigated rice has its own market: typically 18–25 sacas of rice/ha/year for land and water (RS reference).",
        cafe: "Coffee is usually negotiated as a partnership (crop share), not fixed rent — values vary widely by region and yield.",
        cacau: "Cocoa is usually negotiated as a partnership with production sharing — fixed per-hectare rents are rare.",
      },
    },
    auth: {
      signIn: "Sign in",
      signInGoogle: "Sign in with Google",
      signOut: "Sign out",
      myAccount: "My account",
      accountTitle: "My account",
      accountSubtitle: "Your Palmo account. Coming soon: your listings and offers.",
      notSignedIn: "You're not signed in yet. Sign in to save your data and track your listings.",
      signedInAs: "Signed in as",
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Transparent pricing",
      subtitle:
        "You only pay when a deal closes. No subscription, no listing fee.",
      tiers: [
        {
          name: "List & search",
          price: "Free",
          desc: "List your land, browse offers, talk and negotiate. Free for both sides.",
        },
        {
          name: "Success fee",
          price: "5%",
          priceNote: "of the first-year contract",
          desc: "Charged only at signing, paid by the party leasing the land. Includes the standardized contract, verification, and digital signature.",
          highlight: true,
        },
        {
          name: "Satellite monitoring",
          price: "Monthly subscription",
          desc: "For owners to track how their land is being used, with satellite imagery powered by Hexagon. Cancel anytime.",
        },
      ],
      footnote: "No hidden fees. Owners never pay to list.",
    },
    waitlist: {
      eyebrow: "Be one of the first",
      title: "Join the waitlist",
      subtitle: "We'll reach out on WhatsApp as soon as Palmo launches in your region.",
      nameLabel: "Name",
      namePlaceholder: "Your full name",
      phoneLabel: "WhatsApp",
      phonePlaceholder: "+55 00 00000-0000",
      countryLabel: "Country",
      stateLabel: "State",
      statePlaceholder: "e.g. Bahia",
      municipalityLabel: "Municipality",
      municipalityPlaceholder: "e.g. Salvador",
      roleLabel: "You are...",
      rolePlaceholder: "Select...",
      roleHave: "I have land",
      roleWant: "I'm looking for land",
      purposeLabel: "Intended land use",
      purposePlaceholder: "Select a purpose...",
      purposeOptions: [
        { value: "graos", label: "Grains (soy, corn, cotton...)" },
        { value: "cana", label: "Sugarcane" },
        { value: "lavoura_permanente", label: "Permanent crops (coffee, citrus, cocoa...)" },
        { value: "fruticultura", label: "Fruit farming" },
        { value: "horticultura", label: "Horticulture & vegetables" },
        { value: "pecuaria_corte", label: "Beef cattle" },
        { value: "pecuaria_leite", label: "Dairy farming" },
        { value: "avicultura_suinocultura", label: "Poultry / swine" },
        { value: "aquicultura", label: "Aquaculture" },
        { value: "silvicultura", label: "Forestry (eucalyptus, pine...)" },
        { value: "reflorestamento_carbono", label: "Reforestation / carbon credits" },
        { value: "energia_solar", label: "Solar energy" },
        { value: "energia_eolica", label: "Wind energy" },
        { value: "outro", label: "Other" },
      ],
      submit: "Join the waitlist",
      submitting: "Sending...",
      success: "Got it! We'll reach out on WhatsApp.",
      error: "Something went wrong. Please try again shortly.",
    },
    footer: {
      tagline: "De palmo em palmo, a terra volta a produzir.",
      whatsapp: "Chat on WhatsApp",
      instagram: "Instagram",
      rights: "© 2026 Palmo. Made in Brazil.",
      terms: "Terms",
      privacy: "Privacy",
    },
  },
};
