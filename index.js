var currentPolygon = []; //An array of points
var allPolygons = [currentPolygon];    //An array of point arrays. Includes currentPolygon

var canvas = $("#canvas");
var canvasPosition = {
    x: canvas.offset().left,
    y: canvas.offset().top
};

var mainTriangle = [new Point(0, canvas.height() - 2),
                    new Point(canvas.width() - 1, canvas.height() - 2),
                    new Point(canvas.width()/2, 0)];

$(function() {
  render();
});

canvas.on("click", function(e) {
  var mouse = new Point(e.pageX - canvasPosition.x, e.pageY - canvasPosition.y);
  if(pointIsInsideTriangle(mouse, mainTriangle)) {
    addPoint(mouse);
  } else {
    console.log("Point is outside the main triangle"); //TODO: user facing error message
  }
});

function addPoint(p) {
  p = snapToPoint(p, currentPolygon);
  console.log(p);
  if(canAppendPointToPolygon(currentPolygon, p)) {
    currentPolygon.push(p);
    var isFinishingPolygon = currentPolygon.length >= 3 && p.equals(currentPolygon[0]);
    if(isFinishingPolygon) {
      console.log("Finishing polygon");
      currentPolygon.forEach(function(p) {console.log("[" + p.x + "," + p.y + "],")})
      currentPolygon.pop();
      currentPolygon = [];
      allPolygons.push(currentPolygon);
    }
    render();
    if(isFinishingPolygon) {
      var polygon = allPolygons[allPolygons.length - 2];
      var triangles = triangulate(polygon);
      triangles = triangles.concat(trianglesOutsidePolygon(polygon, mainTriangle));
      renderTriangulation(triangles, "gray");
      var graph = triangulationToGraph(triangles);
      var independentSet = getIndependentSet(graph, 8, mainTriangle);
      for(var i=0; i<independentSet.length; i++) {
        drawCircle(independentSet[i].x, independentSet[i].y, "blue");
      }
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

function renderTriangulation(triangles, color) {
  triangles.forEach(function (triangle) {
    renderLine(triangle, {
      strokeStyle: color,
      closed: true
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
        var color = "black";
        if(polygon === currentPolygon && i == polygon.length - 1)
          color = "blue";
        drawCircle(polygon[i].x, polygon[i].y, color);
      }
      //Draw the lines connecting them
      renderLine(polygon, {
        closed: polygon !== currentPolygon
      });
    });
  }

  canvas.clearCanvas();
  renderPolygons();
  renderLine(mainTriangle, {
    closed: true,
    strokeStyle: "brown",
    strokeWidth: 4
  });
}

function drawCircle(x, y, color) {
  canvas.drawArc({
    fillStyle: color,
    strokeStyle: "black",
    x: x,
    y: y,
    radius: 5
  });
}
