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

export function comb(n: bigint, k: bigint): bigint {
    if ((k < 0) || (n < 0)) {
        throw new Error("comb(n,k): n and k must be positive");
    }
    if (k > n) {return 0n;}
    return factorial(n) / (factorial(k) * factorial(n-k));
}

export function perm(n: bigint, k: bigint): bigint {
    if ((k < 0) || (n < 0))
        throw new Error("comb(n,k): n and k must be positive");
    if (k > n) return 0n;
    return factorial(n) / (factorial(n-k));
}
