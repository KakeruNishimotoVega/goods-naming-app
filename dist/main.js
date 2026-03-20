"use strict";
(() => {
  // src/index.ts
  var main = () => {
    console.log("Hello GAS from TypeScript & esbuild!");
  };
  global.main = main;
})();
