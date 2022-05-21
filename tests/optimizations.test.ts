import { assertPrint, assertFail, assertTCFail, assertTC, assertOptimize, assertOptimizeIR } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Optimizations tests", () => {
    assertOptimizeIR(
        "IR-simple-constant-folding", 
        `
        a: int = 0
        a = 1*2+3--4
        `,
        {
            "a": {
              "tag": "none"
            },
            "funs": [],
            "inits": [
              {
                "a": {
                  "tag": "number"
                },
                "name": "valname1",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "a": {
                  "tag": "number"
                },
                "name": "valname2",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "a": {
                  "tag": "number"
                },
                "name": "valname3",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "name": "a",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 0n
                },
                "a": {
                  "tag": "none"
                }
              }
            ],
            "classes": [],
            "body": [
              {
                "a": {
                  "tag": "none"
                },
                "label": "$startProg1",
                "stmts": [
                  {
                    "tag": "assign",
                    "a": {
                      "tag": "number"
                    },
                    "name": "valname1",
                    "value": {
                      "a": {
                        "tag": "number"
                      },
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 2n
                      }
                    }
                  },
                  {
                    "tag": "assign",
                    "a": {
                      "tag": "number"
                    },
                    "name": "valname2",
                    "value": {
                      "a": {
                        "tag": "number"
                      },
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 5n
                      }
                    }
                  },
                  {
                    "tag": "assign",
                    "a": {
                      "tag": "number"
                    },
                    "name": "valname3",
                    "value": {
                      "tag": "value",
                      "value": {
                       "tag": "num",
                       "value": -4n
                      }
                    }
                  },
                  {
                    "a": {
                      "tag": "none"
                    },
                    "tag": "assign",
                    "name": "a",
                    "value": {
                      "a": {
                        "tag": "number"
                      },
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 9n
                      }
                    }
                  }
                ]
              }
            ]
          }
    );
    
    assertOptimizeIR(
        "IR-if-else-propagate", 
        `
        a: int = 15
        b:int = 0
        if(10 > 11):
            a = 15
        b = a + 5
        `,
        {
            "a": {
              "tag": "none"
            },
            "funs": [],
            "inits": [
              {
                "a": {
                  "tag": "bool"
                },
                "name": "valname4",
                "type": {
                  "tag": "bool"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "name": "a",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 15n
                },
                "a": {
                  "tag": "none"
                }
              },
              {
                "name": "b",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 0n
                },
                "a": {
                  "tag": "none"
                }
              }
            ],
            "classes": [],
            "body": [
              {
                "a": {
                  "tag": "none"
                },
                "label": "$startProg2",
                "stmts": [
                  {
                    "tag": "assign",
                    "a": {
                      "tag": "bool"
                    },
                    "name": "valname4",
                    "value": {
                      "a": {
                        "tag": "bool"
                      },
                      "tag": "value",
                      "value": {
                        "tag": "bool",
                        "value": false
                      }
                    }
                  },
                  {
                    "tag": "ifjmp",
                    "cond": {
                        "tag": "bool",
                        "value": false
                    },
                    "thn": "$then1",
                    "els": "$else1"
                  }
                ]
              },
              {
                "a": {
                  "tag": "none"
                },
                "label": "$then1",
                "stmts": [
                  {
                    "a": {
                      "tag": "none"
                    },
                    "tag": "assign",
                    "name": "a",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 15n
                      }
                    }
                  },
                  {
                    "tag": "jmp",
                    "lbl": "$end1"
                  }
                ]
              },
              {
                "a": {
                  "tag": "none"
                },
                "label": "$else1",
                "stmts": [
                  {
                    "tag": "jmp",
                    "lbl": "$end1"
                  }
                ]
              },
              {
                "a": {
                  "tag": "none"
                },
                "label": "$end1",
                "stmts": [
                  {
                    "a": {
                      "tag": "none"
                    },
                    "tag": "assign",
                    "name": "b",
                    "value": {
                      "a": {
                        "tag": "number"
                      },
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 20n
                      }
                    }
                  }
                ]
              }
            ]
          }
    );

    assertOptimizeIR(
        "IR-if-else-notpropagate", 
        `
        a: int = 16
        b:int = 0
        if(10 > 11):
            a = 15
        b = a + 5
        `,
        {
            "a": {
              "tag": "none"
            },
            "funs": [],
            "inits": [
              {
                "a": {
                  "tag": "bool"
                },
                "name": "valname5",
                "type": {
                  "tag": "bool"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "name": "a",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 16n
                },
                "a": {
                  "tag": "none"
                }
              },
              {
                "name": "b",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 0n
                },
                "a": {
                  "tag": "none"
                }
              }
            ],
            "classes": [],
            "body": [
              {
                "a": {
                  "tag": "none"
                },
                "label": "$startProg3",
                "stmts": [
                  {
                    "tag": "assign",
                    "a": {
                      "tag": "bool"
                    },
                    "name": "valname5",
                    "value": {
                      "a": {
                        "tag": "bool"
                      },
                      "tag": "value",
                      "value": {
                        "tag":"bool",
                        "value":false
                      }
                    }
                  },
                  {
                    "tag": "ifjmp",
                    "cond": {
                      "tag": "bool",
                      "value": false,
                      "a": {
                        "tag": "bool"
                      }
                    },
                    "thn": "$then2",
                    "els": "$else2"
                  }
                ]
              },
              {
                "a": {
                  "tag": "none"
                },
                "label": "$then2",
                "stmts": [
                  {
                    "a": {
                      "tag": "none"
                    },
                    "tag": "assign",
                    "name": "a",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 15n
                      }
                    }
                  },
                  {
                    "tag": "jmp",
                    "lbl": "$end2"
                  }
                ]
              },
              {
                "a": {
                  "tag": "none"
                },
                "label": "$else2",
                "stmts": [
                  {
                    "tag": "jmp",
                    "lbl": "$end2"
                  }
                ]
              },
              {
                "a": {
                  "tag": "none"
                },
                "label": "$end2",
                "stmts": [
                  {
                    "a": {
                      "tag": "none"
                    },
                    "tag": "assign",
                    "name": "b",
                    "value": {
                      "a": {
                        "tag": "number"
                      },
                      "tag": "binop",
                      "op": 0,
                      "left": {
                        "a": {
                          "tag": "number"
                        },
                        "tag": "id",
                        "name": "a"
                      },
                      "right": {
                        "tag": "num",
                        "value": 5n
                      }
                    }
                  }
                ]
              }
            ]
          }
    );

    assertOptimize(
        "IR-while-propagate", 
        `
        a: int = 10
        i: int = 0
        b:int = 0
        while(i<3):
            a = 7 + 3
            i = i + 1
        b = a + 1 + i
        `,
        { print: ["0","12"], isIrDifferent: true }
    );

    assertOptimize(
        "IR-fn-propagate", 
        `
        def f(b:int)->int:
            a:int = 2
            return b//a
        
        f(10)
        `,
        { print: ["0","12"], isIrDifferent: true }
    );


    assertOptimize(
        "sanity-simple-constant-folding", 
        `
        a: int = 0
        print(a)
        a = 5 + 7
        print(a)
        `,
        { print: ["0","12"], isIrDifferent: true }
    );

    assertOptimize(
        "sanity-complex-constant-folding", 
        `
        a:int=1
        a=1*2-1+4
        print(a)
        `,
        { print: ["5"], isIrDifferent: true }
    );

    assertOptimize(
        "sanity-while-constant-folding-neg", 
        `
        a:int=10
        b:int = 5
        while a<10:
            a = 1
        b = a
        print(b)
        `,
        { print: ["10"], isIrDifferent: false }
    );

    assertOptimize(
        "sanity-if-constant-prop", 
        `
        a:int = 3
        if 0<3:
            a = 4
            print(a)
        `,
        { print: ["4"], isIrDifferent: true }
    );

    assertOptimize(
        "sanity-if-constant-prop-neg", 
        `
        a:int = 3
if False:
   a = 4
else:
   a = 5
print(a)
        `,
        { print: ["5"], isIrDifferent: false }
    );

    assertOptimize(
        "sanity-while-constant-prop-folding", 
        `
        a:int=1
        b:int = 5
        while a<3:
            b = 2 + 3
            a = a + 1
            print(a)
        print(b)
        `,
        { print: ["2", "3", "5"], isIrDifferent: true }
    );

});