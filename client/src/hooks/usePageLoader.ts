import { useState, useEffect } from 'react';

interface UsePageLoaderProps {
  minLoadTime?: number;
  dependencies?: any[];
}

export const usePageLoader = ({ minLoadTime = 2000, dependencies = [] }: UsePageLoaderProps = {}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      setIsReady(false);
      
      // Ensure minimum loading time for better UX
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        setTimeout(() => setIsReady(true), 500); // Small delay for exit animation
      }, minLoadTime);
    };

    startLoading();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, dependencies);

  return { isLoading, isReady };
};

export default usePageLoader;