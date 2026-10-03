import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const root = process.cwd(); const results = []
const gate = (name, pass, detail='') => results.push({ name, pass, detail })
const has = (file, text) => existsSync(file) && readFileSync(file,'utf8').includes(text)
gate('config', has('lib/succaozero/config.ts','assertSuccaozeroProject'))
gate('schema', has('supabase/succaozero/migrations/20260930090000_phase1_foundation.sql','succaozero_opportunities'))
gate('rls', has('supabase/succaozero/migrations/20260930090000_phase1_foundation.sql','force row level security'))
gate('routing', has('supabase/succaozero/migrations/20260930100000_phase1_routing_and_intake.sql','for update'))
gate('idempotency', has('app/api/public/v1/succaozero/events/route.ts','externalEventId: event.event_id'))
const run = (script) => spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',env:process.env})
if (process.env.SUCCAOZERO_CRM_DATABASE_URL && process.env.SUCCAOZERO_ORGANIZATION_ID) { const r=run('scripts/succaozero/reconcile-data.mjs'); gate('reconciliation',r.status===0,(r.stdout||r.stderr).trim()) } else gate('reconciliation',false,'PENDING: credenciais CRM')
if (process.env.SUCCAOZERO_CRM_DATABASE_URL && process.env.SUCCAOZERO_ORGANIZATION_ID) { const r=run('scripts/succaozero/verify-sync-health.mjs'); gate('sync-health',r.status===0,(r.stdout||r.stderr).trim()) } else gate('sync-health',false,'PENDING: credenciais CRM')
gate('multi-tenant', has('app/api/public/v1/deals/route.ts','RELATIONSHIP_SCOPE_ERROR'))
gate('alice-schema-unchanged', Boolean(process.env.ALICE_SCHEMA_FINGERPRINT_APPROVED),'PENDING: fingerprint aprovado da Alice')
if (process.env.SUCCAOZERO_RESTORE_DATABASE_URL) { const r=run('scripts/succaozero/verify-backup-restore.mjs'); gate('backup-restore',r.status===0,(r.stdout||r.stderr).trim()) } else gate('backup-restore',false,'PENDING: banco restaurado isolado')
for (const result of results) console.log(`${result.name}=${result.pass?'PASS':'FAIL'}${result.detail?` ${result.detail}`:''}`)
if (results.some((result)=>!result.pass)) process.exitCode=1
