---
title: Datenschutzerklärung
description: Wie TypeStar mit Informationen umgeht, wenn du spielst – mit oder ohne Konto. Keine Analysen, keine Werbung.
updated: "2026-10-12"
---

TypeStar ist ein kostenloses Browserspiel. Du kannst es spielen, ohne dich
anzumelden, und es gibt keinen Newsletter und keine Werbung. Die Anmeldung ist
optional: Sie ist nur nötig, um ein Konto geräteübergreifend zu behalten, und
eine Rangliste ist eine künftige Ergänzung. Diese Erklärung beschreibt, welche
Informationen das Spiel berührt und warum.

## Wer ist verantwortlich

TypeStar wird von **HappyPaul55** veröffentlicht, der für alles unten
Beschriebene der Verantwortliche ist. Du kannst den Verantwortlichen über
[happypaul55.com](https://www.happypaul55.com) kontaktieren.

## Spielen ohne Konto

Du brauchst kein Konto zum Spielen. Wenn du dich nie anmeldest:

- Wir fragen keine personenbezogenen Daten ab, speichern oder teilen sie nicht.
- Wir setzen keine eigenen Cookies und verwenden keine Analysen, Tracker oder
  Werbepixel.
- Es gibt keine serverseitige Speicherung deines Spiels oder deiner Punkte.
  Punkte, Combos und Ergebnisse bleiben nur für die Sitzung in deinem Browser.
- Deine Spieleinstellungen (Schwierigkeit, Spielmodus, Wiedergabegeschwindigkeit
  und Sync-Versatz) werden im lokalen Speicher deines Browsers gehalten. Sie
  verlassen dein Gerät nie, und das Löschen deiner Browserdaten entfernt sie.

## Konten (optional)

Wenn du dich anmeldest, erstellen wir ein Konto für dich und speichern:

- deine **E-Mail-Adresse**, mit der du dich anmeldest und die die einzige
  Möglichkeit ist, dich zu kontaktieren;
- eine **Sitzung**, damit du in diesem Browser angemeldet bleibst, bis du dich
  abmeldest oder sie abläuft;
- deinen **Benutzernamen** und Anzeigenamen, falls du sie festlegst (der
  Benutzername ist dein öffentlicher Name in den Ranglisten);
- wann das Konto **erstellt** wurde;
- die **Ergebnisse gewerteter Läufe** (siehe unten).

Die Anmeldung erfolgt über einen per E-Mail zugesandten **Einmal-Link**; es gibt
kein Passwort. Der Link ist einmalig verwendbar, läuft nach 15 Minuten ab und
wird nur als Hash gespeichert. Die Anmelde-E-Mail ist die einzige E-Mail, die
wir senden.

Wir setzen ein **Sitzungs-Cookie**, wenn du angemeldet bist. Es ist unbedingt
erforderlich, um dich angemeldet zu halten, daher bedarf es keiner Einwilligung,
und es wird nicht verwendet, um dich über andere Websites hinweg zu verfolgen.
Das Abmelden oder Löschen deines Kontos entfernt es.

## Punkte und Ranglisten

Wenn du ohne Konto spielst, bleiben deine Punkte nur in deinem Browser. Wenn du
**angemeldet** bist, wird ein gewerteter Lauf gespeichert, damit er in den
Ranglisten erscheinen kann:

- Wir speichern das **Ergebnis** des Laufs – die Punktzahl, Genauigkeit, Combo
  sowie die Schwierigkeit, den Spielmodus und die Geschwindigkeit, mit der
  gespielt wurde – zugeordnet zu deinem Konto und dem Song.
- Um diese Punktzahl fair zu ermitteln, sendet der Browser eine Aufzeichnung der
  **Eingaben** des Laufs (Tastenanschläge oder Tonhöhenproben mit ihren
  Zeitpunkten) und ein Einmal-Token. Der Server spielt sie gegen die eigenen
  Zeitpunkte des Songs ab, um die Punktzahl abzuleiten, und **verwirft dann die
  Aufzeichnung**: Nur das Ergebnis wird behalten.
- Dein **Benutzername und deine Punkte sind öffentlich** – sie erscheinen in der
  Rangliste des Songs, im Feed der neuesten Punkte und auf deiner Profilseite
  unter `/u/<handle>`. Deine E-Mail-Adresse wird nie angezeigt.
- Ein Lauf, dessen Aufzeichnung nicht überprüft werden kann, wird trotzdem
  gespeichert, aber als **unbestätigt** markiert und aus den Ranglisten
  herausgelassen.

Das Löschen deines Kontos löscht auch seine Punkte.

## Das Mikrofon (Singen)

Das Singen ist optional, und das Mikrofon wird nur für den gewerteten
Gesangsmodus verwendet. Wenn du ihn wählst, bittet dein Browser um
Mikrofonzugriff, damit deine Tonhöhe mit den Noten des Songs verglichen werden
kann. Das Audio wird in deinem Browser Bild für Bild analysiert und **niemals
aufgezeichnet, gespeichert oder irgendwohin gesendet**: Nur die resultierende
Note und Punktzahl bleiben für diese Sitzung auf deinem Gerät. Das Mikrofon wird
freigegeben, wenn du stoppst oder die Seite verlässt. Wenn du ablehnst, kannst du
trotzdem ohne Wertung mitsingen.

## Was der Server speichert

- Wenn ein Track gespielt wird, ruft der Server die Untertitel des Videos von
  YouTube ab und speichert die **Zeitdaten** – die Wörter und wann sie vorkommen
  –, damit spätere Wiedergaben sofort laden. Das sind öffentliche Informationen
  über den Song, nicht über dich.
- Wenn du ein Konto hast, werden die oben beschriebenen Kontodetails und
  Ergebnisse gewerteter Läufe in unserer Datenbank gespeichert, die von
  Cloudflare (D1) gehostet wird.
- Die von dir gewählte Video-ID ist Teil der Anfrage, daher werden die üblichen
  technischen Details dieser Anfrage von unserem Hoster Cloudflare verarbeitet,
  wie unten beschrieben.

## Menschen-Prüfungen für neue Songs

Songs, die bereits in unserer Bibliothek sind, werden sofort ohne Prüfung
abgespielt. Wenn du zum ersten Mal einen Song anforderst, den wir noch nicht
gesehen haben – und wenn du einen Anmeldelink anforderst –, führt Cloudflare
**Turnstile** eine schnelle automatische Prüfung durch, um sicherzustellen, dass
die Anfrage von einer Person und nicht von einem Bot kommt. Turnstile kann
technische Signale wie deine IP-Adresse und Browsermerkmale verarbeiten und ein
kurzlebiges Cookie setzen, gemäß Cloudflares eigener Datenschutzrichtlinie. Es
wird nur verwendet, um zu verhindern, dass der Track- und der Anmeldedienst
missbraucht werden; zwischengespeicherte Songs lösen nie eine Prüfung aus.

## Deine Möglichkeiten

- **Zugriff und Übertragbarkeit** – du kannst deine Kontodetails auf der
  [Kontoseite](/account) einsehen.
- **Löschung** – die Kontoseite erlaubt dir, dein Konto und alles damit
  Gespeicherte (E-Mail, Sitzungen, Benutzername) zu löschen. Dies ist sofort und
  dauerhaft.
- **Kontakt** – für alles andere erreiche den Verantwortlichen über
  [happypaul55.com](https://www.happypaul55.com).

## Dritte

- **Cloudflare** hostet die Website, betreibt den Track-Dienst, speichert
  Track-Daten zwischen, speichert Kontodaten (D1), liefert Anmelde-E-Mails aus
  (Email Sending) und stellt die Turnstile-Menschenprüfung bereit.
- **YouTube** liefert die Musik und die Bilder. Wenn ein Spiel gespielt wird,
  wird das Video von YouTube eingebettet, sodass YouTube (Google) möglicherweise
  Cookies setzt und deine IP-Adresse sowie die üblichen technischen Details der
  Anfrage sieht, gemäß seiner eigenen Datenschutzrichtlinie. Zum Durchsuchen des
  restlichen Teils der Website werden keine YouTube-Daten angefordert.

## Änderungen

Wenn sich diese Erklärung ändert, ändert sich auch das Datum „Zuletzt
aktualisiert“ oben auf dieser Seite.
