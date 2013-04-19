var currentPolygon = []; //An array of points
var allPolygons = [currentPolygon]; //An array of point arrays. Includes currentPolygon

var canvas = $("#canvas");
var nextButton = $("#nextStepDataStructure");
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
  $("#nextStepPointLocation").attr('disabled', 'disabled');
  $("#choosePoint").attr('disabled', 'disabled');
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

function setCanvasOnClick(callback) {
  canvas.off('click');
  canvas.on('click', function(e) {
    var mouse = new Point(e.pageX - canvasPosition.x, e.pageY - canvasPosition.y);
    callback(mouse);
  });
}

setCanvasOnClick(function(mouse) {
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
    if($("#shouldAnimate").is(':checked')) {
      setTimeout(function() {
        if(nextButton.attr('disabled') != 'disabled') {
          nextButton.click();
        }
      }, 350);
    }
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
          interactiveIndependentSetRemoval(triangles);
        });
      });
    }
  } else {
    logMessage("Self intersecting segment. Ignoring.", true);
    drawTemporarySegment(p, currentPolygon[currentPolygon.length - 1]);
  }
}

function interactiveIndependentSetRemoval(triangles) {
  var pointLocationData = [triangles.slice(0)];
  function continuousRemoval(triangles) {
    if(triangles.length > 1) {
      setNextStep("Find independent set", function() {
        var independentSet = removeNextIndependentSet(triangles, continuousRemoval);
        var graph = triangulationToGraph(triangles);
        pointLocationData.push(getNextTriangulationLevel(graph, independentSet));
      });
    } else {
      console.log(pointLocationData);
      waitForPointLocationChoice(pointLocationData);
    }
  }
  continuousRemoval(triangles);
}

function waitForPointLocationChoice(pointLocationData) {
  $("#nextStepDataStructure").val("Done building the data structure")
                             .attr('disabled', 'disabled');
  nextButton = $("#nextStepPointLocation");
  nextButton.attr('disabled', 'disabled');

  var choosePointButton = $("#choosePoint");
  choosePointButton.off('click');
  choosePointButton.on('click', function() {
    waitForPointLocationChoice(pointLocationData);
  });
  choosePointButton.attr('disabled', 'disabled');

  nextButton.val("Choose a point to locate");
  choosePointButton.val("Choose a point to locate");
  render();
  setCanvasOnClick(function (mouse) {
    canvas.off('click');
    drawCircle(mouse, "green");
    choosePointButton.val("Reset point location");
    choosePointButton.removeAttr('disabled');
    nextButton.removeAttr('disabled');
    setNextStep("Locate the point", function() {
      interactivelyLocatePoint(pointLocationData, mouse);
    });
  });
}

function interactivelyLocatePoint(pointLocationData, query) {
  function renderCurrentTriangulation(allTriangles, emphasizedTriangles) {
    canvas.clearCanvas();
    renderTriangulation(allTriangles, "gray");
    renderTriangulation(emphasizedTriangles, "blue");
    renderOuterTriangle();
    drawCircle(query, "green");
  }

  function lastStep() {
    var correctTriangle = null;
    var triangles = pointLocationData[0];
    for(var i=0; i<triangles.length; i++) {
      if(pointIsInsideTriangle(query, triangles[i])) {
        correctTriangle = triangles[i];
        break;
      }
    }
    console.assert(correctTriangle);
    renderCurrentTriangulation(pointLocationData[0], [correctTriangle]);
  }

  function nextLevel(level, overlappingTriangles) {
    console.assert(level < pointLocationData.length);
    var triangles = pointLocationData[level];

    renderCurrentTriangulation(triangles, overlappingTriangles);

    var nextOverlaps = null;
    for(var i=0; i<triangles.length; i++) {
      if(pointIsInsideTriangle(query, triangles[i])) {
        nextOverlaps = triangles[i].overlaps;
        break;
      }
    }

    if(nextOverlaps === null) {
      logMessage("The point was not found");
    } else if(level <= 1) {
      setNextStep("Last step: Find the point", lastStep);
    } else {
      setNextStep("Next level", function() {
        nextLevel(level - 1, nextOverlaps);
      });
    }
  }
  nextLevel(pointLocationData.length - 1, []);
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
  return independentSet;
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

