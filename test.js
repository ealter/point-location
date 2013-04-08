function runTests() {
  function segmentIntersectionTest() {
    var s1 = new LineSegment(new Point(5, 5), new Point(10, 10));
    var s2 = new LineSegment(new Point(7, 5), new Point(6, 10));
    assert(lineSegmentsIntersect(s1, s2));
  }
  function triangulationTest(points) {
    for(var i=0; i<points.length; i++) {
      addPoint(new Point(points[i][0], points[i][1]));
    }
  }
  var triangulation1 = [[179, 177],
                        [530, 160],
                        [537, 53],
                        [414, 84],
                        [409, 15],
                        [327, 138],
                        [179, 177]];
  var triangulation2 = [[184,132],
                       [392,57],
                       [504,159],
                       [297,227],
                       [29,155],
                       [306,159],
                       [356,102],
                       [184,132]];
  //segmentIntersectionTest();
  triangulationTest(triangulation2);
  return true;
}

