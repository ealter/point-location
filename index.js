var currentPolygon = []; //An array of points
var allPolygons = [currentPolygon];    //An array of point arrays. Includes currentPolygon

var canvas = $("#canvas");
var canvasPosition = {
    x: canvas.offset().left,
    y: canvas.offset().top
};

canvas.on("click", function(e) {
  var mouse = new Point(e.pageX - canvasPosition.x, e.pageY - canvasPosition.y);
  addPoint(mouse);
});

function addPoint(p) {
  p = snapToPoint(p, currentPolygon);
  console.log(p);
  if(canAppendPointToPolygon(currentPolygon, p)) {
    currentPolygon.push(p);
    render();
    var isFinishingPolygon = currentPolygon.length >= 3 && p.equals(currentPolygon[0]);
    if(isFinishingPolygon) {
      console.log("Finishing polygon");
      currentPolygon.forEach(function(p) {console.log("[" + p.x + "," + p.y + "],")})
      currentPolygon.pop();
      renderTriangulation(currentPolygon);
      currentPolygon = [];
      allPolygons.push(currentPolygon);
    }
  } else {
    console.log("self intersecting");
    drawTemporarySegment(p, currentPolygon[currentPolygon.length - 1]);
  }
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
  console.log("Temporary segment TODO");
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

function renderTriangulation(polygon) {
  var triangles = triangulate(currentPolygon);
  triangles.forEach(function (triangle) {
    renderLine(triangle, {
      strokeStyle: "gray"
    });
  });
}

function renderLine(points, options) {
  options.strokeStyle = options.strokeStyle || "black";
  if(typeof options.strokeWidth === 'undefined')
    options.strokeWidth = 1;
  for(var i=0; i<points.length; i++) {
    options['x' + (i+1)] = points[i].x;
    options['y' + (i+1)] = points[i].y;
  }
  canvas.drawLine(options);
}

function render() {
  function renderPolygons() {
    allPolygons.forEach(function (polygon) {
      for(var i=0; i<polygon.length; i++) {
        canvas.drawArc({
          fillStyle: "black",
          strokeStyle: "black",
          x: polygon[i].x,
          y: polygon[i].y,
          radius: 5
        });
      }
      //Draw the lines connecting them
      renderLine(polygon, {
        closed: polygon !== currentPolygon
      });
    });
  }

  canvas.clearCanvas();
  renderPolygons();
}

