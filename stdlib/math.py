def gcd(a: int, b: int) -> int:
    if b == 0:
        return a
    else:
        return gcd(b, a % b)


def lcm(x: int, y: int) -> int:
    return (x * y) // gcd(x, y)
