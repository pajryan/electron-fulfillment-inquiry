import d3 from 'd3';

//modified from https://bl.ocks.org/efekarakus/96adb9f2d3a9653b0c0a393c106a43c9

export const vennDiagram = (U, A, B, AnB, uData, aData, bData, anbData) => {
  //U = unedited
  //A = edited by fulfillment
  //B = customized by user
  //AnB = both A and B

  var width = 720,
      height = 80,
      margin = {top: 5, right: 0, bottom: 5, left: 0},
      threshold = 0.00001;

  function chart(selection) {
    selection.each(function() {
      var svg = d3.select(this).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      var graphic = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      var diagram = graphic.append("g");

      var distance = getDistanceBetweenCircles();

      var circleU = getCircle(U)
                .attr("class", "unedited")
                .attr("transform", "translate(" +  0 + ", "+margin.top+")");
      var circleA = getCircle(A)
                .attr("class", "editedByFulfiller")
                .attr("transform", "translate(" +  (radius(U)+radius(A)) + ", "+margin.top+")");
      var circleB = getCircle(B)
                .attr("class", "userCusomized")
                .attr("transform", "translate(" +  (radius(U)+radius(A)+distance) + ", "+margin.top+")");

      // var xOffset = (width - (radius(U) + radius(A) + distance + radius(B)))/2
      var yOffset = maxRadius();

      var widthOfVenn = radius(U)*2 + radius(A) + distance + radius(B); //approximate
      var xOffset = -margin.left + radius(U) + (width-widthOfVenn)/2;

      diagram.attr("transform", "translate(" + xOffset  + ", " + yOffset + ")");







      //PR just cobbling together here
      svg.append("text")             
        .attr("transform", "translate(" + (margin.left) + " ," +  (margin.top+20) + ")")
        .style("text-anchor", "start")
        .attr("class", "vennText unedited")
        .text('untouched: ' + U);


      svg.append("text")             
        .attr("transform", "translate(" + (margin.left) + " ," +  (margin.top+40) + ")")
        .style("text-anchor", "start")
        .attr("class", "vennText editedByFulfiller")
        .text('edited by fulfiller: ' + A);

      svg.append("text")             
        .attr("transform", "translate(" + (margin.left) + " ," +  (margin.top+60) + ")")
        .style("text-anchor", "start")
        .attr("class", "vennText userCusomized")
        .text('customized by user: ' + B);

      //# of items untouched
      if(U>0){
        svg.append("text")             
            .attr("transform", "translate(" + (xOffset+margin.left) + " ," +  (12+height/2) + ")")
            .style("text-anchor", "middle")
            .attr("class", "vennText unedited inBubble")
            .text(U)
            .on('click', function(){
            console.log('---relevant orders:');
              uData.forEach(function(d){
                console.log('https://app.pellucid.com#/admin/orders/~'+d.orderId, d)
              })
          });
        }  

      //# of items touched by fulfillers AND customizied
      if(AnB>0){
        svg.append("text")             
          .attr("transform", "translate(" + (xOffset+margin.left+radius(U)+radius(A)+distance/2) + " ," +  (12+height/2) + ")")
          .style("text-anchor", "start")
          .attr("class", "vennText editedByFulfillerAndCustomized inBubble")
          .text(AnB)
          .on('click', function(){
            console.log('---relevant orders:');
              anbData.forEach(function(d){
                console.log('https://app.pellucid.com#/admin/orders/~'+d.orderId, d)
              })
          });
      }

      //# of items touched by fulfillers, but not customized
      if(A>0){
        svg.append("text")             
          .attr("transform", "translate(" + (xOffset+margin.left+radius(U) + distance/3) + " ," +  (12+height/2) + ")")
          .style("text-anchor", "start")
          .attr("class", "vennText editedByFulfiller inBubble")
          .text(A-AnB)
          .on('click', function(){
              console.log('---relevant orders:');
              aData.forEach(function(d){
                if(!d.customized){
                  console.log('https://app.pellucid.com#/admin/orders/~'+d.orderId, d)
                }
              })
          });
        }

      //#of items customized, but not touched by fulfillers
      if(B>0){
        svg.append("text")             
          .attr("transform", "translate(" + (xOffset+margin.left+radius(U)+radius(A)*2+distance/3) + " ," +  (12+height/2) + ")")
          .style("text-anchor", "start")
          .attr("class", "vennText userCusomized inBubble")
          .text(B-AnB)
          .on('click', function(){
              console.log('---relevant orders:')
              bData.forEach(function(d){
                if(!d.editedByFulfillment){
                  console.log('https://app.pellucid.com#/admin/orders/~'+d.orderId, d)
                }
              })
          });
      }

      function getCircle(cardinality) {
        var g = diagram.append("g");
        var r = radius(cardinality);

        g.append("circle")
          .attr("x", r)
          .attr("y", r)
          .attr("r", r);

        return g;
      }
    });
  }

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  }

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  }

  chart.threshold = function(_) {
    if (!arguments.length) return threshold;
    threshold = _;
    return chart;
  }

  function maxRadius() {
    return height < width ? height / 2 : width / 4;
  }

  function maxCardinality() {
    return Math.max(A, B, U);
  }

  function radius(cardinality) {
    if (cardinality === maxCardinality()) return maxRadius();

    var maxArea = Math.PI * maxRadius() * maxRadius();
    return Math.sqrt( (cardinality * maxArea) / (maxCardinality() * Math.PI) );
  }

  function getDistanceBetweenCircles() {
    if (AnB === 0) {
      return radius(A) + radius(B);
    }

    var r = Math.min(radius(A), radius(B));
    var R = Math.max(radius(A), radius(B));
    // var R = maxRadius();
    var intersectionArea = AnB * (Math.PI * R * R) / Math.max(A, B);

    var minDistance = 0,
        maxDistance = (R + r);

    while (minDistance <= maxDistance) {
      var distance = minDistance + (maxDistance - minDistance)/2;
      var lensArea = getLensArea(r, R, distance)

      if (hasConverged(intersectionArea, lensArea)) {
        return distance;
      }

      if (lensArea < intersectionArea) {
        maxDistance = distance;
      } else {
        minDistance = distance;
      }
    }
  }

  function hasConverged(intersectionArea, lensArea) {
    return Math.abs(intersectionArea - lensArea) < (intersectionArea * threshold);
  }

  function getLensArea(r, R, d) {
    var smallLensArea = r * r * Math.acos( ((d*d) + (r*r) - (R*R))/(2*d*r) );
    var bigLensArea = R * R * Math.acos( ((d*d) + (R*R) - (r*r))/(2*d*R) );
    var overlap = 0.5 * Math.sqrt( (-d + r + R) * (d + r - R) * (d - r + R) * (d + r + R) );

    return smallLensArea + bigLensArea  - overlap;
  }

  return chart;
}