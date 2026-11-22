'use strict';

(() => {
  const { days } = window.winterPlan;
  const app = document.getElementById('app');
  const navigation = document.getElementById('navigation');
  const dock = document.getElementById('active-timer');
  const notice = document.getElementById('notice');
  const storageKey = 'winter-arc:1:' + new URL('.', location.href).pathname;
  const longDate = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'long' });
  const shortDate = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const views = [['training', 'Training', 'dumbbell'], ['plan', 'Zyklus', 'cycle'], ['history', 'Verlauf', 'chart']];
  const icons = {
    dumbbell: '<path d="M6 8h2v8H6zm10 0h2v8h-2zM4 10h2v4H4zm14 0h2v4h-2zM8 12h8"/>',
    cycle: '<path d="M20 7v4h-4M4 17v-4h4M5.2 8a8 8 0 0 1 13-1L20 11M4 13l1.8 4a8 8 0 0 0 13-1"/>',
    chart: '<path d="M4 4v16h16M8 16v-4m5 4V9m5 7V6"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    bike: '<circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M5 17l4-8 4 8H5m8 0 4-8m2 8-3-11h3M8 9h3"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    play: '<path d="m9 5 11 7-11 7z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5m0-8v.1"/>',
    pause: '<path d="M9 5v14m6-14v14"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    download: '<path d="M12 4v11m-4-4 4 4 4-4M5 17v3h14v-3"/>'
  };

  function icon(name, className = '') {
    return '<svg class="icon ' + className + '" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>';
  }

  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function readState(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.logs)) {
        return {
          logs: parsed.logs,
          draft: parsed.draft ?? null,
          timer: parsed.timer ?? null,
          loads: parsed.loads ?? {},
          lsitGoal: parsed.lsitGoal ?? 20
        };
      }
    } catch {
      // A missing or unreadable record starts a fresh local plan.
    }
    return { logs: [], draft: null, timer: null, loads: {}, lsitGoal: 20 };
  }

  let state = readState(null);
  let storageAvailable = true;
  try {
    state = readState(localStorage.getItem(storageKey));
  } catch {
    storageAvailable = false;
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      storageAvailable = true;
    } catch {
      if (storageAvailable) announce('Der Browser kann gerade nicht dauerhaft speichern.');
      storageAvailable = false;
    }
  }

  function latestWorkout() {
    return state.logs.find(entry => entry.kind === 'workout');
  }

  function nextDay() {
    return ((latestWorkout()?.day ?? -1) + 1) % days.length;
  }

  let selectedDay = state.draft?.day ?? nextDay();
  let view = 'training';
  let noticeTimeout;
  let audio;
  const openBlocks = new Map();

  function announce(message) {
    clearTimeout(noticeTimeout);
    notice.textContent = message;
    notice.hidden = false;
    noticeTimeout = setTimeout(() => { notice.hidden = true; }, 4200);
  }

  function button(label, attributes, classes = '', glyph = '') {
    return '<button type="button" class="button ' + classes + '" ' + attributes + '>' +
      (glyph ? icon(glyph) : '') + label + '</button>';
  }

  function showView(nextView, day = nextDay()) {
    view = nextView;
    if (nextView === 'training') selectedDay = day;
    render();
    app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function render() {
    document.body.dataset.view = view;
    navigation.innerHTML = views.map(([key, label, glyph]) => (
      '<button type="button" data-view="' + key + '"' + (view === key ? ' aria-current="page"' : '') +
      '>' + icon(glyph) + '<span>' + label + '</span></button>'
    )).join('');
    const today = document.getElementById('date');
    today.textContent = longDate.format(new Date());
    today.dateTime = localDate(new Date());
    if (view === 'training') renderTraining();
    if (view === 'plan') renderPlan();
    if (view === 'history') renderHistory();
    renderTimer();
  }

  function localDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + month + '-' + day;
  }

  function activeDraft() {
    return state.draft?.day === selectedDay ? state.draft : null;
  }

  function dayTiles() {
    return '<div class="days">' + days.map((day, index) => (
      '<button type="button" class="day" data-day="' + index + '" aria-pressed="' + (index === selectedDay) +
      '" aria-label="Tag ' + (index + 1) + ', ' + day.name + (index === nextDay() ? ', als Nächstes' : '') +
      '"><span class="day-icon">' + icon(day.icon) + '</span><span class="day-label"><small>Tag ' + (index + 1) +
      '</small><strong>' + day.short + '</strong></span>' + (index === nextDay() ? '<span class="dot" aria-hidden="true"></span>' : '') + '</button>'
    )).join('') + '</div>';
  }

  function renderTraining() {
    const plan = days[selectedDay];
    const draft = activeDraft();
    const preview = selectedDay !== nextDay();
    const action = preview
      ? button('Zur nächsten Einheit', 'data-action="today"', 'primary')
      : button(draft ? 'Training fortsetzen' : 'Einheit starten', 'data-action="start"', 'primary', 'play');
    const status = preview ? 'Vorschau' : draft ? 'Einheit läuft' : 'Als Nächstes';
    const info = (draft ? '<div data-progress></div>' : '') +
      '<section class="card"><h3 class="card-title">' + icon('info') + 'Trainingshinweis</h3><p>' + plan.rule + '</p></section>';
    app.innerHTML = '<section class="hero" aria-labelledby="day-title"><div class="hero-content">' +
      '<p class="eyebrow">Tag ' + (selectedDay + 1) + ' von 3 · ' + status + '</p>' +
      '<h1 id="day-title">' + plan.name + '</h1><p class="hero-copy">' + plan.subtitle + '</p>' +
      '<div class="hero-actions">' + action + '<span class="hero-facts">' + icon('clock') + plan.time + '</span></div>' +
      '</div></section><section aria-labelledby="rhythm-title"><div class="section-bar"><h2 id="rhythm-title">Dein Trainingszyklus</h2>' +
      '<p>Als Nächstes · ' + days[nextDay()].name + '</p></div>' + dayTiles() + '</section>' +
      '<div class="section-bar" id="workout"><h2>' + (preview ? 'Einheit im Überblick' : 'Ablauf der Einheit') + '</h2>' +
      '<p>' + plan.focus + '</p></div><div class="layout"><div><div class="blocks">' +
      plan.groups.map((block, index) => renderBlock(block, index, draft)).join('') +
      '</div>' + (draft ? finishPanel(draft) : '') + '</div><aside class="sidebar" aria-label="Trainingswerkzeuge">' +
      '<section class="card"><h3 class="card-title">' + icon('clock') + 'Pausentimer</h3><div id="timer-panel"></div></section>' +
      info + '</aside></div>';
    updateProgress();
  }

  function renderBlock(block, index, draft) {
    const blockKey = selectedDay + '-' + block.id;
    const isOpen = openBlocks.get(blockKey) ?? index === 1;
    const tag = block.optional ? '<span class="pill">Optional</span>' : '';
    return '<details class="block" data-block="' + blockKey + '"' + (isOpen ? ' open' : '') + '>' +
      '<summary><span class="block-heading"><strong>' + block.name + '</strong><small>' + block.summary +
      '</small></span>' + tag + '<span class="block-count" data-block-count="' + block.id + '"></span>' +
      icon('chevron', 'chev') + '</summary>' + block.rows.map(row => renderRow(row, draft)).join('') + '</details>';
  }

  function previous(row) {
    for (const log of state.logs) {
      if (log.kind !== 'workout' || log.day !== selectedDay) continue;
      const past = log.rows.find(item => item.id === row.id);
      if (past) return recordSummary(past);
    }
    return '';
  }

  function kgLabel(number) {
    return Number(number).toLocaleString('de-DE') + ' kg';
  }

  function renderRow(row, draft) {
    const entry = draft?.rows[row.id];
    const completed = entry?.done ?? false;
    const tag = row.set ? '<span class="set">Satz ' + row.set + '</span><span aria-hidden="true">·</span>' : '';
    const gear = row.gear ? '<span>' + row.gear + '</span>' : '';
    const plannedLoad = defaultLoad(row);
    const weight = plannedLoad > 0 ? '<span class="kg">+' + kgLabel(plannedLoad) + '</span>' : '';
    const target = row.holdGoal
      ? '<b data-lsit-target>Ziel ' + state.lsitGoal + ' Sek.</b>'
      : '<b>' + row.target + '</b>';
    const rest = row.rest ? button('<span class="clock-caption">' + row.restRange + '</span>',
      'data-action="rest" data-row="' + row.id + '" aria-label="Pause nach ' + escape(row.name) + ' · ' + row.restRange + '"',
      'small transparent', 'clock') : '';
    const check = draft ? '<label class="complete-checkbox"><input type="checkbox" data-complete="' + row.id +
      '" aria-label="' + escape(row.name + (row.set ? ', Satz ' + row.set : '')) + ' abhaken"' +
      (completed ? ' checked' : '') + '>' + icon('check') + '</label>' : '';
    const past = draft ? previous(row) : '';
    return '<article class="exercise' + (completed ? ' is-done' : '') + '" data-exercise="' + row.id + '">' +
      '<div><div class="exercise-title">' + row.name + '</div><div class="exercise-meta">' + tag +
      target + gear + weight + '</div></div>' +
      '<div class="exercise-actions">' + rest + check + '</div>' +
      (row.cue ? '<p class="note">' + row.cue + '</p>' : '') +
      (past ? '<p class="note last">Zuletzt · ' + escape(past) + '</p>' : '') +
      (draft ? fieldsFor(row, entry) : '') + '</article>';
  }

  function numberField(row, entry, key, label, preset = '') {
    const step = key === 'kg' ? 'any' : '1';
    return '<label class="field"><span>' + label + '</span><input type="number" inputmode="' +
      (step === 'any' ? 'decimal' : 'numeric') + '" min="0" step="' + step +
      '" aria-label="' + escape(row.name) + (row.set ? ', Satz ' + row.set : '') + ' · ' + label +
      '" data-field="' + key + '" value="' + escape(entry?.[key] ?? preset) + '" placeholder="–"></label>';
  }

  function fieldsFor(row, entry) {
    if (!row.unit) return '';
    const count = numberField(row, entry, 'value', row.unit, row.plannedValue ?? '');
    const extra = row.extraUnit ? numberField(row, entry, 'extra', row.extraUnit) : '';
    const weight = row.kg !== undefined ? numberField(row, entry, 'kg', 'Zusatz kg', defaultLoad(row)) : '';
    const measure = row.unit === 'Sek.' ? button('Hold messen', 'data-action="hold" data-row="' + row.id + '"', 'small transparent', 'clock') : '';
    const reserve = canProgress(row) ? numberField(row, entry, 'reserve', 'Wdh. übrig') : '';
    const lsitGoal = row.holdGoal && row.set === 1
      ? '<label class="field"><span>L-Sit-Ziel (Sek.)</span><input type="number" inputmode="numeric" min="1" step="1" data-lsit-goal value="' +
        state.lsitGoal + '"></label>' : '';
    const suggestion = suggestedLoad(row);
    const upgrade = suggestion === null ? '' : button('+' + kgLabel(suggestion) + ' testen',
      'data-action="progress-load" data-row="' + row.id + '"', 'small');
    return '<div class="fields">' + count + extra + weight + reserve + lsitGoal + measure + upgrade + '</div>';
  }

  function finishPanel(draft) {
    return '<section class="card finish-panel" aria-label="Einheit abschließen">' +
      '<label for="workout-note">Notiz zur Einheit<textarea id="workout-note" maxlength="1200" placeholder="Zum Beispiel Front-Lever-Progression">' +
      escape(draft.note ?? '') + '</textarea></label>' +
      button('Einheit abschließen', 'data-action="finish" id="finish-workout"', 'primary', 'check') +
      '<p id="finish-hint">Hake mindestens eine Übung ab.</p></section>';
  }

  function allRows(plan) {
    return plan.groups.flatMap(group => group.rows);
  }

  function loadKey(row) {
    return row.progression ?? row.id;
  }

  function defaultLoad(row) {
    return state.loads[loadKey(row)] ?? row.kg ?? '';
  }

  function canProgress(row) {
    return row.unit === 'Wdh.' && (row.progression || row.kg > 0 || row.kg === null);
  }

  function progressionRows(row) {
    return allRows(days[selectedDay]).filter(item => loadKey(item) === loadKey(row));
  }

  function suggestedLoad(row) {
    if (!canProgress(row) || !activeDraft()) return null;
    const rows = progressionRows(row);
    if (rows[0].id !== row.id || rows.some(item => {
      const current = activeDraft().rows[item.id];
      return current?.done || current?.value || current?.reserve;
    })) return null;
    const sessions = state.logs.filter(log => log.kind === 'workout' && log.day === selectedDay).slice(0, 2);
    if (sessions.length < 2) return null;
    const lastLoad = sessions[0].rows.find(item => item.id === row.id)?.kg;
    if (lastLoad == null || lastLoad === '') return null;
    const currentLoad = defaultLoad(row);
    if (currentLoad !== '' && Number(currentLoad) > Number(lastLoad)) return null;
    const meetsTarget = sessions.every(log => rows.every(item => {
      const result = log.rows.find(record => record.id === item.id);
      const target = Number(item.target.match(/–(\d+)/)?.[1]);
      return result?.done && result.kg !== '' && Number(result.kg) === Number(lastLoad) &&
        Number(result.value) >= target && Number(result.reserve) >= 2;
    }));
    return meetsTarget ? Number(lastLoad) + 5 : null;
  }

  function acceptLoad(row) {
    const load = suggestedLoad(row);
    if (load === null) return;
    state.loads[loadKey(row)] = load;
    for (const item of progressionRows(row)) {
      const records = activeDraft().rows;
      records[item.id] = { ...records[item.id], kg: String(load), value: '', reserve: '' };
    }
    save();
    render();
    announce(row.name + ' mit +' + kgLabel(load) + ' eingetragen.');
  }

  function findRow(id) {
    return allRows(days[selectedDay]).find(row => row.id === id);
  }

  function updateProgress() {
    const draft = activeDraft();
    if (!draft) return;
    const plan = days[selectedDay];
    const rows = plan.groups.filter(group => !group.optional).flatMap(group => group.rows).filter(row => row.counts);
    const done = rows.filter(row => draft.rows[row.id]?.done).length;
    const goal = document.querySelector('[data-progress]');
    if (goal) goal.innerHTML = '<section class="card"><h3>Fortschritt</h3><p>' + done + ' von ' + rows.length +
      ' vorgesehenen Sätzen</p><div class="progress-bar" role="progressbar" aria-label="Satzfortschritt" aria-valuenow="' + done +
      '" aria-valuemin="0" aria-valuemax="' + rows.length + '"><span style="width:' + (100 * done / rows.length) +
      '%"></span></div></section>';
    for (const group of plan.groups) {
      const label = document.querySelector('[data-block-count="' + group.id + '"]');
      const checked = group.rows.filter(row => draft.rows[row.id]?.done).length;
      label.innerHTML = checked ? '<span class="pill accent">' + checked + '/' + group.rows.length + '</span>' : '';
    }
    const canFinish = Object.values(draft.rows).some(row => row.done);
    document.getElementById('finish-workout').disabled = !canFinish;
    document.getElementById('finish-hint').hidden = canFinish;
  }

  function startWorkout() {
    if (selectedDay !== nextDay()) return;
    if (!state.draft) {
      state.draft = { day: selectedDay, rows: {}, note: '' };
      openBlocks.set(selectedDay + '-' + days[selectedDay].groups[0].id, true);
      save();
      render();
    }
    document.getElementById('workout').scrollIntoView({ block: 'start' });
  }

  function secondsText(milliseconds) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }

  function unlockSound() {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!audio && Context) audio = new Context();
      if (audio?.state === 'suspended') audio.resume().catch(() => {});
    } catch {
      // The timer also signals completion on screen.
    }
  }

  function chime() {
    if (audio?.state !== 'running') return;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.frequency.value = 690;
    volume.gain.value = .1;
    volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .35);
    tone.connect(volume).connect(audio.destination);
    tone.start();
    tone.stop(audio.currentTime + .36);
  }

  function timerTime(timer, now = Date.now()) {
    const delta = timer.status === 'running' ? Math.max(0, now - timer.from) : 0;
    return timer.kind === 'rest' ? Math.max(0, timer.amount - delta) : timer.amount + delta;
  }

  function startTimer(kind, amount, label, rowId = null, day = selectedDay) {
    unlockSound();
    state.timer = {
      kind, amount, label, rowId,
      day, from: Date.now(), status: 'running'
    };
    save();
    renderTimer();
    announce(kind === 'hold' ? 'Zeitmessung läuft.' : 'Pausentimer läuft.');
  }

  function stopTimer() {
    state.timer = null;
    save();
    renderTimer();
  }

  function toggleTimer() {
    const timer = state.timer;
    if (!timer || timer.status === 'finished') return;
    unlockSound();
    timer.amount = timerTime(timer);
    timer.from = Date.now();
    timer.status = timer.status === 'running' ? 'paused' : 'running';
    save();
    renderTimer();
  }

  function extendTimer() {
    const timer = state.timer;
    if (timer?.kind !== 'rest' || timer.status === 'finished') return;
    timer.amount = timerTime(timer) + 30000;
    timer.from = Date.now();
    save();
    tick();
  }

  function saveHold() {
    const timer = state.timer;
    if (timer?.kind !== 'hold') return;
    const seconds = Math.floor(timerTime(timer) / 1000);
    if (state.draft?.day !== timer.day) {
      stopTimer();
      return;
    }
    const row = allRows(days[timer.day]).find(item => item.id === timer.rowId);
    if (!row) {
      stopTimer();
      return;
    }
    const entry = state.draft.rows[row.id] ?? {};
    entry.value = String(row.bestHold ? Math.max(seconds, Number(entry.value) || 0) : seconds);
    entry.done = true;
    state.draft.rows[row.id] = entry;
    if (activeDraft()?.day === timer.day && view === 'training') {
      const exercise = document.querySelector('[data-exercise="' + row.id + '"]');
      exercise.querySelector('[data-field="value"]').value = entry.value;
      exercise.querySelector('[data-complete]').checked = true;
      exercise.classList.add('is-done');
      updateProgress();
    }
    startTimer('rest', row.rest * 1000, 'Pause · ' + row.name, row.id, timer.day);
  }

  function timerAction(label, action, glyph, compact, more = '') {
    return button(compact && glyph ? '<span class="sr-only">' + label + '</span>' : label,
      'data-action="' + action + '" ' + more, 'small', glyph);
  }

  function timerDisplay(compact) {
    const timer = state.timer;
    const readout = '<div class="clock-line"><div class="timer-readout" data-clock role="timer">00:00</div>' +
      '<div class="timer-label" data-clock-label>' + (timer ? escape(timer.label) : 'Pausenlänge auswählen') + '</div></div>';
    if (!timer) {
      return readout + '<div class="timer-buttons">' + [60, 120, 180].map(duration => (
        button(secondsText(duration * 1000), 'data-action="preset" data-time="' + duration + '"', 'small')
      )).join('') + '</div>';
    }
    if (timer.status === 'finished') {
      return readout + '<div class="timer-buttons">' + timerAction('Schließen', 'stop-timer', '', compact) + '</div>';
    }
    const paused = timer.status === 'paused';
    const controls = [
      timerAction(paused ? 'Weiter' : 'Anhalten', 'toggle-timer', paused ? 'play' : 'pause', compact)
    ];
    if (timer.kind === 'rest') {
      controls.push(timerAction('+30 s', 'extend-timer', '', compact));
      controls.push(timerAction('Beenden', 'stop-timer', 'stop', compact));
    } else {
      controls.push(timerAction('Zeit speichern', 'save-hold', 'check', compact));
      controls.push(timerAction('Verwerfen', 'stop-timer', 'stop', compact));
    }
    return readout + '<div class="timer-buttons">' + controls.join('') + '</div>';
  }

  function renderTimer() {
    const panel = document.getElementById('timer-panel');
    if (panel) panel.innerHTML = timerDisplay(false);
    dock.hidden = !state.timer;
    dock.innerHTML = state.timer ? timerDisplay(true) : '';
    tick();
  }

  function tick() {
    const timer = state.timer;
    if (!timer) return;
    const time = timerTime(timer);
    if (timer.kind === 'rest' && timer.status === 'running' && time === 0) {
      timer.amount = 0;
      timer.status = 'finished';
      save();
      chime();
      announce('Pause beendet.');
      renderTimer();
      return;
    }
    const display = secondsText(timer.kind === 'rest' ? Math.ceil(time / 1000) * 1000 : time);
    const label = timer.status === 'finished' ? 'Pause beendet' : timer.label + (timer.status === 'paused' ? ' · angehalten' : '');
    document.querySelectorAll('[data-clock]').forEach(element => {
      if (element.textContent !== display) element.textContent = display;
    });
    document.querySelectorAll('[data-clock-label]').forEach(element => {
      if (element.textContent !== label) element.textContent = label;
    });
  }

  function finishWorkout() {
    const draft = activeDraft();
    if (!draft || !Object.values(draft.rows).some(row => row.done)) return;
    const plan = days[draft.day];
    const rows = plan.groups.flatMap(group => group.rows.flatMap(row => {
      const record = draft.rows[row.id];
      if (!record || !(record.done || record.value || record.extra || record.kg)) return [];
      return [{
        id: row.id, title: row.name, group: group.name, counts: row.counts, set: row.set ?? '',
        done: record.done ?? false, value: record.value ?? (record.done ? row.plannedValue ?? '' : ''),
        unit: row.unit, kg: record.kg ?? defaultLoad(row), reserve: record.reserve ?? '', extra: record.extra ?? '', extraUnit: row.extraUnit ?? ''
      }];
    }));
    for (const row of allRows(plan).filter(canProgress)) {
      const group = progressionRows(row);
      if (group[0].id !== row.id) continue;
      const completed = group.map(item => rows.find(result => result.id === item.id));
      const load = completed[0]?.kg;
      if (load != null && load !== '' && completed.every(item => item?.done && item.kg !== '' && Number(item.kg) === Number(load))) {
        state.loads[loadKey(row)] = Number(load);
      }
    }
    state.logs.unshift({
      kind: 'workout', day: draft.day, title: plan.name, focus: '',
      when: new Date().toISOString(), rows, note: draft.note.trim()
    });
    state.draft = null;
    state.timer = null;
    save();
    showView('history');
    announce('Einheit gespeichert. Als Nächstes · ' + days[nextDay()].name + '.');
  }

  function todayRestIndex() {
    return state.logs.findIndex(entry => entry.kind === 'rest' && localDate(new Date(entry.when)) === localDate(new Date()));
  }

  function logRestDay() {
    const index = todayRestIndex();
    if (index < 0) {
      state.logs.unshift({ kind: 'rest', title: 'Pausentag', when: new Date().toISOString(), rows: [] });
      announce('Pausentag eingetragen.');
    } else {
      state.logs.splice(index, 1);
      announce('Pausentag zurückgenommen.');
    }
    save();
    render();
  }

  function renderPlan() {
    const descriptions = [
      'Vier feste Runden mit absteigender Zusatzlast und zwei Minuten Pause nach jedem Satz.',
      'Freie Skillversuche nach Tagesform. Danach explosive Züge und feste Zusatzsätze.',
      'Pistol Squats und L-Sit, dann Kreuz-Kniebeugen und Planke. Anschließend eine Runde Oh Hill No und Ganzkörper-Dehnung.'
    ];
    const plans = days.map((day, index) => '<section class="card"><span class="day-icon">' + icon(day.icon) +
      '</span><h3>Tag ' + (index + 1) + ' · ' + day.name + '</h3><p>' + descriptions[index] + '</p>' +
      button('Einheit ansehen', 'data-open-day="' + index + '"', 'small') + '</section>').join('');
    const restAction = todayRestIndex() < 0 ? 'Pausentag eintragen' : 'Pausentag zurücknehmen';
    app.innerHTML = '<div class="page-title"><h1>Dein Drei-Tage-Zyklus</h1><p>Der nächste Tag wechselt, sobald du eine Einheit abschließt. Der Zyklus beginnt danach wieder mit dem Kraftzirkel.</p></div>' +
      '<div class="plan-grid">' + plans + '</div><div class="info-grid">' +
      '<section class="card"><h3>Fortschritt bei Kraft und Skills</h3><p>Trage bei Gewichtsübungen deine sauberen Wiederholungen und die Wiederholungen in Reserve ein. Wenn die letzten beiden vergleichbaren Einheiten am oberen Ende der Zielspanne lagen und mindestens zwei Wiederholungen übrig waren, schlägt die App +5 kg zur Bestätigung vor. Beim L-Sit kannst du dein Zeitziel direkt anpassen.</p></section>' +
      '<section class="card"><h3>Erholung einplanen</h3><p>Der Krafttag belastet dieselben Muskeln wie viele Skills am Folgetag. Wähle dann leichtere Technikvarianten und kürze Zusatzsätze, wenn die Form nachlässt. Falls du einen Pausentag brauchst, bleibt die nächste Einheit im Zyklus stehen.</p>' +
      '<div class="history-actions">' + button(restAction, 'data-action="rest-day"', 'small') + '</div></section>' +
      '</div><details class="card sources"><summary>Quellen zu Kraft, Pausen, Rad und Dehnen</summary><ul>' +
      '<li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/" target="_blank" rel="noopener">ACSM 2026 · Krafttraining, Hypertrophie und Schnellkraft</a></li>' +
      '<li><a href="https://pubmed.ncbi.nlm.nih.gov/28933024/" target="_blank" rel="noopener">Grgic et al. · Satzpausen beim Krafttraining</a></li>' +
      '<li><a href="https://pubmed.ncbi.nlm.nih.gov/32077380/" target="_blank" rel="noopener">Nunes et al. · Übungsreihenfolge und Kraftentwicklung</a></li>' +
      '<li><a href="https://doi.org/10.1007/s40279-021-01587-7" target="_blank" rel="noopener">Schumann et al. · Kraft- und Ausdauertraining kombinieren</a></li>' +
      '<li><a href="https://pubmed.ncbi.nlm.nih.gov/34025459/" target="_blank" rel="noopener">Afonso et al. · Dehnen nach dem Training</a></li>' +
      '</ul></details>';
  }

  function recordSummary(row) {
    const info = [];
    if (row.value !== '') info.push(row.value + ' ' + row.unit);
    if (row.kg !== '') info.push(kgLabel(row.kg));
    if (row.reserve) info.push(row.reserve + ' Wdh. übrig');
    if (row.extra !== '') info.push(row.extra + ' ' + row.extraUnit);
    return info.join(' · ');
  }

  function historyEntry(entry, index) {
    const date = shortDate.format(new Date(entry.when));
    if (entry.kind === 'rest') return '<article class="card"><h3>Pausentag</h3><p>' + date + '</p></article>';
    const sets = entry.rows.filter(row => row.counts && row.done).length;
    const items = entry.rows.map(row => '<li><strong>' + escape(row.title) + (row.set ? ' · Satz ' + row.set : '') +
      '</strong><span>' + escape(recordSummary(row) || (row.done ? 'Abgehakt' : 'Offen')) + '</span></li>').join('');
    return '<details class="block"' + (index === 0 ? ' open' : '') + '><summary><span class="block-heading"><strong>' +
      escape(entry.title) + '</strong><small>' + date + (entry.focus ? ' · ' + escape(entry.focus) : '') +
      '</small></span><span class="pill accent">' + sets + (sets === 1 ? ' Satz' : ' Sätze') + '</span>' +
      icon('chevron', 'chev') + '</summary><div class="entry-data">' +
      (entry.note ? '<p>' + escape(entry.note) + '</p>' : '') + '<ul>' + items + '</ul></div></details>';
  }

  function renderHistory() {
    const total = state.logs.filter(entry => entry.kind === 'workout').length;
    app.innerHTML = '<div class="page-title"><h1>Trainingsverlauf</h1><p>' + total +
      (total === 1 ? ' abgeschlossene Einheit' : ' abgeschlossene Einheiten') +
      ' · Daten in diesem Browser' + (storageAvailable ? '' : ' · Speichern derzeit nicht verfügbar') +
      '</p></div><div class="history-actions">' + button('Zur nächsten Einheit', 'data-action="today"', 'primary') +
      (state.logs.length ? button('CSV exportieren', 'data-action="csv"', '', 'download') : '') +
      '</div><div class="history">' + (state.logs.length ? state.logs.map(historyEntry).join('') :
        '<section class="card"><h3>Noch keine Einheiten</h3><p>Abgeschlossene Einheiten erscheinen hier mit deinen Sätzen, Haltezeiten und Notizen.</p></section>') + '</div>';
  }

  function exportCsv() {
    function csvCell(value) {
      let text = String(value ?? '');
      if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    }
    const table = [['Datum', 'Einheit', 'Fokus', 'Block', 'Übung', 'Satz', 'Wert', 'Einheit des Werts', 'Zusatzgewicht kg', 'Minuten', 'Abgehakt', 'Notiz', 'Wdh. übrig']];
    for (const entry of state.logs) {
      const date = shortDate.format(new Date(entry.when));
      if (entry.kind === 'rest') {
        table.push([date, entry.title]);
        continue;
      }
      for (const row of entry.rows) {
        table.push([date, entry.title, entry.focus, row.group, row.title, row.set, row.value, row.unit,
          String(row.kg).replace('.', ','), row.extra, row.done ? 'Ja' : 'Nein', entry.note, row.reserve]);
      }
    }
    const csv = table.map(row => row.map(csvCell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Winter-Arc-Verlauf.csv';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.addEventListener('click', event => {
    const clicked = event.target.closest('button');
    if (!clicked) return;
    const { action, row, time } = clicked.dataset;
    if (clicked.dataset.view) {
      showView(clicked.dataset.view);
      return;
    }
    if (clicked.dataset.day !== undefined) {
      selectedDay = Number(clicked.dataset.day);
      render();
      document.querySelector('[data-day="' + selectedDay + '"]').focus({ preventScroll: true });
      return;
    }
    if (clicked.dataset.openDay !== undefined) {
      showView('training', Number(clicked.dataset.openDay));
      return;
    }
    if (action === 'start') startWorkout();
    if (action === 'today') showView('training');
    if (action === 'rest' && row) {
      const item = findRow(row);
      startTimer('rest', item.rest * 1000, 'Pause · ' + item.name);
    }
    if (action === 'progress-load') acceptLoad(findRow(row));
    if (action === 'preset') startTimer('rest', Number(time) * 1000, 'Satzpause');
    if (action === 'hold' && activeDraft()) {
      const item = findRow(row);
      startTimer('hold', 0, item.name, item.id);
    }
    if (action === 'toggle-timer') toggleTimer();
    if (action === 'extend-timer') extendTimer();
    if (action === 'stop-timer') stopTimer();
    if (action === 'save-hold') saveHold();
    if (action === 'finish') finishWorkout();
    if (action === 'rest-day') logRestDay();
    if (action === 'csv') exportCsv();
  });

  app.addEventListener('toggle', event => {
    if (event.target.dataset.block && app.contains(event.target)) {
      openBlocks.set(event.target.dataset.block, event.target.open);
    }
  }, true);

  app.addEventListener('input', event => {
    const draft = activeDraft();
    if (!draft) return;
    const input = event.target;
    if (input.id === 'workout-note') {
      draft.note = input.value;
      save();
      return;
    }
    if (input.hasAttribute('data-lsit-goal')) {
      if (input.value && input.validity.valid) {
        state.lsitGoal = Number(input.value);
        document.querySelectorAll('[data-lsit-target]').forEach(label => {
          label.textContent = 'Ziel ' + state.lsitGoal + ' Sek.';
        });
        save();
      }
      return;
    }
    const exercise = input.closest('[data-exercise]');
    if (!exercise) return;
    const id = exercise.dataset.exercise;
    const entry = draft.rows[id] ?? {};
    if (input.dataset.complete) {
      entry.done = input.checked;
      exercise.classList.toggle('is-done', input.checked);
    } else if (input.dataset.field && input.validity.valid) {
      entry[input.dataset.field] = input.value;
    } else {
      return;
    }
    draft.rows[id] = entry;
    save();
    if (input.dataset.complete) {
      updateProgress();
      const row = findRow(id);
      if (input.checked && row.rest) {
        startTimer('rest', row.rest * 1000, 'Pause · ' + row.name, id);
      } else if (!input.checked && state.timer?.kind === 'rest' && state.timer.rowId === id) {
        stopTimer();
      }
    }
  });

  window.addEventListener('storage', event => {
    if (event.key !== storageKey) return;
    const previousDay = nextDay();
    state = readState(event.newValue);
    if (selectedDay === previousDay) selectedDay = nextDay();
    render();
  });
  document.addEventListener('visibilitychange', tick);
  window.setInterval(tick, 250);
  render();

  if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
