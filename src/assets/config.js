// Configuração de publicação.
//
// LEAD_ENDPOINT: URL HTTPS que recebe o cadastro da pré-venda via POST (JSON).
// Pode ser uma função serverless própria, um webhook do CRM ou um serviço de formulários.
// Enquanto estiver vazio, o formulário mostra "Cadastro indisponível" e não envia nada:
// o envio nunca é simulado.
export const LEAD_ENDPOINT = '';
