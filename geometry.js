Array.prototype.get = function(i) {
  if(this.length === 0) {
    return undefined;
  }
  while(i < 0) {
    i += this.length;
  }
  return this[i % this.length];
}

function isApproxEqual(a, b) {
  var epsilon = 1e-4;
  return (a + epsilon >= b) && (a - epsilon <= b);
}

function Point(x, y) {
  this.x = x;
  this.y = y;
}

var PointZero = new Point(0, 0);

Point.prototype.sub = function(p) {
  return new Point(this.x - p.x, this.y - p.y);
};

Point.prototype.add = function(p) {
  return new Point(this.x + p.x, this.y + p.y);
};

Point.prototype.scalarMult = function(m) {
  return new Point(this.x * m, this.y * m);
};

Point.prototype.scalarDiv = function(m) {
  return new Point(this.x / m, this.y / m);
};

Point.prototype.equals = function(p) {
  return isApproxEqual(p.x, this.x) && isApproxEqual(p.y, this.y);
};

Point.prototype.copy = function() {
  return new Point(this.x, this.y);
};

Point.prototype.vector = function() {
  return new LineSegment(PointZero, this.copy());
};

function LineSegment(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;
}

LineSegment.prototype.magnitude = function() {
  return Math.sqrt(distanceSquared(this.p1, this.p2));
};

LineSegment.prototype.crossProduct = function(s2) {
  return crossProduct(this.p1, this.p2, s2.p1, s2.p2);
};

LineSegment.prototype.unitVector = function() {
  var length = this.magnitude();
  return this.p2.sub(p1).scalarDiv(length);
};

function distanceSquared(p1, p2) {
  var dx = p1.x - p2.x;
  var dy = p1.y - p2.y;
  return dx*dx + dy*dy;
}

function crossProduct(p1, p2, p3, p4) {
  return (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
}

function isLeftTurn(p1, p2, p3) {
  return crossProduct(p1, p2, p2, p3) > 0;
}

function isRightTurn(p1, p2, p3) {
  return crossProduct(p1, p2, p2, p3) < 0;
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

function getLineSegmentIntersection(s1, s2) {
  //Formula and explanation from here: http://stackoverflow.com/a/565282/614644
  var r = s1.p2.sub(s1.p1);
  var s = s2.p2.sub(s2.p1);
  var rs = crossProduct(PointZero, r, PointZero, s);

  //Parametric values
  var t = crossProduct(PointZero, s2.p1.sub(s1.p1), PointZero, s)/rs;

  return new s1.p1.add(r.scalerMult(t));
}

function rayToHugeSegment(ray) {
  var multiplier = 1000000/ray.magnitude();
  return new LineSegment(ray.p1, new Point(ray.p2.x * multiplier, ray.p2.y * multiplier));
}

function lineSegmentIntersectsRay(seg, ray) {
  return lineSegmentsIntersect(seg, rayToHugeSegment(ray));
}

function nextPoint(polygon, i) {
  return polygon[(i + 1) % polygon.length];
}

function previousPoint(polygon, i) {
  if(i === 0)
    return polygon[polygon.length - 1];
  return polygon[i - 1];
}

function isReflexVertex(polygon, i, isClockwise) {
  if(polygon.length < 4) {
    return false;
  }
  assert(typeof isClockwise === 'boolean');
  var v = polygon[i];
  var prev = previousPoint(polygon, i);
  var next = nextPoint(polygon, i);
  if(isRightTurn(prev, v, next))
    return isClockwise;
  else
    return !isClockwise;
}

function indexOfMinX(polygon) {
  var minX = Number.MAX_VALUE;
  var minIndex = 0;
  for(var i=0; i<polygon.length; i++) {
    if(polygon[i].x <= minX) {
      minX = polygon[i].x;
      minIndex = i;
    }
  }
  return minIndex;
}

function isPolygonClockwise(polygon) {
  var minIndex = indexOfMinX(polygon);
  var prev = previousPoint(polygon, minIndex);
  var next = nextPoint(polygon, minIndex);
  var v = polygon[minIndex];
  return isLeftTurn(prev, v, next);
}

function isEar(polygon, vertexIndex, isClockwise) {
  if(isReflexVertex(polygon, vertexIndex, isClockwise))
    return false;
  var prev = previousPoint(polygon, vertexIndex);
  var next = nextPoint(polygon, vertexIndex);
  var v = polygon[vertexIndex];
  for(var i=(vertexIndex + 1) % polygon.length; i < vertexIndex; i = (i + 1) % polygon.length) {
    if(isRightTurn(prev, v, polygon[i]) &&
       isRightTurn(v, next, polygon[i]) &&
       isClockwise) {
      return false;
    }
    if(isLeftTurn(prev, v, polygon[i]) &&
       isLeftTurn(v, next, polygon[i]) &&
       !isClockwise) {
      return false;
    }
  }
  return true;
}

function bisectingAngleUnitVector(p1, p2, p3) {
  var v1 = (new LineSegment(p1, p2)).unitVector();
  var v2 = (new LineSegment(p2, p3)).unitVector();
  return v1.add(v2).scalarMult(0.5);
}

function segmentIntersectsPolygon(polygon, seg) {
  for(var i=0; i<polygon.length - 1; i++) {
    if(//!seg.p1.equals(polygon[i]) &&
       //!seg.p2.equals(polygon[i]) &&
       //!seg.p1.equals(polygon[i+1]) &&
       //!seg.p2.equals(polygon[i+1]) &&
       lineSegmentsIntersect(seg, new LineSegment(polygon[i], polygon[i+1]))) {
      return true;
    }
  }
  return false;
}

function makeDiagonal(polygon, i, isClockwise) {
  assert(polygon.length > 3);
  var ray = bisectingAngleUnitVector(previousPoint(polygon, i), polygon[i], nextPoint(polygon, i));
  ray = rayToHugeSegment(ray);
  if(isReflexVertex(polygon, i, isClockwise)) {
    ray = ray.scalarMult(-1); //Flip by 180 degrees
  }
  //Shoot that ray and find the first point that it hits
  var endingIndex = i - 1;
  while(endingIndex < 0)
    endingIndex += polygon.length;
  var minimumDistance = Number.MAX_VALUE;
  var minIndex = 0;
  for(var j=(i + 1) % polygon.length; j < endingVertex; j = (j + 1) % polygon.length) {
    var seg = new LineSegment(polygon[j], nextPoint(polygon, j));
    if(lineSegmentsIntersect(seg, ray)) {
      var intersection = getLineSegmentIntersection(seg, ray);
      var distance = distanceSquared(polygon[i], intersection);
      if(distance < minimumDistance) {
        minimumDistance = distance;
        minIndex = j;
      }
    }
  }
  var triangle = [polygon[minIndex], polygon[(minIndex + 1) % polygon.length], polygon[i]];
  //Sweep this line in both directions
  var closestIndexes = [0, 0];
  var closestAngles  = [Number.MIN_VALUE, Number.MAX_VALUE];
  for(var j=(i + 1) % polygon.length; j < i; j = (j + 1) % polygon.length) {
    if(pointIsInsideTriangle(polygon[j], triangle)) {
      var angle = Math.atan((polygon[j].y - polygon[i].y)/
          (polygon[j].x - polygon[i].x));
      if(angle >= 0) {
        if(angle < closestAngles[1]) {
          closestAngles[1] = angle;
          closestIndexes[1] = j;
        }
      } else {
        if(angle > closestAngles[0]) {
          closestAngles[0] = angle;
          closestIndexes[0] = j;
        }
      }
    }
  }
  if(closestIndex[0] === (i + 1) % polygon.length ||
      closestIndex[0] === endingIndex) {
    return closestIndex[1];
  }
  return closestIndex[0];
}

//Tests whether the point p is inside the triangle
function pointIsInsideTriangle(p, triangle) {
  assert(triangle.length === 3);
  if(isLeftTurn(triangle[0], triangle[1], p)) {
    return isLeftTurn(triangle[1], triangle[2], p) &&
           isLeftTurn(triangle[2], triangle[0], p);
  } else {
    return isRightTurn(triangle[1], triangle[2], p) &&
           isRightTurn(triangle[2], triangle[0], p);
  }
}

function findEar(polygon, bIndex, eIndex, isClockwise) {
  function getMiddle() {
    var numElements = eIndex - bIndex;
    if(numElements < 0)
      numElements += polygon.length;
    return (bIndex + numElements) % polygon.length;
  }
  var medianIndex = getMiddle();
  if(isEar(polygon, medianIndex, isClockwise)) {
    return medianIndex;
  }
  if(eIndex == bIndex) {
    console.log("We did not find an ear!!!");
    return bIndex;
  }
  //TODO: make diagonal
  return findEar(polygon, medianIndex, eIndex, isClockwise);
}

function triangulateEarClipping(polygon) {
  var isClockwise = isPolygonClockwise(polygon);
  //TODO see end of http://www.cs.tufts.edu/comp/163/classnotes/3-triangulation.pdf
}

