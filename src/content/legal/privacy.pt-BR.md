---
title: Política de Privacidade
description: Como o TypeStar lida com as informações quando você joga, com ou sem uma conta. Sem análises, sem publicidade.
updated: "2026-10-12"
---

O TypeStar é um jogo de navegador gratuito. Você pode jogá-lo sem entrar na
conta, e não há newsletter nem publicidade. Entrar na conta é opcional: só é
necessário para manter uma conta entre dispositivos, e um placar de líderes é
uma adição futura. Este aviso explica as informações com que o jogo lida, e por
quê.

## Quem é o responsável

O TypeStar é publicado por **HappyPaul55**, que é o controlador de dados de
tudo o que é descrito abaixo. Você pode contatar o controlador pelo
[happypaul55.com](https://www.happypaul55.com).

## Jogar sem uma conta

Você não precisa de uma conta para jogar. Se você nunca entrar na conta:

- Não pedimos, armazenamos nem compartilhamos nenhuma informação pessoal.
- Não definimos cookies próprios e não usamos análises, rastreadores nem
  pixels de publicidade.
- Não há armazenamento no servidor do seu jogo ou das suas pontuações. As
  pontuações, combos e resultados ficam no seu navegador apenas durante a
  sessão.
- Suas preferências de jogo (dificuldade, modo de jogo, velocidade de
  reprodução e ajuste de sincronia) são guardadas no armazenamento local do seu
  navegador. Elas nunca saem do seu dispositivo, e limpar os dados do navegador
  as remove.

## Contas (opcional)

Se você optar por entrar na conta, criamos uma conta para você e armazenamos:

- seu **endereço de e-mail**, que é como você entra na conta e a única forma de
  entrarmos em contato com você;
- uma **sessão**, para que você permaneça conectado naquele navegador até sair
  ou até ela expirar;
- seu **apelido** e nome de exibição, se você os definir (o apelido é seu nome
  público nos placares de líderes);
- quando a conta foi **criada**;
- os **resultados das partidas pontuadas** (veja abaixo).

A entrada na conta usa um **link de uso único** enviado por e-mail; não há
senha. O link é de uso único, expira após 15 minutos e é armazenado apenas como
um hash. O e-mail de acesso é o único e-mail que enviamos.

Definimos um **cookie de sessão** quando você está conectado. Ele é
estritamente necessário para manter você conectado, então não exige
consentimento, e não é usado para rastrear você em outros sites. Sair da conta,
ou excluir sua conta, o remove.

## Pontuações e placares de líderes

Jogar sem uma conta mantém suas pontuações apenas no seu navegador. Quando você
está **conectado**, uma partida pontuada é salva para poder aparecer nos
placares de líderes:

- Armazenamos o **resultado** da partida — a pontuação, a precisão, o combo e a
  dificuldade, o modo de jogo e a velocidade com que foi jogada — vinculado à
  sua conta e à música.
- Para calcular essa pontuação de forma justa, o navegador envia uma gravação
  das **entradas** da partida (teclas pressionadas ou amostras de afinação, com
  seus tempos) e um token de uso único. O servidor as reproduz de acordo com os
  tempos da própria música para derivar a pontuação, e então **descarta a
  gravação**: apenas o resultado é mantido.
- Seu **apelido e suas pontuações são públicos** — eles aparecem no placar de
  líderes da música, no feed de pontuações recentes e na sua página de perfil em
  `/u/<handle>`. Seu endereço de e-mail nunca é mostrado.
- Uma partida cuja gravação não confere ainda é salva, mas marcada como
  **não verificada** e deixada de fora dos placares de líderes.

Excluir sua conta também exclui suas pontuações.

## O microfone (canto)

Cantar é opcional, e o microfone só é usado para o modo de canto pontuado. Se
você escolhê-lo, seu navegador pede acesso ao microfone para que sua afinação
possa ser comparada com as notas da música. O áudio é analisado no seu
navegador, quadro a quadro, e **nunca é gravado, armazenado nem enviado a lugar
algum**: apenas a nota resultante e a pontuação ficam no seu dispositivo, para
aquela sessão. O microfone é liberado quando você para ou sai da página. Se você
recusar, ainda pode cantar junto sem pontuação.

## O que o servidor armazena

- Quando uma música é tocada, o servidor busca as legendas do vídeo no YouTube
  e salva os **dados de tempo** — as palavras e quando elas ocorrem — para que
  as reproduções posteriores carreguem instantaneamente. São informações
  públicas sobre a música, não sobre você.
- Se você tem uma conta, os detalhes da conta e os resultados das partidas
  pontuadas descritos acima são armazenados no nosso banco de dados, hospedado
  pela Cloudflare (D1).
- O id do vídeo que você escolhe faz parte da solicitação, então os detalhes
  técnicos usuais dessa solicitação são tratados pelo nosso provedor, a
  Cloudflare, conforme descrito abaixo.

## Verificações humanas para músicas novas

As músicas que já estão na nossa biblioteca tocam imediatamente, sem verificação.
Na primeira vez que você pede uma música que ainda não vimos — e quando você
solicita um link de acesso — a Cloudflare **Turnstile** executa uma verificação
automatizada rápida para garantir que a solicitação vem de uma pessoa e não de
um bot. A Turnstile pode processar sinais técnicos como seu endereço IP e
características do navegador, e pode definir um cookie de curta duração, sob a
própria política de privacidade da Cloudflare. Ela é usada apenas para evitar
que os serviços de música e de acesso sejam abusados; músicas em cache nunca
disparam uma verificação.

## Suas escolhas

- **Acesso e portabilidade** — você pode ver os detalhes da sua conta na
  [página da conta](/account).
- **Exclusão** — a página da conta permite excluir sua conta e tudo o que está
  armazenado com ela (e-mail, sessões, apelido). Isso é imediato e permanente.
- **Contato** — para qualquer outra coisa, contate o controlador pelo
  [happypaul55.com](https://www.happypaul55.com).

## Terceiros

- A **Cloudflare** hospeda o site, executa o serviço de músicas, armazena em
  cache os dados das músicas, armazena os dados da conta (D1), entrega os
  e-mails de acesso (Email Sending) e fornece a verificação humana Turnstile.
- O **YouTube** fornece a música e os visuais. Quando um jogo é jogado, o vídeo
  é incorporado a partir do YouTube, então o YouTube (Google) pode definir
  cookies e ver seu endereço IP e os detalhes técnicos padrão da solicitação,
  sob sua própria política de privacidade. Nenhum dado do YouTube é solicitado
  para navegar pelo restante do site.

## Alterações

Se este aviso mudar, a data de "última atualização" no topo desta página mudará
junto.
