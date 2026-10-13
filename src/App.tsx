import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { criarAviso, editarAviso, excluirAviso, listarAvisos } from './api';
import type { Aviso, Consulta } from './types';

export default function App() {
  const [consulta, setConsulta] = useState<Consulta>({ status: 'carregando' });
  const [tentativa, setTentativa] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erroAcao, setErroAcao] = useState('');
  const [feedback, setFeedback] = useState('');
  const campo = useRef<HTMLInputElement>(null);
  // A trava também bloqueia eventos que ocorram antes da próxima renderização.
  const trava = useRef(false);

  useEffect(() => {
    const controle = new AbortController();
    setConsulta({ status: 'carregando' });
    listarAvisos(controle.signal)
      .then(dados => {
        if (!controle.signal.aborted) setConsulta({ status: 'sucesso', dados });
      })
      .catch(() => {
        if (!controle.signal.aborted) setConsulta({
          status: 'erro', mensagem: 'Não foi possível carregar os avisos. Confira se a API está ligada.'
        });
      });
    return () => controle.abort();
  }, [tentativa]);

  function iniciarAcao() {
    if (trava.current) return false;
    trava.current = true;
    setOcupado(true);
    setErroAcao('');
    setFeedback('');
    return true;
  }

  function finalizarAcao() {
    trava.current = false;
    setOcupado(false);
  }

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!titulo.trim() || consulta.status !== 'sucesso' || !iniciarAcao()) return;
    try {
      if (editandoId !== null) {
        const atualizado = await editarAviso(editandoId, titulo.trim());
        setConsulta(c => c.status === 'sucesso'
          ? { ...c, dados: c.dados.map(a => a.id === atualizado.id ? atualizado : a) } : c);
        setFeedback('Aviso atualizado.');
      } else {
        const novo = await criarAviso(titulo.trim());
        setConsulta(c => c.status === 'sucesso' ? { ...c, dados: [...c.dados, novo] } : c);
        setFeedback('Aviso publicado.');
      }
      setTitulo('');
      setEditandoId(null);
    } catch {
      setErroAcao('Não foi possível salvar. Seu título foi mantido para tentar novamente.');
    } finally {
      finalizarAcao();
    }
  }

  function iniciarEdicao(aviso: Aviso) {
    if (trava.current) return;
    setEditandoId(aviso.id);
    setTitulo(aviso.titulo);
    setErroAcao('');
    setFeedback('');
    campo.current?.focus();
  }

  async function remover(id: string) {
    if (trava.current || !window.confirm('Excluir este aviso?') || !iniciarAcao()) return;
    try {
      await excluirAviso(id);
      setConsulta(c => c.status === 'sucesso'
        ? { ...c, dados: c.dados.filter(a => a.id !== id) } : c);
      if (editandoId === id) { setEditandoId(null); setTitulo(''); }
      setFeedback('Aviso excluído.');
    } catch {
      setErroAcao('Não foi possível excluir. O aviso foi mantido na tela.');
    } finally {
      finalizarAcao();
    }
  }

  return <main>
    <header>
      <p className="eyebrow">FRONT-END FRAMEWORKS · AULA 10</p>
      <h1>Mural de avisos</h1>
      <p>Publique os lembretes da turma e mantenha todos informados.</p>
    </header>

    {consulta.status === 'carregando' && <p role="status">Carregando avisos...</p>}
    {consulta.status === 'erro' && <section>
      <p role="alert">{consulta.mensagem}</p>
      <button onClick={() => setTentativa(n => n + 1)}>Tentar novamente</button>
    </section>}

    {consulta.status === 'sucesso' && <>
      <section aria-labelledby="formulario-titulo">
        <h2 id="formulario-titulo">{editandoId === null ? 'Publicar um aviso' : 'Editar aviso'}</h2>
        <form onSubmit={publicar}>
          <label htmlFor="titulo">Título do aviso</label>
          <input ref={campo} id="titulo" value={titulo} maxLength={160} required
            placeholder="Ex.: Entrega do trabalho na sexta-feira"
            onChange={e => setTitulo(e.target.value)} disabled={ocupado} />
          <div className="acoes">
            <button disabled={ocupado || !titulo.trim()}>
              {ocupado ? 'Aguarde...' : editandoId === null ? 'Publicar' : 'Salvar alteração'}
            </button>
            {editandoId !== null && <button type="button" className="secundario" disabled={ocupado}
              onClick={() => { setEditandoId(null); setTitulo(''); setErroAcao(''); }}>
              Cancelar edição
            </button>}
          </div>
        </form>
      </section>
      <p role="alert" className="erro">{erroAcao}</p>
      <p role="status" className="feedback">{feedback}</p>
      <section aria-labelledby="lista-titulo" aria-busy={ocupado}>
        <h2 id="lista-titulo">Avisos da turma <span>({consulta.dados.length})</span></h2>
        {consulta.dados.length === 0
          ? <p>Nenhum aviso cadastrado. Publique o primeiro.</p>
          : <ul>{consulta.dados.map(aviso => <li key={aviso.id}>
            <span className="titulo-aviso">{aviso.titulo}</span>
            <div className="acoes">
              <button type="button" className="secundario" disabled={ocupado}
                aria-label={`Editar aviso: ${aviso.titulo}`} onClick={() => iniciarEdicao(aviso)}>Editar</button>
              <button type="button" className="excluir" disabled={ocupado}
                aria-label={`Excluir aviso: ${aviso.titulo}`} onClick={() => remover(aviso.id)}>Excluir</button>
            </div>
          </li>)}</ul>}
      </section>
    </>}
    <footer>Laboratório de React, TypeScript e consumo de API com fetch.</footer>
  </main>;
}
