// useLocalState.ts — an example custom hook. Use this as the pattern for any reusable stateful logic (useCart, useAuth, useFilters, etc).
import { useState } from "react";

export function useLocalState<T>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const reset = () => setValue(initial);
  return { value, setValue, reset };
}
