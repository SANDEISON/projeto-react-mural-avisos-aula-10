import type { Aviso } from './types';

export const URL = 'http://localhost:3000/avisos';

// O TypeScript não valida o JSON recebido. Estes testes rodam no navegador.
function ehAviso(valor: unknown): valor is Aviso {
  return typeof valor === 'object' && valor !== null
    && 'id' in valor && typeof valor.id === 'string'
    && 'titulo' in valor && typeof valor.titulo === 'string';
}

function verificarStatus(resposta: Response) {
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
}

export async function listarAvisos(signal?: AbortSignal): Promise<Aviso[]> {
  const resposta = await fetch(URL, { signal });
  verificarStatus(resposta);
  const dados: unknown = await resposta.json();
  if (!Array.isArray(dados) || !dados.every(ehAviso)) {
    throw new Error('Formato inesperado da API');
  }
  return dados;
}

async function salvarAviso(metodo: 'POST' | 'PATCH', endereco: string, titulo: string) {
  const resposta = await fetch(endereco, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo })
  });
  verificarStatus(resposta);
  const dados: unknown = await resposta.json();
  if (!ehAviso(dados)) throw new Error('Formato inesperado da API');
  return dados;
}

export function criarAviso(titulo: string) {
  return salvarAviso('POST', URL, titulo);
}

export function editarAviso(id: string, titulo: string) {
  return salvarAviso('PATCH', `${URL}/${encodeURIComponent(id)}`, titulo);
}

export async function excluirAviso(id: string) {
  const resposta = await fetch(`${URL}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  verificarStatus(resposta);
  // Não tentamos ler JSON: uma resposta de exclusão pode não ter corpo.
}
