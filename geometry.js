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
};

Point.prototype.hash = function() {
  return Math.floor(this.x * canvas.width() + this.y);
};

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

function isReflexVertex(polygon, i, isClockwise) {
  if(polygon.length < 4) {
    return false;
  }
  console.assert(typeof isClockwise === 'boolean');
  var v = polygon[i];
  var prev = polygon.get(i - 1);
  var next = polygon.get(i + 1);
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
    if(polygon[i].x < minX || (polygon[i].x == polygon[minIndex].x &&
                               polygon[i].y < polygon[minIndex].y)) {
      minX = polygon[i].x;
      minIndex = i;
    }
  }
  return minIndex;
}

function isPolygonClockwise(polygon) {
  var minIndex = indexOfMinX(polygon);
  var prev = polygon.get(minIndex - 1);
  var next = polygon.get(minIndex + 1);
  var v = polygon[minIndex];
  return isLeftTurn(prev, v, next);
}

function isEar(polygon, vertexIndex, isClockwise) {
  if(isReflexVertex(polygon, vertexIndex, isClockwise))
    return false;
  var prev = polygon.get(vertexIndex - 1);
  var next = polygon.get(vertexIndex + 1);
  var v = polygon[vertexIndex];
  var triangle = [prev, v, next];
  for(var i=0; i<polygon.length - 3; i++) {
    if(pointIsInsidePolygon(polygon.get(i + 2 + vertexIndex), triangle)) {
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
  for(var i=0; i<polygon.length; i++) {
    if(lineSegmentsIntersect(seg, new LineSegment(polygon[i], polygon.get(i+1)))) {
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
    var seg = new LineSegment(polygon[index], polygon.get(index + 1));
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
    return pointIsInsidePolygon(polygon[index], triangle);
  }
  //Test every possible segment
  var rayVector = minIntersection.sub(polygon[fromIndex]);
  var rayAngle = Math.atan2(rayVector.x, rayVector.y);
  for(var j=0; j<polygon.length - 1; j++) {
    var i = polygon.normalizeIndex(j + fromIndex + 1);
    if(pointIsOnOrInsideTriangle(i)) {
      var diagonal = polygon[i].sub(polygon[fromIndex]);
      var angle = Math.atan2(diagonal.x, diagonal.y) - rayAngle;
      while(angle <= -Math.PI)
        angle += 2 * Math.PI;
      while(angle >= Math.PI)
        angle -= 2 * Math.PI;
      if(angle < 0) {
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
  console.assert(closestIndexes[0] >= 0 && closestIndexes[1] >= 0);
  if(closestIndexes[0] === polygon.normalizeIndex(fromIndex + 1) ||
      closestIndexes[0] === endingIndex) {
    return closestIndexes[1];
  }
  return closestIndexes[0];
}

function pointIsOnPolygon(p, polygon) {
  return polygon.some(function (p2) {
    return p2.equals(p);
  });
}

//If the point is a vertex on the polygon, this returns false
function pointIsInsidePolygon(p, polygon) {
  //Use the plum line test
  var ray = new LineSegment(p, new Point(p.x + 1e5, p.y));
  var count = 0;
  for(var i=0; i<polygon.length; i++) {
    var segment = new LineSegment(polygon[i], polygon.get(i + 1));
    if(lineSegmentsIntersect(segment, ray)) {
      count++;
    }
  }
  return count % 2 === 1;
}

function triangulate(polygon) {
  var triangles = [];
  triangulateEarClipping(polygon, triangles);
  return triangles;
}

function triangulateEarClipping(polygon, triangles) {
  //see end of http://www.cs.tufts.edu/comp/163/classnotes/3-triangulation.pdf
  if(polygon.length < 3) {
    console.log("Tried to triangulate a polygon that was smaller than a triangle");
    console.log(polygon);
    return;
  }
  var isClockwise = isPolygonClockwise(polygon);
  var medianIndex = Math.floor(polygon.length / 2);
  if(isEar(polygon, medianIndex, isClockwise)) {
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
  triangulateEarClipping(half1, triangles);

  var half2 = polygon.slice(0);
  half2.splice(medianIndex + 1, diagonalIndex - medianIndex - 1);
  triangulateEarClipping(half2, triangles);
}

function trianglesOutsidePolygon(polygon, outerTriangle) {
  function triangulatePocket(beginIndex, endIndex) {
    if(endIndex > beginIndex) {
      var pocket = polygon.slice(beginIndex, endIndex + 1);
    } else {
      var pocket = polygon.slice(beginIndex).concat(polygon.slice(0, endIndex + 1));
    }
    return triangulate(pocket);
  }

  function triangulateAllPockets(polygon, hull) {
    //Find the index of the first hull point
    var firstPointInHull = -1;
    for(var i=0; i<polygon.length; i++) {
      if(polygon[i].equals(hull[0]))
        firstPointInHull = i;
    }
    console.assert(firstPointInHull >= 0);

    var triangles = [];
    var pointOffset = 0;
    var beginPocket = 0;
    var isInsidePocket = false;
    var hullIndex = 0;
    console.assert(polygon[firstPointInHull].equals(hull[hullIndex]));
    while(pointOffset < polygon.length) {
      var i = polygon.normalizeIndex(pointOffset + firstPointInHull);
      if(polygon[i].equals(hull[hullIndex])) {
        if(isInsidePocket) {
          triangles = triangles.concat(triangulatePocket(beginPocket, i));
        }
        isInsidePocket = false;
        hullIndex = (hullIndex + 1) % hull.length;
      } else {
        if(!isInsidePocket) {
          isInsidePocket = true;
          beginPocket = polygon.normalizeIndex(i - 1);
        }
      }
      pointOffset++;
      if(pointOffset < polygon.length) {
        console.assert(hullIndex < hull.length);
      }
    }
    if(isInsidePocket) {
      triangles = triangles.concat(triangulatePocket(beginPocket, firstPointInHull));
    }
    return triangles;
  }

  function tangentIndexes(origin, hull) {
    //Calculates the 2 points that are tangent to the hull from the "origin"
    //Precondition: the origin is outside of the hull
    shootRaysFromPointToPolygon(hull, origin);
    var referenceAngle = hull[0].angle;
    var minIndex = 0;
    var maxIndex = 0;
    for(var i=0; i<hull.length; i++) {
      hull[i].angle -= referenceAngle;
      if(hull[i].angle < -Math.PI)
        hull[i].angle += 2 * Math.PI;
      else if(hull[i].angle > Math.PI)
        hull[i].angle -= 2 * Math.PI;

      if(hull[i].angle < hull[minIndex].angle) {
        minIndex = i;
      }
      if(hull[i].angle > hull[maxIndex].angle) {
        maxIndex = i;
      }
    }
    console.assert(minIndex !== maxIndex);
    return [minIndex, maxIndex];
  }

  //find the convex hull of the pointset,
  //triangulate each pocket, and then triangulate the outer pocket.
  console.assert(outerTriangle.length === 3);
  var hull = convexHull(polygon);
  var triangles = triangulateAllPockets(polygon, hull);
  for(var i=0; i<outerTriangle.length; i++) {
    var tangents = tangentIndexes(outerTriangle[i], hull);
    //If the polygon is counterclockwise then go from tangents[0] to tangents[1]
    //If the polygon is clockwise        then go from tangents[1] to tangents[0]
    if(isPolygonClockwise(hull)) {
      tangents = [tangents[1], tangents[0]];
    }
    var newHull = hull.slice(0);
    if(tangents[0] < tangents[1]) {
      //Remove elements in between
      newHull.splice(tangents[0] + 1, tangents[1] - tangents[0] - 1, outerTriangle[i]);
    } else {
      //Remove elements at the beginning and end of the array
      newHull.splice(tangents[0] + 1, hull.length, outerTriangle[i]);
      newHull.splice(0, tangents[1]);
    }
    var numElementsRemoved = hull.length - newHull.length + 1;
    for(var j=0; j<numElementsRemoved + 1; j++) {
      var triangle = [hull.get(tangents[0] + j),
                      hull.get(tangents[0] + j + 1),
                      outerTriangle[i]];
      triangles.push(triangle);
    }
    hull = newHull;
  }
  return triangles;
}

function shootRaysFromPointToPolygon(polygon, p) {
  for(var i=0; i<polygon.length; i++) {
    var vector = polygon[i].sub(p);
    polygon[i].angle = Math.atan2(vector.y, vector.x);
  }
}

//Sort the points radially counter-clockwise
function radiallySortPoints(polygon, origin) {
  shootRaysFromPointToPolygon(polygon, origin);

  //Sort the points radially counter-clockwise
  polygon.sort(function (p1, p2) {
    return p2.angle - p1.angle;
  });
  for(var i=0; i<polygon.length; i++) {
    delete polygon[i].angle;
  }
}

//Finds the convex hull of a polygon using a graham scan
function convexHull(polygon) {
  var extremeIndex = indexOfMinX(polygon);
  var sortedPoints = polygon.slice(0);
  sortedPoints.splice(extremeIndex, 1);
  radiallySortPoints(sortedPoints, polygon[extremeIndex]);

  var hull = [polygon[extremeIndex]];
  var i = 0;
  while(i < sortedPoints.length) {
    if(hull.length < 2 || isRightTurn(hull[hull.length - 2], hull[hull.length - 1], sortedPoints[i])) {
      hull.push(sortedPoints[i]);
      i++;
    } else {
      hull.pop();
      console.assert(hull.length >= 1);
      if(hull.length < 1)
        throw "Infinite loop";
    }
  }
  var hullIsClockwise = isPolygonClockwise(hull);
  if(isPolygonClockwise(polygon) != hullIsClockwise) {
    hull.reverse();
  }
  return hull;
}

function isUndefined(x) {
  return typeof x === 'undefined';
}

//Graph functions
function triangulationToGraph(triangles) {
  var graph = {}; //Keys are hashed points

  function addDirectedEdge(p1, p2) {
    var h1 = p1.hash();
    var h2 = p2.hash();
    if(!graph[h1]) {
      graph[h1] = {
        p: p1,
        neighbors: {},
        triangles: []
      };
    }
    graph[h1].neighbors[h2] = p2;
  }

  function addEdge(p1, p2) {
    addDirectedEdge(p1, p2);
    addDirectedEdge(p2, p1);
  }

  function addTriangle(p, triangle) {
    graph[p.hash()].triangles.push(triangle);
  }

  for(var i=0; i<triangles.length; i++) {
    var tri = triangles[i];
    addEdge(tri[0], tri[1]);
    addEdge(tri[1], tri[2]);
    addEdge(tri[2], tri[0]);
    addTriangle(tri[0], triangles[i]);
    addTriangle(tri[1], triangles[i]);
    addTriangle(tri[2], triangles[i]);
  }
  //Convert the neighbors object to an array
  for(var n in graph) {
    if(graph.hasOwnProperty(n)) {
      graph[n].neighbors = $.map(graph[n].neighbors, function (value, key) { return value; });
    }
  }
  return graph;
}

//Finds an independent set in the graph of vertices with degree <= maxDegree
//The independent set will not include vertices in ignoreVertices
function getIndependentSet(graph, maxDegree, ignoreVertices) {
  var lowDegreeVertices = {};
  for(var key in graph) {
    if(graph.hasOwnProperty(key)) {
      var node = graph[key];
      if(node.neighbors.length <= maxDegree) {
        var isIgnored = false;
        for(var i=0; i<ignoreVertices.length; i++) {
          if(node.p.equals(ignoreVertices[i])) {
            isIgnored = true;
          }
        }
        if(!isIgnored) {
          lowDegreeVertices[node.p.hash()] = node;
        }
      }
    }
  }
  for(var key in lowDegreeVertices) {
    var node = lowDegreeVertices[key];
    node.neighbors.forEach(function (neighbor) {
      var hashed = neighbor.hash();
      if(lowDegreeVertices[hashed]) {
        delete lowDegreeVertices[hashed];
      }
    });
  };
  return $.map(lowDegreeVertices, function(value) { return value.p; });
}

//Removes all triangles with vertices inside the independent set.
//This would be possible in O(n), if I had kept references to the triangles in
//the graph data structure. For simplicity, I'm doing this in O(n^2)
function removeIndependentSetFromTriangulation(triangles, independentSet) {
  var newTriangles = [];
  for(var i=0; i<triangles.length; i++) {
    var isMatch = false;
    for(var j=0; !isMatch && j<independentSet.length; j++) {
      for(var k=0; k<3; k++) {
        if(triangles[i][k].equals(independentSet[j])) {
          isMatch = true;
        }
      }
    }
    if(!isMatch) {
      newTriangles.push(triangles[i]);
    }
  }
  console.assert(independentSet.length === 0 || newTriangles.length < triangles.length);
  return newTriangles;
}

//Top level (t=0) is the outer triangle
//For each triangle on L(t), mark which triangles on L(t+1) overlap it.
//Given L(t+1), to find L(t), find the holes and then triangulate them
function getNextTriangulationLevel(graph, independentSet) {
  var triangles = [];
  $.each(graph, function(key, node) {
    node.mark = false;
  });

  function shouldAddTriangle(tri) {
    //Check if any of the points are in the independent set
    for(var i=0; i<independentSet.length; i++) {
      if(independentSet[i].equals(tri[0]) ||
         independentSet[i].equals(tri[1]) ||
         independentSet[i].equals(tri[2])) {
        return false;
      }
    }
    //Check if we've already seen this triangle
    for(var i=0; i<triangles.length; i++) {
      if(tri[0].equals(triangles[i][0]) &&
         tri[1].equals(triangles[i][1]) &&
         tri[2].equals(triangles[i][2])) {
        return false;
      }
    }
    return true;
  }

  independentSet.forEach(function (p) {
    graph[p.hash()].mark = true;
    var hole = getOneHoleInPolygon(graph, p);
    var holeTriangles = triangulate(hole);
    holeTriangles.forEach(function (tri) {
      //The triangle might not overlap all of these, but it will overlap at most
      //8, so in terms of Big O, O(1) == O(8)
      tri.overlaps = graph[p.hash()].triangles.filter(function (tri2) {
        return trianglesIntersect(tri, tri2);
      });
      console.assert(tri.overlaps.length > 0);
    });
    triangles = triangles.concat(holeTriangles);
  });

  $.each(graph, function(key, node) {
    if(!node.mark) {
      var nodeTriangles = node.triangles;
      nodeTriangles.forEach(function (tri) {
        if(shouldAddTriangle(tri)) {
          var nextTriangle = tri.slice(0);
          nextTriangle.overlaps = [tri];
          triangles.push(nextTriangle);
        }
      });
    }
    delete node.mark;
  });

  return triangles;
}

function trianglesIntersect(t1, t2) {
  //2 triangles intersect if any edges cross or if one is completely inside of
  //the other
  console.assert(t1.length === 3 && t2.length === 3);
  for(var i=0; i<3; i++) {
    var seg1 = new LineSegment(t1[i], t1.get(i+1));
    if(segmentIntersectsPolygon(t2, seg1)) {
      return true;
    }
    if(pointIsInsidePolygon(t1[i], t2) || pointIsInsidePolygon(t2[i], t1)) {
      return true;
    }
  }
  return false;
}

function getOneHoleInPolygon(graph, removedPoint) {
  var neighbors = graph[removedPoint.hash()].neighbors.slice(0);
  radiallySortPoints(neighbors, removedPoint);
  return neighbors;
}

function getHolesInPolygon(graph, independentSet) {
  var holes = [];
  for(var i=0; i<independentSet.length; i++) {
    holes.push(getOneHoleInPolygon(graph, independentSet[i]));
  }
  return holes;
}

