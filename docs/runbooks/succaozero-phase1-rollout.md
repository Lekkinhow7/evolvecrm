# Rollout da Fase 1 — Sucção Zero

## Ordem obrigatória

1. Capturar backup restaurável do CRM Sucção Zero e fingerprint somente-leitura do CRM Alice.
2. Restaurar o backup em projeto isolado e executar `verify-backup-restore.mjs`.
3. Aplicar migrations em homologação e executar a suíte completa.
4. Rodar a migração do agente sem `--apply`; confirmar `writes=0` e ausência de PII no relatório.
5. Simular A/B/A/B, inclusão de C, pausa/reativação, concorrência, repetição e ausência de vendedor.
6. Aplicar migrations na produção Sucção Zero mantendo `SUCCAOZERO_CANONICAL_ENABLED=false`.
7. Migrar e reconciliar dados; ativar API e n8n em modo sombra.
8. Ativar a flag somente no deploy Sucção Zero e monitorar erros, duplicidades, fila sem responsável e ações vencidas.
9. Comparar novamente o fingerprint da Alice. Qualquer diferença inesperada bloqueia o rollout.

## Rollback

Desligar a flag, reativar o workflow anterior no checkpoint registrado, preservar eventos posteriores ao corte e executar conciliação. Não remover tabelas, eventos ou alterações recebidas após o corte.

## Evidências do piloto

Registrar IDs técnicos e resultados de A/B/A/B, A/B/C, concorrência, duplicidade, fila sem vendedor, próxima ação/exceção, pausa da IA por atendimento humano e regressão do login/contatos/funil/atividades da Alice. Nunca usar contatos reais no piloto.
