import d3 from 'd3';

export const histogram = (
							jsonData, field, 				//required
							w, h, axisLabel, 				//suggested
							min, max, threshold, vertMax 	//optional overrides
						) => {
	

	//filter nulls for the field
	var data = jsonData.filter(function(i){return i[field]!=null;})


	//set some defaults
	if(!w){w=400;}
	if(!h){h=400;}
	if(!axisLabel){axisLabel=field}


	var formatCount = d3.format(",.0f");

	var svg = d3.select("body").append("svg"),
	    margin = {top: 15, right: 30, bottom: 35, left: 30},
	    width = w - margin.left - margin.right,
	    height = h - margin.top - margin.bottom,
	    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.attr('height', h).attr('width', w);

	var maxVal = Math.ceil(d3.max(data, function(d) { return d.fulfillmentTime; })/10)*10 
	var minVal = 0;
	

	//force min/max if passed
	if(min){minVal = min}
	if(max){maxVal = max}
	


	// console.log('maxVal:', maxVal)

	var x = d3.scaleLinear()
		.domain([minVal, maxVal])
	    .rangeRound([0, width]);

	var thresholdVal = x.ticks(maxVal/100);
	//force threshold if passed
	if(threshold){thresholdVal = threshold}

	var bins = d3.histogram()
		.value(function(d) { return d.fulfillmentTime; })
	    .domain(x.domain())
	    .thresholds(thresholdVal)	//may have to parameterize that "5" to do other histograms
	    (data);

	//I have forced the axis to end - and there may be more 'off the end'.  so force those in
	var maxBin = bins[bins.length-1].x1;
	var binGap = bins[bins.length-1].x1 - bins[bins.length-1].x0;

	//add the unhandled (extra) bins
	var binAdd = data.filter(function(d){return d[field]>maxBin})
	binAdd.x0 = maxBin;
	binAdd.x1 = maxBin + binGap;
	bins.push(binAdd)


	var maxHeight = d3.max(bins, function(d) { return d.length; });

	//force vert max if passed
	if(vertMax){maxHeight = vertMax}



	var y = d3.scaleLinear()
	    .domain([0, maxHeight])
	    .range([height, 0]);

	var bar = g.selectAll(".bar")
	  .data(bins)
	  .enter().append("g")
	    .attr("class", "bar")
	    .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; });

	bar.append("rect")
	    .attr("x", function(d){return d.x0==maxBin?10:1})
	    .attr("class",function(d){return d.x0==maxBin?"lastHistBar":"histBar"})	//"histBar"
	    .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
	    .attr("height", function(d) { return height - y(d.length); });

	bar.on('click', function(d){
		var leftBound = d.x0,
			rightBound = d.x1;
		var bucketData = data.filter(function(d){  return (d[field]>=leftBound && d[field]<rightBound);   });
		if(d.x0 == maxBin){
			//this is the bar off the end.  Just get everything out there
			bucketData = data.filter(function(d){  return (d[field]>=leftBound);   });
		}
		console.log('---relevant orders:')
		bucketData.forEach(function(d){
			console.log('https://app.pellucid.com#/admin/orders/~'+d.orderId, d)
		})
	})

	bar.append("text")
	    .attr("dy", ".75em")
	    .attr("y", -12)
	    .attr("x", function(d){
	    	if(d.x0==maxBin){
	    		return 10+ (x(bins[0].x1) - x(bins[0].x0)) / 2	//for the last bar
	    	}else{
	    		return (x(bins[0].x1) - x(bins[0].x0)) / 2
	    	}
	    })
	    .attr("class",function(d){return d.x0==maxBin?"lastHistBar":""})	//"histBar"
	    .attr("text-anchor", "middle")
	    .text(function(d) { return d.length==0?'':formatCount(d.length); });

	g.append("g")
	    .attr("class", "axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.axisBottom(x));


	svg.append("text")             
      .attr("transform", "translate(" + (width + margin.left) + " ," +  (height + margin.top + 30) + ")")
      .style("text-anchor", "end")
      .attr("class", "axis")
      .text(axisLabel);


	return {
		svg:svg.node(),
		min:minVal,
		max:maxVal,
		threshold: thresholdVal,
		vertMax: maxHeight
	};



}