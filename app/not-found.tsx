export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">404 - Pagina niet gevonden</h1>
      <p className="text-lg text-gray-400 mb-8">De opgevraagde pagina bestaat niet of is verwijderd.</p>
      <a href="/" className="px-6 py-2 bg-green-600 rounded-lg text-white font-semibold hover:bg-green-700 transition">Terug naar dashboard</a>
    </div>
  )
} 