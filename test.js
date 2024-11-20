/* eslint-disable @typescript-eslint/no-unused-vars */
var Color;
(function (Color) {
    Color["Red"] = "RED";
    Color["Green"] = "GREEN";
    Color["Blue"] = "BLUE";
})(Color || (Color = {}));
var Color2;
(function (Color2) {
    Color2[Color2["Red"] = 0] = "Red";
    Color2[Color2["Green"] = 1] = "Green";
    Color2[Color2["Blue"] = 2] = "Blue";
})(Color2 || (Color2 = {}));
const stringEnumToArray = (enumObj) => Object.values(enumObj);
const colors = stringEnumToArray(Color);
console.log("stringEnumToArray", colors);
const stringEnumKeysToArray = (enumObj) => Object.keys(enumObj).filter((x) => isNaN(Number(x)));
const colors2 = stringEnumKeysToArray(Color2);
console.log("colors2", colors2);
const getColors = (...c) => c.map((x) => x);
const selection = getColors("Red", "Green", "Blue");
const keys = Object.keys(Color2).filter((x) => isNaN(Number(x)));
console.log("keys", keys);
const all = getColors(...Object.entries(Color2).map(([k]) => k));
console.log("selection", selection);
console.log("all", all);
