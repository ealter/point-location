//Browser Compatibility
if(typeof console !== "object") {
  console = {};
}
if(typeof console.log !== "function") {
  console.log = function() {};
}
if(typeof console.assert !== "function") {
  console.assert = function() {};
}

Array.prototype.get = function(i) {
  if(this.length === 0) {
    console.log("Tried to get value from 0-length array");
    return undefined;
  }
  return this[this.normalizeIndex(i)];
}

Array.prototype.normalizeIndex = function(i) {
  if(this.length === 0) {
    console.log("Tried to normalize index of 0-length array");
    return undefined;
  }
  while(i < 0) {
    i += this.length;
  }
  return i % this.length;
}

function isApproxEqual(a, b) {
  var epsilon = 1e-4;
  return (a + epsilon >= b) && (a - epsilon <= b);
}

