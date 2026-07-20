# MODELO KYC — INVESTIDOR INTERNACIONAL (Palmo Global)
<!-- v0.1 · desenho de produto/compliance. Validar com advogado de
PLD/FT e agrário antes de operar. -->

## Princípio inegociável
Fluxo **exclusivamente de entrada**: estrangeiro investindo em terra e
produção **no Brasil**. A plataforma não lista, intermedeia ou promove
ativos fora do Brasil, em nenhuma hipótese.

## Enquadramento (o porquê deste KYC)
1. **Lei 5.709/71**: aquisição E arrendamento de imóvel rural por
   estrangeiros (e por brasileiras de controle estrangeiro) são
   restritos e passam por autorização (INCRA). Consequência de produto:
   o investidor internacional v1 **não arrenda diretamente** — acessa
   **rendimento** via instrumentos regulados (Fiagro, CRA/CPR,
   sociedade brasileira estruturada caso a caso com o jurídico).
2. **Lei 9.613/98 (PLD/FT)**: conhecer o cliente, a origem dos recursos
   e monitorar operações. O KYC abaixo é a porta; o fluxo financeiro em
   si corre por instituições reguladas (fundo/securitizadora), que
   aplicam o próprio KYC — dupla camada.
3. **LGPD**: base legal = execução de contrato + obrigação legal;
   retenção mínima de 5 anos após o fim da relação; dados sensíveis
   minimizados.

## Tiers
- **T1 — Pessoa física estrangeira**
- **T2 — Pessoa jurídica estrangeira** (fundo, family office, empresa)

## Coleta (formulário EN, upload seguro)
**T1:** passaporte válido; comprovante de endereço (≤ 3 meses);
declaração de origem dos recursos e patrimônio (source of funds /
source of wealth) com evidência (extrato, carta de banco, contrato de
venda etc.); telefone e e-mail verificados; autodeclaração PEP;
finalidade e faixa de valor pretendida.
**T2 (tudo do T1 para os representantes, mais):** certificate of
incorporation / atos constitutivos; quadro societário até o(s)
**beneficiário(s) final(is) (UBO ≥ 25%)** com documento de cada um;
procuração/prova de poderes do signatário; demonstração financeira ou
carta de referência bancária.

## Verificações (antes de qualquer acesso)
1. **Documento**: validação de autenticidade + prova de vida (selfie
   dinâmica) via provedor de identidade (ex.: classe Sumsub/Veriff).
2. **Sanções**: OFAC (EUA), ONU, UE, UK HMT — pessoa, entidade e UBOs.
3. **PEP** e **adverse media** (mídia negativa relevante).
4. **País**: lista FATF/GAFI (alto risco/monitoramento) e embargos.

## Risk scoring → decisão
Pontuação por: país de residência/constituição, natureza do patrimônio,
valor pretendido, estrutura societária (camadas até o UBO), resultado
das telas acima.
- **Baixo** → aprovação (revisão humana amostral).
- **Médio** → **revisão humana obrigatória** (no início: o fundador
  revisa 100% dos casos).
- **Alto / hit confirmado** → recusa, com registro do motivo.
Reavaliação: anual, ou a cada evento relevante (mudança de UBO, novo
aporte acima da faixa declarada).

## Gate na plataforma (espelho do contact gate)
Sem KYC aprovado: o usuário internacional **não vê** oportunidades,
dados de imóveis ou contatos — apenas a página institucional e o
formulário. Aprovação registrada com trilha de auditoria (quem, quando,
com base em quê). Mesma filosofia do deal_status: confiança garantida
pela infraestrutura.

## Fluxo resumido
Cadastro EN → coleta T1/T2 → verificações automáticas → score →
revisão humana (quando exigida) → aprovação → acesso à vitrine
internacional → interesse em oportunidade → estruturação via
instrumento regulado (com o jurídico) → contrato de grande porte, se
houver, com **módulo ICC** de arbitragem.

## Pendências para o jurídico especializado
Definir o veículo padrão v1 (Fiagro dedicado vs. CRA por operação vs.
SPE brasileira caso a caso); política escrita de PLD/FT; DPO/LGPD;
limiar exato do módulo ICC ({{LIMIAR_ICC}}).
