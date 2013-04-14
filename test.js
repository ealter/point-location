function runTests(testNum) {
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
                       [345,159],
                       [356,102],
                       [184,132]];
  var triangulation3 = [[198,362],
                        [624,268],
                        [403,126],
                        [354,216],
                        [241,83],
                        [617,71],
                        [550,138],
                        [683,50],
                        [74,44],
                        [285,290],
                        [46,330],
                        [543,443],
                        [198,362]];
  var triangulation4 = [[169,384],
                        [406,328],
                        [51,324],
                        [141,442],
                        [268,403],
                        [263,372],
                        [169,384]];
  var triangulation5 = [[519,65],
                        [300,256],
                        [276,329],
                        [140,157],
                        [483,82],
                        [470,28],
                        [519,65]];
  var triangulation6 = [[216,351],
                        [307,293],
                        [335,423],
                        [469,339],
                        [413,264],
                        [327,193],
                        [318,238],
                        [216,351]]; //This test fails because of no general position
  //segmentIntersectionTest();
  var triangulations = [triangulation1, triangulation2, triangulation3,
  triangulation4, triangulation5, triangulation6];
  triangulationTest(triangulations[testNum]);
  return true;
}

