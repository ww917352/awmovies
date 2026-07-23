// Sets the theme class before first paint to avoid a flash of the wrong theme.
// Keep in sync with themeForHour in src/lib/theme.ts (can't import it here — this
// runs as a raw inline script, before any bundle loads).
const THEME_INIT_SCRIPT = `
(function () {
  function autoTheme() {
    var hour = new Date().getHours();
    return (hour >= 7 && hour < 19) ? 'light' : 'dark';
  }
  try {
    var params = new URLSearchParams(window.location.search);
    var qp = params.get('theme');
    if (qp === 'light' || qp === 'dark') {
      localStorage.setItem('theme-override', qp);
    } else if (qp === 'auto') {
      localStorage.removeItem('theme-override');
    }
    var override = localStorage.getItem('theme-override');
    var theme = (override === 'light' || override === 'dark') ? override : autoTheme();
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {
    document.documentElement.classList.toggle('dark', autoTheme() === 'dark');
  }
})();
`;

export default function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
