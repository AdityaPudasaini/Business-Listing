// EmptyState.tsx — shown whenever a list/table has zero results. Every list screen should use this instead of showing a blank page.
export function EmptyState({ message = "No records found." }: { message?: string }) {
  return <div className="text-center py-12 text-gray-500">{message}</div>;
}
