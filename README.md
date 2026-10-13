# Mural de avisos da turma

Projeto didático da aula 10 de Front-End Frameworks: React, TypeScript, `fetch`, CRUD e estados de carregamento, erro e lista vazia.

O aluno pode listar, publicar, editar e excluir avisos. A interface só altera os dados após a confirmação da API. Se uma gravação falhar, mantém o título e os dados atuais.

## O que é a API deste laboratório?

O JSON Server inicia um servidor HTTP local e cria as rotas a partir de `db.json`. A chave `avisos` do arquivo gera o recurso `/avisos`. POST, PATCH e DELETE alteram esse arquivo, portanto os dados sobrevivem ao recarregamento da página e à reinicialização do servidor.

É uma API simulada para aprendizado, sem autenticação ou regras de negócio de um backend de produção. O React roda na porta 5173 e a API na porta 3000. A versão do JSON Server está fixada em `1.0.0-beta.3` para manter o comportamento e os IDs como strings.

## 1. Preparação

Instale Node.js 22.12 ou superior e Git, se for clonar o repositório. Confira:

```bash
node --version
npm --version
git --version
```

Depois de publicar o projeto no GitHub, substitua os campos abaixo pelo endereço real:

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
npm ci
```

Se recebeu a pasta ou o ZIP, abra um terminal dentro da pasta que contém `package.json` e execute somente `npm ci`.

## 2. Iniciar a API

No primeiro terminal:

```bash
npm run api
```

Deixe o terminal aberto. Acesse http://localhost:3000/avisos no navegador. O resultado inicial é um array de dois avisos:

```json
[
  { "id": "1", "titulo": "Entrega do projeto na próxima aula" },
  { "id": "2", "titulo": "Laboratório: praticar GET, POST, PATCH e DELETE" }
]
```

O `db.json` já acompanha o projeto. Para criar a API do zero, basta instalar `json-server`, criar esse arquivo com a propriedade `avisos` contendo um array e iniciar o servidor. Não é necessário escrever manualmente cada rota.

## 3. Iniciar o React

Em um segundo terminal, na mesma pasta:

```bash
npm run dev
```

Abra http://localhost:5173. Mantenha os dois terminais abertos. Para encerrar cada processo, pressione Ctrl+C no terminal correspondente.

## 4. Utilizar o mural

1. Confira os avisos carregados da API.
2. Digite um título e clique em **Publicar**. O servidor gera o ID.
3. Clique em **Editar**, altere o título e clique em **Salvar alteração**.
4. Clique em **Cancelar edição** para abandonar a alteração antes de salvar.
5. Clique em **Excluir** e confirme a exclusão.
6. Recarregue a página e abra `db.json` para conferir a persistência.

Durante uma gravação, os controles ficam desabilitados. Um título com apenas espaços não gera requisição. Excluir todos os avisos exibe a mensagem de lista vazia e mantém o formulário disponível.

## 5. Observar as requisições

Abra as ferramentas de desenvolvedor do navegador (F12), selecione **Network/Rede** e filtre por **Fetch/XHR**. Execute uma ação no mural e confira URL, método, status, Payload e Response.

| Ação | Método | Rota | Corpo JSON |
| --- | --- | --- | --- |
| Listar | GET | `/avisos` | Nenhum |
| Consultar um aviso | GET | `/avisos/1` | Nenhum |
| Criar | POST | `/avisos` | `{"titulo":"Novo aviso"}` |
| Editar parcialmente | PATCH | `/avisos/1` | `{"titulo":"Título atualizado"}` |
| Excluir | DELETE | `/avisos/1` | Nenhum |

Nos exemplos, use um ID que exista no seu `db.json`. Após excluir um registro, a rota correspondente deixa de encontrá-lo. PUT também existe no JSON Server, mas este projeto usa PATCH para edição parcial.

Os códigos 2xx indicam sucesso, 4xx indicam problemas na requisição e 5xx indicam falhas no servidor. `fetch` não rejeita automaticamente por um status HTTP de erro: por isso `src/api.ts` verifica `resposta.ok`. A exclusão não depende de ler JSON, pois uma resposta bem-sucedida pode não ter corpo.

### Testar sem a interface (PowerShell)

Com a API ligada:

```powershell
# Consultar
Invoke-RestMethod -Uri 'http://localhost:3000/avisos'

# Criar e guardar o ID retornado
$novoAviso = Invoke-RestMethod -Uri 'http://localhost:3000/avisos' -Method Post -ContentType 'application/json' -Body '{"titulo":"Teste via PowerShell"}'

# Editar
Invoke-RestMethod -Uri "http://localhost:3000/avisos/$($novoAviso.id)" -Method Patch -ContentType 'application/json' -Body '{"titulo":"Teste atualizado"}'

# Excluir
Invoke-RestMethod -Uri "http://localhost:3000/avisos/$($novoAviso.id)" -Method Delete
```

## 6. Entender o código

```text
db.json          Dados persistidos pela API
src/types.ts     Tipo Aviso e estados possíveis da consulta
src/api.ts       fetch, status HTTP e validação do JSON
src/App.tsx      Componente, formulário, estados e operações CRUD
src/main.tsx     Entrada do React com StrictMode
src/styles.css   Aparência responsiva e indicação de foco
vite.config.ts   Configuração do Vite
```

Sugestão de leitura: comece por `db.json`, leia `types.ts`, depois `api.ts` e finalmente `App.tsx`.

O `useEffect` faz a consulta inicial e cancela a requisição na limpeza com `AbortController`. No StrictMode de desenvolvimento, o React pode iniciar e cancelar uma consulta adicional para verificar a limpeza do efeito. As gravações ocorrem nos eventos do usuário.

O TypeScript descreve os dados esperados, mas não valida respostas externas. A função `ehAviso` verifica o JSON em execução. A lista usa `map`, `filter` e espalhamento para atualizar o estado sem modificar o array anterior.

## 7. Roteiro de verificação em aula

| Cenário | Como testar | Resultado esperado |
| --- | --- | --- |
| Carregamento | Na aba Network, habilitar uma conexão lenta e recarregar | Mensagem de carregamento antes da lista |
| Erro na consulta | Parar a API e recarregar | Mensagem de erro e botão Tentar novamente |
| Recuperação | Reiniciar a API e clicar em Tentar novamente | Lista carregada |
| Lista vazia | Excluir todos os avisos pela interface | Mensagem de lista vazia com formulário disponível |
| Validação | Digitar apenas espaços | Botão Publicar desabilitado |
| Falha ao salvar | Carregar a lista, parar a API e tentar publicar ou editar | Título mantido e mensagem de falha |
| Falha ao excluir | Parar a API após carregar a lista e tentar excluir | Aviso mantido na tela |
| Persistência | Criar um aviso e recarregar | Aviso continua na lista |

Para recomeçar, pare a API, substitua o conteúdo de `db.json` pelos dados iniciais deste README e inicie a API novamente.

## 8. Compilar

```bash
npm run build
```

O comando verifica os tipos e gera `dist/`. `npm run preview` permite visualizar essa compilação localmente; a API precisa continuar ligada.

Para verificar automaticamente as operações da API:

```bash
npm run test:api
```

Esse teste inicia uma API na porta 3099 com banco temporário e verifica lista vazia, criação, edição, persistência, recurso inexistente e exclusão. Não altera o `db.json` da aula. A porta 3099 deve estar livre. Os cenários visuais continuam sendo verificados pelo roteiro da seção 7.

## 9. Publicar o código no GitHub

Crie um repositório vazio no GitHub, sem README, licença ou .gitignore gerados pelo site. Dentro desta pasta, execute, substituindo o endereço pelo seu:

```bash
git init
git add .
git commit -m "Adiciona laboratorio de React e API de avisos"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

O `.gitignore` exclui `node_modules` e `dist`. Publique `package-lock.json` e `db.json`, junto com o código e este README. Antes de publicar, confira se o banco contém os exemplos que deseja compartilhar com a turma.

Hospedar o código no GitHub permite aos alunos clonar e executar o laboratório. GitHub Pages hospeda arquivos estáticos e não executa esta API Node.js. Para a aula, cada aluno deve iniciar a API localmente.

## Problemas comuns

- **API não conecta:** confira se `npm run api` está ativo e se `/avisos` abre no navegador.
- **Porta ocupada:** encerre o processo que está usando 3000 ou 5173. Se alterar a porta da API, atualize a URL em `src/api.ts`.
- **Erro de JSON:** confira aspas duplas, vírgulas e a estrutura do `db.json`.
- **Formato inesperado:** cada aviso precisa de `id` string e `titulo` string.
- **CORS:** use a API deste projeto, confira a URL e a mensagem no Console. Não use `mode: 'no-cors'`, pois impediria a leitura do JSON.

## Referências

- [Vite: primeiros passos](https://vite.dev/guide/)
- [JSON Server: documentação](https://github.com/typicode/json-server)
- [React: useEffect](https://react.dev/reference/react/useEffect)
- [MDN: fetch](https://developer.mozilla.org/pt-BR/docs/Web/API/Window/fetch)
