import { useThemeStore } from '../../store/themeStore';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg border border-border bg-background-elevated flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-brand/50 transition-all duration-200"
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatedIcon isDark={isDark} />
    </motion.button>
  );
}

function AnimatedIcon({ isDark }) {
  return (
    <div className="relative w-4 h-4">
      <motion.div
        initial={false}
        animate={{ opacity: isDark ? 1 : 0, rotate: isDark ? 0 : -90, scale: isDark ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Moon className="w-4 h-4" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? 90 : 0, scale: isDark ? 0.5 : 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Sun className="w-4 h-4" />
      </motion.div>
    </div>
  );
}
