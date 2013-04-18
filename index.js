var currentPolygon = []; //An array of points
var allPolygons = [currentPolygon]; //An array of point arrays. Includes currentPolygon

var canvas = $("#canvas");
var nextButton = $("#nextButton");
var canvasPosition = {
    x: canvas.offset().left,
    y: canvas.offset().top
};

var mainTriangle = [new Point(0, canvas.height() - 2),
                    new Point(canvas.width() - 1, canvas.height() - 2),
                    new Point(canvas.width()/2, 0)];

$(function() {
  render();
  nextButton.attr('disabled', 'disabled');
});

var logMessage = null;
(function() {
  var log = $("#messageLog");
  var count = 0;
  logMessage = function(message, isError) {
    count++;
    var paragraph = $(document.createElement('p'));
    paragraph.text(count + ". " + message)
             .addClass("logMessage");
    if(isError) {
      paragraph.addClass("errorMessage");
    }
    log.append(paragraph);
  };
})();


canvas.on("click", function(e) {
  var mouse = new Point(e.pageX - canvasPosition.x, e.pageY - canvasPosition.y);
  if(pointIsInsideTriangle(mouse, mainTriangle)) {
    addPoint(mouse);
  } else {
    logMessage("Point is outside the main triangle", true);
  }
});

function setNextStep(text, callback) {
  if(callback) {
    nextButton.removeAttr('disabled');
    nextButton.val(text);
    nextButton.on('click', function() {
      nextButton.off('click');
      nextButton.attr('disabled', 'disabled');
      callback();
    });
  } else {
    nextButton.attr('disabled', 'disabled');
  }
}

function addPoint(p) {
  p = snapToPoint(p, currentPolygon);
  if(canAppendPointToPolygon(currentPolygon, p)) {
    currentPolygon.push(p);
    var isFinishingPolygon = currentPolygon.length >= 3 && p.equals(currentPolygon[0]);
    if(isFinishingPolygon) {
      logMessage("Finishing polygon");
      canvas.off('click'); //Disable clicks so that we don't get new points
      currentPolygon.forEach(function(p) {console.log("[" + p.x + "," + p.y + "],")})
      currentPolygon.pop();
      currentPolygon = [];
      allPolygons.push(currentPolygon);
    }
    render();
    if(isFinishingPolygon) {
      var polygon = allPolygons[allPolygons.length - 2];
      setNextStep("Triangulate polygon", function() {
        var triangles = triangulate(polygon);
        render();
        renderTriangulation(triangles, "gray");
        setNextStep("Triangulate outside of polygon", function() {
          triangles = triangles.concat(trianglesOutsidePolygon(polygon, mainTriangle));
          renderTriangulation(triangles, "gray");
          animateIndependentSetRemoval(triangles, 700, true);
        });
      });
    }
  } else {
    logMessage("Self intersecting segment. Ignoring.", true);
    drawTemporarySegment(p, currentPolygon[currentPolygon.length - 1]);
  }
}

function animateIndependentSetRemoval(triangles, waitTime, interactive) {
  function continuousRemoval(triangles) {
    if(triangles.length > 1) {
      if(interactive) {
        setNextStep("Find independent set", function() {
          removeNextIndependentSet(triangles, continuousRemoval);
        });
      } else {
        setTimeout(function () {
          removeNextIndependentSet(triangles, continuousRemoval)
        }, waitTime);
      }
    }
  };
  continuousRemoval(triangles);
}

function renderGraphWithoutPoints(graph, badpoints, color) {
  var badPointsSet = {};
  for(var i=0; i<badpoints.length; i++) {
    badPointsSet[badpoints[i].hash()] = true;
  }

  function isBadPoint(p) {
    return badPointsSet[p.hash()] === true;
  }

  $.each(graph, function (key, node) {
    if(isBadPoint(node.p)) {
      return;
    }
    for(var i=0; i<node.neighbors.length; i++) {
      var p = node.neighbors[i];
      if(!isBadPoint(p)) {
        renderLine([p, node.p], {
          strokeStyle: color
        });
      }
    }
    drawCircle(node.p, "black");
  });
  renderOuterTriangle();
}

function removeNextIndependentSet(triangles, callback) {
  var graph = triangulationToGraph(triangles);
  var independentSet = getIndependentSet(graph, 8, mainTriangle);
  for(var i=0; i<independentSet.length; i++) {
    drawCircle(independentSet[i], "brown");
  }
  setNextStep("Remove the independent set", function() {
    var newtriangles = removeIndependentSetFromTriangulation(triangles, independentSet);
    canvas.clearCanvas();
    renderOuterTriangle();
    renderGraphWithoutPoints(graph, independentSet, "blue"); //TODO
    setNextStep("Retriangulate the holes", function() {
      var holes = getHolesInPolygon(graph, independentSet);
      var holeTriangles = holes.map(triangulate);
      for(var i=0; i<holeTriangles.length; i++) {
        renderTriangulation(holeTriangles[i], "gray");
        newtriangles = newtriangles.concat(holeTriangles[i]);
      }
      callback(newtriangles);
    });
  });
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
  function intersectsVertex() {
    for(var i=1; i<polygon.length; i++) {
      if(polygon[i].equals(p))
        return true;
    }
    return false;
  }

  return polygon.length == 0 ||
    (!p.equals(polygon[polygon.length - 1]) && //Can't make an edge from a point to the same point
     (polygon.length <= 1 || !p.equals(polygon[polygon.length - 2])) && //No edge that already exists
     !intersectsVertex() &&
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
        drawCircle(polygon[i], color);
      }
      //Draw the lines connecting them
      renderLine(polygon, {
        closed: polygon !== currentPolygon
      });
    });
  }

  canvas.clearCanvas();
  renderPolygons();
  renderOuterTriangle();
}

function renderOuterTriangle() {
  renderLine(mainTriangle, {
    closed: true,
    strokeStyle: "brown",
    strokeWidth: 4
  });
}

function drawCircle(p, color) {
  canvas.drawArc({
    fillStyle: color,
    strokeStyle: "black",
    x: p.x,
    y: p.y,
    radius: 5
  });
}

