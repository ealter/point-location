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

Point.prototype.normalize = function() {
  return this.scalarDiv(Math.sqrt(this.x * this.x + this.y * this.y));
};

Point.prototype.dotProduct = function(p) {
  return this.x * p.x + this.y * p.y;
}

function LineSegment(p1, p2) {
  console.assert(typeof p1 === "object" && typeof p2 === "object");
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
  return this.p2.sub(this.p1).scalarDiv(length);
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
  console.assert(!isApproxEqual(rs, 0));

  //Parametric values
  var t = crossProduct(PointZero, s2.p1.sub(s1.p1), PointZero, s)/rs;

  return s1.p1.add(r.scalarMult(t));
}

function rayToHugeSegment(ray) {
  var multiplier = 1000000/ray.magnitude();
  return new LineSegment(ray.p1, new Point(ray.p2.x * multiplier, ray.p2.y * multiplier));
}

function lineSegmentIntersectsRay(seg, ray) {
  return lineSegmentsIntersect(seg, rayToHugeSegment(ray));
}

function nextPoint(polygon, i) {
  return polygon.get(i+1);
}

function previousPoint(polygon, i) {
  return polygon.get(i-1);
}

function isReflexVertex(polygon, i, isClockwise) {
  if(polygon.length < 4) {
    return false;
  }
  console.assert(typeof isClockwise === 'boolean');
  var v = polygon[i];
  var prev = previousPoint(polygon, i);
  var next = nextPoint(polygon, i);
  console.assert(v && prev && next);
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
  var prev = polygon.get(minIndex - 1);
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
  var triangle = [prev, v, next];
  for(var i=0; i<polygon.length - 3; i++) {
    if(pointIsInsideTriangle(polygon.get(i + 2 + vertexIndex), triangle)) {
      return false;
    }
  }
  return true;
}

function bisectingAngleUnitVector(p1, p2, p3) {
  var v1 = p1.sub(p2).normalize();
  var v2 = p3.sub(p2).normalize();
  return new Point((v1.x + v2.x)/2, (v1.y + v2.y)/2);
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

function makeDiagonal(polygon, fromIndex, isClockwise) {
  console.assert(polygon.length > 3);
  var rayVector = bisectingAngleUnitVector(polygon.get(fromIndex-1), polygon[fromIndex], polygon.get(fromIndex+1));
  rayVector = rayVector.scalarMult(1e6);
  if(isReflexVertex(polygon, fromIndex, isClockwise)) {
    console.log("We have a reflex vertex");
    rayVector = rayVector.scalarMult(-1); //Flip by 180 degrees
  }
  var ray = new LineSegment(polygon[fromIndex], polygon[fromIndex].add(rayVector));
  //Shoot that ray and find the first point that it hits
  var endingIndex = fromIndex - 1;
  while(endingIndex < 0)
    endingIndex += polygon.length;
  var minimumDistance = Number.MAX_VALUE;
  var minIndex = -1;
  var minIntersection = PointZero;
  for(var j=0; j<polygon.length - 2; j++) {
    var index = polygon.normalizeIndex(j + fromIndex + 1);
    console.assert(index !== fromIndex);
    var seg = new LineSegment(polygon[index], nextPoint(polygon, index));
    if(lineSegmentsIntersect(seg, ray)) {
      var intersection = getLineSegmentIntersection(seg, ray);
      var distance = distanceSquared(polygon[fromIndex], intersection);
      console.assert(!isNaN(distance));
      if(distance < minimumDistance) {
        minimumDistance = distance;
        minIndex = index;
        minIntersection = intersection;
      }
    }
  }
  console.log("From index is", fromIndex, "polygon", polygon);
  console.assert(minIndex !== fromIndex);
  console.assert(minIndex >= 0);
  console.assert(polygon.normalizeIndex(minIndex + 1) !== fromIndex);
  var triangle = [polygon[minIndex], polygon.get(minIndex + 1), polygon[fromIndex]];
  //Sweep this line in both directions radially (but only stuff we can see)
  var closestIndexes = [-1, -1];
  var closestAngles  = [Number.MAX_VALUE, -Number.MAX_VALUE];
  function pointIsOnOrInsideTriangle(index) {
    for(var j=0; j<3; j++) {
      if(triangle[j].equals(polygon[index]))
        return true;
    }
    return pointIsInsideTriangle(polygon[index], triangle);
  }
  //Test every possible segment
  var rayUnitVector = new Point(minIntersection.y - polygon[fromIndex].y,
                                minIntersection.x - polygon[fromIndex].x)
                      .normalize();
  for(var j=0; j<polygon.length - 1; j++) {
    var i = polygon.normalizeIndex(j + fromIndex + 1);
    if(pointIsOnOrInsideTriangle(i)) {
      var diagonal = new Point(polygon[i].x - polygon[fromIndex].x,
                            polygon[i].y - polygon[fromIndex].y);
      var angle = diagonal.normalize().dotProduct(rayUnitVector);
      console.log("angle is " + angle + " for index " + i);
      if(angle >= 0) {
        if(angle > closestAngles[1]) {
          closestAngles[1] = angle;
          closestIndexes[1] = i;
        }
      } else {
        if(angle < closestAngles[0]) {
          closestAngles[0] = angle;
          closestIndexes[0] = i;
        }
      }
    }
  }
  console.log("from index", fromIndex, "to index", minIndex, "closest", closestIndexes);
  console.assert(closestIndexes[0] >= 0 && closestIndexes[1] >= 0);
  if(closestIndexes[0] === polygon.normalizeIndex(fromIndex + 1) ||
      closestIndexes[0] === endingIndex) {
    return closestIndexes[1];
  }
  return closestIndexes[0];
}

//Tests whether the point p is inside the triangle
function pointIsInsideTriangle(p, triangle) {
  console.assert(triangle.length === 3);
  if(isLeftTurn(triangle[0], triangle[1], p)) {
    return isLeftTurn(triangle[1], triangle[2], p) &&
           isLeftTurn(triangle[2], triangle[0], p);
  } else {
    return isRightTurn(triangle[1], triangle[2], p) &&
           isRightTurn(triangle[2], triangle[0], p);
  }
}

function triangulate(polygon) {
  var triangles = [];
  triangulateEarClipping(polygon, triangles);
  console.log("The triangles are: ");
  console.log(triangles);
  return triangles;
}

function triangulateEarClipping(polygon, triangles) {
  //see end of http://www.cs.tufts.edu/comp/163/classnotes/3-triangulation.pdf
  if(polygon.length < 3) {
    console.log("Tried to triangulate a polygon that was smaller than a triangle");
    return polygon;
  }
  var isClockwise = isPolygonClockwise(polygon);
  var medianIndex = Math.floor(polygon.length / 2);
  if(isEar(polygon, medianIndex, isClockwise)) {
    console.log("We found an ear: ", polygon[medianIndex]);
    var triangle = [polygon[medianIndex], polygon[medianIndex + 1], polygon[medianIndex - 1]];
    triangles.push(triangle);
    polygon = polygon.slice(0);
    polygon.splice(medianIndex, 1);
    if(polygon.length >= 3) {
      triangulateEarClipping(polygon, triangles);
    }
    return;
  }
  var diagonalIndex = makeDiagonal(polygon, medianIndex, isClockwise);
  console.assert(diagonalIndex !== medianIndex);
  if(medianIndex > diagonalIndex) {
    //Swap values
    var tmp = medianIndex;
    medianIndex = diagonalIndex;
    diagonalIndex = tmp;
  }
  var half1 = polygon.slice(0);
  half1.splice(diagonalIndex + 1);
  half1.splice(0, medianIndex);
  console.log("diagonal is ", [polygon[diagonalIndex], polygon[medianIndex]], "polygon is ", polygon, "half1 is ", half1);
  triangulateEarClipping(half1, triangles);

  var half2 = polygon.slice(0);
  half2.splice(medianIndex + 1, diagonalIndex - medianIndex - 1);
  console.log("polygon is ", polygon, "half2 is ", half2, "median:", medianIndex, "diagonal:", diagonalIndex);
  triangulateEarClipping(half2, triangles);
}

