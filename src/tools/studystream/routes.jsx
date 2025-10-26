import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import JoinMeeting from './JoinMeeting';
import MeetingRoom from './MeetingRoom';
import Whiteboard from './Whiteboard';

export const StudyStreamRoutes = () => (
  <Routes>
    <Route index element={<JoinMeeting />} />
    <Route path="meeting/:id" element={<MeetingRoom />} />
    <Route path="whiteboard" element={<Whiteboard />} />
    <Route path="*" element={<Navigate to="." replace />} />
  </Routes>
);
