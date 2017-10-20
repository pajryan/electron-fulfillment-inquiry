var objDiff = require('deep-diff').diff;
var _ = require('lodash');


export const writeObjDiff = (rawJson, whatToDiff, writeToTarget, productJson) => {
																//only "operatorOptions" require productJson

	var diffsArray = new Array();

	switch (whatToDiff){
		case 'operatorOptions':
			diffsArray.push(buildOperatorOptionsDiff(rawJson, productJson))
			break;

		case 'userOptions':
			diffsArray.push(buildUserOptionsDiff(rawJson))
			break;

		case 'pageOptions':
			diffsArray.push(buildPageOptionsDiff(rawJson))
			break;

		case 'skinOptions':
			diffsArray.push(buildSkinOptionsDiff(rawJson))
			break;

	}

	//write diffs
	diffsArray.forEach(function(d){
		writeToTarget.innerHTML += '<p class="diffHeader">'+rawJson.type+' <a href="https://app.pellucid.com#/admin/orders/~'+rawJson.orderId+'" class="js-external-link">'+rawJson.orderId+'</a> ('+rawJson.firstName+' '+rawJson.lastName+')</p>'
		writeToTarget.innerHTML += d
	})


}

//OPERATOR OPTIONS
const buildOperatorOptionsDiff = (rawJson, productJson) => {
	if(rawJson.type=='chart'){
		
		var defaultValues = rawJson.specifications.operatorOptions;
		var fulfillmentValues = rawJson.fulfillmentValues.operatorOptionsValues.p0.c0;
		var diff = objDiff(defaultValues, fulfillmentValues);
		return formatDiff(diff, false)
	}else{
		// console.log('---- doing operator options for page/book in order ' + rawJson.orderId);
		// console.log("rawJson",rawJson)
		// console.log("productJson",productJson)

		var multDffFormatted=''
		//loop through the charts we have overrides for and map them to the original chart
		var pgs = rawJson.fulfillmentValues.operatorOptionsValues;
		for(var p in pgs){	//e.g. p0, p1
			var pg = pgs[p];
			var pIndex = parseInt(p.substring(1))
			for(var c in pg){	//e.g. c0, c1
				var cIndex = parseInt(c.substring(1))
				var chrt = pg[c];

				var fulfillmentValues = chrt;	/**PART1**/
				//have a chart and a page, go get it from spec
				var book = rawJson.specifications.operatorOptions.book;
				// console.log("book", book)
				// console.log("pIndex", pIndex)
				// console.log("cIndex", cIndex)
				var chart = book.pages[pIndex].charts[cIndex];
				var defaultValuesFromBook = chart.operatorOptions;/**PART2**/
				

				//now go look up the default values for the chart
				var chartSpecification;
				var foundDefault = false;
				for(var ps=0; ps<productJson.length; ps++){
					if(productJson[ps].slug == chart.slug && productJson[ps].type=='chart'){
						foundDefault=true;
						chartSpecification = productJson[ps].specifications;
						break;
					}
				}
				if(!foundDefault){
					console.error('Could not find a slug match in productData.csv for ' + chart.slug);
					console.error('try rebuilding that CSV using the query in app/data/README.txt');
				}else{
					var defaultValuesFromChart = chartSpecification.operatorOptions;/**PART3**/

					
				}


				// console.log('fulfillmentValues',fulfillmentValues)
				// console.log('I think I need to merge these?')
				// console.log('defaultValuesFromChart',defaultValuesFromChart)
				// console.log('defaultValuesFromBook',defaultValuesFromBook)

				// need to merge the values from the chart, with the values from the book (book takes precedence)
				var defaultValues = _.merge(defaultValuesFromChart, defaultValuesFromBook);
				// console.log('defaultValuesMerged',defaultValues)

				var diff = objDiff(defaultValues, fulfillmentValues);
				// console.log('diff',diff)
				multDffFormatted += formatDiff(diff, false)




			}
		}



		

		return multDffFormatted;
	}
}


//USER OPTIONS
const buildUserOptionsDiff = (rawJson) => {
	var defaultValues = rawJson.userOptionsValues;
	var fulfillmentValues;
	// if(rawJson.type=='chart'){
	if(rawJson.fulfillmentValues.userOptionsValues.p0){
		var multDffFormatted=''
		//go through each chart if needed
		for(var cht in rawJson.fulfillmentValues.userOptionsValues.p0){
			fulfillmentValues = rawJson.fulfillmentValues.userOptionsValues.p0[cht];
			var diff = objDiff(defaultValues, fulfillmentValues);
			multDffFormatted += formatDiff(diff, false)
		}
		return multDffFormatted;
		

	// }else if(rawJson.type=='page'){
	}else if(rawJson.fulfillmentValues.userOptionsValues.b){
		// console.log('rawJson', rawJson)
		fulfillmentValues = rawJson.fulfillmentValues.userOptionsValues.b;
		// console.log('defaultValues',defaultValues)
		// console.log('fulfillmentValues',fulfillmentValues)
		var diff = objDiff(defaultValues, fulfillmentValues);
		// console.log('diff',diff)
		return formatDiff(diff, false)

	}
	// else{	//BOOK
	// 	fulfillmentValues = rawJson.fulfillmentValues.userOptionsValues.b;
	// 	var diff = objDiff(defaultValues, fulfillmentValues);
	// 	// console.log('diff',diff)
	// 	return formatDiff(diff, false)
	// }
}


//PAGE OPTIONS (e.g. titles & footnotes)
const buildPageOptionsDiff = (rawJson) => {
	//will need to loop through each page and align with the page from the specifications
	var fulfillmentPages = rawJson.fulfillmentValues.pageOptionsValues;
	var multDffFormatted='' 
	for(var p in fulfillmentPages){
		var fulfillmentValues = fulfillmentPages[p];
		//get the index of this page
		var pi = parseInt(p.substring(1));
		//get the original (default) for this page
		var defaultValues = rawJson.specifications.operatorOptions.book.pages[pi].slideInfo.slideContent;
		var diff = objDiff(defaultValues, fulfillmentValues);
		multDffFormatted += formatDiff(diff, false)
	}
	return multDffFormatted;

	

}


const buildSkinOptionsDiff = (rawJson) => {
	
	if(rawJson.type=='chart'){
		// console.log('---------CHART----------')
		// console.log('rawJson',rawJson)
		var fulfillmentValues = rawJson.fulfillmentValues.skinOptionsValues.p0.c0;
		var defaultValues = {};	//need to get the skin to do this right
		var diff = objDiff(defaultValues, fulfillmentValues);
		return formatDiff(diff, false)
	}else{	//page & book
		var defaultValues = {};	//need to get the skin to do this right
		var multDffFormatted='' 
		//loop through pages
		var pgs = rawJson.fulfillmentValues.skinOptionsValues;
		for(var p in pgs){
			var pg = pgs[p];
			//loop thru the charts
			for(var c in pg){
				var cht = pg[c];
				var diff = objDiff(defaultValues, cht);
				multDffFormatted += formatDiff(diff, false)
			}
		}
		return multDffFormatted;


	}

	// console.log('defaultValues',defaultValues)
	// console.log('fulfillmentValues',fulfillmentValues)
	// console.log('diff',diff)

}



/* this is where all the formatting logic is.  It's a bit messy...
dealing with a lot of strings becoming objects etc */ 


const formatDiff = (diff, checkDeletes) => {

	
	//diff results documented here: https://github.com/flitbit/diff
	//  kind=N => new element
	//	kind=E => edited element
	//	kind=D => deleted element (will ignore for operator options, but want to catch for e.g. user options)
	//	kind=A => change in in an array 
	var fmtStr = '<div class="diffObj">';
	diff.forEach(function(d){


		if(checkDeletes && d.kind=='D'){		
			// console.log("----------DELETE -------  need to author this bit")
			// console.log("diff",diff)
			// console.log(d);

			var objPath = ''	//store off the path
			d.path.forEach(function(e){
				objPath += e + '.';
			})

			fmtStr += '<p class="diffDeleted">\t';
			fmtStr += objPath.substring(0,objPath.length-1);	//strip off that last '.'
			fmtStr += ' = ';
			if(typeof d.rhs === 'string' || typeof d.rhs === 'number'){
				fmtStr += d.lhs;
			}else{
				fmtStr += JSON.stringify(d.lhs);
			}
			fmtStr += '</p>';


			// fmtStr += '<p style="color:red; font-weight:bold;">HIT A DELETE I CARE ABOUT.  NEED TO AUTHOR THIS SCENARIO</p>'
		}

		//new element(s) added
		if(d.kind=='N'){
			var objPath = ''	//store off the path
			d.path.forEach(function(e){
				objPath += e + '.';
			})

			if(typeof d.rhs === 'string' || typeof d.rhs === 'number'){
				fmtStr += '<p class="diffAdded">\t';
				fmtStr += objPath.substring(0,objPath.length-1);	//strip off that last '.'
				fmtStr += ' = ' + d.rhs;
				fmtStr += '</p>';
			}else{
				for(var itm in d.rhs){
					fmtStr += '<p class="diffAdded">\t';
					fmtStr += objPath;
					fmtStr += itm + ' = ';
					if(typeof d.rhs === 'string'){
						fmtStr += d.rhs[itm];
					}else{
						fmtStr += JSON.stringify(d.rhs[itm]);
					}
					fmtStr += '</p>';
				}
			}

		}

		if(d.kind=='E'){
			var objPath = ''	//store off the path
			d.path.forEach(function(e){
				objPath += e + '.';
			})
			fmtStr += '<p class="diffEdited">\t';
			fmtStr += objPath.substring(0,objPath.length-1);	//strip off that last '.'
			fmtStr += ' = ';
			if(d.lhs==""){
				fmtStr += '<span class="diffEditedOldVal"><i>empty</i></span>';
			}else{
				fmtStr += '<span class="diffEditedOldVal">'+d.lhs+'</span>';
			}
			fmtStr += ' => ';
			if(typeof d.rhs === 'string' || typeof d.rhs === 'number'){
				fmtStr += '<span class="diffEditedNewVal">'+d.rhs+'</span>';
			}else{
				fmtStr += '<span class="diffEditedNewVal">'+JSON.stringify(d.rhs)+'</span>';
			}
			fmtStr += '</p>';
		}


		if(d.kind=='A'){
			var objPath = ''	//store off the path
			d.path.forEach(function(e){
				objPath += e + '.';
			})

			fmtStr += '<p class="diffArrayEdited">\t';
			fmtStr += objPath.substring(0,objPath.length-1);	//strip off that last '.'
			fmtStr += ' = [ ';
			if(d.item.kind=='N'){
				if(typeof d.rhs === 'string' || typeof d.rhs === 'number'){
					fmtStr += '<span class="diffArrayEditedAdd">'+d.item.rhs+'</span>';	//added item to the array
				}else{
					fmtStr += '<span class="diffArrayEditedAdd">'+JSON.stringify(d.item.rhs)+'</span>';	//added item to the array
				}
			}
			if(d.item.kind=='D'){
				if(typeof d.lhs === 'string' || typeof d.lhs === 'number'){
					fmtStr += '<span class="diffArrayEditedDelete">'+d.item.lhs+'</span>';	//removed item to the array
				}else{
					fmtStr += '<span class="diffArrayEditedDelete">'+JSON.stringify(d.item.lhs)+'</span>';	//removed item to the array
				}
			}			
			fmtStr += ' ]';
			fmtStr += '</p>';

			// console.log("----------ARRAY CHANGE-------  need to author this bit")
			// console.log("diff",diff)
			// console.log(d);
		}

	})

	fmtStr += '</div>';
	return fmtStr;
}





































