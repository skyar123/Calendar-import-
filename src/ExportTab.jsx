// The export screen: who goes in, how they are named, what the reminders look
// like, clearing discharged clients, and backup. Split out of App.jsx, which
// was carrying it plus every other screen in one file.

import React, { useMemo, useRef } from 'react';
import {
  AlertTriangle, Archive, CalendarDays, Check, Download, ExternalLink,
  Package, RotateCcw, Save, Settings2, Undo2,
} from 'lucide-react';

import { CATEGORY_LABELS, DEFAULT_LEAD_TIMES, formatDate } from './rules.js';
import { buildClientIcs, countPastDates, displayName } from './ics.js';

export const CATEGORY_ORDER = [
  'birthday', 'baseline', 'treatmentPlan', 'sniff', 'sixMonth',
  'birthOfChild', 'authorization', 'annual', 'ageWindow',
];

export default function ExportTab({
  clients, setClients, leadTimes, setLeadTimes, categories, setCategories,
  nameStyle, setNameStyle, skipPast, setSkipPast, headsUp, setHeadsUp,
  removals, setRemovals, exportRemovals, lastBackup,
  exportClient, exportAllCombined, exportAllZipped, backup, restore,
}) {
  const fileRef = useRef(null);
  const on = useMemo(() => clients.filter((c) => !c.skip), [clients]);
  const { total, dues } = useMemo(() => on.reduce((acc, c) => {
    const built = buildClientIcs(c, { categories, skipPast, headsUp, leadTimes });
    return { total: acc.total + built.count, dues: acc.dues + built.dueCount };
  }, { total: 0, dues: 0 }), [on, categories, skipPast, headsUp, leadTimes]);
  const pastCount = useMemo(() => countPastDates(on, { categories }), [on, categories]);
  const setSkip = (id, skip) => setClients((prev) => prev.map((c) => (c.id === id ? { ...c, skip } : c)));
  const setNickname = (id, nickname) => setClients((prev) => prev.map((c) => (c.id === id ? { ...c, nickname } : c)));
  const missingNicknames = useMemo(() => on.filter((c) => !(c.nickname || '').trim()).length, [on]);
  const dischargedNames = useMemo(() => [...new Set(removals.map((r) => r.label).filter(Boolean))], [removals]);
  // Stale once the caseload has changed since the backup, or a fortnight has
  // gone by, or there has never been one at all.
  const backupStale = useMemo(() => {
    if (!clients.length) return false;
    if (!lastBackup) return true;
    if (lastBackup.count !== clients.length) return true;
    return (Date.now() - new Date(lastBackup.at).getTime()) > 14 * 86400000;
  }, [clients.length, lastBackup]);

  return (
    <section className="mt-5">
      <div className="card">
        <div className="card-title"><Download size={16} /> Download calendars</div>
        <p className="hint">
          {!clients.length
            ? 'Add clients first.'
            : !on.length
              ? 'Every client is switched off below — tick at least one back on.'
              : headsUp
                ? `${dues} deadline${dues === 1 ? '' : 's'} across ${on.length} client${on.length === 1 ? '' : 's'}, plus ${total - dues} advance warnings — ${total} entries in all.`
                : `${dues} deadline${dues === 1 ? '' : 's'} across ${on.length} client${on.length === 1 ? '' : 's'}, with reminders built in.`}
        </p>
        <div className="export-choice mt-3">
          <button className="big-btn" onClick={exportAllCombined} disabled={!on.length}>
            <CalendarDays size={17} />
            <span>
              <strong>One file, all {on.length} client{on.length === 1 ? '' : 's'}</strong>
              <em>A single import into your work calendar. Simplest — start here.</em>
            </span>
          </button>
          <button className="big-btn big-btn-quiet" onClick={exportAllZipped} disabled={!on.length}>
            <Package size={17} />
            <span>
              <strong>Separate file per client (.zip)</strong>
              <em>Import each into its own Google calendar so families can be toggled and colour-coded individually. {on.length} import{on.length === 1 ? '' : 's'}.</em>
            </span>
          </button>
        </div>

        <label className="heads-up mt-4">
          <input type="checkbox" checked={headsUp} onChange={(e) => setHeadsUp(e.target.checked)} />
          <span>
            <strong>Put the advance warnings on the calendar, not just in a notification.</strong>
            <br />
            Each reminder lead time becomes its own all-day entry that many days earlier —
            <em> ⏳ 30 days · 6-month reassessment due</em> — so you can see what is coming
            while you plan the week. The due date itself reads <em>🔴</em>, and anything
            already past reads <em>⚠ OVERDUE</em>. Turn this off to go back to a single
            entry per deadline with pop-up reminders only.
          </span>
        </label>

        {pastCount > 0 && (
          <label className="skip-past mt-4">
            <input type="checkbox" checked={skipPast} onChange={(e) => setSkipPast(e.target.checked)} />
            <span>
              <strong>Leave out the {pastCount} date{pastCount === 1 ? '' : 's'} that already passed.</strong>
              <br />
              Families already months into service have baselines and plan reviews behind them.
              Importing those puts stale entries back through your calendar. They stay visible
              under <em>What&apos;s coming</em> either way, and birthdays and the 90-day SNIFF are
              never dropped.
            </span>
          </label>
        )}

        <div className="per-client mt-4">
          <div className="field-label">Names inside the calendar</div>
          <p className="hint">
            A calendar file travels — onto a phone, into a synced account, in front of
            everyone the calendar is shared with, and it cannot be unshared. So full names
            never go into one. Names stay here, where you need them to tell clients apart;
            only initials or a nickname leave.
            {nameStyle === 'nickname' && missingNicknames > 0
              ? ` ${missingNicknames} client${missingNicknames === 1 ? ' has' : 's have'} no nickname yet — ${missingNicknames === 1 ? 'that one falls' : 'those fall'} back to initials.`
              : ''}
          </p>
          <div className="flex gap-2 flex-wrap mt-2">
            <button
              className={'seg ' + (nameStyle === 'initials' ? 'seg-on' : '')}
              onClick={() => setNameStyle('initials')}
            >
              Initials
            </button>
            <button
              className={'seg ' + (nameStyle === 'nickname' ? 'seg-on' : '')}
              onClick={() => setNameStyle('nickname')}
            >
              Nicknames
            </button>
          </div>
          {clients.length > 0 && (
            <div className="preview-line mt-2">
              Events will read <strong>{displayName(on[0] || clients[0], nameStyle)} — 6-month reassessment due</strong>
            </div>
          )}
        </div>

        {clients.length > 0 && (
          <div className="per-client mt-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="field-label" style={{ marginBottom: 0 }}>Who goes in</div>
              <div className="bulk-actions">
                <button className="mini" onClick={() => setClients((p) => p.map((c) => ({ ...c, skip: false })))}>All</button>
                <button className="mini" onClick={() => setClients((p) => p.map((c) => ({ ...c, skip: true })))}>None</button>
              </div>
            </div>
            <p className="hint mt-2">
              Unticking leaves a client out of both downloads above. The arrow grabs
              that one client on its own.
              {nameStyle === 'nickname' ? ' Type each nickname here — blank falls back to initials.' : ''}
            </p>
            {clients.map((c) => {
              const built = buildClientIcs(c, { categories, skipPast, headsUp, leadTimes });
              return (
                <div className={'pick-row ' + (c.skip ? 'pick-off' : '')} key={c.id}>
                  <label className="pick-main">
                    <input type="checkbox" checked={!c.skip} onChange={(e) => setSkip(c.id, !e.target.checked)} />
                    <span className="min-w-0">
                      <span className="pick-name">{c.name || 'Unnamed client'}</span>
                      <span className="pick-meta">
                        goes in as <strong>{displayName(c, nameStyle)}</strong> · {built.dueCount} deadline{built.dueCount === 1 ? '' : 's'}
                        {headsUp && built.count > built.dueCount ? ` · ${built.count - built.dueCount} warnings` : ''}
                      </span>
                    </span>
                  </label>
                  {nameStyle === 'nickname' && (
                    <input
                      className="in nick-in"
                      value={c.nickname || ''}
                      placeholder={displayName(c, 'initials')}
                      onChange={(e) => setNickname(c.id, e.target.value)}
                      aria-label={`Nickname for ${c.name || 'this client'}`}
                    />
                  )}
                  <button className="icon-btn" onClick={() => exportClient(c)} title={`Download just ${c.name || 'this client'}`}>
                    <Download size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {removals.length > 0 && (
        <div className="card mt-3 removal-card">
          <div className="card-title"><Archive size={16} /> Clear discharged clients</div>
          <p className="hint">
            {dischargedNames.length} discharged client{dischargedNames.length === 1 ? '' : 's'}
            {' '}({dischargedNames.join(', ')}) still {dischargedNames.length === 1 ? 'has' : 'have'}
            {' '}{removals.length} entr{removals.length === 1 ? 'y' : 'ies'} sitting in whatever
            calendar you sent them to. Importing only ever adds and updates, so these have to
            be cancelled on purpose.
          </p>
          <ol className="steps mt-2">
            <li>Download the removal file.</li>
            <li>Import it into <strong>the same calendar</strong> the originals went to.</li>
            <li>Their entries disappear for you and for everyone the calendar is shared with.</li>
          </ol>
          <div className="flex gap-2 flex-wrap mt-3">
            <button className="btn-primary" onClick={exportRemovals}>
              <Download size={16} /> Removal file ({removals.length})
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                if (window.confirm('Clear this list without downloading?\n\nOnly do this if those dates were never sent to a calendar, or you have already removed them by hand.')) setRemovals([]);
              }}
            >
              <Undo2 size={15} /> Already handled
            </button>
          </div>
        </div>
      )}

      <div className="card mt-3">
        <div className="card-title"><Settings2 size={16} /> Reminders</div>
        <p className="hint">Days ahead of the due date. Comma-separated; 0 means the day itself.</p>
        {CATEGORY_ORDER.map((key) => (
          <div className="lead-row" key={key}>
            <label className="lead-check">
              <input
                type="checkbox"
                checked={categories.includes(key)}
                onChange={(e) =>
                  setCategories(e.target.checked
                    ? CATEGORY_ORDER.filter((k) => k === key || categories.includes(k))
                    : categories.filter((k) => k !== key))
                }
              />
              <span>{CATEGORY_LABELS[key]}</span>
            </label>
            <input
              className="in lead-in"
              value={(leadTimes[key] || []).join(', ')}
              onChange={(e) => {
                const days = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => Number.isFinite(n) && n >= 0 && n <= 365);
                setLeadTimes({ ...leadTimes, [key]: days });
              }}
              inputMode="numeric"
              aria-label={`${CATEGORY_LABELS[key]} reminder days`}
            />
          </div>
        ))}
        <button className="btn-ghost mt-2" onClick={() => { setLeadTimes(DEFAULT_LEAD_TIMES); setCategories(CATEGORY_ORDER); }}>
          <RotateCcw size={15} /> Back to defaults
        </button>
      </div>

      <div className="card mt-3">
        <div className="card-title"><ExternalLink size={16} /> Getting these into your calendar</div>
        <ol className="steps">
          <li>
            <strong>Google Calendar.</strong> Open{' '}
            <a href="https://calendar.google.com/calendar/u/0/r/settings/export" target="_blank" rel="noreferrer">
              Settings → Import &amp; export
            </a>, choose the downloaded <code>.ics</code>, pick which calendar it goes into,
            and press Import. Do it once per client file and each family lands in its own
            calendar you can toggle on and off.
          </li>
          <li>
            <strong>Apple Calendar / iPhone.</strong> Open the <code>.ics</code> file — it
            offers to add the events. On a Mac, File → Import lets you send them to a new
            calendar named for the client.
          </li>
          <li>
            <strong>Outlook.</strong> File → Open &amp; Export → Import an iCalendar (.ics),
            then choose <em>Open as New Calendar</em>.
          </li>
          <li>
            The reminders travel inside the file, so once it is imported your calendar app
            does the alerting — a week before every birthday, a month before every 6-month.
          </li>
          <li>
            Re-import after you change a date and the matching events update in place
            rather than doubling up.
          </li>
        </ol>
      </div>

      <div className="card mt-3">
        <div className="card-title"><Save size={16} /> Backup</div>
        <p className="hint">
          Clients live in this browser only. A backup file moves them to another device or
          brings them back after clearing site data — and it carries the hidden ids your
          calendar entries are matched on, which is what lets a re-import update an entry
          instead of adding a second copy of it. Lose those and Google gets duplicates of
          everything.
        </p>
        {backupStale && (
          <div className="issue issue-warn mt-2">
            <AlertTriangle size={13} />
            {!lastBackup
              ? 'No backup taken yet.'
              : `Last backup ${formatDate(lastBackup.at.slice(0, 10))}, when you had ${lastBackup.count} client${lastBackup.count === 1 ? '' : 's'}.`}
            {' '}Worth doing now.
          </div>
        )}
        {!backupStale && lastBackup && (
          <div className="issue issue-ok mt-2">
            <Check size={13} /> Backed up {formatDate(lastBackup.at.slice(0, 10))}.
          </div>
        )}
        <div className="flex gap-2 flex-wrap mt-3">
          <button className="btn-quiet" onClick={backup} disabled={!clients.length}>
            <Download size={15} /> Save backup
          </button>
          <button className="btn-quiet" onClick={() => fileRef.current?.click()}>
            <RotateCcw size={15} /> Restore
          </button>
          <input
            ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f); e.target.value = ''; }}
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
