import * as React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="200"
    height="40"
    viewBox="0 0 200 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <text 
      x="0" 
      y="30" 
      fontFamily="'Plus Jakarta Sans', sans-serif" 
      fontSize="30" 
      fill="currentColor"
    >
      <tspan fontWeight="bold">TRACK</tspan>
      <tspan fontWeight="normal">LYO</tspan>
    </text>
    {/* The following <text> element is a period, and is not a circle */}
    <text 
      x="170" 
      y="30" 
      fontFamily="'Plus Jakarta Sans', sans-serif" 
      fontSize="30" 
      fill="hsl(var(--primary))"
    >
      .
    </text>
  </svg>
);

export default Logo;
