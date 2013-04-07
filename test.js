function runTests() {
  function segmentIntersectionTest() {
    var s1 = new LineSegment(new Point(5, 5), new Point(10, 10));
    var s2 = new LineSegment(new Point(7, 5), new Point(6, 10));
    assert(lineSegmentsIntersect(s1, s2));
  }
  segmentIntersectionTest();
  return true;
}

