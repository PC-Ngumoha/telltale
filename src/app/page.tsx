"use client";

import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Stop } from "@/icons";
import { Slider } from "@/components/ui/slider";
import { scanTXTFile } from "@/utils";

export default function Home() {
  const [isPlaying, setPlaying] = useState(false);
  const [content, setContent] = useState("");
  const [sentences, setSentences] = useState<string[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice>();
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [sentenceIndex, setSentenceIndex] = useState<number | null>(null);
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);

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

  // Splits content into sentences on content change
  useEffect(() => {
    setSentences(content.match(/[^.!?]+[.!?]?/g) || []);
  }, [content]);

  // Tracks the movement of highlighted span tags
  useEffect(() => {
    if (sentenceIndex !== null && sentenceRefs.current[sentenceIndex]) {
      // and scrolls them into view smoothly.
      sentenceRefs.current[sentenceIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [sentenceIndex]);

  // Aids in the selection of the voice
  const handleVoiceChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceIndex = evt.target.value;
    setSelectedVoice(voices[Number(voiceIndex)]);
  };

  /**
   * Utility: calculates the sentence index from the utterance index
   * @param sentences
   * @param charIndex
   * @returns
   */
  const getSentenceIndex = (sentences: string[], charIndex: number) => {
    let total = 0;
    for (let i = 0; i < sentences.length; i++) {
      total += sentences[i].length;
      if (charIndex < total) return i;
    }
    return -1;
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
      speechSynthesis.cancel(); // clear utterance queue

      //   const contents = contentsRef.current?.textContent;
      if (content !== "") {
        // create new utterance
        const utterance = new SpeechSynthesisUtterance(content);

        // Cancel utterance when done
        utterance.onend = () => {
          speechSynthesis.cancel();
          setPlaying(false);
          setSentenceIndex(null); // clears the highlighting
        };

        // Keeping track of current sentence being spoken by TTS
        utterance.onboundary = (evt) => {
          if (evt.name === "sentence") {
            const idx = getSentenceIndex(sentences, evt.charIndex);
            setSentenceIndex(idx);
          }
        };

        // Set voice if selected by user
        utterance.voice = selectedVoice ?? null;

        // set pitch & rate
        utterance.pitch = pitch;
        utterance.rate = rate;

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
        scanTXTFile(file, setContent);
      } else {
        alert(`File: ${file.name} could not be opened`);
      }
    } catch (error) {
      alert(`Error processing file: ${error}`);
    }
  };

  return (
    <main className="w-full h-fit bg-primary text-secondary-main py-3">
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
          className="w-5/6 h-[50vh] p-4 bg-primary-light text-secondary-main font-literata
            placeholder:font-literata rounded tracking-wide leading-relaxed
            shadow-sm shadow-gray-500 font-medium overflow-y-hidden"
          contentEditable={false}
          style={{ whiteSpace: "pre-line" }}
        >
          {sentences.map((sentence, idx) => (
            <span
              key={idx}
              ref={(el) => {
                sentenceRefs.current[idx] = el;
              }}
              className={
                idx === sentenceIndex
                  ? "font-bold text-accent-main tracking-wider"
                  : ""
              }
            >
              {sentence}
            </span>
          ))}
        </div>
        {/* Speech Control Area */}
        <div className="w-full flex justify-center">
          {/* Start, pause or resume speaking */}
          {!isPlaying ? (
            <button
              className="p-1 bg-secondary-main text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider mx-1"
              onClick={handleReadStart}
            >
              {/* Play Icon */}
              <Play />
            </button>
          ) : (
            <button
              className="p-1 bg-secondary-main text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider mx-1"
              onClick={handleReadPause}
            >
              {/* Pause Icon */}
              <Pause />
            </button>
          )}

          {/* Stop speaking */}
          <button
            className="p-1 bg-secondary-main text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider mx-1"
            onClick={handleReadStop}
          >
            {/* Stop Icon */}
            <Stop />
          </button>
        </div>
        {/* Voice selection area */}
        <div className="w-5/6 bg-secondary-main flex justify-center rounded p-1">
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
        {/* Native TTS support warning message */}
        <blockquote
          className="text-secondary-main text-xs w-5/6 bg-primary-light
         p-2 italic tracking-widest border-l-2 border-l-secondary-main"
        >
          “Only system voices are shown for optimal performance. If none appear,
          please enable system TTS voices in your OS.”
        </blockquote>
        {/* Speed & Pitch controls */}
        <div
          className="w-5/6 bg-primary-light flex justify-center rounded p-2
          font-bold"
        >
          {/* Speed controls */}
          <div className="text-secondary-main flex items-center flex-1 p-1">
            <label htmlFor="rate">Speed: </label>
            <Slider
              id="rate"
              defaultValue={[1.0]}
              value={[rate]}
              min={0.1}
              max={4.0}
              step={0.1}
              className="ml-2"
              onValueChange={(value) => setRate(value[0])}
            />
          </div>

          {/* Pitch controls */}
          <div className="text-secondary-main flex items-center flex-1 p-1">
            <label htmlFor="pitch">Pitch: </label>
            <Slider
              id="pitch"
              defaultValue={[1.0]}
              value={[pitch]}
              min={0.0}
              max={2.0}
              step={0.1}
              className="ml-2"
              onValueChange={(value) => setPitch(value[0])}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
