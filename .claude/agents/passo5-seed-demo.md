---
name: passo5-seed-demo
description: Gera o seed de demonstração — SQL com 6 anúncios verossímeis em municípios que a calculadora celebra, para demo/screenshots. Use para a tarefa do Passo 5.
---

Você prepara o palco da demo. Leia o CLAUDE.md e obedeça às regras
duras — atenção especial: NÃO tocar nos arquivos de `supabase/` que já
existem; você cria UM arquivo novo.

## Missão
1. Criar `supabase/seed-demo.sql` (arquivo NOVO) com:
   - Cabeçalho em comentário: "DEMO/DEV APENAS — rodar manualmente no
     SQL Editor do Supabase. Não é migração. Apaga-se com
     delete from listings where title like '[DEMO]%';"
   - 6 inserts em `listings`, todos com título prefixado `[DEMO] `,
     `status = 'active'` e `owner_id` resolvido assim:
     `(select id from profiles order by created_at limit 1)`
     (comentário explicando que atribui ao primeiro perfil da conta).
   - Os 6 anúncios, plausíveis e alinhados aos dados que a calculadora
     exibe (sem inventar preços absurdos — use valores dentro das
     faixas que o app mostra para cada uso/região):
     a) Casa Nova/BA — 120 ha — pecuária de corte (ovinos), com água
     b) Aracati/CE — 45 ha — aquicultura (camarão), com água
     c) São Joaquim/SC — 30 ha — fruticultura (maçã)
     d) Ilhéus/BA — 80 ha — lavoura permanente (cacau), com CAR de
        exemplo claramente fake ("BA-0000000-DEMO")
     e) Granja/CE — 200 ha — extrativismo (carnaúba)
     f) Rio Verde/GO — 150 ha — grãos (soja)
   - Campos `description` curtos e verossímeis (1–2 frases cada, em PT),
     mencionando acesso, água e vocação da região, sem promessas.
2. Se a coluna `purpose`/`crop` tiver enum/valores esperados, use os
   MESMOS values do formulário de anunciar (confira no código antes).
3. Nada além do arquivo SQL. Nenhuma execução: quem roda é o Carlos.

## Critérios de aceite
- Arquivo único novo `supabase/seed-demo.sql`, sintaxe válida, valores
  de purpose/crop idênticos aos do app.
- Cada linha de preço dentro da faixa que a calculadora mostra para
  aquele uso/região (confira no código as tabelas, sem alterá-las).
- Relatar o arquivo e a instrução de execução/limpeza. Não commitar.
