import { stringify } from "./webstart";
import { BasicREPL } from "./repl";

export function addAccordionEvent(repl:BasicREPL) {
    console.log("addAccordionEvent added");
    // var acc = document.getElementsByClassName("accordion");
    // var i = 0;
    // for (i; i < acc.length; i++) {
    //   if (acc[i].getAttribute("listener") !== "true") {
    //     acc[i].setAttribute("listener", "true");
    //     acc[i].addEventListener("click", function (evt) {
    //         console.log("receive one event");
    //       const ele =  evt.currentTarget as any;
    //       this.classList.toggle("active");
    //       if (ele.getAttribute("unfolded")==="no"){
    //         const address = parseInt(ele.getAttribute("address"));
    //         const classname = ele.getAttribute("classname");
    //         unfold_object(address, classname,repl,ele);
    //       }
    //       var panel = ele.nextElementSibling as any;
    //       var arrow = ele.firstChild as any;
    //       if (panel.style.display === "block") {
    //         panel.style.display = "none";
    //         arrow.style.transform = "rotate(-45deg)";
    //       } else {
    //         panel.style.display = "block";
    //         arrow.style.transform = "rotate(45deg)";
    //       }
    //     });
    //   }
    // }
  }

//   function prettyPrintClassObject(result: any, repl: BasicREPL, currentEle: any) {
//     const view = new Int32Array(repl.importObject.js.memory.buffer);
//     const typedCls = repl.currentTypeEnv.classes.get(result.name)[0];
//     const cls = repl.currentEnv.classes.get(result.name);
  
//     const exp = document.createElement("button") as HTMLButtonElement;
//     exp.setAttribute("class", "accordion");
//     const div = document.createElement("div");
//     div.setAttribute("class", "panel");
//     const addr = document.createElement("p");
//     addr.innerHTML = "<b class='tag'>address: </b><p class='val'>" + result.address + "</p>";
  
//     exp.innerHTML = "<i class='arrow' id='arrow'></i> " + result.name + " object";
//     div.appendChild(addr);
//     addr.setAttribute("class", "info");
//     //div.appendChild(document.createElement("br"));
  
//     cls.forEach((value, key) => {
//       var offset = value[0];
//       var type = typedCls.get(key);
  
//       const ele = document.createElement("pre");
//       // PyValue implementation seems incomplete, casting to any for now
  
//       // pretty printing object fields
//       switch (type.tag) {
//         case "class":
//           if (val.tag !== "none") {
//             ele.innerHTML = "<b class='tag'>" + key + ":</b>";
//             const new_div = document.createElement("div");
//             ele.appendChild(new_div);
//             prettyPrintClassObject(val, repl, new_div);
//           } else {
//             ele.innerHTML = "<b class='tag'>" + key + ": </b> <p class='val'>none</p>";
//           }
//           break;
//         // case "list":
//         //   if (val.tag !== "none") {
//         //     ele.innerHTML = "<b class='tag'>" + key + ":</b>";
//         //     const new_div = document.createElement("div");
//         //     ele.appendChild(new_div);
//         //     prettyPrintList(val, repl, new_div);
//         //   } else {
//         //     ele.innerHTML = "<b class='tag'>" + key + ": </b> <p class='val'>none</p>";
//         //   }
//         //   break;
//         // case "dict":
//         //   if (val.tag !== "none") {
//         //     ele.innerHTML = "<b class='tag'>" + key + ":</b>";
//         //     const new_div = document.createElement("div");
//         //     ele.appendChild(new_div);
//         //     prettyPrintDictionary(val, repl, new_div);
//         //   } else {
//         //     ele.innerHTML = "<b class='tag'>" + key + ": </b> <p class='val'>none</p>";
//         //   }
//         //   break;
//         default:
//           ele.innerHTML = "<b class='tag'>" + key + ": </b><p class='val'>" + val.value + "</p>";
//           break;
//       }
//       div.appendChild(ele);
//       ele.setAttribute("class", "info");
//       //div.appendChild(document.createElement("br"));
//     });
  
//     currentEle.appendChild(exp);
//     currentEle.appendChild(div);
//   }


  export function generate_folded_object(address:number, classname:string, repl:BasicREPL, currentEle: HTMLElement) {
    if(address == 0){
      currentEle.innerText = `${classname} object is None`;
    }
    currentEle.append
    const exp:HTMLButtonElement = document.createElement("button") ;
    exp.setAttribute("class", "accordion");
    exp.setAttribute("address",address.toString());
    exp.setAttribute("classname",classname);
    exp.setAttribute("unfolded","no"); 
    exp.innerHTML = "<i class='arrow' id='arrow'></i> " + classname +  `object at ${address}`;
    currentEle.appendChild(exp);
  
  }
  export function unfold_object( address: number, classname: string,repl: BasicREPL, currentEle: HTMLButtonElement): Array<string> {
     const parentNode = currentEle.parentNode;
    const div = document.createElement("div");
    div.setAttribute("class", "panel");
    currentEle.appendChild(div);
    var fields_offset_ = repl.currentEnv.classes.get(classname);
    var fields_type = repl.currentTypeEnv.classes.get(classname)[0];
    var mem = new Uint32Array(repl.importObject.js.memory.buffer);
    var display: Array<string> = [];
    // A[1][0] refers to the offset value of field A, sorted by the offset value to ensure the iteration has a consistent order. 
    var fields_offset = Array.from(fields_offset_.entries());
    fields_offset.sort((a, b) => {
      return a[1][0] - b[1][0];
    });
  
  
    fields_offset.forEach(thisfield => {
      const ele = document.createElement("pre");
  
      var thisfield_type = fields_type.get(thisfield[0]);
      const val = mem[address / 4 + thisfield[1][0]];
      const key = thisfield[0];
      if (thisfield_type.tag === "class") {
          const new_div = document.createElement("div");
          ele.appendChild(new_div);
          generate_folded_object(val, thisfield_type.name,repl, new_div);
      } else {
        ele.innerHTML = "<b class='tag'>" + key + ": </b><p class='val'>" + stringify(thisfield_type,val,repl) + "</p>";
      }
      div.appendChild(ele);
      ele.setAttribute("class", "info");
    }
    )
    currentEle.setAttribute("unfolded", "true");
  
    parentNode.insertBefore(div, currentEle.nextSibling)
    return display;
  }