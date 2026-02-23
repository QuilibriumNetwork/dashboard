import { useTheme } from "@/components/helpers/ThemeContext";
import Lightdarkmode from "@/assets/icons/iconset/Lightdarkmode";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex h-11 w-11 items-center justify-center text-primary transition-colors hover:text-pink"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Lightdarkmode className="h-5 w-5" />
    </button>
  );
}
