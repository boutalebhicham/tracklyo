import * as React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="180"
    height="40"
    viewBox="0 0 180 40"
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
      <tspan fill="hsl(var(--primary))">.</tspan>
    </text>
  </svg>
);

export default Logo;
