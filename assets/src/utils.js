export const lerp = (x, y, a) => x * (1 - a) + y * a;
export const invlerp = (a, b, v) => clamp((v - a) / (b - a));
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));