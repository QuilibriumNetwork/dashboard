const Timerzero = ({ className = "", style = {}, ...props }) => (
  <svg style={style} className={`inline-block align-text-bottom ${className}`} fill="currentColor" height="1em" viewBox="0 0 24 24" width="1em" {...props}>
    <g id="timer-zero">
      <path clipRule="evenodd" d="M10.75 5V1h2.5v4h-2.5Zm-7.134 0.384 2.5 2.5 1.768 -1.768 -2.5 -2.5 -1.768 1.768Zm14.268 2.5 2.5 -2.5 -1.768 -1.768 -2.5 2.5 1.768 1.768Zm0 8.232 2.5 2.5 -1.768 1.768 -2.5 -2.5 1.768 -1.768Zm-11.768 0 -2.5 2.5 1.768 1.768 2.5 -2.5 -1.768 -1.768ZM10.75 19v4h2.5v-4h-2.5ZM5 13.25H1v-2.5h4v2.5Zm14 0h4v-2.5h-4v2.5Z" fillRule="evenodd" fill="currentColor" strokeWidth="1" />
    </g>
  </svg>
);

export default Timerzero;
