"use client";

import React, { RefObject, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set the worker source (use .js, not .mjs)
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function Home() {
  const contentsRef = useRef<HTMLDivElement>(null);

  const handleReadStart = (e: React.FormEvent) => {
    e.preventDefault();
    const synth = window.speechSynthesis;
    const text = contentsRef.current?.textContent;
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);
    }
  };

  const handleFileSelection = async (
    evt: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = evt.target.files?.[0];
    if (!file) return;

    try {
      if (file.type === "text/plain") {
        scanTXTFile(file, contentsRef as RefObject<HTMLDivElement>);
      } else if (file.type === "application/pdf") {
        scanPDFFile(file, contentsRef as RefObject<HTMLDivElement>);
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

/**
 * Utility function: Read .pdf files
 */
async function scanPDFFile(file: File, ref: RefObject<HTMLDivElement>) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    // for (let i = 1; i <= pdf.numPages; i++) {
    //   const page = await pdf.getPage(i);
    //   const content = await page.getTextContent();
    //   const pageText = content.items
    //     .map((item: any) => ("str" in item ? item.str : "\n"))
    //     .join(" ");
    //   text += pageText + "\n";
    // }

    // Modification to enable scanner be able to take account
    // for the occurrence of newline characters in the file.
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let lastY: number | null = null;
      let pageText = "";

      for (const item of content.items) {
        if ("str" in item && item.str.trim()) {
          const y = item.transform[5]; // y-coord. of text item.
          const text = item.str;

          // Detecting newline by comparing y-coordinates;
          if (lastY !== null && Math.abs(lastY - y) > 5) {
            // Threshold value of 5 points to detect a line break
            pageText += "\n";
          }

          pageText += text;
          lastY = y;
        }
      }
      // Add extra newline between pages to set it apart
      text += pageText + (i < pdf.numPages ? "\n\n" : "");
    }

    if (ref.current) {
      ref.current.innerHTML = text.replaceAll("\n", "<br />");
    }
  } catch (error) {
    alert(`PDF processing error: ${error}`);
    if (ref.current) {
      ref.current.innerHTML = `<b>Failed to process PDF file</b><br />${error}`;
    }
  }
}
