"use client";

import React, { RefObject, useRef, useState } from "react";

export default function Home() {
  const contentsRef = useRef<HTMLDivElement>(null);

  const handleReadStart = (e: React.FormEvent) => {
    e.preventDefault();
    const synth = window.speechSynthesis;

    // retrieve text typed into textarea
    const text = contentsRef.current?.textContent;

    const utterance = new SpeechSynthesisUtterance(text as string);
    synth.speak(utterance);
  };

  const handleFileSelection = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (!evt || !evt.target || evt.target.files?.length !== 1) {
      return;
    }

    const file = evt.target.files[0];

    // Scans text file unto the text area
    scanTextFile(file, contentsRef as RefObject<HTMLDivElement>);
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
          name=""
          id=""
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
        {/* Start speaking */}
        <button
          className="px-6 py-2 bg-secondary text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider"
          onClick={handleReadStart}
        >
          Read Aloud
        </button>
      </div>
    </main>
  );
}

// UTILITY FUNCTIONS

/**
 * Utility function to help us read text files
 * @param file
 */
function scanTextFile(file: File, ref: RefObject<HTMLDivElement>) {
  // Initialize reader
  const reader = new FileReader();

  // What to do on error
  reader.onerror = () => {
    alert("Failed to read the file for unknown reasons");
  };

  // What to do when file loaded completely
  reader.onload = () => {
    // Populating the board
    if (ref.current) {
      const output = reader.result as string;
      ref.current.innerHTML = output.replaceAll("\n", "<br />");
    }
  };

  // Actually read the file
  reader.readAsText(file);
}
