import pg from 'pg'

const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')
const confirmArg = process.argv.slice(2).find((value) => value.startsWith('--confirm-project='))
const confirmProject = confirmArg?.split('=')[1] || ''
const agentUrl = process.env.SUCCAOZERO_AGENT_DATABASE_URL || ''
const crmUrl = process.env.SUCCAOZERO_CRM_DATABASE_URL || ''
const expectedRef = process.env.SUCCAOZERO_SUPABASE_PROJECT_REF || ''
const organizationId = process.env.SUCCAOZERO_ORGANIZATION_ID || ''
const boardId = process.env.SUCCAOZERO_BOARD_ID || ''
const stageId = process.env.SUCCAOZERO_STAGE_ID || ''
const table = process.env.SUCCAOZERO_AGENT_LEADS_TABLE || 'succaozero_leads'
if (!/^[a-z_][a-z0-9_]*$/i.test(table)) throw new Error('Nome de tabela de origem inválido')
if (!agentUrl || !crmUrl) throw new Error('URLs dos bancos Sucção Zero não configuradas')
if (apply && (!expectedRef || confirmProject !== expectedRef)) throw new Error('Confirmação do projeto CRM inválida')
if (apply && (!organizationId || !boardId || !stageId)) throw new Error('IDs canônicos obrigatórios para aplicar')

const normalize = (id) => {
  const value = String(id || '').trim()
  if (value.endsWith('@lid')) return { alternateIdentifier: value, phone: null, pending: true }
  const digits = value.replace(/@s\.whatsapp\.net$/, '').replace(/\D/g, '')
  const phone = digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null
  return { alternateIdentifier: value, phone, pending: !phone }
}
const agent = new pg.Pool({ connectionString: agentUrl, max: 2 })
const crm = new pg.Pool({ connectionString: crmUrl, max: 2 })
try {
  const source = await agent.query(`select identificador, nome, timestamp from public.${table} order by identificador`)
  const seen = new Set(); let pending = 0; let duplicates = 0
  for (const row of source.rows) { const key = `agent-lead:${row.identificador}`; if (seen.has(key)) duplicates++; else seen.add(key); if (normalize(row.identificador).pending) pending++ }
  console.log(`leads_read=${source.rowCount}`)
  console.log(`contacts_to_create=${seen.size}`)
  console.log(`opportunities_to_create=${source.rowCount - duplicates - pending}`)
  console.log(`pending_identity=${pending}`)
  console.log(`duplicates_by_event=${duplicates}`)
  if (!apply) { console.log('writes=0'); process.exitCode = 0 }
  else {
    let writes = 0
    for (let offset = 0; offset < source.rows.length; offset += 100) {
      const batch = source.rows.slice(offset, offset + 100); const client = await crm.connect()
      try {
        await client.query('begin'); await client.query(`select set_config('app.succaozero_project_ref',$1,true)`, [expectedRef])
        for (const row of batch) {
          const identity = normalize(row.identificador)
          await client.query('select public.succaozero_ingest_lead($1::jsonb)', [{ organization_id: organizationId, source: 'agent', externalEventId: `agent-lead:${row.identificador}`, name: String(row.nome || '').trim() || 'Contato sem nome informado', phone: identity.phone, alternateIdentifier: identity.alternateIdentifier, boardId, stageId, metadata: { migrated: true } }]); writes++
        }
        await client.query('commit')
      } catch (error) { await client.query('rollback'); throw error } finally { client.release() }
    }
    console.log(`writes=${writes}`)
  }
} finally { await Promise.all([agent.end(), crm.end()]) }
