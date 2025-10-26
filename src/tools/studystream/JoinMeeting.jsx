import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sampleData from './sampleData.json';

const FRIEND_DIRECTORY = sampleData.friends;
const FRIEND_SUGGESTIONS = FRIEND_DIRECTORY.slice(0, 4);

const GROUP_DIRECTORY = sampleData.groups;
const GROUP_SUGGESTIONS = GROUP_DIRECTORY.slice(0, 3);

const generateMeetingId = (seed = '') => {
  const randomId = Math.random().toString(36).substring(2, 8);
  if (!seed) {
    return randomId;
  }

  const normalizedSeed = seed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
  return normalizedSeed ? `${normalizedSeed}-${randomId}` : randomId;
};

const JoinMeeting = () => {
  const [meetingId, setMeetingId] = useState('');
  const [friendQuery, setFriendQuery] = useState('');
  const [groupQuery, setGroupQuery] = useState('');
  const [previewRoomCode] = useState(() =>
    generateMeetingId()
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 6)
      .toUpperCase()
  );
  const navigate = useNavigate();

  const startNewMeeting = () => {
    navigate(`/meeting/${generateMeetingId()}`);
  };

  const joinMeeting = (event) => {
    event.preventDefault();
    const sanitizedId = meetingId.trim();

    if (sanitizedId) {
      navigate(`/meeting/${sanitizedId}`);
    }
  };

  const normalizedFriendQuery = friendQuery.trim().toLowerCase();
  const normalizedGroupQuery = groupQuery.trim().toLowerCase();

  const friendResults = normalizedFriendQuery
    ? FRIEND_DIRECTORY.filter((friend) => friend.name.toLowerCase().includes(normalizedFriendQuery))
    : FRIEND_SUGGESTIONS;

  const groupResults = normalizedGroupQuery
    ? GROUP_DIRECTORY.filter((group) => group.name.toLowerCase().includes(normalizedGroupQuery))
    : GROUP_SUGGESTIONS;

  const handleStartWith = (label) => {
    navigate(`/meeting/${generateMeetingId(label)}`);
  };

  return (
    <div className="join-layout">
      <header className="meeting-topbar join-topbar">
        <div className="meeting-topbar-left">
          <div className="meeting-heading">
            <h1 className="meeting-title">Meeting Room</h1>
            <p className="meeting-tagline">Study Multiply · Go Beyond</p>
          </div>
        </div>
        <div className="meeting-meta" role="list">
          <span className="meeting-meta-pill" role="listitem">
            Room {previewRoomCode}
          </span>
          <span className="meeting-meta-pill" role="listitem">
            Invite classmates
          </span>
          <span className="meeting-meta-pill" role="listitem">
            Plan ahead
          </span>
        </div>
      </header>

      <main className="join-page">
        <section className="join-card">
          <header className="join-card-header">
            <span className="badge">Studygo Stream</span>
            <h1>Start or join a room</h1>
            <p className="lead">Spin up a fresh room or enter a code to rejoin your group.</p>
          </header>

        <div className="join-actions">
          <button type="button" className="btn-primary" onClick={startNewMeeting}>
            Start a new room
          </button>

          <div className="join-divider">
            <span>or join with a code</span>
          </div>

          <form onSubmit={joinMeeting} className="join-form">
            <input
              type="text"
              value={meetingId}
              onChange={(event) => setMeetingId(event.target.value)}
              placeholder="Enter meeting code"
              aria-label="Meeting code"
            />
            <button type="submit" className="btn-secondary">
              Join
            </button>
          </form>

          <p className="join-hint">Share this room code to invite classmates back any time.</p>
        </div>
      </section>

        <aside className="join-network">
          <header className="network-header">
            <h2>Join with friends</h2>
            <p>Line up the people you usually study with and jump straight into a room together.</p>
          </header>

        <section className="network-section">
          <div className="network-section-header">
            <h3>Friends</h3>
            <span className="network-section-note">Connected from Studygo</span>
          </div>
          <div className="network-search">
            <input
              type="search"
              value={friendQuery}
              onChange={(event) => setFriendQuery(event.target.value)}
              placeholder="Search friends by name"
              aria-label="Search friends"
            />
          </div>
          {normalizedFriendQuery && friendResults.length === 0 ? (
            <p className="network-empty">No matches yet. Try another name or check your spelling.</p>
          ) : (
            <ul className="network-list">
              {friendResults.map((friend) => (
                <li key={friend.name} className="network-item">
                  <div className="network-meta">
                    <strong>{friend.name}</strong>
                    <span>{friend.detail}</span>
                  </div>
                  <button
                    type="button"
                    className="network-action"
                    onClick={() => handleStartWith(friend.name)}
                  >
                    Invite
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="network-section">
          <div className="network-section-header">
            <h3>Groups</h3>
            <span className="network-section-note">Bring everyone in at once</span>
          </div>
          <div className="network-search">
            <input
              type="search"
              value={groupQuery}
              onChange={(event) => setGroupQuery(event.target.value)}
              placeholder="Search groups"
              aria-label="Search groups"
            />
          </div>
          {normalizedGroupQuery && groupResults.length === 0 ? (
            <p className="network-empty">No groups found. Create a new room and share the link.</p>
          ) : (
            <ul className="network-list">
              {groupResults.map((group) => (
                <li key={group.name} className="network-item">
                  <div className="network-meta">
                    <strong>{group.name}</strong>
                    <span>{group.detail}</span>
                  </div>
                  <button
                    type="button"
                    className="network-action"
                    onClick={() => handleStartWith(group.name)}
                  >
                    Start
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        </aside>
      </main>
    </div>
  );
};

export default JoinMeeting;
