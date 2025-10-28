'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Oops!</h1>
        <p className="mt-2 text-gray-600">Something went wrong</p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}