var currentPolygon = []; //An array of points
var allPolygons = [currentPolygon];    //An array of point arrays. Includes currentPolygon

var canvas = $("#canvas");
var canvasPosition = {
    x: canvas.offset().left,
    y: canvas.offset().top
};

canvas.on("click", function(e) {
  var mouse = new Point(e.pageX - canvasPosition.x, e.pageY - canvasPosition.y);
  var p = snapToPoint(mouse, currentPolygon);
  console.log(p);
  if(canAppendPointToPolygon(currentPolygon, p)) {
    currentPolygon.push(p);
    var isFinishingPolygon = currentPolygon.length >= 3 && p.equals(currentPolygon[0]);
    if(isFinishingPolygon) {
      console.log("Finishing polygon");
      currentPolygon.pop();
      //triangulateEarClipping(currentPolygon);
      currentPolygon = [];
      allPolygons.push(currentPolygon);
    }
    render();
  } else {
    console.log("self intersecting");
    drawTemporarySegment(p, currentPolygon[currentPolygon.length - 1]);
  }
});

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

function render() {
  canvas.clearCanvas();
    console.log(allPolygons);
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
    var line = {
      strokeStyle: "black",
      strokeWidth: 1,
      closed: polygon !== currentPolygon
    };
    for(var i=0; i<polygon.length; i++) {
      line['x' + (i+1)] = polygon[i].x;
      line['y' + (i+1)] = polygon[i].y;
    }
    canvas.drawLine(line);
  });
}

