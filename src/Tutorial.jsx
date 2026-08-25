// ============================================================================
// TUTORIAL OVERLAY — the first-run walkthrough, and the replay behind the
// footer link.
//
// It is a plain overlay rather than a series of spotlights pinned to elements.
// Spotlights have to know where things are, which breaks the moment a button
// moves; this explains the workflow in order and lets you get on with it. It
// can always be left: Escape, the backdrop, or Skip.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ClipboardPaste, Download, ListChecks,
  ShieldCheck, X, CalendarClock, Archive,
} from 'lucide-react';

const STEPS = [
  {
    icon: CalendarClock,
    title: 'Two dates in, a calendar out',
    body: (
      <>
        <p>
          Give this a birthday and an intake date and it works out every Child First
          deadline that follows — baseline, treatment plan reviews, the quarterly SNIFF,
          the 6-month, the annual window — and hands them back as a calendar file.
        </p>
        <p className="tut-quiet">
          That is all it does. It does not track what you have completed and it holds no
          notes. Nothing you type ever leaves this browser.
        </p>
      </>
    ),
  },
  {
    icon: ClipboardPaste,
    title: 'Paste your caseload',
    body: (
      <>
        <p>
          Paste the whole thing — a CFCR caseload export, a spreadsheet, or notes you
          typed. One client per line. It works out which date is the birthday and which
          is the intake.
        </p>
        <pre className="tut-code">Cashwell, Josie (24264) 3/16/2021  F  3/16/2021
999-99-9999  NC-CFCR  3/13/2026 12:00 PM</pre>
        <p className="tut-quiet">
          Social security numbers are stripped before anything is read. If your paste
          says how many clients it holds, that number is checked against how many came
          through, so a line that failed to copy gets reported rather than lost.
        </p>
      </>
    ),
  },
  {
    icon: Check,
    title: 'Check it before it becomes a calendar',
    body: (
      <>
        <p>
          Everything lands in a review table first. The birthday and the intake date are
          the two that drive every deadline, so those are the two worth a glance.
        </p>
        <p>
          It flags a client pasted twice, and tells you if a date looks wrong — an intake
          before a birthday usually means the two are swapped.
        </p>
      </>
    ),
  },
  {
    icon: ListChecks,
    title: 'Decide what actually goes in',
    body: (
      <>
        <p>
          Every deadline has a tick box. Untick the ones already handled and they drop
          out of the export, warnings and all.
        </p>
        <p>
          <strong>Caught up</strong> on a client unticks everything already past, for a
          family that is current and only needs what is ahead. It tells you how many it
          will drop before you press it.
        </p>
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: 'What a calendar entry says',
    body: (
      <>
        <pre className="tut-code">🔴 A.R. 4/12/2024 (27 mo) — 6-month reassessment due
⏳ 30 days · A.R. 4/12/2024 (27 mo) — 6-month reassessment due</pre>
        <p>
          Initials, date of birth, and the child&apos;s age in months <em>on the
          deadline</em> — the number that decides which instrument applies.
        </p>
        <p className="tut-quiet">
          Full names are never written into a calendar file. It travels onto phones, into
          synced accounts, and in front of everyone it is shared with, and it cannot be
          unshared. The names stay here, where you need them.
        </p>
      </>
    ),
  },
  {
    icon: Download,
    title: 'Export, then import once',
    body: (
      <>
        <p>
          <strong>One file, all clients</strong> is the simple path: a single import into
          your work calendar. Take the per-client zip instead if you want each family in
          its own Google calendar, which is also the only way to colour-code them.
        </p>
        <p className="tut-quiet">
          In Google Calendar: Settings → Import &amp; export → choose the file → pick the
          calendar → Import. Sharing that calendar with colleagues means they see every
          later update without doing anything.
        </p>
      </>
    ),
  },
  {
    icon: Archive,
    title: 'Keeping it current',
    body: (
      <>
        <p>
          Paste the whole caseload again whenever it changes. Clients already on your list
          are updated rather than duplicated, and anyone missing from the paste is named
          so you can discharge them.
        </p>
        <p>
          <strong>Discharging</strong> queues that family&apos;s dates for removal —
          importing only ever adds and updates, so a closed case has to be cancelled on
          purpose or it lingers in a shared calendar.
        </p>
        <p className="tut-quiet">
          Take a backup now and then. It carries the hidden ids your entries are matched
          on; without them a re-import gives Google duplicates of everything.
        </p>
      </>
    ),
  },
];

export default function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const cardRef = useRef(null);
  const last = STEPS.length - 1;

  const next = () => (step === last ? onClose() : setStep((s) => s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Escape leaves, arrows move. A walkthrough that traps you is worse than none.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Hold the page still underneath, and put focus where the keys work.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cardRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  const s = STEPS[step];
  const Icon = s.icon;

  return (
    <div className="tut-back" onClick={onClose}>
      <div
        className="tut-card" ref={cardRef} tabIndex={-1}
        role="dialog" aria-modal="true" aria-labelledby="tut-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="tut-x" onClick={onClose} aria-label="Close the tutorial">
          <X size={18} />
        </button>

        <div className="tut-step">Step {step + 1} of {STEPS.length}</div>
        <h2 className="tut-title" id="tut-title"><Icon size={19} /> {s.title}</h2>
        <div className="tut-body">{s.body}</div>

        <div className="tut-dots" role="tablist" aria-label="Tutorial steps">
          {STEPS.map((x, i) => (
            <button
              key={x.title}
              className={'tut-dot ' + (i === step ? 'tut-dot-on' : '')}
              onClick={() => setStep(i)}
              aria-label={`Step ${i + 1}: ${x.title}`}
              aria-selected={i === step}
              role="tab"
            />
          ))}
        </div>

        <div className="tut-actions">
          <button className="btn-ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn-ghost" onClick={onClose}>
            {step === last ? 'Close' : 'Skip'}
          </button>
          <button className="btn-primary" onClick={next}>
            {step === last ? <><Check size={16} /> Start pasting</> : <>Next <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
