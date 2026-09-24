/**
 * Nome do CRM mostrado na tela, nos títulos das páginas e nos textos do assistente.
 * Cada cliente tem a sua instalação; o nome vem da variável NEXT_PUBLIC_CRM_NAME do deploy.
 * Sem a variável, fica o nome da primeira instalação (SucçãoZero), para ela não mudar.
 */
export const CRM_NAME = process.env.NEXT_PUBLIC_CRM_NAME || 'Sucção0 CRM';
