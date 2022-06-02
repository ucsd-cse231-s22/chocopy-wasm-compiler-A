import { bigMath } from "../utils";
export function gcd(a: bigint, b: bigint): bigint {
    if (b == 0n) {
        return a;
    }
    return gcd(b, a % b);
}

export function lcm(a: bigint, b: bigint): bigint {
    return a * b / gcd(a, b);
}

export function factorial(n: bigint): bigint {
    if (n == 0n) {
        return 1n;
    }
    return n * factorial(n - 1n);
} 