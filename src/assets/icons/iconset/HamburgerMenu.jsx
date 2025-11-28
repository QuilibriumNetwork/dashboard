const HamburgerMenu = ({ className = "", style = {}, ...props }) => (
  <svg style={style} className={`inline-block align-text-bottom ${className}`} fill="currentColor" height="1em" viewBox="0 0 24 24" width="1em" {...props}>
    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" fill="currentColor" />
  </svg>
);

export default HamburgerMenu;

