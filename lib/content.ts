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
    consultPickCrop: string;
    consultPotential: string;
    disclaimer: string;
    legalNote: string;
    leadTitle: string;
    leadSubtitle: string;
    heroLink: string;
    heroLinkSub: string;
    compareTitle: string;
    compareUnit: string;
    compareYourChoice: string;
    compareUpsell: string;
    compareCaveat: string;
    selectiveTag: string;
    cropLabel: string;
    cropPlaceholder: string;
    cropRefPotential: string;
    formedPotential: string;
    formedNote: string;
    rawLandLabel: string;
    advantageLabel: string;
    vtnPotential: string;
    vtnPotentialApprox: string;
    vtnLine: string;
    vtnLineApprox: string;
    crops: Record<string, { value: string; label: string }[]>;
    cropNotes: Record<string, string>;
    cropFormation: Record<string, string>;
    formedMath: string;
    nationalFallbackNote: string;
    cropVariants: Record<string, { value: string; label: string }[]>;
    variantLabel: string;
    variantPlaceholder: string;
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
      consultPickCrop:
        "Dica: escolha a cultura específica no campo acima — para várias culturas (banana, açaí, cacau...) temos referências de mercado da sua região.",
      consultPotential:
        "Potencial da sua área com {use} — o uso mais valorizado com referência na sua região:",
      disclaimer:
        "Valores de referência baseados em fontes públicas do mercado (sindicatos rurais, IMEA, CNA, consultorias). Não constituem avaliação formal — o valor real depende de solo, logística, água e negociação.",
      legalNote:
        "Pela lei (Estatuto da Terra), o arrendamento é limitado a 15% do valor do imóvel por ano (30% em zonas de exploração intensiva).",
      leadTitle: "Quer receber propostas reais nessa faixa?",
      leadSubtitle: "Entre na lista de espera — é grátis.",
      heroLink: "Quanto vale minha terra?",
      heroLinkSub: "Descubra em 30 segundos — grátis, com dados oficiais.",
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
      formedPotential:
        "Com lavoura FORMADA e em produção: na sua região, arrendamentos costumam ficar em ~15% do faturamento ({source}):",
      formedNote:
        "Vale para lavoura já plantada e produzindo. Terra nua (sem a lavoura) vale bem menos — veja abaixo.",
      formedMath:
        "🧮 A conta: faturamento estimado de {revMin} a {revMax} por hectare/ano × ~15% (praxe de mercado para lavoura formada) = a faixa acima.",
      nationalFallbackNote:
        "⚠️ Referência nacional ampla — seu estado ainda não tem faixa própria levantada para esse uso; trate como piso e teto largos.",
      cropVariants: {
        cafe: [
          { value: "arabica", label: "Arábica" },
          { value: "conilon", label: "Conilon / robusta" },
        ],
        uva: [
          { value: "mesa", label: "Uva de mesa" },
          { value: "vinho_suco", label: "Vinho e suco" },
        ],
        banana: [
          { value: "prata", label: "Prata" },
          { value: "nanica", label: "Nanica" },
          { value: "terra", label: "Da terra" },
        ],
      },
      variantLabel: "Variedade (opcional)",
      variantPlaceholder: "Todas / não sei",
      rawLandLabel: "Terra nua (sem lavoura formada):",
      advantageLabel: "Vantagem regional",
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
          { value: "girassol", label: "Girassol" },
          { value: "amendoim", label: "Amendoim" },
          { value: "gergelim", label: "Gergelim" },
          { value: "aveia", label: "Aveia" },
          { value: "cevada", label: "Cevada" },
          { value: "canola", label: "Canola" },
          { value: "milheto", label: "Milheto" },
          { value: "grao_de_bico", label: "Grão-de-bico" },
          { value: "mamona", label: "Mamona" },
          { value: "fumo", label: "Fumo (tabaco)" },
          { value: "fava", label: "Fava" },
          { value: "chia", label: "Chia" },
          { value: "triticale", label: "Triticale" },
        ],
        lavoura_permanente: [
          { value: "cafe", label: "Café" },
          { value: "cacau", label: "Cacau" },
          { value: "caju", label: "Caju (castanha)" },
          { value: "citros", label: "Citros (laranja)" },
          { value: "seringueira", label: "Seringueira" },
          { value: "dende", label: "Dendê" },
          { value: "erva_mate", label: "Erva-mate" },
          { value: "pimenta_do_reino", label: "Pimenta-do-reino" },
          { value: "guarana", label: "Guaraná" },
          { value: "macadamia", label: "Macadâmia" },
          { value: "noz_pecan", label: "Noz-pecã" },
          { value: "oliveira", label: "Oliveira (azeite)" },
          { value: "palmito_pupunha", label: "Palmito pupunha" },
          { value: "urucum", label: "Urucum" },
          { value: "limao_tahiti", label: "Limão tahiti" },
          { value: "aroeira", label: "Pimenta-rosa (aroeira)" },
        ],
        fruticultura: [
          { value: "banana", label: "Banana" },
          { value: "manga", label: "Manga" },
          { value: "uva", label: "Uva" },
          { value: "melao", label: "Melão" },
          { value: "acai", label: "Açaí" },
          { value: "coco", label: "Coco" },
          { value: "mamao", label: "Mamão" },
          { value: "maracuja", label: "Maracujá" },
          { value: "melancia", label: "Melancia" },
          { value: "abacaxi", label: "Abacaxi" },
          { value: "goiaba", label: "Goiaba" },
          { value: "acerola", label: "Acerola" },
          { value: "abacate", label: "Abacate" },
          { value: "atemoia", label: "Pinha e atemoia" },
          { value: "graviola", label: "Graviola" },
          { value: "pitaya", label: "Pitaya" },
          { value: "morango", label: "Morango" },
          { value: "maca", label: "Maçã" },
          { value: "pessego", label: "Pêssego" },
          { value: "tangerina", label: "Tangerina" },
          { value: "cupuacu", label: "Cupuaçu" },
          { value: "roma", label: "Romã" },
          { value: "lichia", label: "Lichia" },
          { value: "figo", label: "Figo" },
          { value: "caqui", label: "Caqui" },
          { value: "jabuticaba", label: "Jabuticaba" },
        ],
        horticultura: [
          { value: "hortalicas", label: "Hortaliças em geral" },
          { value: "mandioca", label: "Mandioca" },
          { value: "batata", label: "Batata" },
          { value: "batata_doce", label: "Batata-doce" },
          { value: "tomate", label: "Tomate" },
          { value: "cebola", label: "Cebola" },
          { value: "alho", label: "Alho" },
          { value: "cenoura", label: "Cenoura" },
          { value: "abobora", label: "Abóbora" },
          { value: "pimentao", label: "Pimentão" },
          { value: "inhame", label: "Inhame" },
          { value: "quiabo", label: "Quiabo" },
          { value: "gengibre", label: "Gengibre" },
          { value: "pimentas", label: "Pimentas (conservas)" },
          { value: "mandioquinha", label: "Mandioquinha-salsa" },
          { value: "brassicas", label: "Brássicas (repolho, brócolis...)" },
          { value: "beterraba", label: "Beterraba" },
          { value: "chuchu", label: "Chuchu" },
          { value: "pepino", label: "Pepino" },
          { value: "flores", label: "Flores e ornamentais" },
        ],
        pecuaria_corte: [
          { value: "bovinos_corte", label: "Bovinos de corte" },
          { value: "ovinos", label: "Ovinos (carneiros)" },
          { value: "caprinos", label: "Caprinos (bodes e cabras)" },
          { value: "bufalos", label: "Búfalos" },
        ],
        pecuaria_leite: [
          { value: "bovino_leite", label: "Gado de leite" },
          { value: "caprino_leite", label: "Cabras leiteiras" },
        ],
        avicultura_suinocultura: [
          { value: "frango_corte", label: "Frango de corte (integração)" },
          { value: "postura", label: "Galinhas de postura (ovos)" },
          { value: "suinos", label: "Suínos (integração)" },
        ],
        aquicultura: [
          { value: "tilapia", label: "Tilápia" },
          { value: "camarao", label: "Camarão (carcinicultura)" },
          { value: "tambaqui", label: "Tambaqui" },
          { value: "pirarucu", label: "Pirarucu" },
        ],
        silvicultura: [
          { value: "eucalipto", label: "Eucalipto" },
          { value: "pinus", label: "Pinus" },
          { value: "teca", label: "Teca" },
          { value: "mogno_africano", label: "Mogno-africano" },
          { value: "acacia_negra", label: "Acácia-negra (tanino)" },
          { value: "parica", label: "Paricá" },
          { value: "cedro_australiano", label: "Cedro-australiano" },
          { value: "bambu", label: "Bambu" },
        ],
        extrativismo: [
          { value: "carnauba", label: "Carnaúba (pó e cera)" },
          { value: "babacu", label: "Babaçu" },
          { value: "pinhao", label: "Pinhão (araucária)" },
          { value: "castanha_amazonia", label: "Castanha-da-amazônia" },
          { value: "piacava", label: "Piaçava" },
          { value: "pequi", label: "Pequi" },
          { value: "mangaba", label: "Mangaba" },
          { value: "licuri", label: "Licuri" },
          { value: "umbu", label: "Umbu" },
          { value: "baru", label: "Baru" },
        ],
      },
      cropNotes: {
        soja: "Contratos de grãos são normalmente fixados em sacas de soja por hectare/ano.",
        milho: "Mesmo para milho, os contratos costumam ser fixados em sacas de soja por hectare/ano (rotação soja/milho).",
        algodao: "Áreas aptas a algodão costumam negociar no topo da faixa de grãos da região.",
        arroz: "Arroz irrigado tem mercado próprio: normalmente 18–25 sacas de arroz/ha/ano por terra e água (referência RS).",
        cafe: "Café costuma ser negociado em parceria (meação), não em valor fixo — e são dois mercados com preços bem diferentes: arábica (MG/SP) e conilon/robusta (ES/RO). Informe a variedade acima para dados melhores.",
        cacau: "Cacau costuma ser negociado em parceria, com partilha da produção — valores fixos por hectare são raros.",
        banana: "Bananal formado arrenda por fração do faturamento (~15%); terra nua para plantar banana vale bem menos e depende de água.",
        manga: "Pomar de manga formado (Vale do São Francisco) arrenda por fração do faturamento — o preço da fruta é muito volátil.",
        uva: "Parreiral formado de uva de mesa irrigada tem alto faturamento e alto custo; o arrendamento costuma ser fração do faturamento.",
        melao: "Melão é cultura anual: no polo Mossoró/Açu (RN/CE), empresas arrendam terra nua por safra — terra irrigada com outorga de água vale prêmio.",
        acai: "Açaí plantado em terra firme arrenda por fração do faturamento; açaizal de várzea manejado é mercado extrativista à parte.",
        coco: "Coqueiral anão formado e irrigado arrenda por fração do faturamento; coqueiral gigante de sequeiro rende bem menos.",
        mamao: "Mamão tem ciclo curto (~2 anos): a lavoura formada arrenda por fração do faturamento, normalmente em contratos por ciclo.",
        maracuja: "Maracujá tem ciclo de 1,5–2 anos: o comum é parceria ou arrendamento por ciclo, como fração do faturamento.",
        caju: "Cajueiral tradicional rende pouco (300–500 kg/ha de castanha); renovado com clones da Embrapa chega a 1.600 kg/ha — parceria para renovação de cajueiral velho é mercado ativo no CE/PI/RN.",
        mandioca: "Mandioca é cultura anual: fecularias e arrendatários plantam em renovação de pastagem (SP/PR); no Nordeste predomina a produção familiar para farinha.",
        melancia: "Melancia é cultura de safra: arrenda-se terra nua por ciclo — Teixeira de Freitas (BA) colhe 59–71 t/ha (CEPEA).",
        abacaxi: "Abacaxi tem ciclo de ~18 meses; o comum é arrendamento por ciclo, com prêmio para área irrigada.",
        ovinos: "No semiárido, pastagem nativa (caatinga) arrenda por bem menos que pasto formado; contratos por cabeça/mês são comuns.",
        caprinos: "Caprinos dominam a caatinga: contratos por cabeça/mês ou fração do pasto; pasto formado vale mais que o nativo.",
        bufalos: "Búfalos concentram-se em várzeas e baixadas (Marajó/PA); o arrendamento segue o mercado de pastagem da região.",
        frango_corte: "Na integração, quem remunera é o lote alojado: o aviário (galpão) formado é o ativo que arrenda — a terra nua pesa pouco.",
        suinos: "Suinocultura integrada remunera por lote; a granja formada (instalações) é o ativo relevante, não a terra nua.",
        tilapia: "Aquicultura arrenda lâmina d'água: açude ou viveiro escavado formado tem mercado próprio (R$/ha de água), separado da terra seca.",
        camarao: "Viveiro de camarão formado (RN/CE) arrenda caro; terra nua apta à carcinicultura depende de licença e água salobra.",
        eucalipto: "Florestas plantadas usam contratos longos (7+ anos): arrendamento fixo ou parceria florestal com a indústria.",
        erva_mate: "Erval formado costuma arrendar por colheita — mercado tradicional no Sul (PR/SC/RS).",
        fumo: "Fumo funciona por integração com as fumageiras (RS/SC/BA): a empresa fomenta insumos e compra a safra — parceria de terra clássica do Sul.",
        mamona: "Mamona é lavoura de sequeiro do semiárido (BA lidera); costuma entrar em consórcio com feijão — arrendamento por safra.",
        limao_tahiti: "Limão tahiti tem mercado e indicador CEPEA próprios (SP domina); preço fortemente sazonal — pomar formado arrenda por fração do faturamento.",
        gengibre: "Gengibre é cultura anual de exportação (ES/SC/PR): arrenda-se terra nua por safra, com prêmio para solo leve e água.",
        flores: "Floricultura arrenda ESTRUTURA: estufa formada tem mercado próprio (Holambra/SP e serras do CE), separado da terra nua.",
        acacia_negra: "Acácia-negra (RS) é floresta de ciclo ~7 anos com casca vendida para tanino — contratos com a indústria, como eucalipto.",
        pirarucu: "Pirarucu exige tanques grandes e licença; RO/AM lideram o cultivo (Embrapa) — o ativo que arrenda é o tanque formado.",
        carnauba: "Carnaubal nativo em pé já rende: PI e CE concentram ~96% do pó de carnaúba do país, 100% nordestino (IBGE PEVS) — a extração arrenda por safra da palha.",
        babacu: "MA responde por ~94% das amêndoas de babaçu (IBGE PEVS); atenção à Lei do Babaçu Livre em vários municípios — o acesso das quebradeiras é protegido.",
        pinhao: "O Sul concentra ~97% do pinhão nacional (IBGE PEVS): araucárias nativas em pé rendem por colheita — o corte é proibido, a renda é da coleta.",
        castanha_amazonia: "AC lidera a castanha-da-amazônia, com AM e PA no pódio (IBGE PEVS): castanhais nativos rendem por safra — o corte da árvore é proibido por lei.",
        piacava: "BA concentra ~96% da piaçava do país — Ilhéus, Nilo Peçanha e Cairu lideram (IBGE PEVS); piaçavais nativos arrendam por corte da fibra.",
        pequi: "Pequi é renda em pé do cerrado (GO/MG/TO na PEVS/IBGE): coleta por safra em pequizais nativos — o corte da árvore é restrito por lei em GO/MG.",
        mangaba: "Mangaba é extrativismo do litoral nordestino (SE é referência na PEVS/IBGE); mangabais nativos rendem por safra.",
        licuri: "Licuri é a palmeira do semiárido baiano (PEVS/IBGE): amêndoas coletadas em licurizais nativos — renda em pé típica da caatinga.",
        umbu: "Umbu é coleta da caatinga (BA lidera na PEVS/IBGE): umbuzeiros nativos rendem por safra para polpa e doces.",
        baru: "Baru é a castanha do cerrado em expansão (GO/MG/MT): coleta em barueiros nativos e primeiros plantios — mercado comprador crescendo.",
      },
      cropFormation: {
        banana: "Do plantio à primeira colheita: ~10–14 meses (Embrapa).",
        mamao: "Do plantio à primeira colheita: ~8–10 meses (Embrapa).",
        maracuja: "Do plantio à primeira colheita: ~7–9 meses (Embrapa).",
        uva: "Do plantio à primeira colheita: ~1,5 ano; produção plena: ~3 anos (Embrapa).",
        cafe: "Do plantio à primeira colheita: ~2–3 anos; produção plena: ~4–5 anos (Embrapa) — contratos de plantio costumam prever carência.",
        caju: "Caju-anão clonal: primeira colheita ~2–3 anos; produção plena: ~7 anos (Embrapa) — contratos de plantio costumam prever carência.",
        coco: "Coqueiro-anão: primeira colheita ~2,5–3 anos; produção plena: ~6 anos (Embrapa) — contratos de plantio costumam prever carência.",
        acai: "Açaí de terra firme: primeira colheita ~3 anos; produção plena: ~5–6 anos (Embrapa) — contratos de plantio costumam prever carência.",
        cacau: "Do plantio à primeira colheita: ~3–4 anos; produção plena: ~6–7 anos (Embrapa/CEPLAC) — contratos de plantio costumam prever carência.",
        citros: "Do plantio à primeira colheita: ~3 anos; produção plena: ~7–8 anos (Embrapa/Fundecitrus) — contratos de plantio costumam prever carência.",
        manga: "Manga enxertada: primeira colheita ~3–4 anos; produção plena: ~7 anos (Embrapa) — contratos de plantio costumam prever carência.",
        dende: "Do plantio à primeira colheita: ~3 anos; produção plena: ~7–8 anos (Embrapa) — as integradoras costumam estruturar a carência.",
        seringueira: "Do plantio ao início da sangria: ~6–7 anos (Embrapa) — contratos de plantio costumam prever carência longa.",
        erva_mate: "Do plantio à primeira poda comercial: ~4–5 anos (Embrapa Florestas).",
        eucalipto: "Do plantio ao corte: ~6–7 anos (Embrapa Florestas) — por isso os contratos florestais são longos.",
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
        { value: "extrativismo", label: "Extrativismo (renda em pé)" },
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
      consultPickCrop:
        "Tip: pick the specific crop in the field above — for several crops (banana, açaí, cocoa...) we have market references for your region.",
      consultPotential:
        "Your area's potential with {use} — the highest-value benchmarked use in your region:",
      disclaimer:
        "Reference values based on public market sources (rural unions, IMEA, CNA, consultancies). Not a formal appraisal — actual value depends on soil, logistics, water and negotiation.",
      legalNote:
        "By law (Estatuto da Terra), rural rent is capped at 15% of the property value per year (30% in intensive-use zones).",
      leadTitle: "Want to receive real offers in this range?",
      leadSubtitle: "Join the waitlist — it's free.",
      heroLink: "How much is my land worth?",
      heroLinkSub: "Find out in 30 seconds — free, with official data.",
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
      formedPotential:
        "With a FORMED, producing plantation: leases in your region typically run ~15% of gross revenue ({source}):",
      formedNote:
        "Applies to an already planted, producing crop. Bare land (without the plantation) is worth much less — see below.",
      formedMath:
        "🧮 The math: estimated gross revenue of {revMin} to {revMax} per hectare/year × ~15% (market convention for formed crops) = the range above.",
      nationalFallbackNote:
        "⚠️ Broad national reference — your state doesn't have its own surveyed range for this use yet; treat it as a wide floor and ceiling.",
      cropVariants: {
        cafe: [
          { value: "arabica", label: "Arabica" },
          { value: "conilon", label: "Conilon / robusta" },
        ],
        uva: [
          { value: "mesa", label: "Table grapes" },
          { value: "vinho_suco", label: "Wine & juice" },
        ],
        banana: [
          { value: "prata", label: "Prata" },
          { value: "nanica", label: "Cavendish (nanica)" },
          { value: "terra", label: "Plantain" },
        ],
      },
      variantLabel: "Variety (optional)",
      variantPlaceholder: "All / not sure",
      rawLandLabel: "Bare land (no formed plantation):",
      advantageLabel: "Regional advantage",
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
          { value: "girassol", label: "Sunflower" },
          { value: "amendoim", label: "Peanut" },
          { value: "gergelim", label: "Sesame" },
          { value: "aveia", label: "Oats" },
          { value: "cevada", label: "Barley" },
          { value: "canola", label: "Canola" },
          { value: "milheto", label: "Millet" },
          { value: "grao_de_bico", label: "Chickpea" },
          { value: "mamona", label: "Castor bean" },
          { value: "fumo", label: "Tobacco" },
          { value: "fava", label: "Broad bean" },
          { value: "chia", label: "Chia" },
          { value: "triticale", label: "Triticale" },
        ],
        lavoura_permanente: [
          { value: "cafe", label: "Coffee" },
          { value: "cacau", label: "Cocoa" },
          { value: "caju", label: "Cashew" },
          { value: "citros", label: "Citrus (orange)" },
          { value: "seringueira", label: "Rubber tree" },
          { value: "dende", label: "Oil palm" },
          { value: "erva_mate", label: "Yerba mate" },
          { value: "pimenta_do_reino", label: "Black pepper" },
          { value: "guarana", label: "Guarana" },
          { value: "macadamia", label: "Macadamia" },
          { value: "noz_pecan", label: "Pecan" },
          { value: "oliveira", label: "Olive" },
          { value: "palmito_pupunha", label: "Peach-palm heart" },
          { value: "urucum", label: "Annatto" },
          { value: "limao_tahiti", label: "Tahiti lime" },
          { value: "aroeira", label: "Pink pepper (aroeira)" },
        ],
        fruticultura: [
          { value: "banana", label: "Banana" },
          { value: "manga", label: "Mango" },
          { value: "uva", label: "Grapes" },
          { value: "melao", label: "Melon" },
          { value: "acai", label: "Açaí" },
          { value: "coco", label: "Coconut" },
          { value: "mamao", label: "Papaya" },
          { value: "maracuja", label: "Passion fruit" },
          { value: "melancia", label: "Watermelon" },
          { value: "abacaxi", label: "Pineapple" },
          { value: "goiaba", label: "Guava" },
          { value: "acerola", label: "Acerola cherry" },
          { value: "abacate", label: "Avocado" },
          { value: "atemoia", label: "Sugar-apple & atemoya" },
          { value: "graviola", label: "Soursop" },
          { value: "pitaya", label: "Dragon fruit" },
          { value: "morango", label: "Strawberry" },
          { value: "maca", label: "Apple" },
          { value: "pessego", label: "Peach" },
          { value: "tangerina", label: "Mandarin" },
          { value: "cupuacu", label: "Cupuaçu" },
          { value: "roma", label: "Pomegranate" },
          { value: "lichia", label: "Lychee" },
          { value: "figo", label: "Fig" },
          { value: "caqui", label: "Persimmon" },
          { value: "jabuticaba", label: "Jaboticaba" },
        ],
        horticultura: [
          { value: "hortalicas", label: "General vegetables" },
          { value: "mandioca", label: "Cassava" },
          { value: "batata", label: "Potato" },
          { value: "batata_doce", label: "Sweet potato" },
          { value: "tomate", label: "Tomato" },
          { value: "cebola", label: "Onion" },
          { value: "alho", label: "Garlic" },
          { value: "cenoura", label: "Carrot" },
          { value: "abobora", label: "Pumpkin" },
          { value: "pimentao", label: "Bell pepper" },
          { value: "inhame", label: "Yam" },
          { value: "quiabo", label: "Okra" },
          { value: "gengibre", label: "Ginger" },
          { value: "pimentas", label: "Chili peppers" },
          { value: "mandioquinha", label: "Arracacha" },
          { value: "brassicas", label: "Brassicas (cabbage, broccoli...)" },
          { value: "beterraba", label: "Beet" },
          { value: "chuchu", label: "Chayote" },
          { value: "pepino", label: "Cucumber" },
          { value: "flores", label: "Flowers & ornamentals" },
        ],
        pecuaria_corte: [
          { value: "bovinos_corte", label: "Beef cattle" },
          { value: "ovinos", label: "Sheep" },
          { value: "caprinos", label: "Goats" },
          { value: "bufalos", label: "Buffalo" },
        ],
        pecuaria_leite: [
          { value: "bovino_leite", label: "Dairy cattle" },
          { value: "caprino_leite", label: "Dairy goats" },
        ],
        avicultura_suinocultura: [
          { value: "frango_corte", label: "Broilers (integration)" },
          { value: "postura", label: "Layers (eggs)" },
          { value: "suinos", label: "Swine (integration)" },
        ],
        aquicultura: [
          { value: "tilapia", label: "Tilapia" },
          { value: "camarao", label: "Shrimp farming" },
          { value: "tambaqui", label: "Tambaqui" },
          { value: "pirarucu", label: "Pirarucu" },
        ],
        silvicultura: [
          { value: "eucalipto", label: "Eucalyptus" },
          { value: "pinus", label: "Pine" },
          { value: "teca", label: "Teak" },
          { value: "mogno_africano", label: "African mahogany" },
          { value: "acacia_negra", label: "Black wattle (tannin)" },
          { value: "parica", label: "Paricá" },
          { value: "cedro_australiano", label: "Australian red cedar" },
          { value: "bambu", label: "Bamboo" },
        ],
        extrativismo: [
          { value: "carnauba", label: "Carnauba (powder & wax)" },
          { value: "babacu", label: "Babassu" },
          { value: "pinhao", label: "Araucaria pine nut" },
          { value: "castanha_amazonia", label: "Brazil nut" },
          { value: "piacava", label: "Piassava fiber" },
          { value: "pequi", label: "Pequi" },
          { value: "mangaba", label: "Mangaba" },
          { value: "licuri", label: "Licuri" },
          { value: "umbu", label: "Umbu" },
          { value: "baru", label: "Baru" },
        ],
      },
      cropNotes: {
        soja: "Grain contracts are typically fixed in sacas of soybean per hectare/year.",
        milho: "Even for corn, contracts are usually fixed in sacas of soybean per hectare/year (soy/corn rotation).",
        algodao: "Cotton-suitable areas usually negotiate at the top of the region's grain range.",
        arroz: "Irrigated rice has its own market: typically 18–25 sacas of rice/ha/year for land and water (RS reference).",
        cafe: "Coffee is usually negotiated as a partnership (crop share), not fixed rent — and it is two markets with very different prices: arabica (MG/SP) and conilon/robusta (ES/RO). Set the variety above for better data.",
        cacau: "Cocoa is usually negotiated as a partnership with production sharing — fixed per-hectare rents are rare.",
        banana: "A formed banana plantation leases as a share of gross revenue (~15%); bare land for planting is worth much less and depends on water.",
        manga: "A formed mango orchard (São Francisco Valley) leases as a share of revenue — fruit prices are highly volatile.",
        uva: "A formed irrigated table-grape vineyard has high revenue and high costs; leases usually run as a share of revenue.",
        melao: "Melon is an annual crop: in the Mossoró/Açu hub (RN/CE) companies lease bare land per season — irrigated land with water rights earns a premium.",
        acai: "Planted upland açaí leases as a share of revenue; managed floodplain açaí is a separate extractive market.",
        coco: "A formed, irrigated dwarf-coconut grove leases as a share of revenue; rain-fed tall coconut yields far less.",
        mamao: "Papaya has a short cycle (~2 years): formed plantations lease as a share of revenue, usually per cycle.",
        maracuja: "Passion fruit runs 1.5–2-year cycles: partnerships or per-cycle leases as a share of revenue are the norm.",
        caju: "Traditional cashew groves yield little (300–500 kg/ha of nuts); Embrapa clonal renewal reaches 1,600 kg/ha — renewal partnerships for old groves are an active market in CE/PI/RN.",
        mandioca: "Cassava is an annual crop: starch mills and tenant growers plant it on pasture-renewal land (SP/PR); in the Northeast, family flour production dominates.",
        melancia: "Watermelon is a per-season crop: bare land is leased per cycle — Teixeira de Freitas (BA) harvests 59–71 t/ha (CEPEA).",
        abacaxi: "Pineapple runs an ~18-month cycle; per-cycle leases are the norm, with a premium for irrigated land.",
        ovinos: "In the semi-arid, native pasture (caatinga) leases for far less than formed pasture; per-head/month contracts are common.",
        caprinos: "Goats dominate the caatinga: per-head/month contracts or a share of pasture; formed pasture is worth more than native.",
        bufalos: "Buffalo concentrate in floodplains and lowlands (Marajó/PA); leases follow the region's pasture market.",
        frango_corte: "In integration, the housed flock is what pays: the formed poultry house is the asset that leases — bare land matters little.",
        suinos: "Integrated swine pays per batch; the formed facility is the relevant asset, not bare land.",
        tilapia: "Aquaculture leases WATER surface: a formed pond or reservoir has its own market (R$/ha of water), separate from dry land.",
        camarao: "Formed shrimp ponds (RN/CE) lease at a premium; bare land suited to shrimp farming depends on licensing and brackish water.",
        eucalipto: "Planted forests use long contracts (7+ years): fixed leases or forestry partnerships with the industry.",
        erva_mate: "A formed yerba-mate stand usually leases per harvest — a traditional market in the South (PR/SC/RS).",
        fumo: "Tobacco runs on integration with leaf companies (RS/SC/BA): they finance inputs and buy the crop — the South's classic land partnership.",
        mamona: "Castor bean is a semi-arid rain-fed crop (BA leads); often intercropped with beans — leased per season.",
        limao_tahiti: "Tahiti lime has its own market and CEPEA indicator (SP dominates); strongly seasonal prices — formed orchards lease as a share of revenue.",
        gengibre: "Ginger is an annual export crop (ES/SC/PR): bare land leased per season, premium for light soil and water.",
        flores: "Floriculture leases STRUCTURE: a formed greenhouse has its own market (Holambra/SP and the CE highlands), separate from bare land.",
        acacia_negra: "Black wattle (RS) is a ~7-year forest whose bark sells for tannin — industry contracts, like eucalyptus.",
        pirarucu: "Pirarucu needs large ponds and licensing; RO/AM lead the farming (Embrapa) — the formed pond is the leasable asset.",
        carnauba: "A standing carnauba grove already earns: PI and CE hold ~96% of Brazil's carnauba powder, 100% of it Northeastern (IBGE PEVS) — extraction leases per straw season.",
        babacu: "MA accounts for ~94% of babassu kernels (IBGE PEVS); note the Free Babassu Law in many municipalities — breaker women's access is protected.",
        pinhao: "The South holds ~97% of Brazil's pine nuts (IBGE PEVS): standing native araucarias earn per harvest — felling is banned, the income is the gathering.",
        castanha_amazonia: "AC leads Brazil nuts, with AM and PA on the podium (IBGE PEVS): native groves earn per season — felling the tree is illegal.",
        piacava: "BA holds ~96% of Brazil's piassava — Ilhéus, Nilo Peçanha and Cairu lead (IBGE PEVS); native stands lease per fiber cut.",
        pequi: "Pequi is standing cerrado income (GO/MG/TO in IBGE's PEVS): seasonal gathering from native stands — felling is restricted by law in GO/MG.",
        mangaba: "Mangaba is Northeast-coast extractivism (SE is the reference in IBGE's PEVS); native stands earn per season.",
        licuri: "Licuri is Bahia's semi-arid palm (IBGE PEVS): kernels gathered from native stands — classic caatinga standing income.",
        umbu: "Umbu is caatinga gathering (BA leads in IBGE's PEVS): native trees earn per season for pulp and sweets.",
        baru: "Baru is the cerrado nut on the rise (GO/MG/MT): gathered from native trees plus first orchards — buyer market growing.",
      },
      cropFormation: {
        banana: "Planting to first harvest: ~10–14 months (Embrapa).",
        mamao: "Planting to first harvest: ~8–10 months (Embrapa).",
        maracuja: "Planting to first harvest: ~7–9 months (Embrapa).",
        uva: "Planting to first harvest: ~1.5 years; full yield: ~3 years (Embrapa).",
        cafe: "Planting to first harvest: ~2–3 years; full yield: ~4–5 years (Embrapa) — planting leases usually include a grace period.",
        caju: "Clonal dwarf cashew: first harvest ~2–3 years; full yield: ~7 years (Embrapa) — planting leases usually include a grace period.",
        coco: "Dwarf coconut: first harvest ~2.5–3 years; full yield: ~6 years (Embrapa) — planting leases usually include a grace period.",
        acai: "Upland açaí: first harvest ~3 years; full yield: ~5–6 years (Embrapa) — planting leases usually include a grace period.",
        cacau: "Planting to first harvest: ~3–4 years; full yield: ~6–7 years (Embrapa/CEPLAC) — planting leases usually include a grace period.",
        citros: "Planting to first harvest: ~3 years; full yield: ~7–8 years (Embrapa/Fundecitrus) — planting leases usually include a grace period.",
        manga: "Grafted mango: first harvest ~3–4 years; full yield: ~7 years (Embrapa) — planting leases usually include a grace period.",
        dende: "Planting to first harvest: ~3 years; full yield: ~7–8 years (Embrapa) — integrators usually structure the grace period.",
        seringueira: "Planting to first tapping: ~6–7 years (Embrapa) — planting leases usually include a long grace period.",
        erva_mate: "Planting to first commercial pruning: ~4–5 years (Embrapa Florestas).",
        eucalipto: "Planting to harvest: ~6–7 years (Embrapa Florestas) — which is why forestry contracts run long.",
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
        { value: "extrativismo", label: "Extractivism (standing income)" },
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
