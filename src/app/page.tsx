"use client";

import React, { RefObject, useRef, useEffect, useState } from "react";
import { Play, Pause, Stop } from "@/icons";

export default function Home() {
  const contentsRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice>();

  useEffect(() => {
    const populateVoices = () => {
      if (typeof speechSynthesis === undefined) {
        return;
      }
      const availableVoices = window.speechSynthesis
        .getVoices()
        .filter((voice) => {
          // filter out chrome-specific TTS voices
          return (
            !voice.name.toLowerCase().includes("google") &&
            !voice.name.toLowerCase().includes("chromium")
          );
        });
      setVoices(availableVoices);
      setSelectedVoice(availableVoices[0] || null);
    };

    // call populateVoices
    populateVoices();
    if (
      typeof speechSynthesis !== undefined &&
      speechSynthesis.onvoiceschanged !== undefined
    ) {
      speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, []);

  // Aids in the selection of the voice
  const handleVoiceChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceIndex = evt.target.value;
    setSelectedVoice(voices[Number(voiceIndex)]);
  };

  /**
   * Start or Resume reading from text area
   * @param e
   */
  const handleReadStart = (e: React.FormEvent) => {
    e.preventDefault();

    // If paused, resume
    if (speechSynthesis.speaking && speechSynthesis.paused) {
      speechSynthesis.resume();
      setPlaying(true);
    } else {
      // Otherwise
      // Clear utterance queue
      speechSynthesis.cancel();

      const contents = contentsRef.current?.textContent;
      if (contents) {
        // create new utterance
        const utterance = new SpeechSynthesisUtterance(contents);

        // Cancel utterance when done
        utterance.onend = () => {
          speechSynthesis.cancel();
          setPlaying(false);

          console.log("Done speaking");
        };

        utterance.onresume = () => {
          console.log("Resumed speaking");
        };

        utterance.onstart = () => {
          console.log("Started speaking");
        };

        // Set voice if selected by user
        utterance.voice = selectedVoice ?? null;

        // Start speaking
        speechSynthesis.speak(utterance);
        setPlaying(true);
      }
    }
  };

  /**
   * Pause reading from text area
   * @param e
   */
  const handleReadPause = (e: React.FormEvent) => {
    e.preventDefault();
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setPlaying(false);
    }
  };

  /**
   * Stop reading from text area
   * @param e
   */
  const handleReadStop = (e: React.FormEvent) => {
    e.preventDefault();
    speechSynthesis.cancel();
    setPlaying(false);
  };

  /**
   * Determine how selected file is parsed and presented.
   * @param evt
   * @returns
   */
  const handleFileSelection = async (
    evt: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = evt.target.files?.[0];
    if (!file) return;

    try {
      if (file.type === "text/plain") {
        scanTXTFile(file, contentsRef as RefObject<HTMLDivElement>);
      } else {
        alert(`File: ${file.name} could not be opened`);
      }
    } catch (error) {
      alert(`Error processing file: ${error}`);
    }
  };

  return (
    <main className="w-full h-screen bg-primary text-secondary">
      <h1 className="w-full text-center text-4xl font-playfair-display italic tracking-widest">
        Telltale
      </h1>
      <div className="flex flex-col items-center gap-4 mt-5">
        {/* File Upload Area */}
        <input
          type="file"
          accept=".txt,.pdf"
          className="w-5/6 border-2 p-4 border-primary-light"
          onChange={handleFileSelection}
        />
        {/* Document Contents */}
        <div
          className="w-5/6 h-[50vh] p-4 bg-primary-light text-secondary font-literata
            placeholder:font-literata rounded tracking-wide leading-relaxed
            shadow-sm shadow-gray-500 font-medium overflow-y-auto"
          ref={contentsRef}
          contentEditable={false}
        />
        {/* Speech Control Area */}
        <div className="w-full flex justify-center">
          {/* Start, pause or resume speaking */}
          {!isPlaying ? (
            <button
              className="p-1 bg-secondary text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider mx-1"
              onClick={handleReadStart}
            >
              {/* Play Icon */}
              <Play />
            </button>
          ) : (
            <button
              className="p-1 bg-secondary text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider mx-1"
              onClick={handleReadPause}
            >
              {/* Pause Icon */}
              <Pause />
            </button>
          )}

          {/* Stop speaking */}
          <button
            className="p-1 bg-secondary text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider mx-1"
            onClick={handleReadStop}
          >
            {/* Stop Icon */}
            <Stop />
          </button>
        </div>
        {/* Voice selection area */}
        <div className="w-5/6 bg-secondary flex justify-center rounded-lg p-1">
          <label
            htmlFor="voices"
            className="text-primary self-center font-bold"
          >
            Voices:{" "}
          </label>
          <select
            id="voices"
            onChange={handleVoiceChange}
            className="bg-transparent text-primary-light p-1 w-[90%] focus:outline-0
            italic tracking-tighter"
          >
            {/* Populate dropdown with voices */}
            {voices?.map((voice, idx) => (
              <option key={idx} value={idx}>{`${voice.name} ${
                voice.default ? "[DEFAULT]" : ""
              }`}</option>
            ))}
          </select>
        </div>
        <blockquote
          className="text-secondary text-xs w-5/6 bg-primary-light
         p-2 italic tracking-widest border-l-2 border-l-secondary"
        >
          “Only system voices are shown for optimal performance. If none appear,
          please enable system TTS voices in your OS.”
        </blockquote>
      </div>
    </main>
  );
}

// UTILITY FUNCTIONS

/**
 * Utility function: Read .txt files
 */
function scanTXTFile(file: File, ref: RefObject<HTMLDivElement>) {
  const reader = new FileReader();

  reader.onerror = () => {
    alert("Failed to read the file for unknown reasons");
  };

  reader.onload = () => {
    if (ref.current) {
      const output = reader.result as string;
      ref.current.innerHTML = output.replaceAll("\n", "<br />");
    }
  };

  reader.readAsText(file);
}
