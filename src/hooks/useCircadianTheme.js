import { useEffect, useState } from 'react';

export function useCircadianTheme() {
  const [isCircadian, setIsCircadian] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      // After 5:00 PM (17) or before 6:00 AM (6)
      const isNight = hour >= 17 || hour < 6;
      setIsCircadian(isNight);

      const root = document.documentElement;
      
      if (isNight) {
        // Apply subtle amber tint to reduce blue light strain
        root.style.setProperty('--color-bg-base', root.classList.contains('dark') ? '#0a0908' : '#FFFAFA');
      } else {
        // Reset to default Apple pure white / OLED black
        root.style.removeProperty('--color-bg-base');
      }
    };

    checkTime();
    
    // Also listen for system theme changes in case they toggle dark mode manually
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTime();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return isCircadian;
}
