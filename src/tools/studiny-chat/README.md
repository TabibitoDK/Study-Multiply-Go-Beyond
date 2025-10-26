# Studiny Chat Embed

Use this package-style folder to drop the Studiny Chat experience into any React + Vite project.

## Files

- `StudinyChat.jsx` – main component (accepts an optional `apiKey`, `title`, and `onBackClick`)
- `StudinyChat.css` – scoped styling used by the component
- `AppLogo.jsx` – inline SVG logo used inside the header/empty state
- `index.js` – convenience re-export

## Usage

1. Copy the entire `studiny-chat` folder into your target project (for example, inside `src/features/studiny-chat`).
2. Ensure the project can resolve remote ESM imports. Vite handles this out of the box, so no extra configuration is needed.
3. Provide a Gemini API key via either:
   - The `apiKey` prop: `<StudinyChat apiKey="YOUR_KEY" />`
   - A Vite environment variable `VITE_GEMINI_API_KEY` (the prop takes precedence when provided).
4. Import and render the component:

```jsx
import { StudinyChat } from './studiny-chat';
import './studiny-chat/StudinyChat.css';

export default function Example() {
  return <StudinyChat title="Studiny Chat" />;
}
```

The component lazy-loads `jspdf` and `marked` from CDNs the first time it mounts, so PDF export works without additional setup.
