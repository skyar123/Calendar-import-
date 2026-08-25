import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertTriangle, Archive, Cake, CalendarDays, Check, ChevronDown, ClipboardPaste,
  Download, ExternalLink, HelpCircle, Info, Plus, Printer, Trash2, Users, X,
} from 'lucide-react';

import {
  CATEGORY_LABELS, DEFAULT_LEAD_TIMES, formatAge, formatDate, getClientSchedule,
  getAgeInMonths, getIssues, getOverdue, getRelativeDue, getUpcoming, parseDate, todayISO,
} from './rules.js';
import { parseCaseload, uid } from './parse.js';
import {
  buildCaseloadIcs, buildClientIcs, buildRemovalIcs, buildZip, downloadBlob,
  downloadText, displayName, exportedUids, googleCalendarUrl, slug,
} from './ics.js';
import ExportTab, { CATEGORY_ORDER } from './ExportTab.jsx';
import Tutorial from './Tutorial.jsx';
import Styles from './Styles.jsx';

/* ============================================================
   DUE DATES : paste two dates per client, get a calendar back.
   Sole purpose — deadlines and birthday reminders, exported per
   client as .ics. Phone-first. Autosaves. Nothing leaves the browser.
   ============================================================ */

const STORE_KEY = 'cf_duedates_v1';

const emptyClient = () => ({
  id: uid(), name: '', nickname: '', dob: '', caregiverName: '', caregiverDob: '',
  intakeDate: '', birthDate: '', authExpires: '', type: 'child', notes: '',
});

// Names are compared loosely — punctuation, spacing and "Last, First" order all
// vary between a caseload export and something typed by hand.
const nameKey = (s) => String(s || '')
  .toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

/**
 * Is this parsed row the same child as one already on the list? A shared date of
 * birth plus either the same name or the same intake date is treated as a match;
 * date of birth alone is not, since siblings and twins share one.
 */
export const isSameClient = (a, b) => {
  if (!a || !b) return false;
  const sameDob = !!a.dob && a.dob === b.dob;
  const sameName = !!nameKey(a.name) && nameKey(a.name) === nameKey(b.name);
  const sameIntake = !!a.intakeDate && a.intakeDate === b.intakeDate;
  if (sameDob && (sameName || sameIntake)) return true;
  return sameName && sameIntake;
};

/**
 * Guarantees every client has an id of their own.
 *
 * A client's id is what their calendar UIDs are built from, so two clients
 * sharing one would have their entries merged into a single event by any
 * calendar app — one family's deadlines quietly replacing another's. Ids are
 * generated uniquely, but a hand-edited backup or a file copied between devices
 * can arrive with duplicates or none, so they are repaired on the way in.
 */
const withUniqueIds = (list) => {
  const seen = new Set();
  return list.map((c) => {
    const id = c?.id && !seen.has(c.id) ? c.id : uid();
    seen.add(id);
    return { ...c, id };
  });
};

// Only carry over fields the paste actually filled in, so re-pasting a trimmed
// export never blanks out a detail that was added by hand.
const stripEmpty = (row) =>
  Object.fromEntries(Object.entries(row).filter(([k, v]) => k !== 'id' && v !== '' && v != null));

const SAMPLE = `Ramirez, Ava (23641)   4/12/2024   F   4/12/2024   999-99-9999   CF-AA   RHA Behavioral Health   2/03/2026 12:00 PM   Medicaid
Nia B. — DOB 8/30/2022, caregiver DOB 5/2/1994, intake 11/17/2025
Theo W, 2025-01-09, 2026-04-01`;

// ---------------------------------------------------------------------------

export default function App() {
  const [clients, setClients] = useState([]);
  const [leadTimes, setLeadTimes] = useState(DEFAULT_LEAD_TIMES);
  const [categories, setCategories] = useState(CATEGORY_ORDER);
  const [skipPast, setSkipPast] = useState(true);
  const [headsUp, setHeadsUp] = useState(true);
  // Entries already sent to a calendar for clients who have since been
  // discharged. Importing adds and updates but never removes, so these have to
  // be cancelled explicitly or a closed case haunts a shared calendar.
  const [removals, setRemovals] = useState([]);
  // When the last backup was taken, and of how many clients. Losing this
  // browser's storage loses the client ids, and with them the ability of a
  // re-import to update rather than duplicate — so the nudge is worth showing.
  const [lastBackup, setLastBackup] = useState(null);
  // The walkthrough runs itself once, then only when asked for. It waits for
  // storage to be read first — opening it over a caseload that was about to
  // load would be the wrong greeting for a returning user.
  const [tutorial, setTutorial] = useState(false);
  const [tutorialSeen, setTutorialSeen] = useState(true);
  const [tab, setTab] = useState('clients');
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState('');

  // ---- load / autosave ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) { setTutorialSeen(false); setTutorial(true); }
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.clients)) setClients(withUniqueIds(saved.clients));
        if (saved.leadTimes) setLeadTimes({ ...DEFAULT_LEAD_TIMES, ...saved.leadTimes });
        if (Array.isArray(saved.categories) && saved.categories.length) setCategories(saved.categories);
        if (typeof saved.skipPast === 'boolean') setSkipPast(saved.skipPast);
        if (typeof saved.headsUp === 'boolean') setHeadsUp(saved.headsUp);
        if (Array.isArray(saved.removals)) setRemovals(saved.removals);
        if (saved.lastBackup) setLastBackup(saved.lastBackup);
        if (!saved.tutorialSeen) { setTutorialSeen(false); setTutorial(true); }
      }
    } catch {
      /* corrupt or unavailable storage — start clean rather than blocking the app */
      setTutorialSeen(false);
      setTutorial(true);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ clients, leadTimes, categories, skipPast, headsUp, removals, lastBackup, tutorialSeen }));
    } catch {
      /* private mode / quota — the export buttons still work */
    }
  }, [clients, leadTimes, categories, skipPast, headsUp, removals, lastBackup, tutorialSeen, loaded]);

  const closeTutorial = () => { setTutorial(false); setTutorialSeen(true); };

  const say = (message) => {
    setToast(message);
    setTimeout(() => setToast((t) => (t === message ? '' : t)), 3200);
  };

  const exportOpts = { leadTimes, categories, skipPast, headsUp };

  // ---- exports ----
  const exportClient = (client) => {
    const { ics, count } = buildClientIcs(client, exportOpts);
    if (!count) return say('Nothing to export for this client yet — add an intake date or a birthday.');
    downloadText(ics, `${slug(displayName(client))}-due-dates.ics`);
    say(`${count} date${count === 1 ? '' : 's'} exported for ${client.name}.`);
  };

  const exportAllCombined = () => {
    const { ics, count } = buildCaseloadIcs(clients, exportOpts);
    if (!count) return say('No dates to export yet.');
    downloadText(ics, `child-first-caseload-${clients.filter((c) => !c.skip).length}-clients-${todayISO()}.ics`);
    say(`${count} entries exported in one calendar.`);
  };

  const exportAllZipped = () => {
    const files = clients
      .map((c) => ({ client: c, built: buildClientIcs(c, exportOpts) }))
      .filter(({ built }) => built.count > 0)
      .map(({ client, built }) => ({ name: `${slug(displayName(client))}-due-dates.ics`, text: built.ics }));
    if (!files.length) return say('No dates to export yet.');
    downloadBlob(buildZip(files), `child-first-calendars-${todayISO()}.zip`);
    say(`${files.length} client calendar${files.length === 1 ? '' : 's'} zipped.`);
  };

  // Discharging keeps the tombstones and drops the client. The entries stay
  // recorded until the removal file has actually been imported, since that is
  // the only thing that clears them from a calendar.
  const discharge = (client, { quiet = false } = {}) => {
    const label = displayName(client);
    const marks = exportedUids(client, { leadTimes }).map((t) => ({ ...t, label }));
    setRemovals((prev) => [...prev, ...marks]);
    setClients((prev) => prev.filter((c) => c.id !== client.id));
    if (!quiet) say(`${label} discharged — download the removal file to clear their dates.`);
  };

  const exportRemovals = () => {
    const { ics, count } = buildRemovalIcs(removals);
    if (!count) return say('Nothing to remove.');
    downloadText(ics, `child-first-remove-${todayISO()}.ics`);
    say(`${count} entries marked for removal. Import this into the same calendar.`);
  };

  const backup = () => {
    downloadText(JSON.stringify({ version: 1, savedAt: new Date().toISOString(), clients, leadTimes, categories, skipPast, headsUp, removals }, null, 2),
      `due-dates-backup-${todayISO()}.json`, 'application/json');
    setLastBackup({ at: new Date().toISOString(), count: clients.length });
    say('Backup saved.');
  };

  const restore = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.clients)) throw new Error('no clients');
        setClients(withUniqueIds(data.clients));
        if (data.leadTimes) setLeadTimes({ ...DEFAULT_LEAD_TIMES, ...data.leadTimes });
        if (Array.isArray(data.categories) && data.categories.length) setCategories(data.categories);
        if (typeof data.skipPast === 'boolean') setSkipPast(data.skipPast);
        if (typeof data.headsUp === 'boolean') setHeadsUp(data.headsUp);
        if (Array.isArray(data.removals)) setRemovals(data.removals);
        say(`Restored ${data.clients.length} client${data.clients.length === 1 ? '' : 's'}.`);
      } catch {
        say('That file did not look like a Due Dates backup.');
      }
    };
    reader.readAsText(file);
  };

  const upcoming = useMemo(
    () => getUpcoming(clients, { days: 60 }).filter((m) => categories.includes(m.category)),
    [clients, categories]
  );
  const overdue = useMemo(
    () => getOverdue(clients).filter((m) => categories.includes(m.category)),
    [clients, categories]
  );

  return (
    <div className="app">
      <Styles />
      <div className="shell">
        <header className="pt-8 pb-6">
          <div className="eyebrow">Child First · deadlines only</div>
          <h1 className="brand">Due&nbsp;Dates</h1>
          <p className="tagline">
            Paste a birthday and an intake date. Get every deadline that follows — plus
            birthday reminders a week ahead and the 6-month a month ahead — as a calendar
            you can import per client.
          </p>
          <div className="privacy mt-4">
            Everything stays in this browser. Nothing is uploaded, and no account is
            involved. Calendar entries carry initials, a date of birth and an age — never
            a name.
          </div>
        </header>

        <nav className="tabs" role="tablist">
          <TabButton id="clients" tab={tab} setTab={setTab} icon={Users}>
            Clients{clients.length ? ` (${clients.length})` : ''}
          </TabButton>
          <TabButton id="calendar" tab={tab} setTab={setTab} icon={CalendarDays}>
            What&apos;s coming
          </TabButton>
          <TabButton id="export" tab={tab} setTab={setTab} icon={Download}>Export</TabButton>
        </nav>

        {tab === 'clients' && (
          <ClientsTab
            clients={clients} setClients={setClients}
            exportClient={exportClient} say={say} categories={categories} discharge={discharge}
          />
        )}

        {tab === 'calendar' && (
          <CalendarTab clients={clients} upcoming={upcoming} overdue={overdue} />
        )}

        {tab === 'export' && (
          <ExportTab
            clients={clients} setClients={setClients} leadTimes={leadTimes} setLeadTimes={setLeadTimes}
            categories={categories} setCategories={setCategories}
            skipPast={skipPast} setSkipPast={setSkipPast}
            removals={removals} setRemovals={setRemovals} exportRemovals={exportRemovals}
            lastBackup={lastBackup}
            headsUp={headsUp} setHeadsUp={setHeadsUp}
            exportClient={exportClient} exportAllCombined={exportAllCombined}
            exportAllZipped={exportAllZipped} backup={backup} restore={restore}
          />
        )}

        <footer className="foot">
          Deadlines are computed from the intake date using the Child First protocol
          intervals — baseline and initial plan at 60 days, SNIFF every 90, plan reviews
          every 90, the 6-month at 180, the annual window at 365. They are a planning aid,
          not the record. Check anything that matters against CFCR.
          <div>
            <button className="tut-replay" onClick={() => setTutorial(true)}>
              <HelpCircle size={13} /> Replay the tutorial
            </button>
          </div>
        </footer>
      </div>

      {tutorial && <Tutorial onClose={closeTutorial} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function TabButton({ id, tab, setTab, icon: Icon, children }) {
  return (
    <button
      className={'tab ' + (tab === id ? 'tab-on' : '')}
      role="tab" aria-selected={tab === id}
      onClick={() => setTab(id)}
    >
      <Icon size={15} /> {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------------------

function ClientsTab({ clients, setClients, exportClient, say, categories, discharge }) {
  const [paste, setPaste] = useState('');
  const [review, setReview] = useState(null);
  const [skipped, setSkipped] = useState([]);
  const [declaredCount, setDeclaredCount] = useState(null);
  // Clients on the list who were not in this paste. Off by default: a paste of
  // one client is not evidence that the other fifteen have closed.
  const [dischargeAbsent, setDischargeAbsent] = useState(false);

  const read = () => {
    const { clients: parsed, skipped: missed, declaredCount: declared } = parseCaseload(paste);
    if (!parsed.length) {
      say(missed.length ? 'No dates found in that paste — check the review tips below.' : 'Nothing to read yet.');
      setSkipped(missed);
      return;
    }
    setReview(parsed);
    setSkipped(missed);
    setDeclaredCount(declared);
    setDischargeAbsent(false);
  };

  // Who is on the list but absent from this paste — the families that have
  // closed since last time. Re-pasting can add and update on its own, but only
  // this comparison can notice a departure.
  const absent = review
    ? clients.filter((c) => !review.some((r) => isSameClient(c, r)))
    : [];

  // Re-pasting the caseload is the normal way to keep it current, so a row that
  // matches someone already on the list updates them in place instead of
  // creating a second copy of the same child.
  const commit = () => {
    let added = 0;
    let updated = 0;
    setClients((prev) => {
      const next = [...prev];
      review.forEach((row) => {
        const at = next.findIndex((c) => isSameClient(c, row));
        if (at === -1) { next.push(row); added++; return; }
        // Keep the existing id (its calendar UIDs are built from it) and any
        // detail the paste does not carry, such as a logged birth date.
        next[at] = { ...next[at], ...stripEmpty(row), id: next[at].id };
        updated++;
      });
      return next;
    });
    if (dischargeAbsent) absent.forEach((c) => discharge(c, { quiet: true }));
    const parts = [];
    if (added) parts.push(`Added ${added}`);
    if (updated) parts.push(`updated ${updated}`);
    if (dischargeAbsent && absent.length) parts.push(`discharged ${absent.length}`);
    say(`${parts.join(', ')}.`);
    setReview(null);
    setPaste('');
    setSkipped([]);
    setDeclaredCount(null);
  };

  const update = (id, patch) =>
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id) => setClients((prev) => prev.filter((c) => c.id !== id));

  return (
    <section>
      {!review && (
        <div className="card mt-5">
          <div className="card-title"><ClipboardPaste size={16} /> Paste your caseload</div>
          <p className="hint">
            One client per line. It reads caseload exports, spreadsheet rows, and plain
            notes like <code>Ava R — DOB 4/12/2024, intake 2/3/2026</code>. Social security
            numbers are stripped before anything is read.
          </p>
          <textarea
            className="ta paste"
            rows={6}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={SAMPLE}
            spellCheck={false}
          />
          <div className="flex gap-2 flex-wrap mt-3">
            <button className="btn-primary" onClick={read} disabled={!paste.trim()}>
              <Check size={16} /> Read these
            </button>
            <button className="btn-quiet" onClick={() => setPaste(SAMPLE)}>Try an example</button>
            <button
              className="btn-ghost"
              onClick={() => setClients((prev) => [...prev, emptyClient()])}
            >
              <Plus size={15} /> Add one by hand
            </button>
          </div>
          {skipped.length > 0 && (
            <div className="note mt-3">
              {skipped.length} line{skipped.length === 1 ? '' : 's'} had no date and
              {skipped.length === 1 ? ' was' : ' were'} skipped.
            </div>
          )}
        </div>
      )}

      {review && (
        <ReviewTable
          rows={review}
          setRows={setReview}
          existing={clients}
          declaredCount={declaredCount}
          absent={absent}
          dischargeAbsent={dischargeAbsent}
          setDischargeAbsent={setDischargeAbsent}
          onConfirm={commit}
          onCancel={() => setReview(null)}
        />
      )}

      {clients.length === 0 && !review && (
        <div className="empty mt-5">No clients yet. Paste a few lines above.</div>
      )}

      {clients.map((c) => (
        <ClientCard
          key={c.id} client={c} categories={categories}
          onChange={(patch) => update(c.id, patch)}
          onRemove={() => remove(c.id)}
          onDischarge={() => discharge(c)}
          onExport={() => exportClient(c)}
        />
      ))}

      {clients.length > 1 && (
        <button
          className="btn-ghost mt-4"
          onClick={() => { if (confirm2(clients.length)) setClients([]); }}
        >
          <Trash2 size={15} /> Clear all clients
        </button>
      )}
    </section>
  );
}

const confirm2 = (n) =>
  window.confirm(`Remove all ${n} clients from this browser? Export or back up first if you want to keep them.`);

function ReviewTable({
  rows, setRows, existing = [], declaredCount = null,
  absent = [], dischargeAbsent = false, setDischargeAbsent = () => {},
  onConfirm, onCancel,
}) {
  const set = (id, patch) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const drop = (id) => setRows(rows.filter((r) => r.id !== id));

  const matches = rows.map((r) => existing.find((c) => isSameClient(c, r)) || null);
  const updating = matches.filter(Boolean).length;
  const countOff = declaredCount != null && declaredCount !== rows.length;
  // The same child pasted twice in one go — two spellings of a name, or a row
  // copied by accident. Merging would hide it, so it is called out instead.
  const twins = rows.map((r, i) => rows.findIndex((o) => isSameClient(o, r)) !== i);
  const dupes = twins.filter(Boolean).length;
  // A paste covering only a fraction of the list is probably not the whole
  // caseload, and absence from it means nothing.
  const partial = rows.length * 2 < existing.length;

  return (
    <div className="card mt-5 review">
      <div className="card-title"><Check size={16} /> Check these before they go in</div>
      <p className="hint">
        Fix anything that landed in the wrong column — the birthday and the intake date are
        the two that drive every deadline.
      </p>

      {countOff && (
        <div className="issue issue-warn mt-2">
          <AlertTriangle size={13} /> The paste says {declaredCount} client
          {declaredCount === 1 ? '' : 's'}, but {rows.length} row
          {rows.length === 1 ? '' : 's'} came through — a line may not have copied cleanly.
        </div>
      )}
      {declaredCount != null && !countOff && (
        <div className="issue issue-ok mt-2">
          <Check size={13} /> All {declaredCount} clients on the paste came through.
        </div>
      )}
      {dupes > 0 && (
        <div className="issue issue-warn mt-2">
          <AlertTriangle size={13} /> {dupes} row{dupes === 1 ? '' : 's'} in this paste
          look{dupes === 1 ? 's' : ''} like a client already listed above it — drop the
          repeat with the ✕ unless they really are different people.
        </div>
      )}
      {updating > 0 && (
        <div className="issue issue-info mt-2">
          <Info size={13} /> {updating} of these {updating === 1 ? 'is' : 'are'} already on your
          list — {updating === 1 ? 'it' : 'they'} will be updated, not added twice.
        </div>
      )}

      {absent.length > 0 && (
        <label className={'absent-box mt-3 ' + (dischargeAbsent ? 'absent-on' : '')}>
          <input
            type="checkbox" checked={dischargeAbsent}
            onChange={(e) => setDischargeAbsent(e.target.checked)}
          />
          <span>
            <strong>
              {absent.length} client{absent.length === 1 ? '' : 's'} on your list
              {absent.length === 1 ? ' is' : ' are'} not in this paste — discharge
              {absent.length === 1 ? ' them' : ' them'}?
            </strong>
            <br />
            {absent.map((c) => c.name || 'Unnamed').join(', ')}
            <br />
            {partial
              ? 'This paste is much smaller than your list, so it may not be your whole caseload. Leave this alone unless it is.'
              : 'Ticking this takes them off the list and queues their dates for removal from any calendar you sent them to.'}
          </span>
        </label>
      )}

      {rows.map((r, i) => (
        <div className={'review-row ' + (twins[i] ? 'review-dupe' : '')} key={r.id}>
          {matches[i] && (
            <div className="dupe-tag">Updates {matches[i].name || 'an existing client'}</div>
          )}
          <div className="review-grid">
            <Field label="Name">
              <input className="in" value={r.name} onChange={(e) => set(r.id, { name: e.target.value })} />
            </Field>
            <Field label="Child DOB">
              <input className="in" type="date" value={r.dob} onChange={(e) => set(r.id, { dob: e.target.value })} />
            </Field>
            <Field label="Intake date">
              <input className="in" type="date" value={r.intakeDate} onChange={(e) => set(r.id, { intakeDate: e.target.value })} />
            </Field>
            <Field label="Caregiver DOB (optional)">
              <input className="in" type="date" value={r.caregiverDob} onChange={(e) => set(r.id, { caregiverDob: e.target.value })} />
            </Field>
          </div>
          <IssueList issues={getIssues(r)} />
          <button className="icon-btn review-drop" onClick={() => drop(r.id)} aria-label="Drop this row">
            <X size={16} />
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-4 flex-wrap">
        <button className="btn-primary" onClick={onConfirm} disabled={!rows.length}>
          <Plus size={16} />
          {updating === rows.length
            ? `Update ${rows.length} client${rows.length === 1 ? '' : 's'}`
            : updating > 0
              ? `Add ${rows.length - updating}, update ${updating}`
              : `Add ${rows.length} client${rows.length === 1 ? '' : 's'}`}
        </button>
        <button className="btn-quiet" onClick={onCancel}>Back to the paste box</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function IssueList({ issues }) {
  if (!issues.length) return null;
  return (
    <div className="issues">
      {issues.map((i, n) => (
        <div key={n} className={'issue issue-' + i.level}>
          {i.level === 'info' ? <Info size={13} /> : <AlertTriangle size={13} />} {i.message}
        </div>
      ))}
    </div>
  );
}

function ClientCard({ client, categories, onChange, onRemove, onDischarge, onExport }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(!client.name || client.name === 'Unnamed client');

  const schedule = useMemo(
    () => getClientSchedule(client).filter((m) => categories.includes(m.category)),
    [client, categories]
  );
  // What the collapsed card leads with: the oldest thing already past due, or
  // failing that the next date ahead. Overdue work should never hide behind a
  // deadline that is still comfortably in the future.
  const next = useMemo(() => {
    const today = todayISO();
    return schedule.find((m) => m.date < today && m.category !== 'birthday')
      || schedule.find((m) => m.date >= today)
      || null;
  }, [schedule]);
  const overdueCount = useMemo(
    () => schedule.filter((m) => m.date < todayISO() && m.category !== 'birthday').length,
    [schedule]
  );
  const issues = getIssues(client);
  const rel = next ? getRelativeDue(next.date) : null;

  // Which of this client's deadlines are switched off. Ticking one off means
  // "this is handled — keep it out of my calendar"; the deadline still shows
  // here, greyed, so it can be switched back on.
  const setExcluded = (excluded) => onChange({ excluded });
  const toggleOne = (id) => setExcluded({ ...(client.excluded || {}), [id]: !client.excluded?.[id] });
  const included = schedule.filter((m) => !client.excluded?.[m.id]).length;
  const allOff = Object.fromEntries(schedule.map((m) => [m.id, true]));
  // "Caught up" drops everything already past — the baselines and reviews a
  // family months into service has behind them — and leaves what is still ahead.
  const past = schedule.filter((m) => !m.recurrence && m.date < todayISO());
  const pastDue = past.length;
  const pastOff = { ...(client.excluded || {}), ...Object.fromEntries(past.map((m) => [m.id, true])) };

  return (
    <div className={'card client-card mt-3 ' + (open ? 'card-open' : '')}>
      <div className="case-row">
        <button className="case-open" onClick={() => setOpen(!open)} aria-expanded={open}>
          <div className="min-w-0">
            <div className="case-name">
              {client.name || 'Unnamed client'}
              {client.dob && <span className="case-age"> · {formatAge(client.dob)}</span>}
            </div>
            <div className="case-meta">
              {client.intakeDate ? `Intake ${formatDate(client.intakeDate)}` : 'No intake date'}
              {client.dob ? ` · Born ${formatDate(client.dob)}` : ''}
              {` · ${schedule.length} date${schedule.length === 1 ? '' : 's'}`}
            </div>
            {next && rel && (
              <div className={'due-chip tone-' + rel.tone}>
                {next.category === 'birthday' ? <Cake size={12} /> : <CalendarDays size={12} />}
                {next.label} · {rel.label}
                {overdueCount > 1 && ` · +${overdueCount - 1} more past due`}
              </div>
            )}
          </div>
          <ChevronDown size={18} className={'chev ' + (open ? 'chev-open' : '')} />
        </button>
        <button className="icon-btn" onClick={onExport} title="Download this client's calendar">
          <Download size={17} />
        </button>
      </div>

      {open && (
        <div className="card-body">
          <IssueList issues={issues} />

          {editing ? (
            <div className="review-grid mt-3">
              <Field label="Name">
                <input className="in" value={client.name} onChange={(e) => onChange({ name: e.target.value })} />
              </Field>
              <Field label="Nickname (for the calendar)">
                <input
                  className="in" value={client.nickname || ''} placeholder={displayName(client, 'initials')}
                  onChange={(e) => onChange({ nickname: e.target.value })}
                />
              </Field>
              <Field label="Child DOB">
                <input className="in" type="date" value={client.dob} onChange={(e) => onChange({ dob: e.target.value })} />
              </Field>
              <Field label="Intake date">
                <input className="in" type="date" value={client.intakeDate} onChange={(e) => onChange({ intakeDate: e.target.value })} />
              </Field>
              <Field label="Caregiver name">
                <input className="in" value={client.caregiverName} onChange={(e) => onChange({ caregiverName: e.target.value })} />
              </Field>
              <Field label="Authorization expires">
                <input
                  className="in" type="date" value={client.authExpires || ''}
                  onChange={(e) => onChange({ authExpires: e.target.value })}
                />
              </Field>
              <Field label="Caregiver DOB">
                <input className="in" type="date" value={client.caregiverDob} onChange={(e) => onChange({ caregiverDob: e.target.value })} />
              </Field>
              <Field label="Enrolled as">
                <select className="in" value={client.type} onChange={(e) => onChange({ type: e.target.value })}>
                  <option value="child">Child at admission</option>
                  <option value="pregnant">Pregnant caregiver at admission</option>
                </select>
              </Field>
              {client.type === 'pregnant' && (
                <Field label="Birth date (once baby arrives)">
                  <input className="in" type="date" value={client.birthDate} onChange={(e) => onChange({ birthDate: e.target.value })} />
                </Field>
              )}
            </div>
          ) : null}

          <div className="flex gap-2 flex-wrap mt-3">
            <button className="btn-ghost" onClick={() => setEditing(!editing)}>
              {editing ? 'Done editing' : 'Edit dates'}
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                if (window.confirm(`Discharge ${client.name || 'this client'}?\n\nThey come off your list, and their dates are queued for removal from any calendar you already sent them to. Download the removal file afterwards to finish the job.`)) onDischarge();
              }}
            >
              <Archive size={15} /> Discharge
            </button>
            <button
              className="btn-ghost danger"
              onClick={() => {
                if (window.confirm(`Delete ${client.name || 'this client'} outright?\n\nNothing is queued for removal — use Discharge instead if their dates are already in a calendar.`)) onRemove();
              }}
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>

          {schedule.length > 0 && (
            <div className="bulk mt-3">
              <span className="bulk-count">
                {included} of {schedule.length} going to the calendar
              </span>
              <div className="bulk-actions">
                <button className="mini" onClick={() => setExcluded({})}>All</button>
                <button className="mini" onClick={() => setExcluded(allOff)}>None</button>
                <button className="mini mini-strong" onClick={() => setExcluded(pastOff)} disabled={!pastDue}>
                  {pastDue ? `Caught up (drop ${pastDue} past due)` : 'Nothing past due'}
                </button>
              </div>
            </div>
          )}

          <div className="sched">
            {schedule.length === 0 && <div className="hint mt-3">Add an intake date or a birthday to build a schedule.</div>}
            {schedule.map((m) => (
              <MilestoneRow
                key={m.id} client={client} m={m}
                included={!client.excluded?.[m.id]}
                onToggle={() => toggleOne(m.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MilestoneRow({ client, m, included = true, onToggle }) {
  const rel = getRelativeDue(m.date);
  const [showItems, setShowItems] = useState(false);
  return (
    <div className={'sched-row ' + (included ? '' : 'sched-off')}>
      <input
        type="checkbox" className="sched-check" checked={included} onChange={onToggle}
        aria-label={`Include ${m.label} in the calendar`}
      />
      <div className="sched-date">
        <div className="sched-day">{formatDate(m.date, 'day')}</div>
        <div className="sched-year">{parseDate(m.date)?.getFullYear()}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="sched-label">
          {m.category === 'birthday' && <Cake size={13} />}
          {m.label.replace(`${client.name} — `, '')}
          {client.dob ? <span className="turning"> · {getAgeInMonths(client.dob, m.date)} mo</span> : null}
          {m.turning ? <span className="turning"> · turns {m.turning}</span> : null}
        </div>
        <div className="sched-meta">
          <span className={'pill pill-' + m.category}>{CATEGORY_LABELS[m.category]}</span>
          {rel && <span className={'tone-text tone-' + rel.tone}>{rel.label}</span>}
          {m.recurrence === 'yearly' && <span className="muted">repeats yearly</span>}
          {m.recurrence === 'every90' && <span className="muted">repeats every 90 days</span>}
        </div>
        {m.items?.length > 0 && (
          <button className="link-btn" onClick={() => setShowItems(!showItems)}>
            {showItems ? 'Hide' : `What's due (${m.items.length})`}
          </button>
        )}
        {showItems && <div className="items">{m.items.join(' · ')}</div>}
      </div>
      <a
        className="icon-btn" title="Add just this one to Google Calendar"
        href={googleCalendarUrl(client, m)} target="_blank" rel="noreferrer"
      >
        <ExternalLink size={15} />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WHAT'S COMING
// ---------------------------------------------------------------------------

function CalendarTab({ clients, upcoming, overdue }) {
  if (!clients.length) {
    return <div className="empty mt-5">Add clients first and the next two months will show up here.</div>;
  }

  const byWeek = groupByWeek(upcoming);

  return (
    <section className="mt-5">
      {overdue.length > 0 && (
        <div className="card overdue-card">
          <div className="card-title"><AlertTriangle size={16} /> Past due ({overdue.length})</div>
          {overdue.map((m) => <UpcomingRow key={m.client.id + m.id} m={m} />)}
        </div>
      )}

      <div className="card mt-3">
        <div className="card-title"><CalendarDays size={16} /> Next 60 days</div>
        {upcoming.length === 0 && <div className="hint">Nothing due in the next 60 days.</div>}
        {byWeek.map(([label, rows]) => (
          <div key={label} className="week">
            <div className="week-label">{label}</div>
            {rows.map((m) => <UpcomingRow key={m.client.id + m.id} m={m} />)}
          </div>
        ))}
      </div>

      <button className="btn-quiet mt-4" onClick={() => window.print()}>
        <Printer size={15} /> Print this list
      </button>
    </section>
  );
}

function groupByWeek(rows) {
  const groups = new Map();
  rows.forEach((m) => {
    const days = getRelativeDue(m.date)?.days ?? 0;
    const label =
      days <= 0 ? 'Today'
      : days <= 7 ? 'This week'
      : days <= 14 ? 'Next week'
      : days <= 30 ? 'Later this month'
      : 'Next month and beyond';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(m);
  });
  return [...groups.entries()];
}

function UpcomingRow({ m }) {
  const rel = getRelativeDue(m.date);
  return (
    <div className="up-row">
      <div className="up-date">{formatDate(m.date, 'day')}</div>
      <div className="min-w-0 flex-1">
        <div className="up-label">
          {m.category === 'birthday' && <Cake size={13} />}
          <strong>{displayName(m.client)}</strong>
          <span className="turning"> {m.client.dob ? `${formatDate(m.client.dob)} · ${getAgeInMonths(m.client.dob, m.date)} mo` : ''}</span>
          {' — '}{m.label.replace(`${m.client.name} — `, '')}
          {m.turning ? <span className="turning"> · turns {m.turning}</span> : null}
        </div>
        <div className="sched-meta">
          <span className={'pill pill-' + m.category}>{CATEGORY_LABELS[m.category]}</span>
          {rel && <span className={'tone-text tone-' + rel.tone}>{rel.label}</span>}
        </div>
      </div>
    </div>
  );
}