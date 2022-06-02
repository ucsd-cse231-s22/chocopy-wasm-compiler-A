import { bigMath } from "../utils";
// Number-theoretic and representation functions

export function ceil_float(x: number): bigint {
    return BigInt(Math.ceil(x));
}

export function ceil_int(x: bigint): bigint {
    return x;
}

export function comb(n: bigint, k: bigint): bigint {
    if ((k < 0) || (n < 0))
        throw new Error("comb(n,k): n and k must be positive");
    if (k > n) {return 0n;}
    return factorial(n) / (factorial(k) * factorial(n-k));
}

export function copysign_float(x: number, y: number): number {
    x = Math.abs(x);
    if (y < 0) {
        return -x;
    }
    return x;
}

// in Python, this returns a float;
// we don't have arbitrary precision floats, so this works
export function copysign_int(x: bigint, y: bigint): bigint {
    x = x >= 0 ? x : -x;
    return y >= 0 ? x : -x;
}

export function fabs_float(x : number): number {
    return Math.abs(x);
}

export function fabs_int(x : bigint): bigint {
    return x >= 0 ? x : -x;
}

export function factorial(n: bigint): bigint {
    if (n == 0n) {
        return 1n;
    }
    return n * factorial(n - 1n);
} 

export function floor_float(x: number): bigint {
    return BigInt(Math.floor(x));
}

export function floor_int(x: bigint): bigint {
    return x;
}

// skipping fmod

// skipping frexp -- even though it looks very useful!

// skipping fsum

export function gcd(a: bigint, b: bigint): bigint {
    if (b == 0n) {
        return a;
    }
    return gcd(b, a % b);
}

// skipping isclose

export function isfinite_float(x : number): boolean {
    return Number.isFinite(x);
}

export function isfinite_int(x : bigint): boolean {
    return true;  // yep
}

export function isinf_float(x : number): boolean {
    return !(Number.isFinite(x) || Number.isNaN(x));
}

export function isinf_int(x : bigint): boolean {
    return false;
}

export function isnan_float(x : number): boolean {
    return Number.isNaN(x);
}

export function isnan_int(x : bigint): boolean {
    return false;
}

export function isqrt_float(x : number): bigint {
    return BigInt(Math.floor(Math.sqrt(x)));
}

// isqrt_int is kind of tough because BigInts don't have
// a math library builtin

export function lcm(a: bigint, b: bigint): bigint {
    return a * b / gcd(a, b);
}

// note: please only call this with `number` or `bigint` args!!!
export function ldexp(x: any, i: any): number {
    return Number(x)*(2**(Number(i)));
}

// skipping modf

// skipping nextafter

// note: in python's mathlib, k defaults to None; then perm(n) = n!
export function perm(n: bigint, k: bigint): bigint {
    if ((k < 0) || (n < 0))
        throw new Error("comb(n,k): n and k must be positive");
    if (k > n) return 0n;
    return factorial(n) / (factorial(n-k));
}

// skipping prod

// skipping remainder

export function trunc_float(x: number): number {
    return x >= 0 ? Math.floor(x) : Math.ceil(x);
}

export function trunc_int(x: bigint): bigint {
    return x;
}

// skipping ulp

// power and logarithmic functions

export function exp(x : any): number {
    return Math.exp(Number(x));
}

export function expm1(x : any): number {
    return Math.expm1(Number(x));
}

export function log(x : any): number {
    return Math.log(Number(x));
}

export function logBase(x: any, b: any): number {
    return Math.log(Number(x))/Math.log(Number(b));
}

export function log1p(x: any): number {
    return Math.log1p(Number(x));
}

export function log10(x: any): number {
    return Math.log10(Number(x));
}

export function pow(x: any, y: any): number {
    return Math.pow(Number(x), Number(y))
}

export function sqrt(n: any): number {
    return Math.sqrt(Number(n));
}

export function acos(n: any): number {
    return Math.acos(Number(n));
}

export function asin(n: any): number {
    return Math.asin(Number(n));
}

export function atan(n: any): number {
    return Math.atan(Number(n));
}

// skipping atan2

export function cos(x: any): number {
    return Math.cos(Number(x));
}

// skipping dist

// skipping hypot

export function sin(x: any): number {
    return Math.sin(Number(x));
}

export function tan(x: any): number {
    return Math.tan(Number(x));
}

// skipping degrees and radians

// skipping the hyperbolic functions

// skipping erf

// skipping erfc

// skipping gamma

// skipping lgamma

// constants:

export const pi = Math.PI;

export const e = Math.E;

// skipping tau; it's just 2pi

export const inf = Infinity;

export const nan = NaN;
