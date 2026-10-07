// Marca que a pessoa entrou pelo link de senha nova ou de convite e ainda não criou a senha.
// Enquanto existir, o proxy só deixa abrir /nova-senha. Sai quando a senha é salva
// ou quando a pessoa entra com e-mail e senha pela tela de entrada.
export const COOKIE_TROCAR_SENHA = 'trocar_senha'

// Dura o mesmo que a sessão costuma durar, para não liberar o CRM sem senha nova.
export const COOKIE_TROCAR_SENHA_SEGUNDOS = 60 * 60 * 24 * 30

/** Apaga a marca no navegador (o cookie não é httpOnly justamente para isso). */
export function limparTrocaDeSenha() {
    document.cookie = `${COOKIE_TROCAR_SENHA}=; Max-Age=0; path=/`
}
