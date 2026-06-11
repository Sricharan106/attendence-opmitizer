import { GlobalCursor } from "@/components/ui/cursor";
import useMobileDetection from "@/hooks/useMobile";

export default function CursorManager() {
  const checkMobile = useMobileDetection();

  if (checkMobile) {
    return null;
  }

  return <GlobalCursor />;
}
