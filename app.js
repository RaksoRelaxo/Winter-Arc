'use strict';

(() => {
  const { days } = window.winterPlan;
  const { collectMeasurements, metricKey, bestMeasurement, mergeLogs } = window.winterStatistics;
  const gradeRow = allRows(days[2]).find(row => row.id === 'grade-time');
  const gradeBenchmark = { id: gradeRow.id, title: gradeRow.name, group: 'Fahrrad',
    unit: gradeRow.unit, value: gradeRow.reference, kg: '' };
  const app = document.getElementById('app');
  const navigation = document.getElementById('navigation');
  const dock = document.getElementById('active-timer');
  const notice = document.getElementById('notice');
  const storageKey = 'winter-arc:1:' + new URL('.', location.href).pathname;
  const longDate = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'long' });
  const shortDate = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const views = [['training', 'Training', 'dumbbell'], ['plan', 'Zyklus', 'cycle'], ['history', 'Verlauf', 'history'], ['statistics', 'Statistik', 'chart']];
  const icons = {
    dumbbell: '<path d="M6 8h2v8H6zm10 0h2v8h-2zM4 10h2v4H4zm14 0h2v4h-2zM8 12h8"/>',
    cycle: '<path d="M20 7v4h-4M4 17v-4h4M5.2 8a8 8 0 0 1 13-1L20 11M4 13l1.8 4a8 8 0 0 0 13-1"/>',
    history: '<path d="M5 4h14v16H5zm3 4h8m-8 4h8m-8 4h4"/>',
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
        const loads = parsed.loads ?? {};
        if (parsed.revision !== 2) {
          delete loads['push-vest'];
          delete loads['push-10'];
          const rows = parsed.draft?.rows;
          if (rows?.['push-vest']?.done) rows['push-vest'].kg ??= '';
          if (rows?.['push-10']?.done) rows['push-10'].kg ??= '10';
        }
        return {
          revision: 2,
          logs: parsed.logs,
          draft: parsed.draft ?? null,
          timer: parsed.timer ?? null,
          loads,
          lsitGoal: parsed.lsitGoal ?? 20
        };
      }
    } catch {
      // A missing or unreadable record starts a fresh local plan.
    }
    return { revision: 2, logs: [], draft: null, timer: null, loads: {}, lsitGoal: 20 };
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
      return true;
    } catch {
      if (storageAvailable) announce('Der Browser kann gerade nicht dauerhaft speichern.');
      storageAvailable = false;
      return false;
    }
  }

  function latestWorkout() {
    return state.logs.find(entry => entry.kind === 'workout');
  }

  function nextDay() {
    return state.draft?.day ?? ((latestWorkout()?.day ?? -1) + 1) % days.length;
  }

  function nextRideMode() {
    return window.winterStatistics.nextRideMode(state.logs, 2);
  }

  function workoutPlan(day) {
    const plan = days[day];
    if (day !== 2) return plan;
    const mode = state.draft?.day === day ? state.draft.rideMode ?? nextRideMode() : nextRideMode();
    return {
      ...plan, groups: plan.groups.map(block => {
        if (block.id !== 'bike') return block;
        return {
          ...block,
          summary: mode === 'time' ? 'The Grade · Zeitfahrt' : 'Oh Hill No · 2 Runden nach Puls',
          rows: block.rows.filter(row => row.rideMode === mode)
        };
      })
    };
  }

  let selectedDay = state.draft?.day ?? nextDay();
  let view = 'training';
  let statisticsDay = null;
  let statisticsMetric = '';
  let statisticsLoad = '';
  let openedHistory = null;
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
    if (view === 'statistics') renderStatistics();
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

  function cycleContext() {
    const latest = latestWorkout();
    const nextRide = workoutPlan(2).groups.find(block => block.id === 'bike').summary;
    return '<div class="cycle-context">' +
      (latest ? '<span>Zuletzt abgeschlossen · ' + escape(latest.title) + ' am ' +
        shortDate.format(new Date(latest.when)) + '</span>' : '') +
      '<span>Nächster Radblock · ' + nextRide + '</span></div>';
  }

  function renderTraining() {
    const plan = workoutPlan(selectedDay);
    const draft = activeDraft();
    const preview = selectedDay !== nextDay();
    const action = preview
      ? button('Zur nächsten Einheit', 'data-action="today"', 'primary')
      : button(draft ? 'Training fortsetzen' : 'Einheit starten', 'data-action="start"', 'primary', 'play');
    const status = preview ? 'Vorschau' : draft ? 'Einheit läuft' : 'Als Nächstes';
    const bike = plan.groups.find(block => block.id === 'bike');
    const rideLabel = bike ? '<p class="hero-ride">' + icon('bike') + ' ' + bike.summary + '</p>' : '';
    const info = (draft ? '<div data-progress></div>' : '') +
      '<section class="card"><h3 class="card-title">' + icon('info') + 'Trainingshinweis</h3><p>' + plan.rule + '</p></section>';
    app.innerHTML = '<section class="hero" aria-labelledby="day-title"><div class="hero-content">' +
      '<p class="eyebrow">Tag ' + (selectedDay + 1) + ' von 3 · ' + status + '</p>' +
      '<h1 id="day-title">' + plan.name + '</h1><p class="hero-copy">' + plan.subtitle + '</p>' + rideLabel +
      '<div class="hero-actions">' + action + '<span class="hero-facts">' + icon('clock') + plan.time + '</span></div>' +
      '</div></section><section aria-labelledby="rhythm-title"><div class="section-bar"><h2 id="rhythm-title">Dein Trainingszyklus</h2>' +
      '<p>Als Nächstes · ' + days[nextDay()].name + '</p></div>' + dayTiles() + cycleContext() + '</section>' +
      '<div class="section-bar" id="workout"><h2>' + (preview ? 'Einheit im Überblick' : 'Ablauf der Einheit') + '</h2>' +
      '<p>' + plan.focus + '</p></div><div class="layout"><div><div class="blocks">' +
      plan.groups.map((block, index) => renderBlock(block, index, draft)).join('') +
      '</div>' + (draft ? finishPanel(draft) : '') + '</div><aside class="sidebar" aria-label="Trainingswerkzeuge">' +
      '<section class="card"><h3 class="card-title">' + icon('clock') + '<span id="timer-title">Pausentimer</span></h3><div id="timer-panel"></div></section>' +
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

  function parseSegmentTime(value) {
    const match = /^([0-9]{1,3}):([0-5]?[0-9])(?:[.,]([0-9]{1,3}))?$/.exec(String(value ?? '').trim());
    if (!match) return null;
    const seconds = Number(match[1]) * 60 + Number(match[2]) + Number('0.' + (match[3] ?? '0'));
    return seconds > 0 ? seconds : null;
  }

  function segmentTime(value) {
    const ms = Math.round(Number(value) * 1000);
    return secondsText(ms) + (ms % 1000 ? ',' + String(ms % 1000).padStart(3, '0').replace(/0+$/, '') : '');
  }

  function rowHistory(row, day) {
    return state.logs.filter(log => log.kind === 'workout' && log.day === day)
      .flatMap(log => log.rows.filter(result => result.id === row.id && result.done && Number(result.value) > 0));
  }

  function rowRecord(row, load, day) {
    const records = rowHistory(row, day).filter(result => row.kg === undefined ||
      (load !== '' && result.kg !== '' && Number(result.kg) === Number(load)));
    if (row.reference !== undefined) records.push({ value: row.reference, unit: row.unit, kg: '', extra: '' });
    return records.reduce((best, candidate) => {
      if (!best) return candidate;
      const better = row.unit === 'Zeit'
        ? Number(candidate.value) < Number(best.value)
        : Number(candidate.value) > Number(best.value);
      return better ? candidate : best;
    }, null);
  }

  function comparison(row, entry) {
    const latest = rowHistory(row, selectedDay)[0];
    const load = entry?.kg ?? defaultLoad(row);
    const best = row.rideMode === 'pulse' ? null : rowRecord(row, load, selectedDay);
    const item = (label, result, style = '') => '<span class="record-item ' + style + '"><small>' + label +
      '</small><strong>' + escape(recordSummary(result)) + '</strong></span>';
    return (latest ? item('Zuletzt', latest) : '') + (best ? item('Rekord', best, 'best') : '');
  }

  function kgLabel(number) {
    return Number(number).toLocaleString('de-DE') + ' kg';
  }

  function renderRow(row, draft) {
    const entry = draft?.rows[row.id];
    const completed = entry?.done ?? false;
    const tag = row.set ? '<span class="set">Satz ' + row.set + '</span><span aria-hidden="true">·</span>' : '';
    const gear = row.gear ? '<span>' + row.gear + '</span>' : '';
    const plannedLoad = entry?.kg ?? defaultLoad(row);
    const weight = row.kg === undefined ? '' : '<span class="kg" data-row-load>' + (plannedLoad > 0 ? '+' + kgLabel(plannedLoad) : '') + '</span>';
    const target = row.holdGoal
      ? '<b data-lsit-target>Ziel ' + state.lsitGoal + ' Sek.</b>'
      : '<b>' + row.target + '</b>';
    const rest = row.rest ? button('<span class="clock-caption">' + row.restRange + '</span>',
      'data-action="rest" data-row="' + row.id + '" aria-label="Pause nach ' + escape(row.name) + ' · ' + row.restRange + '"',
      'small transparent', 'clock') : '';
    const check = draft && !row.skillTimer ? '<label class="complete-checkbox"><input type="checkbox" data-complete="' + row.id +
      '" aria-label="' + escape(row.name + (row.set ? ', Satz ' + row.set : '')) + ' abhaken"' +
      (completed ? ' checked' : '') + '>' + icon('check') + '</label>' : '';
    const refs = comparison(row, entry);
    const info = row.unit ? '<div class="row-records" data-row-records>' + refs + '</div>' : '';
    return '<article class="exercise' + (completed ? ' is-done' : '') + '" data-exercise="' + row.id + '">' +
      '<div><div class="exercise-title">' + row.name + '</div><div class="exercise-meta">' + tag +
      target + gear + weight + '</div></div>' +
      '<div class="exercise-actions">' + rest + check + '</div>' +
      (row.cue ? '<p class="note">' + row.cue + '</p>' : '') +
      info + (draft ? fieldsFor(row, entry) + '<div class="row-progression" data-progression>' +
        progressionPanel(row) + '</div>' : '') + '</article>';
  }

  function numberField(row, entry, key, label, preset = '') {
    const step = key === 'kg' ? 'any' : '1';
    const limits = row.rideMode === 'pulse' && key === 'value' ? ' min="1" max="250"' : ' min="0"';
    return '<label class="field"><span>' + label + '</span><input type="number" inputmode="' +
      (step === 'any' ? 'decimal' : 'numeric') + '"' + limits + ' step="' + step +
      '" aria-label="' + escape(row.name) + (row.set ? ', Satz ' + row.set : '') + ' · ' + label +
      '" data-field="' + key + '" value="' + escape(entry?.[key] ?? preset) + '" placeholder="–"></label>';
  }

  function fieldsFor(row, entry) {
    if (!row.unit) return '';
    if (row.skillTimer) {
      const start = entry?.done || state.timer?.kind === 'skill' ? '' :
        button('30 Min. starten', 'data-action="skill" data-row="' + row.id + '"', 'small primary', 'play');
      const result = entry?.value ? '<span class="pill accent">' + secondsText(entry.value * 1000) + ' gespeichert</span>' : '';
      return '<div class="fields">' + start + result + '</div>';
    }
    if (row.unit === 'Zeit') {
      return '<div class="fields"><label class="field time-input"><span>Segmentzeit am Gipfel</span>' +
        '<input type="text" data-field="segment" placeholder="18:45,1" maxlength="10" spellcheck="false" value="' +
        escape(entry?.segment ?? '') + '"></label></div>';
    }
    const count = numberField(row, entry, 'value', row.rideMode === 'pulse' ? 'Ø Puls (bpm)' : row.unit, row.plannedValue ?? '');
    const extra = row.extraUnit ? numberField(row, entry, 'extra', 'Dauer (Min.)') : '';
    const weight = row.kg !== undefined ? numberField(row, entry, 'kg', 'Zusatz kg', defaultLoad(row)) : '';
    const measure = row.unit === 'Sek.' ? button('Hold messen', 'data-action="hold" data-row="' + row.id + '"', 'small transparent', 'clock') : '';
    const lsitGoal = row.holdGoal && row.set === 1
      ? '<label class="field"><span>L-Sit-Ziel (Sek.)</span><input type="number" inputmode="numeric" min="1" step="1" data-lsit-goal value="' +
        state.lsitGoal + '"></label>' : '';
    return '<div class="fields">' + count + extra + weight + lsitGoal + measure + '</div>';
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
    return allRows(workoutPlan(selectedDay)).filter(item => loadKey(item) === loadKey(row));
  }

  function progressionTarget(row) {
    return row.holdGoal ? state.lsitGoal : Number(row.target.match(/–(\d+)/)?.[1]);
  }

  function suggestedLoad(row) {
    if (!canProgress(row) || !activeDraft()) return null;
    const rows = progressionRows(row);
    if (rows[0].id !== row.id) return null;
    const load = defaultLoad(row);
    if (load === '' || rows.some(item => {
      const current = activeDraft().rows[item.id];
      return current?.done || current?.value || (current?.kg !== undefined && Number(current.kg) !== Number(load));
    })) return null;
    const latest = state.logs.find(log => log.kind === 'workout' && log.day === selectedDay &&
      log.rows.some(result => rows.some(item => item.id === result.id) && result.done && Number(result.value) > 0));
    if (!latest) return null;
    const meetsTarget = rows.every(item => {
      const result = latest.rows.find(record => record.id === item.id);
      return result?.done && result.kg !== '' && Number(result.kg) === Number(load) &&
        Number(result.value) >= progressionTarget(item);
    });
    return meetsTarget ? Number(load) : null;
  }

  function progressionPanel(row) {
    const load = suggestedLoad(row);
    if (load !== null) {
      return '<form class="load-options" data-progress-row="' + row.id + '">' +
        '<p><strong>Obergrenze erreicht</strong> · Neues Zusatzgewicht wählen</p>' +
        '<div class="fields">' + button('+5 kg', 'data-action="progress-load" data-step="5" data-row="' + row.id + '"', 'small primary') +
        button('+10 kg', 'data-action="progress-load" data-step="10" data-row="' + row.id + '"', 'small') +
        '<label class="field"><span>Eigener Wert (kg)</span><input type="number" name="custom-load" inputmode="decimal" step="any" min="0" required></label>' +
        '<button type="submit" class="button small">Übernehmen</button></div></form>';
    }
    const latest = (row.nextVariant || (row.holdGoal && row.set === 1)) && rowHistory(row, selectedDay)[0];
    if (!latest || Number(latest.value) < progressionTarget(row)) return '';
    const idea = row.holdGoal ? 'Setz dein L-Sit-Ziel um 5 Sekunden höher.' : row.nextVariant;
    return '<p class="variant-tip"><strong>Ziel erreicht</strong> · ' + idea + '</p>';
  }

  function refreshProgression(row) {
    const first = progressionRows(row)[0];
    const target = document.querySelector('[data-exercise="' + first.id + '"] [data-progression]');
    if (target) target.innerHTML = progressionPanel(first);
  }

  function acceptLoad(row, custom, increment = 0) {
    const current = suggestedLoad(row);
    if (current === null) return;
    const load = increment ? current + increment : Number(custom);
    if (!Number.isFinite(load) || load <= current) {
      announce('Wähle ein Zusatzgewicht über ' + kgLabel(current) + '.');
      return;
    }
    state.loads[loadKey(row)] = load;
    for (const item of progressionRows(row)) {
      const records = activeDraft().rows;
      records[item.id] = { ...records[item.id], kg: String(load) };
    }
    save();
    render();
    document.querySelector('[data-exercise="' + row.id + '"] [data-field="kg"]')?.focus({ preventScroll: true });
    announce(row.name + ' mit +' + kgLabel(load) + ' eingetragen.');
  }

  function findRow(id) {
    return allRows(workoutPlan(selectedDay)).find(row => row.id === id);
  }

  function updateProgress() {
    const draft = activeDraft();
    if (!draft) return;
    const plan = workoutPlan(selectedDay);
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
      if (selectedDay === 2) state.draft.rideMode = nextRideMode();
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
    return timer.kind === 'hold' ? timer.amount + delta : Math.max(0, timer.amount - delta);
  }

  function startTimer(kind, amount, label, rowId = null, day = selectedDay) {
    if (state.timer?.kind === 'skill') {
      announce('Speichere zuerst die Zeit des Skillblocks.');
      return;
    }
    unlockSound();
    state.timer = {
      kind, amount, label, rowId,
      day, from: Date.now(), status: 'running'
    };
    if (kind === 'skill') state.timer.goal = amount;
    save();
    if (kind === 'skill' && view === 'training') renderTraining();
    renderTimer();
    announce(kind === 'hold' ? 'Zeitmessung läuft.' : kind === 'skill' ? 'Skillblock läuft.' : 'Pausentimer läuft.');
  }

  function stopTimer() {
    const skill = state.timer?.kind === 'skill';
    state.timer = null;
    save();
    if (skill && view === 'training') renderTraining();
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

  function extendSkills() {
    const timer = state.timer;
    if (timer?.kind !== 'skill' || timer.goal >= 2100000) return;
    timer.amount = timerTime(timer) + 300000;
    timer.goal += 300000;
    timer.from = Date.now();
    if (timer.status === 'finished') timer.status = 'running';
    unlockSound();
    save();
    renderTimer();
  }

  function saveSkills() {
    const timer = state.timer;
    if (timer?.kind !== 'skill' || state.draft?.day !== timer.day) return;
    const seconds = Math.floor((timer.goal - timerTime(timer)) / 1000);
    if (seconds < 1) {
      announce('Der Skillblock läuft erst seit einem Moment.');
      return;
    }
    state.draft.rows[timer.rowId] = { value: String(seconds), done: true };
    stopTimer();
    announce('Skillblock gespeichert.');
  }

  function saveHold() {
    const timer = state.timer;
    if (timer?.kind !== 'hold') return;
    const seconds = Math.floor(timerTime(timer) / 1000);
    if (state.draft?.day !== timer.day) {
      stopTimer();
      return;
    }
    const row = allRows(workoutPlan(timer.day)).find(item => item.id === timer.rowId);
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
    if (timer.kind === 'skill') {
      const controls = [];
      if (timer.status !== 'finished') controls.push(timerAction(timer.status === 'paused' ? 'Weiter' : 'Anhalten',
        'toggle-timer', timer.status === 'paused' ? 'play' : 'pause', compact));
      if (timer.goal < 2100000) controls.push(timerAction('+5 Min.', 'extend-skills', '', compact));
      controls.push(timerAction('Skillzeit speichern', 'save-skills', 'check', compact));
      controls.push(timerAction('Verwerfen', 'stop-timer', 'stop', compact));
      return readout + '<div class="timer-buttons">' + controls.join('') + '</div>';
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
    const title = document.getElementById('timer-title');
    if (title) title.textContent = state.timer?.kind === 'skill' ? 'Skilltimer' :
      state.timer?.kind === 'hold' ? 'Haltezeit' : 'Pausentimer';
    if (panel) panel.innerHTML = timerDisplay(false);
    dock.hidden = !state.timer;
    dock.innerHTML = state.timer ? timerDisplay(true) : '';
    tick();
  }

  function tick() {
    const timer = state.timer;
    if (!timer) return;
    const time = timerTime(timer);
    if (timer.kind !== 'hold' && timer.status === 'running' && time === 0) {
      timer.amount = 0;
      timer.status = 'finished';
      save();
      chime();
      announce(timer.kind === 'skill' ? 'Skillzeit erreicht. Speichere die Zeit oder verlängere den Block.' : 'Pause beendet.');
      renderTimer();
      return;
    }
    const display = secondsText(timer.kind === 'hold' ? time : Math.ceil(time / 1000) * 1000);
    const finishedLabel = timer.kind === 'skill' ? 'Skillzeit erreicht' : 'Pause beendet';
    const label = timer.status === 'finished' ? finishedLabel : timer.label + (timer.status === 'paused' ? ' · angehalten' : '');
    document.querySelectorAll('[data-clock]').forEach(element => {
      if (element.textContent !== display) element.textContent = display;
    });
    document.querySelectorAll('[data-clock-label]').forEach(element => {
      if (element.textContent !== label) element.textContent = label;
    });
  }

  function retiredDraftRows(draft) {
    const retired = {
      'v-up': ['V-Ups', 'Runde 3', 'Wdh.'],
      'pseudo-r3': ['Pseudo Planche Push-ups', 'Runde 3', 'Wdh.', 0],
      'push-bw': ['Liegestütze', 'Runde 4', 'Wdh.', 0],
      'hs-1': ['Handstand', 'Freie Skillversuche', 'Sek.'],
      'planche-1': ['Planche', 'Freie Skillversuche', 'Sek.'],
      'lever-1': ['Front Lever', 'Freie Skillversuche', 'Sek.'],
      'press-1': ['Press to Handstand', 'Freie Skillversuche', 'Versuche'],
      'hspu-1': ['Handstand Push-ups', 'Freie Skillversuche', 'Wdh.'],
      'one-arm-bars': ['Einarmiger Handstand · Parallettes', 'Freie Skillversuche', 'Sek.'],
      'one-arm-floor': ['Einarmiger Handstand · Boden', 'Freie Skillversuche', 'Sek.'],
      'rows-20': ['Front Lever Rows', 'Front Lever Rows', 'Wdh.', 20],
      'rows-bw': ['Front Lever Rows', 'Front Lever Rows', 'Wdh.', 0],
      'pseudo-skill': ['Pseudo Planche Push-ups', 'Planche-Zusatzsätze', 'Wdh.'],
      'high-wide': ['High Pull-ups · breit', 'Klimmzüge', 'Wdh.'],
      'all-hill': ['Oh Hill No', 'Fahrrad', 'Runden']
    };
    return Object.entries(draft.rows).flatMap(([id, record]) => {
      const previous = retired[id];
      if (!previous) return [];
      const [title, group, unit, kg] = previous;
      return [{ id, title, group, unit, kg: record.kg ?? kg ?? '', done: record.done ?? false,
        counts: draft.day === 0 || (draft.day === 1 && group !== 'Freie Skillversuche'),
        value: record.value ?? '', extra: record.extra ?? '', extraUnit: id === 'all-hill' ? 'Min.' : '' }];
    });
  }

  function finishWorkout() {
    const draft = activeDraft();
    if (!draft || !Object.values(draft.rows).some(row => row.done)) return;
    if (state.timer?.kind === 'skill') {
      announce('Speichere zuerst die Zeit des Skillblocks.');
      return;
    }
    const plan = workoutPlan(draft.day);
    const rows = plan.groups.flatMap(group => group.rows.flatMap(row => {
      const record = draft.rows[row.id];
      if (!record || !(record.done || record.value || record.extra || record.kg || record.segment)) return [];
      const value = row.unit === 'Zeit' ? parseSegmentTime(record.segment) ?? '' :
        record.value ?? (record.done ? row.plannedValue ?? '' : '');
      const load = record.kg ?? defaultLoad(row);
      const best = row.rideMode === 'pulse' ? null : rowRecord(row, load, draft.day);
      const pr = record.done && Number(value) > 0 && best && (row.unit === 'Zeit'
        ? Number(value) < Number(best.value) : Number(value) > Number(best.value));
      return [{
        id: row.id, title: row.name, group: group.name, counts: row.counts, set: row.set ?? '',
        done: record.done ?? false, value, pr: Boolean(pr),
        unit: row.unit, kg: load, extra: record.extra ?? '', extraUnit: row.extraUnit ?? ''
      }];
    }));
    const loads = { ...state.loads };
    for (const row of allRows(plan).filter(canProgress)) {
      const group = progressionRows(row);
      if (group[0].id !== row.id) continue;
      const completed = group.map(item => rows.find(result => result.id === item.id));
      const load = completed[0]?.kg;
      if (load != null && load !== '' && completed.every(item => item?.done && item.kg !== '' && Number(item.kg) === Number(load))) {
        loads[loadKey(row)] = Number(load);
      }
    }
    rows.push(...retiredDraftRows(draft));
    const entry = { kind: 'workout', day: draft.day, title: plan.name, focus: '',
      when: new Date().toISOString(), rows, note: draft.note.trim() };
    const previous = state;
    state = { ...state, logs: [entry, ...state.logs], draft: null, timer: null, loads };
    if (!save()) {
      state = previous;
      announce('Speichern ist gerade fehlgeschlagen. Deine Einheit bleibt geöffnet.');
      return;
    }
    openedHistory = null;
    showView('history');
    const records = rows.filter(row => row.pr).length;
    const prefix = records ? (records === 1 ? 'Ein neuer Rekord.' : records + ' neue Rekorde.') : 'Einheit gespeichert.';
    announce(prefix + ' Als Nächstes · ' + days[nextDay()].name + '.');
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
      '30 Minuten freie Skills. Danach Pike Push-ups, Rows, Planche-Zusatzsätze und Klimmzüge.',
      'Pistol Squats und L-Sit, dann Kreuz-Kniebeugen und Planke. Danach im Wechsel The Grade auf Zeit oder zwei Oh-Hill-No-Runden nach Puls.'
    ];
    const plans = days.map((day, index) => '<section class="card"><span class="day-icon">' + icon(day.icon) +
      '</span><h3>Tag ' + (index + 1) + ' · ' + day.name + '</h3><p>' + descriptions[index] + '</p>' +
      button('Einheit ansehen', 'data-open-day="' + index + '"', 'small') + '</section>').join('');
    const restAction = todayRestIndex() < 0 ? 'Pausentag eintragen' : 'Pausentag zurücknehmen';
    app.innerHTML = '<div class="page-title"><h1>Dein Drei-Tage-Zyklus</h1><p>Der nächste Tag wechselt, sobald du eine Einheit abschließt. Der Zyklus beginnt danach wieder mit dem Kraftzirkel.</p></div>' +
      cycleContext() + '<div class="plan-grid">' + plans + '</div><div class="info-grid">' +
      '<section class="card"><h3>Fortschritt bei Kraft und Skills</h3><p>Du siehst den letzten Satz und den Rekord bei vergleichbarer Last. Sobald du einmal die obere Wiederholungszahl sauber erreichst, kannst du +5 kg, +10 kg oder ein eigenes Zusatzgewicht für die nächste Einheit übernehmen.</p></section>' +
      '<section class="card"><h3>Erholung einplanen</h3><p>Der Krafttag belastet dieselben Muskeln wie viele Skills am Folgetag. Wähle dann leichtere Technikvarianten und kürze Zusatzsätze, wenn die Form nachlässt. Falls du einen Pausentag brauchst, bleibt die nächste Einheit im Zyklus stehen.</p>' +
      '<div class="history-actions">' + button(restAction, 'data-action="rest-day"', 'small') + '</div></section>' +
      '</div><details class="card sources"><summary>Quellen zu Kraft, Pausen, Rad und Dehnen</summary><ul>' +
      '<li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/" target="_blank" rel="noopener">ACSM 2026 · Krafttraining, Hypertrophie und Schnellkraft</a></li>' +
      '<li><a href="https://pubmed.ncbi.nlm.nih.gov/28933024/" target="_blank" rel="noopener">Grgic et al. · Satzpausen beim Krafttraining</a></li>' +
      '<li><a href="https://pubmed.ncbi.nlm.nih.gov/32077380/" target="_blank" rel="noopener">Nunes et al. · Übungsreihenfolge und Kraftentwicklung</a></li>' +
      '<li><a href="https://doi.org/10.1007/s40279-021-01587-7" target="_blank" rel="noopener">Schumann et al. · Kraft- und Ausdauertraining kombinieren</a></li>' +
      '<li><a href="https://acsm.org/wp-content/uploads/2025/02/Exercise-intensity-infographic-PDF.pdf" target="_blank" rel="noopener">ACSM · Ausdauerintensität und Sprechtest</a></li>' +
      '<li><a href="https://pubmed.ncbi.nlm.nih.gov/34025459/" target="_blank" rel="noopener">Afonso et al. · Dehnen nach dem Training</a></li>' +
      '</ul></details>';
  }

  function recordSummary(row) {
    const info = [];
    if (row.value != null && row.value !== '') {
      const display = row.unit === 'Zeit' ? segmentTime(row.value) : row.id === 'skill-block'
        ? secondsText(row.value * 1000) + ' Min.' : row.value + ' ' + row.unit;
      info.push(display);
    }
    if (row.kg != null && row.kg !== '') info.push(kgLabel(row.kg));
    if (row.extra != null && row.extra !== '') info.push(row.extra + ' ' + row.extraUnit);
    return info.join(' · ');
  }


  function historyEntry(entry, index, records) {
    const date = shortDate.format(new Date(entry.when));
    if (entry.kind === 'rest') return '<article class="card"><h3>Pausentag</h3><p>' + date + '</p></article>';
    const sets = entry.rows.filter(row => row.counts && row.done).length;
    const groups = new Map();
    for (const row of entry.rows) {
      const group = row.group || 'Sätze';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(row);
    }
    const items = Array.from(groups, ([group, rows]) => '<h4>' + escape(group) + '</h4><ul>' +
      rows.map(row => '<li><strong>' + escape(row.title) + (row.set ? ' · Satz ' + escape(row.set) : '') +
      '</strong><span>' + escape(recordSummary(row) || (row.done ? 'Abgehakt' : 'Offen')) +
      (row.pr || records?.has(metricKey(row)) ? ' <span class="pill accent">Neuer Rekord</span>' : '') + '</span></li>').join('') + '</ul>').join('');
    return '<details class="block" id="history-' + index + '"' + (index === (openedHistory ?? 0) ? ' open' : '') + '><summary><span class="block-heading"><strong>' +
      escape(entry.title) + '</strong><small>' + date + (entry.focus ? ' · ' + escape(entry.focus) : '') +
      '</small></span><span class="pill accent">' + sets + (sets === 1 ? ' Satz' : ' Sätze') + '</span>' +
      icon('chevron', 'chev') + '</summary><div class="entry-data">' +
      (entry.note ? '<p>' + escape(entry.note) + '</p>' : '') + items +
      button('Statistik für diesen Tag', 'data-stats-day="' + entry.day + '"', 'small') + '</div></details>';
  }

  function renderHistory() {
    const total = state.logs.filter(entry => entry.kind === 'workout').length;
    const recordsByEntry = new Map();
    for (const day of days.keys()) {
      for (const result of collectMeasurements(state.logs, day, gradeBenchmark)) {
        if (!result.pr) continue;
        if (!recordsByEntry.has(result.index)) recordsByEntry.set(result.index, new Set());
        recordsByEntry.get(result.index).add(result.key);
      }
    }
    app.innerHTML = '<div class="page-title"><h1>Trainingsverlauf</h1><p>' + total +
      (total === 1 ? ' abgeschlossene Einheit' : ' abgeschlossene Einheiten') +
      ' · Daten in diesem Browser' + (storageAvailable ? '' : ' · Speichern derzeit nicht verfügbar') +
      '</p></div><div class="history-actions">' + button('Zur nächsten Einheit', 'data-action="today"', 'primary') +
      (state.logs.length ? button('CSV exportieren', 'data-action="csv"', '', 'download') +
        button('Sicherung speichern', 'data-action="backup"', '') : '') +
      button('Sicherung laden', 'data-action="import-backup"', '') +
      '<input type="file" id="backup-file" accept=".json,application/json" hidden>' +
      '</div><div class="history">' + (state.logs.length ? state.logs.map((entry, index) =>
        historyEntry(entry, index, recordsByEntry.get(index))).join('') :
        '<section class="card"><h3>Noch keine Einheiten</h3><p>Abgeschlossene Einheiten erscheinen hier mit deinen Sätzen, Haltezeiten und Notizen.</p></section>') + '</div>';
  }

  function renderStatistics() {
    statisticsDay ??= latestWorkout()?.day ?? nextDay();
    const results = collectMeasurements(state.logs, statisticsDay, gradeBenchmark);
    const observations = results.filter(result => result.row.unit !== '');
    const catalog = new Map(observations.map(result => [result.key, result.row]));
    if (statisticsDay === 2 && !catalog.has(metricKey(gradeBenchmark))) {
      catalog.set(metricKey(gradeBenchmark), gradeBenchmark);
    }
    if (!catalog.has(statisticsMetric)) statisticsMetric = catalog.keys().next().value ?? '';
    const series = observations.filter(result => result.key === statisticsMetric);
    const loads = Array.from(new Set(series.map(result => result.load)));
    if (!loads.includes(statisticsLoad)) statisticsLoad = loads[0] ?? '';
    const points = series.filter(result => result.load === statisticsLoad);
    const benchmark = statisticsMetric === metricKey(gradeBenchmark) ? { row: gradeBenchmark, when: null } : null;
    const best = bestMeasurement(points, benchmark);
    const sessions = state.logs.filter(entry => entry.kind === 'workout' && entry.day === statisticsDay);
    const sets = sessions.reduce((total, entry) => total + entry.rows.filter(row => row.done && row.counts).length, 0);
    const prs = observations.filter(result => result.pr);
    const tabs = days.map((day, index) => button(day.short, 'data-stats-day="' + index +
      '" aria-pressed="' + (index === statisticsDay) + '"', 'small' + (index === statisticsDay ? ' primary' : ''))).join('');
    const summary = '<div class="stats-summary">' + summaryCard('Einheiten', sessions.length) +
      summaryCard('Sätze', sets) + summaryCard('Rekorde', prs.length) + '</div>';
    const filters = catalog.size ? '<div class="stats-filters">' +
      statsSelect('Übung', 'metric', [...catalog].map(([key, row]) => [key, exerciseLabel(row)]), statisticsMetric) +
      (loads.some(load => load !== '') ? statsSelect('Zusatzgewicht', 'load', loads.map(load => [load,
        load === '' ? 'Ohne Gewichtsangabe' : Number(load) === 0 ? 'Körpergewicht' : '+' + kgLabel(load)]), statisticsLoad) : '') +
      '</div>' : '';
    const metrics = points.length || best ? '<div class="stats-summary score-summary">' +
      summaryCard('Zuletzt', points[0] ? scoreText(points[0].row) : '–', points[0] ? shortDate.format(new Date(points[0].when)) : '') +
      (best ? summaryCard('Rekord', scoreText(best.row), best.when ? shortDate.format(new Date(best.when)) : 'Startrekord aus Zwift')
        : summaryCard('Zielpuls', '132 bpm', '130–135 bpm')) +
      summaryCard('Messungen', points.length) + '</div>' : '';
    app.innerHTML = '<div class="page-title"><h1>Statistik</h1><p>Verfolge deine Sätze, Zeiten und Rekorde nach Trainingstag.</p></div>' +
      '<div class="stats-tabs" role="group" aria-label="Trainingstag für Statistik">' + tabs + '</div>' + summary +
      '<section class="card stats-series" aria-label="Übungsverlauf">' + filters + metrics +
      (points.length ? seriesPlot(points, best) : '<p class="muted">' +
        (best ? 'Deine erste eingetragene Zeitfahrt erscheint hier.' : 'Sobald du Werte speicherst, erscheint hier dein Verlauf.') + '</p>') +
      '</section><section class="stats-achievements" aria-labelledby="achievement-heading"><div class="section-bar">' +
      '<h2 id="achievement-heading">Erfolge nach Datum</h2></div>' +
      (prs.length ? achievementList(prs) : '<p class="muted">Neue Bestleistungen erscheinen hier mit ihrem Trainingstag.</p>') + '</section>';
  }

  function exerciseLabel(row) {
    return [row.group, row.title, row.set ? 'Satz ' + row.set : ''].filter(Boolean).join(' · ');
  }

  function scoreText(row) {
    if (row.unit === 'Zeit') return segmentTime(row.value);
    if (row.id === 'skill-block') return secondsText(row.value * 1000) + ' Min.';
    return Number(row.value).toLocaleString('de-DE') + ' ' + row.unit;
  }

  function summaryCard(label, value, detail = '') {
    return '<div class="stat-tile"><span>' + label + '</span><strong>' + escape(value) + '</strong>' +
      (detail ? '<small>' + escape(detail) + '</small>' : '') + '</div>';
  }

  function statsSelect(label, filter, options, current) {
    return '<label><span>' + label + '</span><select data-stats-filter="' + filter + '">' +
      options.map(([value, name]) => '<option value="' + escape(value) + '"' + (value === current ? ' selected' : '') +
        '>' + escape(name) + '</option>').join('') + '</select></label>';
  }

  function seriesPlot(points, best) {
    const recent = points.slice(0, 8).reverse();
    const max = Math.max(...recent.map(result => Number(result.row.value)));
    const bars = recent.map(result => {
      const date = shortDate.format(new Date(result.when));
      const value = scoreText(result.row);
      const bar = '<span class="stat-bar-value">' + escape(value) + '</span><span class="stat-bar-track" aria-hidden="true">' +
        '<span class="stat-bar-fill" style="height:' + (100 * Number(result.row.value) / max).toFixed(2) + '%"></span></span>' +
        '<span class="stat-bar-date">' + escape(date.slice(0, 6)) + '</span>';
      return '<li>' + button(bar, 'data-history-index="' + result.index + '" aria-label="Einheit vom ' + escape(date) +
        ' · ' + escape(value) + ' öffnen"', 'stat-bar' + (best === result ? ' is-best' : '')) + '</li>';
    }).join('');
    const rows = points.map(result => '<li><time datetime="' + escape(result.when) + '">' +
      shortDate.format(new Date(result.when)) + '</time><strong>' + escape(scoreText(result.row)) + '</strong>' +
      (result.pr ? '<span class="pill accent">Rekord</span>' : '<span></span>') +
      button('Einheit öffnen', 'data-history-index="' + result.index + '"', 'small') + '</li>').join('');
    return '<h3 class="stat-subhead">Verlauf</h3><ol class="stat-chart" aria-label="Letzte ' + recent.length +
      ' Messungen">' + bars + '</ol><details class="stat-measurements"><summary>Alle Messungen (' + points.length +
      ')</summary><ul>' + rows + '</ul></details>';
  }

  function achievementList(results) {
    const grouped = new Map();
    for (const result of results) {
      if (!grouped.has(result.index)) grouped.set(result.index, []);
      grouped.get(result.index).push(result);
    }
    return '<div class="history">' + [...grouped].map(([index, achievements]) => (
      '<details class="block"><summary><span class="block-heading"><strong>' +
      shortDate.format(new Date(achievements[0].when)) + '</strong><small>' + achievements.length +
      (achievements.length === 1 ? ' neuer Rekord' : ' neue Rekorde') + '</small></span>' + icon('chevron', 'chev') +
      '</summary><div class="entry-data"><ul>' + achievements.map(({ row }) =>
        '<li><strong>' + escape(exerciseLabel(row)) + '</strong><span>' + escape(recordSummary(row)) + '</span></li>').join('') +
      '</ul>' + button('Einheit öffnen', 'data-history-index="' + index + '"', 'small') + '</div></details>'
    )).join('') + '</div>';
  }

  function exportCsv() {
    function csvCell(value) {
      let text = String(value ?? '');
      if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    }
    const table = [['Datum', 'Einheit', 'Fokus', 'Block', 'Übung', 'Satz', 'Wert', 'Einheit des Werts', 'Zusatzgewicht kg', 'Minuten', 'Abgehakt', 'Notiz', 'Neuer Rekord']];
    for (const entry of state.logs) {
      const date = shortDate.format(new Date(entry.when));
      if (entry.kind === 'rest') {
        table.push([date, entry.title]);
        continue;
      }
      for (const row of entry.rows) {
        table.push([date, entry.title, entry.focus, row.group, row.title, row.set, row.unit === 'Zeit' && row.value !== '' ? segmentTime(row.value) : row.value, row.unit,
          String(row.kg).replace('.', ','), row.extra, row.done ? 'Ja' : 'Nein', entry.note, row.pr ? 'Ja' : '']);
      }
    }
    const csv = table.map(row => row.map(csvCell).join(';')).join('\r\n');
    downloadFile('Winter-Arc-Verlauf.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8');
  }

  function downloadFile(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportBackup() {
    const { logs, loads, lsitGoal } = state;
    downloadFile('Winter-Arc-Sicherung.json', JSON.stringify({ format: 'winter-arc', version: 1, logs, loads, lsitGoal }),
      'application/json');
  }

  async function importBackup(file) {
    if (!file) return;
    let backup;
    try {
      backup = JSON.parse(await file.text());
      if (backup?.format !== 'winter-arc' || backup.version !== 1 || !Array.isArray(backup.logs) ||
        !backup.logs.every(validBackupEntry)) throw new Error('Ungültige Sicherung');
    } catch {
      announce('Wähle eine gültige Winter-Arc-Sicherung im JSON-Format.');
      return;
    }
    const previous = state;
    const previousCount = state.logs.length;
    const logs = mergeLogs(state.logs, backup.logs);
    const restoredLoads = Object.fromEntries(Object.entries(backup.loads ?? {}).filter(([, value]) =>
      typeof value === 'number' && Number.isFinite(value) && value >= 0));
    const lsitGoal = previousCount === 0 && !state.draft && Number.isInteger(backup.lsitGoal) && backup.lsitGoal > 0
      ? backup.lsitGoal : state.lsitGoal;
    state = { ...state, logs, loads: { ...restoredLoads, ...state.loads }, lsitGoal };
    if (!save()) {
      state = previous;
      announce('Die Sicherung konnte gerade nicht gespeichert werden.');
      return;
    }
    openedHistory = null;
    render();
    const count = state.logs.length - previousCount;
    if (count === 0) announce('Diese Einträge sind bereits im Verlauf.');
    else announce(count === 1 ? 'Ein Trainingseintrag übernommen.' : count + ' Trainingseinträge übernommen.');
  }

  function validBackupEntry(entry) {
    if (!entry || typeof entry.when !== 'string' || !Number.isFinite(Date.parse(entry.when)) ||
        !Array.isArray(entry.rows) || typeof entry.title !== 'string') return false;
    if (entry.kind === 'rest') return entry.rows.length === 0;
    return entry.kind === 'workout' && Number.isInteger(entry.day) && entry.day >= 0 && entry.day < days.length &&
      entry.rows.every(row => row && typeof row.id === 'string' && typeof row.title === 'string' &&
        typeof row.unit === 'string' && typeof row.done === 'boolean' &&
        (row.value == null || typeof row.value === 'number' || typeof row.value === 'string') &&
        [row.group, row.kg, row.set, row.extra, row.extraUnit].every(value =>
          value == null || typeof value === 'string' || typeof value === 'number'));
  }

  document.addEventListener('click', event => {
    const clicked = event.target.closest('button');
    if (!clicked) return;
    const { action, row, time } = clicked.dataset;
    if (clicked.dataset.view) {
      if (clicked.dataset.view === 'history') openedHistory = null;
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
    if (clicked.dataset.statsDay !== undefined) {
      statisticsDay = Number(clicked.dataset.statsDay);
      statisticsMetric = '';
      statisticsLoad = '';
      showView('statistics');
      document.querySelector('.stats-tabs [aria-pressed="true"]')?.focus({ preventScroll: true });
      return;
    }
    if (clicked.dataset.historyIndex !== undefined) {
      openedHistory = Number(clicked.dataset.historyIndex);
      showView('history');
      const entry = document.getElementById('history-' + openedHistory);
      entry?.scrollIntoView({ block: 'start' });
      entry?.querySelector('summary')?.focus({ preventScroll: true });
      return;
    }
    if (action === 'start') startWorkout();
    if (action === 'today') showView('training');
    if (action === 'rest' && row) {
      const item = findRow(row);
      startTimer('rest', item.rest * 1000, 'Pause · ' + item.name);
    }
    if (action === 'progress-load') acceptLoad(findRow(row), '', Number(clicked.dataset.step));
    if (action === 'skill' && activeDraft() && !activeDraft().rows[row]?.done) {
      startTimer('skill', 1800000, 'Freies Skilltraining', row);
    }
    if (action === 'extend-skills') extendSkills();
    if (action === 'save-skills') saveSkills();
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
    if (action === 'backup') exportBackup();
    if (action === 'import-backup') {
      const input = document.getElementById('backup-file');
      input.value = '';
      input.click();
    }
  });

  app.addEventListener('change', event => {
    const input = event.target;
    if (input.id === 'backup-file') importBackup(input.files[0]);
    const filter = input.dataset.statsFilter;
    if (!filter) return;
    if (filter === 'metric') {
      statisticsMetric = input.value;
      statisticsLoad = '';
    } else {
      statisticsLoad = input.value;
    }
    renderStatistics();
    document.querySelector('[data-stats-filter="' + filter + '"]')?.focus({ preventScroll: true });
  });

  app.addEventListener('toggle', event => {
    if (event.target.dataset.block && app.contains(event.target)) {
      openBlocks.set(event.target.dataset.block, event.target.open);
    }
  }, true);

  app.addEventListener('submit', event => {
    const form = event.target;
    if (!form.dataset.progressRow) return;
    event.preventDefault();
    acceptLoad(findRow(form.dataset.progressRow), form.elements.namedItem('custom-load').value);
  });

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
    const row = findRow(id);
    const entry = draft.rows[id] ?? {};
    if (input.dataset.complete) {
      if (input.checked && row.rest && state.timer?.kind === 'skill') {
        input.checked = false;
        announce('Speichere zuerst die Zeit des Skillblocks.');
        return;
      }
      if (input.checked && exercise.querySelector('[data-field]:invalid')) {
        input.checked = false;
        announce('Prüfe bitte deine Eingaben für diesen Satz.');
        return;
      }
      if (input.checked && row.rideMode) {
        const valid = row.unit === 'Zeit' ? parseSegmentTime(entry.segment) !== null : Number(entry.value) > 0;
        if (!valid) {
          input.checked = false;
          announce(row.unit === 'Zeit' ? 'Trag die Segmentzeit als Min:Sek ein.' : 'Trag deinen Durchschnittspuls ein.');
          return;
        }
      }
      entry.done = input.checked;
      exercise.classList.toggle('is-done', input.checked);
    } else if (input.dataset.field && input.validity.valid) {
      entry[input.dataset.field] = input.value;
      if (row.rideMode && input.dataset.field !== 'extra') {
        const valid = row.unit === 'Zeit' ? parseSegmentTime(entry.segment) !== null : Number(entry.value) > 0;
        if (!valid) {
          entry.done = false;
          exercise.querySelector('[data-complete]').checked = false;
          exercise.classList.remove('is-done');
        }
      }
    } else {
      return;
    }
    draft.rows[id] = entry;
    save();
    if (row.rideMode || input.dataset.complete) updateProgress();
    if (input.dataset.field === 'kg') {
      exercise.querySelector('[data-row-records]').innerHTML = comparison(row, entry);
      exercise.querySelector('[data-row-load]').textContent = Number(entry.kg) > 0 ? '+' + kgLabel(entry.kg) : '';
    }
    if (input.dataset.complete || input.dataset.field === 'value' || input.dataset.field === 'kg') refreshProgression(row);
    if (input.dataset.complete) {
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
