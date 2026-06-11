import { motion } from "framer-motion";
import { ThemeToggleButton } from "./ui/themeToggle";
import { cn } from "@/lib/utils.ts";
import Logo from "@/components/ui/logo";

export function NavBar() {
  return (
    <div className="flex justify-between w-full px-6 overflow-x-hidden content-center">
      <div>
        <Logo></Logo>
      </div>
      <motion.div>
        <ThemeToggleButton className={cn("size-12 p-2")} />
      </motion.div>
    </div>
  );
}
