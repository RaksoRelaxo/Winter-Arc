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

## Plan und Anpassungen

Der Kraftzirkel hat vier feste Runden. Für einen +5-kg-Vorschlag braucht die App in den beiden letzten vergleichbaren Einheiten die obere Wiederholungszahl bei gleichem Gewicht, mindestens zwei saubere Wiederholungen in Reserve und einen abgehakten Satz. Bei Pistol Squats und Kreuz-Kniebeugen müssen alle vorgesehenen Sätze die Bedingung erfüllen. Den Vorschlag bestätigst du im nächsten Training. Gib bei einem zu großen Sprung das niedrigere Gewicht wieder ein.

Am Skilltag wählst du die Versuche frei. Die Zusatzsätze bleiben vorgegeben. Das L-Sit-Ziel startet bei 20 Sekunden und lässt sich im ersten L-Sit-Satz ändern. Am dritten Tag folgen auf Beine und Bauch eine Runde Oh Hill No in Zwift und die Ganzkörper-Dehnung.

Der Trainingsplan steht in **plan.js**. Wenn du die App-Dateien nach der Veröffentlichung änderst, erhöhe die Versionsnummer in **sw.js**, damit installierte Browser die neuen Dateien übernehmen.
