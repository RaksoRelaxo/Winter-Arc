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
  const strength = {
    id: 'kraft', name: 'Kraftzirkel', short: 'Kraft', icon: 'dumbbell',
    subtitle: 'Schwere Züge und Dips, danach kontrollierte Wiederholungen.',
    time: '45–55 Min. inkl. Pausen', focus: 'Oberkörper',
    rule: 'Ziel sind 2–3 saubere Wiederholungen in Reserve. Nach jedem abgehakten Satz startet eine Zwei-Minuten-Pause. Locker dich am Ende kurz aus.',
    groups: [
      warmup('kraft-warm'),
      group('kraft-1', 'Runde 1', 'Schwer', [
        exercise('pull-20', 'Klimmzüge', '3–5 Wdh.', { kg: 20, gear: vest, cue: 'Aus kontrolliertem Hang ziehen. Wähle für den ersten Arbeitssatz eine Last, bei der etwa zwei saubere Wiederholungen übrig bleiben.' }),
        exercise('dip-30', 'Dips', '3–6 Wdh.', { kg: 30, gear: 'Weste + Gürtel', cue: 'Geh kontrolliert so tief, wie die Schulter stabil bleibt.' }),
        exercise('toes-bar', 'Toes-to-Bar', '5–8 Wdh.', { gear: 'An der Stange', cue: 'Heb die Beine möglichst gestreckt Richtung Stange. Kontrolliere die Abwärtsbewegung und vermeide Schwung.' }),
        exercise('push-vest', 'Liegestütze', '5–8 Wdh.', { kg: null, gear: 'Parallettes + Weste', cue: 'Das Gewicht der Weste ist frei. Wähle es so, dass du die Spannung hältst und zwei saubere Wiederholungen übrig hast.' })
      ]),
      group('kraft-2', 'Runde 2', 'Mittlere Last', [
        exercise('pull-10', 'Klimmzüge', '4–6 Wdh.', { kg: 10, gear: belt }),
        exercise('dip-20', 'Dips', '5–8 Wdh.', { kg: 20, gear: vest }),
        exercise('knee-hang', 'Knieheben im Hang', '8–12 Wdh.', { gear: 'Knie angewinkelt', cue: 'Zieh die Knie an und roll das Becken am oberen Ende leicht ein.' }),
        exercise('push-10', 'Liegestütze', '6–10 Wdh.', { kg: 10, gear: 'Parallettes + Scheibe', cue: 'Verwende die Scheibe mit sicherer Auflage und Hilfe beim Auflegen. Trainierst du allein, ist eine fest sitzende Weste die praktische Alternative.' })
      ]),
      group('kraft-3', 'Runde 3', 'Leichtere Zug- und Diplast', [
        exercise('pull-bw', 'Klimmzüge', '5–8 Wdh.', { kg: 0, gear: bodyweight }),
        exercise('dip-10', 'Dips', '6–10 Wdh.', { kg: 10, gear: belt }),
        exercise('v-up', 'V-Ups', '8–12 Wdh.', { gear: 'Am Boden', cue: 'Heb aus der Rückenlage Oberkörper und möglichst gestreckte Beine gleichzeitig. Führ die Hände zu den Füßen und senk dich kontrolliert ab.' }),
        exercise('pseudo-r3', 'Pseudo Planche Push-ups', '4–8 Wdh.', { kg: 0, gear: bars, cue: 'Lehn dich nur so weit vor, wie du am Ende des Zirkels noch kontrolliert drücken kannst.' })
      ]),
      group('kraft-4', 'Runde 4', 'Körpergewicht', [
        exercise('chin-bw', 'Chin-ups', '5–8 Wdh.', { kg: 0, gear: 'Untergriff' }),
        exercise('dip-bw', 'Dips', '6–10 Wdh.', { kg: 0, gear: bodyweight }),
        exercise('reverse-crunch', 'Reverse Crunches mit gestreckten Beinen', '6–10 Wdh.', { gear: 'Matte · fester Griff hinter dem Kopf', cue: 'Greif in Rückenlage an einen fest montierten Rackpfosten oder einen ähnlich stabilen Griff. Heb die gestreckten Beine Richtung Decke und roll das Becken oben kurz ein. Senk zuerst das Becken und dann die Beine langsam ab, so weit du den unteren Rücken stabil hältst. Schultern und Kopf bleiben auf der Matte.' }),
        exercise('push-bw', 'Liegestütze', '8–12 Wdh.', { kg: 0, gear: bars, cue: 'Lass etwa 3 Wiederholungen in Reserve, damit du am nächsten Tag sauber Skills üben kannst.' })
      ]),
      cooldown('kraft-cool')
    ]
  };

  const hold = (id, name, target, options) => exercise(id, name, target, { unit: 'Sek.', ...options });

  function skillDay() {
    return {
      id: 'skills', name: 'Skilltraining', short: 'Skills', icon: 'target',
      subtitle: 'Freie Skillversuche und feste Zusatzsätze.',
      time: 'Ca. 30–40 Min. + freie Skills', focus: 'Skills & Kraft',
      rule: 'Wähle Reihenfolge, Varianten und Anzahl deiner Skillversuche frei. Halte bei Bedarf deine besten Werte oder eine Notiz fest. Bei den Zusatzsätzen bleiben etwa 3 Wiederholungen in Reserve.',
      groups: [
        warmup('skill-warm'),
        group('free-skills', 'Freie Skillversuche', 'Wähle nach Tagesform', [
          hold('hs-1', 'Handstand', 'Beste Haltezeit', { counts: false, bestHold: true }),
          hold('planche-1', 'Planche', 'Beste Haltezeit', { counts: false, bestHold: true }),
          hold('lever-1', 'Front Lever', 'Beste Haltezeit', { counts: false, bestHold: true }),
          exercise('press-1', 'Press to Handstand', 'Gelungene Versuche', { unit: 'Versuche', counts: false }),
          exercise('hspu-1', 'Handstand Push-ups', 'Saubere Wiederholungen', { counts: false }),
          hold('one-arm-bars', 'Einarmiger Handstand', 'Beste Haltezeit', { counts: false, bestHold: true, gear: 'Parallettes' }),
          hold('one-arm-floor', 'Einarmiger Handstand', 'Beste Haltezeit', { counts: false, bestHold: true, gear: 'Am Boden' })
        ]),
        group('high', 'High Pull-ups', '2 explosive Sätze', [
          exercise('high-narrow', 'High Pull-ups', '2–3 Wdh.', { set: 1, gear: 'Mitteleng', cue: 'Aus stabilem Hang maximal schnell hochziehen. Stoppe bei sinkender Zughöhe.' }),
          exercise('high-wide', 'High Pull-ups', '2–3 Wdh.', { set: 2, gear: 'Breit', cue: 'Wähle eine breite, für die Schultern angenehme Griffweite. Auch hier zählt die Höhe jeder Wiederholung.' })
        ]),
        group('pike', 'Pike Push-ups', 'Erhöht, dann am Boden', [
          exercise('pike-high', 'Pike Push-ups', '4–8 Wdh.', { set: 1, gear: 'Füße erhöht' }),
          exercise('pike-floor', 'Pike Push-ups', '6–10 Wdh.', { set: 2, gear: 'Am Boden' })
        ]),
        group('rows', 'Front Lever Rows', 'Mit Weste, dann ohne', [
          exercise('rows-20', 'Front Lever Rows', '4–6 Wdh.', { set: 1, kg: 20, gear: vest, cue: '20 kg sind dein Zielwert. Nimm bei Bedarf eine leichtere Progression oder weniger Zusatzgewicht für 4–6 kontrollierte Züge.' }),
          exercise('rows-bw', 'Front Lever Rows', '5–8 Wdh.', { set: 2, kg: 0, gear: bodyweight })
        ]),
        group('planche-assist', 'Planche-Zusatzsätze', 'Lean, dann Push-ups', [
          hold('lean', 'Planche Leans', '10–20 Sek.', { set: 1, cue: 'Schultern nach vorn, Ellbogen gestreckt, Schulterblätter aktiv nach außen schieben.' }),
          exercise('pseudo-skill', 'Pseudo Planche Push-ups', '4–8 Wdh.', { set: 2, gear: bars, cue: 'Halte die Vorneigung bei jeder Wiederholung gleich.' })
        ]),
        cooldown('skill-cool')
      ]
    };
  }

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
      step('all-hill', 'Oh Hill No', '1 Runde · 7,9 km · 306 hm', 'Fahr eine Runde in deinem Tempo und roll zum Schluss locker aus.', {
        unit: 'Runden', extraUnit: 'Min.', plannedValue: 1
      })
    ]),
    group('stretch', 'Ganzkörper-Dehnung', 'Nach dem Radfahren · 8–12 Min.', [
      step('stretch-legs', 'Ganzkörper dehnen', 'Je 20–40 Sek.', 'Dehne Waden, vordere und hintere Oberschenkel, Hüftbeuger, Gesäß, Brust, Schultern und seitlichen Rücken. Gehe bis zu einem leichten Zug und atme ruhig.')
    ])
  ];

  const legs = {
    id: 'beine', name: 'Beine, Bauch & Rad', short: 'Beine & Rad', icon: 'bike',
    subtitle: 'Zwei Beine-Bauch-Blöcke, eine Runde Oh Hill No und Ganzkörper-Dehnung.',
    time: '45–55 Min. + Rad', focus: 'Unterkörper & Rumpf',
    rule: 'Erst Pistol Squats und Kreuz-Kniebeugen plus Bauchübungen, dann Rad. Halte die Runde bei müden Beinen im lockeren bis moderaten Bereich. Der Zeitrahmen enthält Aufwärmen, Satzpausen und die Ganzkörper-Dehnung.',
    groups: legGroups
  };

  window.winterPlan = {
    days: [strength, skillDay(), legs]
  };
})();
