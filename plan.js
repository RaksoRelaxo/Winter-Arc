'use strict';

(() => {
  function exercise(id, name, target, options = {}) {
    return { id, name, target, unit: 'Wdh.', counts: true, rest: 120, restRange: '2 Min.', ...options };
  }

  function step(id, name, target, cue, options = {}) {
    return exercise(id, name, target, { unit: '', counts: false, rest: 0, cue, ...options });
  }

  function group(id, name, summary, rows, options = {}) {
    return { id, name, summary, rows, ...options };
  }

  function warmup(id) {
    return group(id, 'Aufwärmen', '8–12 Min.', [
      step(id + '-ready', 'Aufwärmen', 'Nach Bedarf')
    ]);
  }

  function cooldown(id) {
    return group(id, 'Auslockern', '2–3 Min.', [
      step(id + '-done', 'Locker auslaufen und ausschütteln', 'Nach Bedarf')
    ]);
  }

  const vest = 'Gewichtsweste';
  const belt = 'Gewichtsgürtel';
  const bars = 'Parallettes';
  const bodyweight = 'Körpergewicht';
  const pullCue = 'Schulterbreiter Obergriff. Beine leicht vor dem Körper und Rumpf angespannt halten. Zieh ohne Schwung hoch und senk dich kontrolliert bis zur vollen Armstreckung ab.';
  const dipCue = 'Ellbogen körpernah führen. Geh kontrolliert so tief, wie die Schulter stabil bleibt, und drück bis zur Armstreckung.';
  const pushCue = 'Nimm auf den Parallettes einen vollen, kontrollierten Bewegungsweg. Rumpf und Beine bleiben gespannt. Drück dich oben ganz heraus.';
  const narrowPress = 'Griffe schulterbreit und etwas tiefer am Oberkörper platzieren. ' + pushCue;
  const strength = {
    id: 'kraft', name: 'Kraftzirkel', short: 'Kraft', icon: 'dumbbell',
    subtitle: 'Schwere Züge und Dips, danach kontrollierte Wiederholungen.',
    time: '45–55 Min. inkl. Pausen', focus: 'Oberkörper',
    rule: 'Beim Krafttag Ellbogenschoner und Handgelenkbandagen tragen. Zähl bis zur letzten sauberen Wiederholung. Nach jedem abgehakten Satz startet die Zwei-Minuten-Pause.',
    groups: [
      warmup('kraft-warm'),
      group('kraft-1', 'Runde 1', 'Schwer', [
        exercise('pull-20', 'Klimmzüge', '3–5 Wdh.', { kg: 20, gear: vest, cue: pullCue }),
        exercise('dip-30', 'Dips', '2–4 Wdh.', { kg: 30, gear: 'Weste + Gürtel', cue: dipCue }),
        exercise('toes-bar', 'Toes-to-Bar', '5–8 Wdh.', { gear: 'An der Stange', cue: 'Heb die Beine möglichst gestreckt Richtung Stange und senk sie ohne Schwung ab.', nextVariant: 'Senk die Beine langsamer ab oder halte sie oben kurz.' }),
        exercise('push-vest', 'Liegestütze', '3–6 Wdh.', { kg: 30, gear: 'Parallettes · 20-kg-Weste + 10-kg-Scheibe', cue: narrowPress + ' Nutze die Scheibe mit Hilfe beim Auflegen und sicherer Auflage. Trag bei Bedarf eine niedrigere Testlast ein.' })
      ]),
      group('kraft-2', 'Runde 2', 'Mittlere Last', [
        exercise('pull-10', 'Klimmzüge', '4–6 Wdh.', { kg: 10, gear: belt, cue: pullCue }),
        exercise('dip-20', 'Dips', '5–8 Wdh.', { kg: 20, gear: vest, cue: dipCue }),
        exercise('knee-hang', 'Knieheben im Hang', '6–10 Wdh.', { gear: 'Knie angewinkelt', cue: 'Zieh die Knie an und roll das Becken oben zu den Rippen ein. Heb die Hüfte dabei leicht an und senk sie kontrolliert ab.', nextVariant: 'Halte das Becken oben kurz eingerollt.' }),
        exercise('push-10', 'Liegestütze', '4–8 Wdh.', { kg: 20, gear: 'Parallettes + Weste', cue: narrowPress })
      ]),
      group('kraft-3', 'Runde 3', 'Leichtere Zug- und Diplast', [
        exercise('pull-bw', 'Klimmzüge', '6–10 Wdh.', { kg: 0, gear: bodyweight, cue: pullCue, nextVariant: 'Halte die obere Position eine Sekunde.' }),
        exercise('dip-10', 'Dips', '6–10 Wdh.', { kg: 10, gear: belt, cue: dipCue }),
        exercise('dragon-negative', 'Dragon-Flag-Negative', '2–4 Wdh.', { gear: 'Matte · fester Griff', cue: 'Zieh die Knie kontrolliert an, um in die obere Position zu kommen. Streck dich und senk den Körper über 3–5 Sekunden als Linie ab. Beuge bei Bedarf die Knie für einen kürzeren Hebel.', nextVariant: 'Verlängere die Absenkphase oder geh mit gerader Körperlinie etwas tiefer.' }),
        exercise('push-wide-r3', 'Breite Liegestütze', '6–10 Wdh.', { kg: 10, gear: 'Parallettes + Weste', cue: 'Greif sichtbar breiter als schulterbreit, so weit die Schultern stabil bleiben. ' + pushCue })
      ]),
      group('kraft-4', 'Runde 4', 'Körpergewicht', [
        exercise('chin-bw', 'Chin-ups', '6–10 Wdh.', { kg: 0, gear: 'Untergriff', cue: 'Schulterbreiter Untergriff, kontrolliert über die Stange ziehen und bis zur Armstreckung ablassen.', nextVariant: 'Halte die obere Position eine Sekunde.' }),
        exercise('dip-bw', 'Dips', '6–10 Wdh.', { kg: 0, gear: bodyweight, cue: dipCue, nextVariant: 'Senk dich über drei Sekunden kontrolliert ab.' }),
        exercise('reverse-crunch', 'Reverse Crunches mit gestreckten Beinen', '6–10 Wdh.', { gear: 'Matte · fester Griff hinter dem Kopf', cue: 'Greif in Rückenlage an einen fest montierten Rackpfosten oder einen ähnlich stabilen Griff. Heb die gestreckten Beine Richtung Decke und roll das Becken oben kurz ein. Senk zuerst das Becken und dann die Beine langsam ab, so weit du den unteren Rücken stabil hältst. Schultern und Kopf bleiben auf der Matte.', nextVariant: 'Senk die gestreckten Beine etwas tiefer ab, solange der Rücken stabil bleibt.' }),
        exercise('pseudo-r4', 'Pseudo Planche Push-ups', '2–5 Wdh.', { kg: 0, gear: bars, cue: 'Lehn die Schultern kontrolliert vor die Hände und halte die Vorneigung beim Absenken und Drücken möglichst gleich. ' + pushCue, nextVariant: 'Verlagere die Schultern etwas weiter vor die Hände.' })
      ]),
      cooldown('kraft-cool')
    ]
  };

  const hold = (id, name, target, options) => exercise(id, name, target, { unit: 'Sek.', ...options });

  const skills = {
    id: 'skills', name: 'Skilltraining', short: 'Skills', icon: 'target',
    subtitle: '30 Minuten frei üben, danach acht feste Zusatzsätze.',
    time: 'Ca. 60–75 Min.', focus: 'Skills & Kraft',
    rule: 'Wähle deine Skillversuche frei und speichere am Ende die Dauer. Bei den Zusatzsätzen startet nach jedem abgehakten Satz die Zwei-Minuten-Pause.',
    groups: [
      warmup('skill-warm'),
      group('free-skills', 'Freie Skillversuche', '30 Min. · optional +5 Min.', [
        step('skill-block', 'Freies Skilltraining', '30 Min.', 'Wechsle nach Gefühl zwischen Handstand, Press, Planche und deinen weiteren Skills.', { unit: 'Sek.', skillTimer: true })
      ]),
      group('pike', 'Pike Push-ups', 'Erhöht, dann am Boden', [
        exercise('pike-high', 'Pike Push-ups', '4–8 Wdh.', { set: 1, gear: 'Füße erhöht', nextVariant: 'Erhöhe die Fußauflage etwas.' }),
        exercise('pike-floor', 'Pike Push-ups', '6–10 Wdh.', { set: 2, gear: 'Am Boden', nextVariant: 'Verlagere mehr Gewicht auf die Hände.' })
      ]),
      group('rows', 'Rows am Barren', 'Mit Weste, dann ohne', [
        exercise('bar-rows-20', 'Rows am Barren', '4–6 Wdh.', { set: 1, kg: 20, gear: 'Weste · Füße abgestützt', cue: 'Stütz die Füße rutschfest ab. Wähle einen tiefen, kontrollierbaren Körperwinkel und behalte ihn für vergleichbare Sätze bei.' }),
        exercise('bar-rows-bw', 'Rows am Barren', '5–8 Wdh.', { set: 2, kg: 0, gear: 'Füße abgestützt', nextVariant: 'Stell den Körper etwas flacher und nutze eine gleichbleibende Fußauflage.' })
      ]),
      group('planche-assist', 'Planche-Zusatzsätze', 'Tuck Push-ups, dann Leans', [
        exercise('tuck-planche-push', 'Tuck Planche Push-ups', '2–5 Wdh.', { set: 1, gear: bars, cue: 'Zieh die Knie an und halte die Tuck-Position während des kontrollierten Absenkens und Hochdrückens.', nextVariant: 'Öffne die Tuck-Position ein kleines Stück bei gleicher Kontrolle.' }),
        hold('lean', 'Planche Leans', '10–20 Sek.', { set: 2, gear: bars, cue: 'Schultern nach vorn, Ellbogen gestreckt, Schulterblätter aktiv nach außen schieben.', nextVariant: 'Verlagere die Schultern etwas weiter nach vorn.' })
      ]),
      group('high', 'Klimmzüge', 'Mitteleng explosiv, dann breit', [
        exercise('high-narrow', 'High Pull-ups', '2–3 Wdh.', { set: 1, gear: 'Mitteleng', cue: 'Aus stabilem Hang maximal schnell hochziehen. Stoppe bei sinkender Zughöhe.', nextVariant: 'Peile eine etwas höhere Zughöhe bei gleicher Explosivität an.' }),
        exercise('pull-wide-skill', 'Breite Klimmzüge', '4–8 Wdh.', { set: 2, gear: 'Breiter Obergriff', cue: 'Wähle eine breite, angenehme Griffweite und zieh kontrolliert.', nextVariant: 'Halte die obere Position kurz und senk dich kontrolliert ab.' })
      ]),
      cooldown('skill-cool')
    ]
  };

  const legGroups = [
    warmup('leg-warm'),
    group('legs-a', 'Block A', '3 Durchgänge · Pistol Squats und L-Sit',
      [1, 2, 3].flatMap(set => [
        exercise('pistol-' + set, 'Pistol Squats', '4–6 Wdh. je Bein', { set, kg: 0, progression: 'pistol', cue: 'Beide Seiten trainieren. Halte dich bei Bedarf leicht fest. Protokolliere die Wiederholungen der schwächeren Seite.' }),
        hold('lsit-' + set, 'L-Sit', 'Ziel 20 Sek.', { set, holdGoal: 20, gear: bars, cue: 'Halt sauber so lange du kannst und trag die tatsächliche Zeit ein. Wenn 20 Sekunden stabil sind, kannst du das Ziel etwa auf 25 oder 30 Sekunden setzen.' })
      ])),
    group('legs-b', 'Block B', '2 Durchgänge · Kreuz-Kniebeugen und Planke',
      [1, 2].flatMap(set => [
        exercise('curtsy-' + set, 'Kreuz-Kniebeugen', '6–10 Wdh. je Bein', { set, kg: 20, progression: 'curtsy', gear: vest, cue: 'Setz ein Bein schräg nach hinten und geh kontrolliert runter. Wähle eine kürzere Kreuzung oder einen geraden Rückwärtsschritt, wenn das Standbein instabil wird.' }),
        hold('plank-' + set, 'Unterarmstütz', 'Ziel 2:30 Min.', { set, cue: 'Ellbogen direkt unter die Schultern, Unterarme nach vorn. Spann Bauch und Gesäß an, halte Kopf, Rumpf und Beine in einer Linie und atme ruhig. Beende den Satz, wenn die Hüfte absinkt.' })
      ])),
    group('bike', 'Fahrrad', 'Zwift · Oh Hill No', [
      step('grade-time', 'The Grade · Zeitfahrt', '1 Anstieg · Segmentzeit am Gipfel', 'Trag am Gipfel die The-Grade-Segmentzeit aus Zwift ein.', {
        unit: 'Zeit', rideMode: 'time', reference: 1125.1
      }),
      step('hill-pulse', 'Oh Hill No · Pulsfahrt', '2 Runden · Zielpuls 132 bpm', 'Orientiere dich an 130–135 bpm. Fahr locker genug, dass du noch in ganzen Sätzen sprechen kannst.', {
        unit: 'bpm', extraUnit: 'Min.', rideMode: 'pulse'
      })
    ]),
    group('stretch', 'Ganzkörper-Dehnung', 'Nach dem Radfahren · 8–12 Min.', [
      step('stretch-legs', 'Ganzkörper dehnen', 'Je 20–40 Sek.', 'Dehne Waden, vordere und hintere Oberschenkel, Hüftbeuger, Gesäß, Brust, Schultern und seitlichen Rücken. Gehe bis zu einem leichten Zug und atme ruhig.')
    ])
  ];

  const legs = {
    id: 'beine', name: 'Beine, Bauch & Rad', short: 'Beine & Rad', icon: 'bike',
    subtitle: 'Zwei Beine-Bauch-Blöcke, Zwift im Wechsel und Ganzkörper-Dehnung.',
    time: '45–55 Min. + Rad', focus: 'Unterkörper & Rumpf',
    rule: 'Erst Pistol Squats und Kreuz-Kniebeugen plus Bauchübungen, dann Rad. Bei Zwift wechseln sich The Grade auf Zeit und zwei Oh-Hill-No-Runden nach Puls ab.',
    groups: legGroups
  };

  window.winterPlan = {
    days: [strength, skills, legs]
  };
})();
