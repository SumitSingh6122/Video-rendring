import { config } from "@remotion/eslint-config-flat";
import {tailwindcss} from  '@tailwindcss/vite'
export default config;
module.exports = {
    // …
    env: {
      browser: true,   // your frontend code
      node: true,      // allow `process`, `__dirname`, etc.
      es2021: true
    },
   Plugin:[
    tailwindcss(),
   ]
  };
  