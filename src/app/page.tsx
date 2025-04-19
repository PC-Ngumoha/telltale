"use client";

import React, { RefObject, useRef, useEffect } from "react";

export default function Home() {
  const contentsRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis>(null);

  useEffect(() => {
    // Setting up synth for use in the later parts of the app
    if (typeof window !== undefined) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  /**
   * Start reading from text area
   * @param e
   */
  const handleReadStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (synthRef.current) {
      const text = contentsRef.current?.textContent;
      if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        synthRef.current.speak(utterance);
      }
    }
  };

  /**
   * Stop reading from text area
   * @param e
   */
  const handleReadStop = (e: React.FormEvent) => {
    if (synthRef.current) {
      // Only stop speaking if already speaking.
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    }
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
          {/* Start speaking */}
          <button
            className="p-2 bg-secondary text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider mx-1"
            onClick={handleReadStart}
          >
            {/* Play Icon */}
            <svg
              className="w-8 h-8 text-gray-800 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Stop speaking */}
          <button
            className="p-2 bg-secondary text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider mx-1"
            onClick={handleReadStop}
          >
            {/* Stop Icon */}
            <svg
              className="w-8 h-8 text-gray-800 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Z" />
            </svg>
          </button>
        </div>
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
