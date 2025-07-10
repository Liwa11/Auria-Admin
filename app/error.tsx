"use client"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Er is een fout opgetreden</h1>
      <p className="text-lg text-gray-400 mb-8">{error.message || "Onbekende fout"}</p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-green-600 rounded-lg text-white font-semibold hover:bg-green-700 transition"
      >
        Probeer opnieuw
      </button>
    </div>
  )
} 