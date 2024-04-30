import { Fn, Stack } from "aws-cdk-lib";

/*
 * getSuffixFromStack is used to get the suffix from the stackId.
 * Use this in naming resources like buckets and tables.
 * There are two benefits:
 * 1. It reduces the chances of name collisions.
 * 2. It gives an at-a-glance idea of which stack the resource belongs to.
 * */
export function getSuffixFromStack(stack: Stack) {
  const shortStackId = Fn.select(2, Fn.split("/", stack.stackId));
  return Fn.select(4, Fn.split("-", shortStackId));
}
