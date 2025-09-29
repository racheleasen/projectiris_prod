# Iris Web

Edge (browser) gaze vector computation with MediaPipe + TS, and Server inference via FastAPI (WebSocket) that runs the original Python class.


## Notes
- Edge mode never sends video by default. Toggle consent to POST **derived** gaze vectors to `/events`.
- Server mode WS is connected in the demo (derived-only response).
- Logs: `data/events.jsonl` local setup only

## Test
- npm run dev 


## Deploy
- Build `server/` to Cloud Run / ECS Fargate.
- Host `frontend/` on Vercel/CF Pages; set `VITE_API_WS_URL` and `VITE_EVENTS_URL`.
