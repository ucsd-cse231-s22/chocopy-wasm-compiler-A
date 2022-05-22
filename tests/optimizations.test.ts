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

    assertOptimizeIR(
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
              "name": "valname6",
              "type": {
                "tag": "bool"
              },
              "value": {
                "tag": "none"
              }
            },
            {
              "a": {
                "tag": "number"
              },
              "name": "valname7",
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
                "value": 10n
              },
              "a": {
                "tag": "none"
              }
            },
            {
              "name": "i",
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
              "label": "$startProg4",
              "stmts": [
                {
                  "tag": "jmp",
                  "lbl": "$whilestart1"
                }
              ]
            },
            {
              "a": {
                "tag": "none"
              },
              "label": "$whilestart1",
              "stmts": [
                {
                  "tag": "assign",
                  "a": {
                    "tag": "bool"
                  },
                  "name": "valname6",
                  "value": {
                    "a": {
                      "tag": "bool"
                    },
                    "tag": "binop",
                    "op": 9,
                    "left": {
                      "a": {
                        "tag": "number"
                      },
                      "tag": "id",
                      "name": "i"
                    },
                    "right": {
                      "tag": "num",
                      "value": 3n
                    }
                  }
                },
                {
                  "tag": "ifjmp",
                  "cond": {
                    "tag": "id",
                    "name": "valname6",
                    "a": {
                      "tag": "bool"
                    }
                  },
                  "thn": "$whilebody1",
                  "els": "$whileend1"
                }
              ]
            },
            {
              "a": {
                "tag": "none"
              },
              "label": "$whilebody1",
              "stmts": [
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
                      "value": 10n
                    }
                  }
                },
                {
                  "a": {
                    "tag": "none"
                  },
                  "tag": "assign",
                  "name": "i",
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
                      "name": "i"
                    },
                    "right": {
                      "tag": "num",
                      "value": 1n
                    }
                  }
                },
                {
                  "tag": "jmp",
                  "lbl": "$whilestart1"
                }
              ]
            },
            {
              "a": {
                "tag": "none"
              },
              "label": "$whileend1",
              "stmts": [
                {
                  "tag": "assign",
                  "a": {
                    "tag": "number"
                  },
                  "name": "valname7",
                  "value": {
                    "a": {
                      "tag": "number"
                    },
                    "tag": "value",
                    "value": {
                      "tag": "num",
                      "value": 11n
                    }
                  }
                },
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
                      "tag": "num",
                      "value": 11n
                    },
                    "right": {
                      "a": {
                        "tag": "number"
                      },
                      "tag": "id",
                      "name": "i"
                    }
                  }
                }
              ]
            }
          ]
        }
    );

    assertOptimizeIR(
        "IR-fn-propagate", 
        `
        def f(b:int)->int:
            a:int = 2
            return b//a
        
        f(10)
        `,
        {
          "a": {
            "tag": "number"
          },
          "funs": [
            {
              "name": "f",
              "parameters": [
                {
                  "name": "b",
                  "type": {
                    "tag": "number"
                  }
                }
              ],
              "ret": {
                "tag": "number"
              },
              "inits": [
                {
                  "a": {
                    "tag": "number"
                  },
                  "name": "valname8",
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
                    "value": 2n
                  }
                }
              ],
              "body": [
                {
                  "a": {
                    "tag": "none"
                  },
                  "label": "$startFun1",
                  "stmts": [
                    {
                      "tag": "assign",
                      "a": {
                        "tag": "number"
                      },
                      "name": "valname8",
                      "value": {
                        "a": {
                          "tag": "number"
                        },
                        "tag": "binop",
                        "op": 3,
                        "left": {
                          "a": {
                            "tag": "number"
                          },
                          "tag": "id",
                          "name": "b"
                        },
                        "right": {
                          "tag": "num",
                          "value": 2n
                        }
                      }
                    },
                    {
                      "tag": "return",
                      "a": {
                        "tag": "number"
                      },
                      "value": {
                        "tag": "id",
                        "name": "valname8",
                        "a": {
                          "tag": "number"
                        }
                      }
                    }
                  ]
                }
              ],
              "a": {
                "tag": "none"
              }
            }
          ],
          "inits": [],
          "classes": [],
          "body": [
            {
              "a": {
                "tag": "number"
              },
              "label": "$startProg5",
              "stmts": [
                {
                  "tag": "expr",
                  "a": {
                    "tag": "number"
                  },
                  "expr": {
                    "tag": "call",
                    "name": "f",
                    "arguments": [
                      {
                        "tag": "num",
                        "value": 10n
                      }
                    ],
                    "a": {
                      "tag": "number"
                    }
                  }
                }
              ]
            }
          ]
        }
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

    assertOptimize(
      "sanity-nestedif-1lev-constant-prop-folding",
      `
      a:int = 10
      b:int = 100
      if a==10:
          if b==100:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      
      print(b)
      `,
      {print: ["1340"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-nestedif-1lev-constant-prop-folding-neg",
      `
      a:int = 10
      b:int = 100
      if True:
          if False:
              a = 2
              b = 3
          if True:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      print(b)
      `,
      {print: ["1340"], isIrDifferent: false}
    )

    assertOptimize(
      "sanity-nestedif-while-1lev-constant-prop-folding",
      `
      a:int = 10
      b:int = 100
      c:int = 1
      i:int = 0
      while(i<10):
          if a==10:
            if b==100:
                c = b+a+b*a+b//a+b%a+b+a+b+a
          i = i+1
      print(c)
      `,
      {print: ["1340"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-nestedif-func-1lev-constant-prop-folding-neg",
      `
      def fun1()->int:
          return 10
      
      a:int = 10
      b:int = 100
      if True:
          if False:
              a = fun1()
              b = fun1()*10
          if True:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      print(b)
      `,
      {print: ["1340"], isIrDifferent: false}
    )

    assertOptimize(
      "sanity-nestedif-func-1lev-constant-prop-folding",
      `
      def fun1(a:int, b:int)->int:
          return a+b
      
      a:int = 10
      b:int = 100
      if True:
          if False:
              a = fun1(a,b)
          if True:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      print(b)
      `,
      {print: ["1340"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-nestedif-func-1lev-constant-prop-folding",
      `
      def fun1(a:int, b:int)->int:
          return a+b
      
      a:int = 10
      b:int = 100
      if True:
          if False:
              a = fun1(a,b)
          if True:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      print(b)
      `,
      {print: ["1340"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-many-variables-constant-fold",
      `
a:int = 1
b:int = 10
c:int = 1000
d:int = 109
if True:
  c = a+9
  if False:
    d= b*10 +9
    if True:
      d = a+b+c-c-a*2+b//2
print(d)
      `,
      {print: ["109"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-many-variables-constant-fold",
      `
a:int = 1
b:int = 10
c:int = 1000
d:int = 109
if True:
  c = 11
  if False:
    b=2
    a=1
    if True:
      d = a+b+c-c-a*2+b//2
print(d)
      `,
      {print: ["109"], isIrDifferent: true}
    )

});