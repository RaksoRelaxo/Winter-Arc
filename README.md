# Winter Arc

Eine mobile Trainings-App für den rollierenden Drei-Tage-Zyklus aus Kraftzirkel, Skilltraining und Beine/Bauch mit Oh Hill No.

## Auf GitHub Pages veröffentlichen

1. Entpacke die ZIP-Datei und lege ein GitHub-Repository an.
2. Lade den entpackten Inhalt in das Hauptverzeichnis des Repositorys. Die Datei **index.html** muss direkt dort liegen. Der Ordner **assets** bleibt erhalten. Wenn du Git verwendest, nimm auch **.nojekyll** mit auf.
3. Öffne **Settings → Pages**. Wähle unter **Source** die Einstellung **Deploy from a branch**. Wähle **main** und **/(root)** und speichere.
4. GitHub zeigt nach dem Bereitstellen die App-Adresse in den Pages-Einstellungen an. Öffne sie auf deinem Handy. Auf dem iPhone kannst du die Seite in Safari über **Teilen → Zum Home-Bildschirm** hinzufügen.

[GitHub-Anleitung zu Veröffentlichungsquellen](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Zum schnellen Ansehen kannst du die entpackte **index.html** auf dem Rechner im Browser öffnen. Für die installierbare App und den Offline-Modus verwende die veröffentlichte HTTPS-Adresse und öffne sie einmal online.

## Trainieren

- **Training** zeigt die nächste Einheit. Du kannst alle drei Tage in der Vorschau ansehen. Starte die nächste Einheit, trage deine Werte ein und hake erledigte Übungen ab.
- Nach dem Abhaken eines Satzes startet automatisch eine Zwei-Minuten-Pause. Bei Holds kannst du die Sekunden eintragen oder **Hold messen → Zeit speichern** nutzen. Der Signalton hängt vom Browser und von der Audioausgabe ab.
- Mit **Einheit abschließen** landen deine Einträge im **Verlauf**. Dort kannst du eine CSV herunterladen. Ein Pausentag unter **Zyklus** hält den Plan am aktuellen Tag.
- Der Browser speichert Entwürfe und Einheiten für genau diese App-Adresse. Verwende für den Verlauf denselben Browser und dieselbe Adresse. Wenn du Browserdaten löschst oder das Gerät wechselst, kannst du eine zuvor exportierte CSV separat öffnen.

## Training und Fortschritt

Der Kraftzirkel hat vier feste Runden. Nach dem Abhaken eines Kraft- oder Zusatzsatzes startet der Zwei-Minuten-Timer. Bei Gewichtsübungen zeigt die App den letzten Satz und den Rekord bei der gewählten Last. Wenn du die Obergrenze erstmals sauber erreichst, kannst du beim nächsten Training +5 kg, +10 kg oder dein eigenes Zusatzgewicht übernehmen. Runde, Übung und Last bestimmen den Vergleich.

Am Skilltag startest du mit 30 Minuten freiem Training. Du kannst fünf Minuten ergänzen und die Dauer speichern. Danach kommen die festen Zusatzsätze.

Am dritten Tag wechseln sich The Grade auf Zeit und zwei Oh-Hill-No-Runden nach Puls ab. Für die Zeitfahrt gibst du die Segmentzeit oben am Gipfel ein, zum Beispiel 18:45,1. Bei der Pulsfahrt sind 132 bpm das Ziel, mit 130–135 bpm als Orientierung.

## Bestehende Installation aktualisieren

Lade die Dateien in dasselbe Repository und an dieselbe Stelle hoch. Nutze danach dieselbe App-Adresse im selben Browser oder über dein vorhandenes Home-Bildschirm-Symbol. So liest die neue Version den vorhandenen Verlauf. Öffne die App nach dem Upload online und lade sie bei Bedarf erneut, damit der Browser die neuen Dateien übernimmt. Über **Verlauf → CSV exportieren** kannst du deine Trainingseinträge separat sichern.

Der Trainingsplan steht in **plan.js**. Wenn du die App-Dateien nach der Veröffentlichung änderst, erhöhe die Versionsnummer in **sw.js**, damit installierte Browser die neuen Dateien übernehmen.

## Statistik und Sicherung

Unter **Statistik** wählst du den Trainingstag, die Übung und bei Zusatzgewichten die Vergleichslast. Die Balken und Messwerte führen zur jeweiligen Einheit. Unter **Erfolge nach Datum** findest du die jeweiligen Bestleistungen. Die Rückmeldung zum nächsten Training richtet sich nach der zuletzt abgeschlossenen Einheit. Der Radmodus wechselt, sobald eine Zeitfahrt oder Pulsfahrt mit Messwert abgehakt und gespeichert wurde.

Unter **Verlauf → Sicherung speichern** kannst du eine JSON-Datei mit abgeschlossenen Einheiten und Zielen sichern. Über **Sicherung laden** führst du diese Einträge mit dem vorhandenen Verlauf zusammen. Das funktioniert auch nach einem Wechsel der App-Adresse oder des Geräts. Der CSV-Export bleibt für Tabellen verfügbar.
