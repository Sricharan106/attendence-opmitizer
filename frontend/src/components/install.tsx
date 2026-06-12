import React, { useState, useEffect } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the default browser mini-infobar prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show your custom installation UI
      setIsReadyToInstall(true);
    };

    const handleAppInstalled = () => {
      console.log("PWA was installed successfully!");
      setIsReadyToInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async (): Promise<void> => {
    if (!deferredPrompt) return;

    // Show the native browser install prompt
    await deferredPrompt.prompt();

    // Await the user's choice (Accept or Cancel)
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice outcome: ${outcome}`);

    // The prompt can only be used once; discard it
    setDeferredPrompt(null);
    setIsReadyToInstall(false);
  };

  if (!isReadyToInstall) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="install-button"
      style={{ padding: "10px 20px", cursor: "pointer" }}
    >
      📱 Install App
    </button>
  );
};

export default InstallAppButton;
