"use client";

export default function Home() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const synth = window.speechSynthesis;

    // retrieve text typed into textarea
    const formData = new FormData(e.target as HTMLFormElement);
    const text = Object.fromEntries(formData.entries())["book-content"];
    // console.log(text);

    const utterance = new SpeechSynthesisUtterance(text as string);
    synth.speak(utterance);
  };

  return (
    <main className="w-full h-screen bg-primary text-secondary">
      <h1 className="w-full text-center text-4xl font-playfair-display italic tracking-widest">
        Telltale
      </h1>
      <form
        className="flex flex-col items-center gap-4 mt-10"
        onSubmit={handleSubmit}
      >
        <textarea
          className="w-5/6 p-4 bg-primary-light text-secondary font-literata
            placeholder:font-literata rounded tracking-wide leading-relaxed
            shadow-sm shadow-gray-500 font-medium"
          placeholder="Tell your tale..."
          rows={15}
          name="book-content"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-secondary text-primary rounded hover:bg-opacity-90
          font-outfit font-bold tracking-wider"
        >
          Read Aloud
        </button>
      </form>
    </main>
  );
}
