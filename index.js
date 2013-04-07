var width = 700;
var height = 500;
var currentPolygon = []; //An array of points
var allPolygons = [currentPolygon];    //An array of point arrays. Includes currentPolygon

var svg = d3.select("body").append("svg")
                           .attr("width", width)
                           .attr("height", height)
                           .style("border", "1px solid black");

var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

svg.on("click", function() {
  var p = snapToPoint(new Point(d3.event.offsetX, d3.event.offsetY), currentPolygon);
  console.log(p);
  if(canAppendPointToPolygon(currentPolygon, p)) {
    currentPolygon.push(p);
    var isFinishingPolygon = currentPolygon.length >= 3 && p.equals(currentPolygon[0]);
    redrawPolygon(currentPolygon, isFinishingPolygon);
    if(isFinishingPolygon) {
      //drawTriangulation(currentPolygon);
      currentPolygon.pop();
      triangulateEarClipping(currentPolygon);
      currentPolygon = [];
      allPolygons.push(currentPolygon);
    }
  } else {
    console.log("self intersecting");
    drawTemporarySegment(p, currentPolygon[currentPolygon.length - 1]);
  }
});

function triangulate(polygon) {
  return d3.geom.delaunay(currentPolygon.map(function (vertex) {
    return [vertex.x, vertex.y];
  }));
}

function drawTriangulation(polygon) {
  path.data(triangulate(polygon))
      .enter().append("path")
      .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
      .style("fill", "None")
      .style("stroke", "green");
}

function snapToPoint(p, polygon) {
  //If (x,y) is close to a point on the polygon, it returns that point
  for(var i=0; i<polygon.length; i++) {
    if(distanceSquared(p, polygon[i]) < 300) {
      console.log("snapping");
      return polygon[i].copy();
    }
  }
  return p.copy();
}

function drawTemporarySegment(p1, p2) {
  var line = svg.append("svg:line")
                .attr("x1", p1.x)
                .attr("y1", p1.y)
                .attr("x2", p2.x)
                .attr("y2", p2.y)
                .style("stroke", "red")
                .transition()
                .duration(600)
                .style("opacity", 0)
                .remove();
}

function segmentIntersectsAnyPolygon(seg) {
  return allPolygons.some(function(polygon) {
    return segmentIntersectsPolygon(polygon, seg);
  });
}

function canAppendPointToPolygon(polygon, p) {
  return polygon.length == 0 ||
    (!p.equals(polygon[polygon.length - 1]) && //Can't make an edge from a point to the same point
     (polygon.length <= 1 || !p.equals(polygon[polygon.length - 2])) && //No edge that already exists
     !segmentIntersectsAnyPolygon(new LineSegment(polygon[polygon.length - 1], p)));
}

function redrawPolygon(polygon, highlight) {
  var g = circle.data(polygon).enter();
  g.append('circle')
    .attr('class', 'vertex')
    .attr('r', 5)
    .attr('cx', function(d) { return d.x; })
    .attr('cy', function(d) { return d.y; });
  var line = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });
  var lineData = g.append("svg:path")
    .attr("d", line(polygon))
    .style("fill", "None")
    .style("stroke-width", 3);
  if(highlight) {
    lineData.style("stroke", "blue")
            .transition()
            .duration(800)
            .style("stroke", "black")
            .style("stroke-width", 1);
  } else {
    lineData.style("stroke", "black")
            .style("stroke-width", 1);
  }
}

