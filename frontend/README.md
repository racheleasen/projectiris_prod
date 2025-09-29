# ProjectIris
- dev domain: https://www.projectiris.dev/ 
- prod domain: https://www.projectiris.app/

ProjectIris is a gaze communication tool. It combines MediaPipe FaceMesh for landmark detection with custom vector math to estimate gaze direction, enabling real-time gaze-based interaction without the need for specialized hardware.

## Features

- Runs entirely in the browser (no download or install required)
- Uses MediaPipe to track iris, pupil, and eye landmarks
- Backend and Deployment setup possible (possibly?) with FastAPI and Vercel

## Usage

1. Clone the repo:
   ```bash
   git clone https://github.com/racheleasen/projectiris.git

2. Install frontend dependencies and run:
    ```bash
    npm install
    npm run dev

3. Open localhost://XXXX

Goals

The goal of Iris is to make accessible, webcam-based eye tracking freely available — supporting gaze-driven communication for those with motor nueron diseases (MNDs).