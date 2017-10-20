import d3 from 'd3';

export const timeScatter = (
							jsonData, timeField, yField
						) => {


	//filter nulls for the field
	var data = jsonData.filter(function(i){return i[yField]!=null;})
		data = jsonData.filter(function(i){return i[timeField]!=null;})


	var width = 720,
		height = 80,
		margin = {top: 15, right: 15, bottom: 15, left: 50},
		axisLabel = yField;

	var vertAxisMax = 120;	//2 hours in fulfillment minutes

	function chart(selection){
		selection.each(function(){
			var svg = d3.select(this).append("svg")
		        .attr("width", width + margin.left + margin.right)
		        .attr("height", height + margin.top + margin.bottom);


	        var g = svg.append("g")
        		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        	// set the ranges
			var x = d3.scaleTime()
				.domain(d3.extent(data, function(d) { return d[timeField]; }))
				.range([0, width])
				.nice()

			var y = d3.scaleLinear()
				.domain([0, 120])
				// .domain([0, d3.max(data, function(d) { return d[yField]; })])
				.range([height, 0]);


			// define the line
			var valueline = d3.line()
				.x(function(d) { return x(d[timeField]); })
				.y(function(d) { return y(d[yField]); });

			// Define the div for the tooltip
			var div = d3.select("body").append("div")	
				.attr("class", "tooltip")				
				.style("opacity", 0);

			var formatTime = d3.timeFormat("%B %d, %Y %I:%M %p");


			// Add the scatterplot
			g.selectAll("dot")
				.data(data)
					.enter().append("circle")
				.attr("r", 5)
				.attr("cx", function(d) { return x(d[timeField]); })
				.attr("cy", function(d) { 
					if(d[yField] >  vertAxisMax){
						//if off the top, plot above
						return -10;
					}
					return y(d[yField]); 
				})
				.attr("class", function(d){
					var cls = 'scatterDot';
					if(d[yField] >  vertAxisMax){
						cls += ' overMax';
					}
					if(yField=='fulfillmentTime'){
						//specific to fulfillment time
						var clsFul = ''
						if(d.customized){clsFul += ' dotCust'}
						if(d.editedByFulfillment){clsFul += ' dotEditFul'}
						if(!d.editedByFulfillment && !d.customized){clsFul = ' dotUntouched'}
						cls += ' '+clsFul;
					}
					return cls;
				})
				.on("mouseover", function(d) {		
					div.transition()		
						.duration(20)		
					.style("opacity", .9);		
					div	.html(d.orderId + "<br/>" + d.firstName + ' ' + d.lastName + "<br/>"  + formatTime(d[timeField]) + "<br/> fulfilled in "  + d[yField] + ' min')	
						.style("left", (d3.event.pageX) + "px")		
						.style("top", (d3.event.pageY - 28) + "px");	
				})					
				.on("mouseout", function(d) {		
					div.transition()		
						.duration(30)		
						.style("opacity", 0);	
				}).on("click", function(d) {		
					console.log('---relevant order:');
					console.log('https://app.pellucid.com#/admin/orders/~'+d.orderId, d)
				});



			// Add the X Axis
			g.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x).ticks(8));

			// Add the Y Axis
			g.append("g")
				.call(d3.axisLeft(y));


			// text label for the y axis
			g.append("text")
			  .attr("transform", "rotate(-90)")
			  .attr("y", 0 - margin.left)
			  .attr("x",0 )
			  .attr("dy", "1em")
			  .style("text-anchor", "end")
			  .attr("class", "axis")
			  .text(axisLabel); 


			return svg;

		})
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

	chart.vertAxisMax = function(_) {
		if (!arguments.length) return vertAxisMax;
		vertAxisMax = _;
		return chart;
	}

	chart.axisLabel = function(_) {
		if (!arguments.length) return axisLabel;
		axisLabel = _;
		return chart;
	}


	return chart;



}