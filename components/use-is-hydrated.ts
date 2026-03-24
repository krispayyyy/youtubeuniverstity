import { useEffect, useState } from "react";

export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(typeof window !== 'undefined');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
