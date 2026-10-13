export type Aviso = { id: string; titulo: string };

export type Consulta =
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'sucesso'; dados: Aviso[] };
