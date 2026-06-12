import { useState, useEffect } from "react";
import { NavBar } from "@/components/navBar";
import { ThemeProvider } from "@/context/theme-provider";
import CursorManager from "@/hooks/customCursor";
import { BouncingCubes } from "./components/ui/loader"; // Uncommented this
import CalendarView from "@/components/ui/calendar";
import InstallAppButton from "./components/install";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulates a 1.5-second loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen dark:bg-zinc-950 bg-white text-black dark:text-white">
        <CursorManager />

        {isLoading ? (
          /* Center the loader on the screen during loading state */
          <div className="min-h-screen flex justify-center items-center">
            <BouncingCubes size={60} />
          </div>
        ) : (
          /* Main application content renders after loading is complete */
          <>
            <header className="w-full flex justify-center py-4 border-b border-zinc-800 bg-teal-950 backdrop-blur-md top-0 z-50">
              <NavBar />
            </header>
            <InstallAppButton />
            <div className="max-w-5xl mx-auto mt-2 min-h-[calc(100vh-64px)]">
              <CalendarView />
            </div>
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
