import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

const Whiteboard = () => {
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get('meetingId');

  return (
    <div className="whiteboard-page">
      <header className="whiteboard-page__header" role="banner">
        <div className="whiteboard-page__title-group">
          <span className="whiteboard-page__eyebrow">Shared canvas</span>
          <h1 className="whiteboard-page__title">Studygo Whiteboard</h1>
        </div>
        {meetingId ? (
          <Link
            to={`/tools/stream/meeting/${meetingId}`}
            className="whiteboard-page__return"
            aria-label="Return to meeting"
          >
            Return to meeting
          </Link>
        ) : null}
      </header>
      <main className="whiteboard-page__canvas" role="application" aria-label="Collaborative whiteboard">
        <Tldraw autoFocus />
      </main>
    </div>
  );
};

export default Whiteboard;
