---
name: verificar-integracao
description: "Verifica e corrige a integração entre frontend e backend para um fluxo do DMS."
argument-hint: "Fluxo a verificar (ex.: upload de documentos)"
agent: agent
---

# Verificar integração

Verifique e corrija a integração do fluxo `${input:fluxo:Fluxo do DMS a verificar}` entre o frontend e o backend.

Consulte as [instruções do projeto](../copilot-instructions.md), a [especificação do DMS](../../docs/specs/dms-spec.md) e o código e os testes relevantes para o fluxo.

- Compare rotas, método HTTP, cabeçalhos, corpo da requisição, respostas e tratamento de erros entre as duas aplicações.
- Verifique o uso do prefixo `/api` e do proxy, além dos estados da interface relevantes para o fluxo.
- Identifique e corrija divergências com a especificação e regressões relacionadas ao fluxo, preservando as funcionalidades existentes.
- Cubra as correções com testes adequados e execute as verificações pertinentes quando viável.
- Não trate identificação por `X-User-Id` como autenticação completa.

Apresente os problemas encontrados e as correções realizadas, com referências aos arquivos. Informe as verificações executadas e os riscos ou cenários não verificados. Se não houver problemas, declare isso explicitamente.