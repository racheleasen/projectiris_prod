import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  onEnableCamera: () => void;
}

export default function GetStarted({ onEnableCamera }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    onEnableCamera();      // enable camera + consent
    navigate("/");         // redirect to homepage
  };

  return (
    <main className="standardPage">
      <div className="standardCard">
        <h1>Enabling your Webcam</h1>
        <p>
          Project Iris uses your webcam to estimate gaze —
          no video or audio is ever uploaded.
        </p>

        <p>
          You will be asked to enable camera access after consenting to analytics and selecting 'start camera' on the next page.
        </p>
        <p> Gaze and web analytics help us improve eye tracking accuracy for everyone.
        </p>

        <button className="consentButton" onClick={handleClick}>
          Opt-in & Continue
        </button>
      </div>
    </main>
  );
}
