'use strict';

(() => {
  function isMeasurement(row) {
    return row.done && row.unit && Number.isFinite(Number(row.value)) && Number(row.value) > 0;
  }

  function weightKey(row) {
    return row.kg == null || row.kg === '' || !Number.isFinite(Number(row.kg)) ? '' : String(Number(row.kg));
  }

  function metricKey(row) {
    return JSON.stringify([row.id, row.unit]);
  }

  function improves(row, best) {
    if (row.unit === 'bpm') return false;
    return row.unit === 'Zeit' ? Number(row.value) < Number(best.value) : Number(row.value) > Number(best.value);
  }

  function collectMeasurements(logs, day, seed) {
    const records = new Map();
    const results = [];
    for (let index = logs.length - 1; index >= 0; index--) {
      const entry = logs[index];
      if (entry.kind !== 'workout' || entry.day !== day) continue;
      for (const row of entry.rows.filter(isMeasurement)) {
        const key = metricKey(row);
        const load = weightKey(row);
        const recordKey = JSON.stringify([key, load]);
        const benchmark = row.id === seed.id && row.unit === seed.unit ? seed : null;
        const best = records.get(recordKey) ?? benchmark;
        const pr = Boolean(best && improves(row, best));
        if (!best || pr) records.set(recordKey, row);
        results.push({ row, key, load, index, when: entry.when, pr });
      }
    }
    return results.reverse();
  }

  function bestMeasurement(points, fallback = null) {
    if (points[0]?.row.unit === 'bpm') return null;
    return points.reduce((best, candidate) => (
      !best || improves(candidate.row, best.row) ? candidate : best
    ), fallback);
  }

  function nextRideMode(logs, day) {
    const last = logs.filter(entry => entry.kind === 'workout' && entry.day === day)
      .flatMap(entry => entry.rows).find(row =>
        (row.id === 'grade-time' || row.id === 'hill-pulse') && isMeasurement(row)
      );
    return last?.id === 'grade-time' ? 'pulse' : 'time';
  }

  function mergeLogs(current, imported) {
    const key = entry => JSON.stringify([entry.kind, entry.day ?? null, entry.when]);
    const entries = new Map(imported.map(entry => [key(entry), entry]));
    for (const entry of current) entries.set(key(entry), entry);
    return Array.from(entries.values()).sort((first, second) => new Date(second.when) - new Date(first.when));
  }

  window.winterStatistics = { collectMeasurements, metricKey, bestMeasurement, nextRideMode, mergeLogs };
})();
