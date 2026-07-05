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
  pricing: {
    title: string;
    body: string;
  };
  waitlist: {
    eyebrow: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    roleLabel: string;
    roleHave: string;
    roleWant: string;
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
    pricing: {
      title: "Grátis até fechar negócio",
      body: "Anunciar, buscar e negociar não custa nada. A Palmo só ganha quando o seu negócio fecha.",
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
      roleLabel: "Você é...",
      roleHave: "Tenho terra",
      roleWant: "Procuro terra",
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
    pricing: {
      title: "Free until the deal closes",
      body: "Listing, searching and negotiating cost nothing. Palmo only earns when your deal closes.",
    },
    waitlist: {
      eyebrow: "Be one of the first",
      title: "Join the waitlist",
      subtitle: "We'll reach out on WhatsApp as soon as Palmo launches in your region.",
      nameLabel: "Name",
      namePlaceholder: "Your full name",
      phoneLabel: "WhatsApp",
      phonePlaceholder: "+55 00 00000-0000",
      roleLabel: "You are...",
      roleHave: "I have land",
      roleWant: "I'm looking for land",
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
