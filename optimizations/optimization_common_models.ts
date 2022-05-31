import { BasicBlock } from "../ir";



export class Env {

    //General basic block environment class for dataflow analysis

    get(arg: any): any {
        // Get the value of arg from the Environment map
        return;
    }
    has(arg: any): any {
        // Check if the environment map has the arg
        return;
    }
    set(arg: any, value: any) {
        // Set the value of arg in the environment map
        return;
    }
    duplicateEnv(): Env {
        // Return a duplicate of the calling environment object
        return;
    }
    checkEqual(b: Env): boolean {
        // Check if calling environment object and arg are equal
        return;
    }
    updateEnvironmentByBlock(block: BasicBlock<any>): Env {
        // Return an updated environment
        return;
    }
    mergeEnvironment(b: Env): Env {
        // Return a new environment which merges the calling environment object and arg
        return;
    }

}