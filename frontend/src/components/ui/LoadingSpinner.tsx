// LoadingSpinner.tsx — shown while data is being fetched. Every screen that calls the API should show this until the data arrives.
export function LoadingSpinner() {
  return <div className="animate-pulse text-center py-12 text-gray-400">Loading...</div>;
}
