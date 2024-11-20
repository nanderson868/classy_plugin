/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
export type AbstractConstructor<T> = abstract new (...args: any[]) => T;
export type ConcreteConstructor<T> = new (...args: any[]) => T;
