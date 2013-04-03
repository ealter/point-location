function isApproxEqual(a, b) {
  var epsilon = 1e-4;
  return (a + epsilon >= b) && (a - epsilon <= b);
}

function Point(x, y) {
  this.x = x;
  this.y = y;
  this.equals = function(p) {
    return isApproxEqual(p.x, this.x) && isApproxEqual(p.y, this.y);
  }
  this.copy = function() {
    return new Point(this.x, this.y);
  }
}

function LineSegment(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;
}

function distanceSquared(p1, p2) {
  var dx = p1.x - p2.x;
  var dy = p1.y - p2.y;
  return dx*dx + dy*dy;
}

function crossProduct(p1, p2, p3) {
  return (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);
}

function isLeftTurn(p1, p2, p3) {
  return crossProduct(p1, p2, p3) > 0;
}

function isRightTurn(p1, p2, p3) {
  return crossProduct(p1, p2, p3) < 0;
}

function lineSegmentsIntersect(s1, s2) {
  function doesIntersect(a, b) {
    if(isLeftTurn(a.p1, a.p2, b.p1)) {
      return isRightTurn(a.p1, a.p2, b.p2);
    } else {
      return isLeftTurn(a.p1, a.p2, b.p2);
    }
  }
  return doesIntersect(s1, s2) && doesIntersect(s2, s1);
}

