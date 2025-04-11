export default function ZoomLogo() {
  return (
    <svg
      width="500"
      height="130"
      viewBox="0 0 500 130"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background removed for transparency */}
      {/* <rect width="100%" height="100%" fill="black" /> */}

      {/* Text: z */}
      <text
        x="20"
        y="90"
        fontSize="85"
        fontWeight="bold"
        fill="white"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        z
      </text>

      {/* Text: o */}
      <text
        x="90"
        y="90"
        fontSize="85"
        fontWeight="bold"
        fill="white"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        o
      </text>

      {/* Sunburst 'o' */}
      <g transform="translate(160, 20)">
        {/* Center circle */}
        <circle cx="50" cy="50" r="30" fill="black" />
        <g>
          {[...Array(20)].map((_, i) => {
            const angle = (i * 360) / 20;
            const rad = (angle * Math.PI) / 180;
            const x1 = 50 + 30 * Math.cos(rad);
            const y1 = 50 + 30 * Math.sin(rad);
            const x2 = 50 + 48 * Math.cos(rad);
            const y2 = 50 + 48 * Math.sin(rad);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFD700"
                strokeWidth={i % 2 === 0 ? 5 : 2}
                strokeLinecap="round"
              />
            );
          })}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="5s"
            repeatCount="indefinite"
          />
        </g>
      </g>

      {/* Text: m */}
      <text
        x="285"
        y="90"
        fontSize="85"
        fontWeight="bold"
        fill="white"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        m
      </text>

      {/* Text: CREATIVES - centered below the "m" */}
      <text
        x="335"
        y="120"
        fontSize="22"
        fontWeight="normal"
        fill="white"
        fontFamily="Arial, Helvetica, sans-serif"
        textAnchor="middle"
      >
        CREATIVES
      </text>
    </svg>
  );
}
