// Finalidade "Aberta a propostas" (o dono nao crava o uso da terra; quem
// propoe uso e preco e o produtor). Constante de aplicacao, nao de banco:
// listings.purpose e texto livre, sem enum nem check constraint, entao este
// valor novo nao exige migration. NAO entra em lib/content.ts (regra 5):
// cada select acrescenta a opcao inline e cada tela de exibicao traduz o
// rotulo no seu proprio dicionario `label` via useLanguage().
export const PURPOSE_OPEN = "aberta_a_propostas";
