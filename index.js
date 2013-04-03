var width = 700;
var height = 500;
var currentPolygon = [];

var svg = d3.select("body").append("svg")
                           .attr("width", width)
                           .attr("height", height)
                           .style("border", "1px solid black");

var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

svg.on("click", function() {
  var p = new Point(d3.event.x, d3.event.y);
  if(canAppendPointToPolygon(currentPolygon, p)) {
    currentPolygon.push(snapToPoint(p, currentPolygon));
    redrawPolygon(currentPolygon);
  } else {
    console.log("self intersecting");
    //TODO: animate this
  }
});

function snapToPoint(p, polygon) {
  //If (x,y) is close to a point on the polygon, it returns that point
  for(var i=0; i<polygon.length; i++) {
    if(distanceSquared(p, polygon[i]) < 300) {
      return new Point(polygon[i].x, polygon[i].y);
    }
  }
  return p.copy();
}

function Point(x, y) {
  this.x = x;
  this.y = y;
  this.equals = function(p) {
    return p.x == this.x && p.y == this.y;
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

function segmentIntersectsPolygon(polygon, seg) {
  for(var i=0; i<polygon.length - 1; i++) {
    if(!seg.p1.equals(polygon[i]) &&
       !seg.p2.equals(polygon[i]) &&
       !seg.p1.equals(polygon[i+1]) &&
       !seg.p2.equals(polygon[i+1]) &&
       lineSegmentsIntersect(seg, new LineSegment(polygon[i], polygon[i+1]))) {
      return true;
    }
  }
  return false;
}

function canAppendPointToPolygon(polygon, p) {
  return !segmentIntersectsPolygon(polygon,
              new LineSegment(polygon[polygon.length - 1], p));
}

function redrawPolygon(polygon) {
  circle = circle.data(polygon);
  var g = circle.enter();
  g.append('circle')
    .attr('class', 'vertex')
    .attr('r', 5)
    .attr('cx', function(d) { return d.x; })
    .attr('cy', function(d) { return d.y; });
  var line = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });
  g.append("svg:path")
    .attr("d", line(polygon))
    .style("fill", "None")
    .style("stroke", "black");
}

