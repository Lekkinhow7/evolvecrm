/**
 * Nome do CRM mostrado na tela, nos títulos das páginas e nos textos do assistente.
 * Cada cliente tem a sua instalação; o nome vem da variável NEXT_PUBLIC_CRM_NAME do deploy.
 * Sem a variável, fica o nome da primeira instalação (SucçãoZero), para ela não mudar.
 */
export const CRM_NAME = process.env.NEXT_PUBLIC_CRM_NAME || 'Sucção0 CRM';

/**
 * Linha de apoio embaixo do nome, no menu lateral (ex.: "Advocacia").
 * Vem de NEXT_PUBLIC_CRM_TAGLINE; sem a variável, o menu mostra só o nome.
 */
export const CRM_TAGLINE = process.env.NEXT_PUBLIC_CRM_TAGLINE || '';
