// src/index.ts
const main = () => {
  console.log('Hello GAS from TypeScript & esbuild!');
};

// GAS側から呼び出せるようにグローバルに登録するおまじない
(global as any).main = main;