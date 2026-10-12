---
title: Politique de confidentialité
description: Comment TypeStar traite les informations lorsque vous jouez, avec ou sans compte. Aucune analyse, aucune publicité.
updated: "2026-10-12"
---

TypeStar est un jeu de navigateur gratuit. Vous pouvez y jouer sans vous
connecter, et il n'y a ni newsletter ni publicité. Se connecter est facultatif :
cela ne sert qu'à conserver un compte sur plusieurs appareils, et un classement
est un ajout futur. Cet avis explique les informations que le jeu utilise, et
pourquoi.

## Qui est responsable

TypeStar est publié par **HappyPaul55**, qui est le responsable du traitement des
données pour tout ce qui est décrit ci-dessous. Vous pouvez contacter le
responsable via [happypaul55.com](https://www.happypaul55.com).

## Jouer sans compte

Vous n'avez pas besoin d'un compte pour jouer. Si vous ne vous connectez jamais :

- Nous ne demandons, ne stockons ni ne partageons aucune information personnelle.
- Nous ne déposons aucun cookie qui nous soit propre et n'utilisons aucune
  analyse, aucun traqueur ni pixel publicitaire.
- Il n'y a aucun stockage côté serveur de votre partie ou de vos scores. Les
  scores, les combos et les résultats restent dans votre navigateur, pour la
  session uniquement.
- Vos préférences de jeu (difficulté, mode de partie, vitesse de lecture et
  décalage de synchronisation) sont conservées dans le stockage local de votre
  navigateur. Elles ne quittent jamais votre appareil, et l'effacement des
  données de votre navigateur les supprime.

## Comptes (facultatif)

Si vous choisissez de vous connecter, nous créons un compte pour vous et
stockons :

- votre **adresse e-mail**, qui est votre moyen de connexion et le seul moyen de
  vous contacter ;
- une **session**, pour que vous restiez connecté sur ce navigateur jusqu'à ce
  que vous vous déconnectiez ou qu'elle expire ;
- votre **pseudonyme** et votre nom d'affichage, si vous les définissez (le
  pseudonyme est votre nom public dans les classements) ;
- la date de **création** du compte ;
- les **résultats des parties notées** (voir ci-dessous).

La connexion utilise un **lien à usage unique** envoyé par e-mail ; il n'y a pas
de mot de passe. Le lien est à usage unique, expire au bout de 15 minutes et
n'est conservé que sous forme de hachage. L'e-mail de connexion est le seul
e-mail que nous envoyons.

Nous déposons un **cookie de session** lorsque vous êtes connecté. Il est
strictement nécessaire pour vous garder connecté, il ne requiert donc pas de
consentement, et il n'est pas utilisé pour vous suivre sur d'autres sites. La
déconnexion, ou la suppression de votre compte, le supprime.

## Scores et classements

Jouer sans compte garde vos scores uniquement dans votre navigateur. Lorsque vous
êtes **connecté**, une partie notée est enregistrée pour pouvoir figurer dans les
classements :

- Nous stockons le **résultat** de la partie — le score, la précision, le combo,
  ainsi que la difficulté, le mode de partie et la vitesse auxquels elle a été
  jouée — en l'associant à votre compte et au morceau.
- Pour calculer ce score équitablement, le navigateur envoie un enregistrement
  des **entrées** de la partie (frappes au clavier ou échantillons de hauteur,
  avec leurs horodatages) et un jeton à usage unique. Le serveur les rejoue selon
  les timings propres au morceau pour en déduire le score, puis **écarte
  l'enregistrement** : seul le résultat est conservé.
- Votre **pseudonyme et vos scores sont publics** — ils apparaissent dans le
  classement du morceau, le fil des scores récents et votre page de profil à
  `/u/<handle>`. Votre adresse e-mail n'est jamais affichée.
- Une partie dont l'enregistrement ne se vérifie pas est tout de même
  enregistrée, mais marquée **non vérifiée** et exclue des classements.

Supprimer votre compte supprime aussi ses scores.

## Le microphone (le chant)

Le chant est facultatif, et le microphone n'est utilisé que pour le mode de chant
noté. Si vous le choisissez, votre navigateur demande l'accès au microphone afin
que votre hauteur puisse être comparée aux notes du morceau. L'audio est analysé
dans votre navigateur, image par image, et n'est **jamais enregistré, stocké ni
envoyé où que ce soit** : seules la note et le score qui en résultent restent sur
votre appareil, pour cette session. Le microphone est libéré lorsque vous
arrêtez ou quittez la page. Si vous refusez, vous pouvez toujours chanter sans
notation.

## Ce que le serveur stocke

- Lorsqu'un morceau est joué, le serveur récupère les sous-titres de la vidéo
  depuis YouTube et enregistre les **données de timing** — les mots et le moment
  où ils surviennent — afin que les lectures ultérieures se chargent
  instantanément. Ce sont des informations publiques sur le morceau, et non sur
  vous.
- Si vous avez un compte, les détails du compte et les résultats des parties
  notées décrits ci-dessus sont stockés dans notre base de données, hébergée par
  Cloudflare (D1).
- L'identifiant de la vidéo que vous choisissez fait partie de la requête, de
  sorte que les détails techniques habituels de cette requête sont traités par
  notre hébergeur, Cloudflare, comme décrit ci-dessous.

## Vérifications humaines pour les nouveaux morceaux

Les morceaux déjà présents dans notre bibliothèque se jouent immédiatement, sans
vérification. La première fois que vous demandez un morceau que nous n'avons
jamais vu — et lorsque vous demandez un lien de connexion — Cloudflare
**Turnstile** effectue une vérification automatisée rapide pour s'assurer que la
requête provient d'une personne et non d'un robot. Turnstile peut traiter des
signaux techniques tels que votre adresse IP et les caractéristiques de votre
navigateur, et peut déposer un cookie de courte durée, selon la propre politique
de confidentialité de Cloudflare. Il est utilisé uniquement pour éviter que les
services de morceaux et de connexion soient abusés ; les morceaux en cache ne
déclenchent jamais de vérification.

## Vos choix

- **Accès et portabilité** — vous pouvez consulter les détails de votre compte
  sur la [page de compte](/account).
- **Suppression** — la page de compte vous permet de supprimer votre compte et
  tout ce qui y est stocké (e-mail, sessions, pseudonyme). C'est immédiat et
  définitif.
- **Contact** — pour tout le reste, contactez le responsable via
  [happypaul55.com](https://www.happypaul55.com).

## Tiers

- **Cloudflare** héberge le site, exécute le service de morceaux, met en cache les
  données des morceaux, stocke les données de compte (D1), envoie les e-mails de
  connexion (Email Sending) et fournit la vérification humaine Turnstile.
- **YouTube** fournit la musique et les visuels. Lorsqu'une partie est jouée, la
  vidéo est intégrée depuis YouTube, de sorte que YouTube (Google) peut déposer
  des cookies et voir votre adresse IP ainsi que les détails techniques standards
  de la requête, selon sa propre politique de confidentialité. Aucune donnée
  YouTube n'est demandée pour parcourir le reste du site.

## Modifications

Si cet avis change, la date de « dernière mise à jour » en haut de cette page
changera en conséquence.
