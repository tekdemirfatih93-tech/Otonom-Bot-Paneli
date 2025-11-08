export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const jitter = (ms, j = 0.35) => Math.max(20, Math.round(ms * (1 + (Math.random() * 2 - 1) * j)));
export const rand = (min, max) => Math.random() * (max - min) + min;
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
