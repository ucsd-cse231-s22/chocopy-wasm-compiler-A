export function randint(a: bigint, b: bigint): bigint {
    var range = b - a;
    var rrange = randrange(range);
    return a + rrange;
}

export function randrange(range: bigint): bigint {
  // ref: https://codereview.stackexchange.com/questions/230992/javascript-random-bigint
  var rand = 0n,
    digits = (range.toString().length / 9 + 2) | 0;
  while (digits--) {
    rand *= 1000000000n;
    rand += BigInt((Math.random() * 1000000000) | 0);
  }
  return rand % range;
}
