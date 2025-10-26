# StudyStream Page Export

Copy this folder into the `src` directory of another Vite + React project to reuse the StudyStream experience as a nested route.

## Usage

1. Install peer dependency used by the whiteboard experience:

   ```bash
   npm install tldraw
   ```

2. Import the routes inside your app router:

   ```jsx
   import { StudyStreamRoutes } from './studystream';

   // Example using react-router
   <Route path="/studygo/*" element={<StudyStreamRoutes />} />
   ```

3. Optionally access the individual pages directly:

   ```jsx
   import { JoinMeeting, MeetingRoom, Whiteboard } from './studystream';
   ```

All styles are bundled in `styles.css` and applied globally when any of the exports are used.
