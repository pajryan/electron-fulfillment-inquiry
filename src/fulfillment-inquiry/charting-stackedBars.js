import d3 from 'd3';
var _ = require('lodash');
export const horizStackedBars = (
							jsonData, stackKey, stackFields, fulfillmentTimes, clickFunc
						) => {

	//filter nulls for the field
	var data = jsonData.filter(function(i){return i[stackKey]!=null;})



	var width = 720,
		height = 80,
		margin = {top: 15, right: 15, bottom: 15, left: 250},
		axisLabel = '# of orders with fulfillment edits';

	var vertAxisMax = 120;	//2 hours in fulfillment minutes

	function chart(selection){
		selection.each(function(){
			var svg = d3.select(this).append("svg")
		        .attr("width", width + margin.left + margin.right)
		        .attr("height", height + margin.top + margin.bottom);


	        var g = svg.append("g")
        		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        	var xScale = d3.scaleLinear().rangeRound([0, width]),	//rangeRound
				yScale = d3.scaleBand().rangeRound([height, 0]),
				color = d3.scaleOrdinal(d3.schemeCategory20),
				xAxis = d3.axisBottom(xScale),
				yAxis =  d3.axisLeft(yScale)

			var stack = d3.stack()
				.keys(stackFields)
				// .order(d3.stackOrderAscending)
				.offset(d3.stackOffsetNone);

			var layers= stack(data);

			//store the key with each item so I can get it when the bars are clicked later
			layers = _.map(layers, function(l){
				var key = l.key;
				l.forEach(function(li){
					li.key = key;
				})
				return l;
			})
			// console.log('layers',layers)			
// console.log('MAX',d3.max(layers[layers.length - 1], function(d) { return d[0] + d[1]; }))


			//sort by total number of edits
			data.sort(function(a, b) { return a.totalChanged - b.totalChanged; });
			yScale.domain(data.map(function(d) { return d.name; }));
			xScale.domain([0, d3.max(layers[layers.length - 1], function(d) { return d[0] + d[1]; }) ]).nice();

			var layer = g.selectAll(".layer")
				.data(layers)
				.enter().append("g")
				.attr("class", "layer")
				.style("fill", function(d, i) { return color(i); })
				.style("stroke", '#ffffff')
				.style("stroke-width", 1)
				.style("cursor", 'pointer');

				layer.selectAll("rect")
					.data(function(d) {return d; })
					.enter().append("rect")
						.attr("y", function(d,i) {return yScale(d.data.name); })
						.attr("x", function(d,i) {return xScale(d[0]); })
						.attr("height", yScale.bandwidth())
						.attr("width", function(d) {return xScale(d[1]) - xScale(d[0]) })
					.on("click", clickFunc)
				


			var barLabels =	g.selectAll("text")
				.data(layers[layers.length-1])
				.enter()
				.append("text")
					.text(function(d, i) { 
						if(d.data.name == data[0].name){
							return timeLookup(d.data.name, true);	//label the last bar
						}else{
							return timeLookup(d.data.name, false);
						}
					})
					.attr("x", function(d) {return xScale(d[1]) + 5 })
					.attr("y", function(d,i) {return yScale(d.data.name)  + yScale.bandwidth()/2 +3; })
					.style("fill", "black")
					.style("font", "10px sans-serif");


			g.append("g")
				.attr("class", "axis axis--x")
				.attr("transform", "translate(0," + (height+5) + ")")
				.call(xAxis);

			g.append("g")
				.attr("class", "axis axis--y")
				.attr("transform", "translate(0,0)")
				.call(yAxis);		




			var legend = g.selectAll(".legend")
				.data(stackFields)
				.enter().append("g")
					.attr("class", "legend")
					.attr("transform", function(d, i) { return "translate(-100," + (150+ i * 20) + ")"; })
					.style("font", "10px sans-serif");

			 legend.append("rect")
				.attr("x", width + 18)
				.attr("width", 18)
				.attr("height", 18)
				.attr("fill", function(d,i){return color(i)})
				

			 legend.append("text")
				.attr("x", width + 44)
				.attr("y", 9)
				.attr("dy", ".35em")
				.attr("text-anchor", "start")
				.text(function(d) {return d; });

			g.append("text")             
				// .attr("transform", "translate(" + (width + margin.left-100) + " ," +  (height + margin.top-50) + ")")
				.attr("transform", "translate(" + (width) + " ," +  (height+margin.top+15) + ")")
				.style("text-anchor", "end")
				.attr("class", "axis")
				.text(axisLabel);



			return svg;

		})
	}



	function timeLookup(name, addTextLabels){
		var orderCnt='NA';
		var totFulfillmentTime='NA';
		for(var ft=0; ft<fulfillmentTimes.length; ft++){
			if(fulfillmentTimes[ft].name==name){
				orderCnt = fulfillmentTimes[ft].orderCount
				totFulfillmentTime = fulfillmentTimes[ft].totalFulfillmentTime
				//have access to: orderCount ,maxFulfillTime,minFulfillTime,avgFulfillTime,medianFulfillTime,totalFulfillmentTime
				break;
			};
		}
		if(addTextLabels){
			return orderCnt + ' total orders / ' + Math.round(totFulfillmentTime) + ' total fulfillment time (min)'
		}else{
			return orderCnt + ' / ' + Math.round(totFulfillmentTime)
		}
		
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