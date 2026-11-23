# Especificação - Document Management System

> Especificação do DMS para desenvolvimento guiado por especificação (Spec Driven Development).
> Baseada em [spec-template.md](/workspaces/document-management-system-tatiana-burgos/docs/specs/spec-template.md).

## 1. Objetivo

Permitir que usuários enviem, listem e baixem documentos por meio de uma aplicação web, com armazenamento local e metadados em memória nesta fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos do usuário
- Download de documentos pelo identificador
- Gestão simples por usuário (cada documento tem um dono)
- Tratamento de erros nos limites do sistema (entrada HTTP, leitura e escrita de arquivos)

### Fora do escopo

- Armazenamento externo ou em nuvem, e serviços de upload de terceiros
- Versionamento de documentos
- Autenticação completa (login, senha, sessão, tokens)
- Persistência de metadados em banco de dados
- Remoção ou edição de documentos
- Compartilhamento entre usuários

## 3. Requisitos funcionais

| ID    | Requisito                                                                                  |
| ----- | ------------------------------------------------------------------------------------------ |
| RF-01 | O usuário pode enviar um documento (arquivo único por requisição)                          |
| RF-02 | O usuário pode listar os documentos de sua propriedade                                     |
| RF-03 | O usuário pode baixar um documento pelo identificador, desde que seja o dono              |
| RF-04 | O sistema rejeita envios sem arquivo ou com arquivo acima do limite configurado            |
| RF-05 | O sistema responde 404 quando o documento não existe ou não pertence ao usuário            |
| RF-06 | A interface web permite enviar, listar e baixar documentos                                 |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                   |
| ------ | ------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local em `backend/storage`, via `multer` com `diskStorage`  |
| RNF-02 | Metadados mantidos em memória nesta fase (perdidos ao reiniciar o processo)                 |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor), com valores padrão seguros              |
| RNF-04 | Backend em Node.js + Express (CommonJS), testes com `node:test`                             |
| RNF-05 | Frontend em React + Vite (ESM), comunicação via `fetch` com prefixo `/api` (proxy do Vite)  |
| RNF-06 | JavaScript puro, sem TypeScript nesta fase                                                  |
| RNF-07 | Nomes de símbolos em inglês; mensagens ao usuário e comentários em português                |

### Variáveis de ambiente previstas

| Variável           | Padrão                 | Descrição                                      |
| ------------------ | ---------------------- | ---------------------------------------------- |
| `PORT`             | `3000`                 | Porta do servidor HTTP                         |
| `STORAGE_DIR`      | `backend/storage`      | Pasta de gravação dos arquivos                 |
| `MAX_FILE_SIZE_MB` | `10`                   | Limite de tamanho por arquivo, em megabytes    |

## 5. Modelo de dados

### Metadados do documento (em memória)

| Campo        | Tipo   | Descrição                                                   |
| ------------ | ------ | ----------------------------------------------------------- |
| id           | string | Identificador único (UUID v4)                               |
| originalName | string | Nome original do arquivo enviado                            |
| storedName   | string | Nome do arquivo gravado no disco (uso interno, não exposto) |
| mimeType     | string | Tipo MIME informado no upload                               |
| size         | number | Tamanho em bytes                                            |
| uploadedAt   | string | Data/hora do upload (ISO 8601, UTC)                         |
| owner        | string | Identificador do usuário dono                               |

### Identificação do usuário (premissa)

Sem autenticação nesta fase, o usuário é informado pelo cabeçalho HTTP `X-User-Id`. Se ausente, a requisição recebe 400. Essa premissa deve ser revisada quando houver autenticação.

### Armazenamento em memória

- Estrutura: `Map` indexado por `id`.
- O repositório é a única camada que acessa essa estrutura.

## 6. Contratos de API

Todas as rotas são servidas sob `/api` pelo frontend (proxy do Vite) e, no backend, sob a raiz.

### POST /upload

- Cabeçalhos: `X-User-Id` (obrigatório), `Content-Type: multipart/form-data`
- Corpo: campo `file` com o arquivo
- Respostas:
  - `201 Created`: metadados do documento criado (sem `storedName`)
  - `400 Bad Request`: campo `file` ausente ou `X-User-Id` ausente
  - `413 Payload Too Large`: arquivo acima de `MAX_FILE_SIZE_MB`
  - `500 Internal Server Error`: falha ao gravar o arquivo

Exemplo de resposta `201`:

```json
{
  "id": "3f2c1e0a-8d4b-4c59-9a7e-2b1f6d0e7a11",
  "originalName": "contrato.pdf",
  "mimeType": "application/pdf",
  "size": 48213,
  "uploadedAt": "2026-11-23T17:21:00.000Z",
  "owner": "user-42"
}
```

### GET /documents

- Cabeçalhos: `X-User-Id` (obrigatório)
- Respostas:
  - `200 OK`: array com os metadados dos documentos do usuário (vazio se não houver)
  - `400 Bad Request`: `X-User-Id` ausente

### GET /documents/:id/download

- Cabeçalhos: `X-User-Id` (obrigatório)
- Respostas:
  - `200 OK`: conteúdo binário, com `Content-Type` igual ao `mimeType` e `Content-Disposition: attachment; filename="<originalName>"`
  - `400 Bad Request`: `X-User-Id` ausente
  - `404 Not Found`: documento inexistente, de outro dono, ou arquivo ausente no disco
  - `500 Internal Server Error`: falha de leitura do arquivo

### Formato de erro

```json
{ "error": "Mensagem em português descrevendo o problema" }
```

## 7. Decisões arquiteturais

### Backend (Clean Architecture simples)

Fluxo de dependência: `routes -> controllers -> services -> repositories`. Camadas internas não conhecem as externas.

| Camada          | Responsabilidade                                                        |
| --------------- | ----------------------------------------------------------------------- |
| `routes/`       | Define endpoints e delega para os controllers                           |
| `controllers/`  | Trata entrada e saída HTTP e validação básica (cabeçalho, arquivo)      |
| `services/`     | Regras de negócio (ownership, montagem de metadados, limites)           |
| `repositories/` | Persistência: gravação em disco (multer `diskStorage`) e mapa em memória |

- `app.js` monta o Express e registra as rotas; não contém regra de negócio.
- Erros são tratados nos limites: controllers (HTTP) e repositório (I/O de arquivo).

### Armazenamento

- `multer` com `diskStorage` grava em `STORAGE_DIR` com nome gerado (UUID), evitando colisão e path traversal.
- Nenhum provedor externo é utilizado.

### Frontend (componentes React)

- Organização: `components/`, `pages/`, `services/`.
- `services/` centraliza as chamadas `fetch` ao `/api`; componentes não chamam `fetch` diretamente.
- Componentes funcionais com Hooks; reutilização de componentes para evitar duplicação.

### Princípios

SOLID, DRY, KISS, YAGNI. Sem overengineering e sem abstrações desnecessárias.

## 8. Plano de execução

Cada etapa tem critério de aceite verificável. A implementação só começa após aprovação desta especificação.

1. **Preparar a configuração**
   - Escopo: leitura de variáveis de ambiente com valores padrão; criação da pasta `backend/storage` (sem versionar os arquivos gravados).
   - Aceite: aplicação sobe com e sem variáveis definidas, usando os padrões da tabela de variáveis de ambiente.

2. **Repositório de documentos**
   - Escopo: gravação via `multer` `diskStorage` e mapa em memória com operações de inserção, busca por id e listagem por dono.
   - Aceite: testes unitários cobrem inserção, busca, listagem filtrada por dono e busca de id inexistente.

3. **Serviço de documentos**
   - Escopo: regras de ownership, montagem de metadados (UUID, `uploadedAt`) e validação de tamanho.
   - Aceite: testes cobrem documento de outro dono retornando "não encontrado" e metadados completos.

4. **Controllers e rotas do backend**
   - Escopo: `POST /upload`, `GET /documents`, `GET /documents/:id/download`, cabeçalho `X-User-Id`, mapeamento de erros para 400, 404, 413 e 500.
   - Aceite: testes de integração com `node:test` para cada rota e cada código de resposta listado na seção 6.

5. **Frontend: camada de serviço e componentes**
   - Escopo: `services/` com chamadas ao `/api`; componentes de upload, lista e download; página principal.
   - Aceite: envio, listagem e download funcionam pela interface com o backend rodando; erros exibidos em português.

6. **Integração e validação final**
   - Escopo: proxy do Vite para `/api`; verificação dos RF-01 a RF-06; atualização da documentação.
   - Aceite: todos os requisitos funcionais verificados manualmente e pelos testes automatizados; nenhuma funcionalidade existente quebrada.

## 9. Riscos e premissas

- **Metadados em memória**: reinício do processo apaga o índice, mas os arquivos permanecem em disco (órfãos). Aceito nesta fase.
- **Identificação por cabeçalho**: `X-User-Id` não é autenticação. Qualquer cliente pode se passar por outro usuário. Aceito apenas para o escopo de treinamento.
- **Vulnerabilidades de dependências**: `npm install` reportou 1 vulnerabilidade de severidade alta em `backend` e outra em `frontend`. Devem ser avaliadas antes de produção.
