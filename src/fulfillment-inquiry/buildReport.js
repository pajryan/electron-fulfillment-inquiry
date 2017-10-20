
import d3 from 'd3';

import { histogram } from './charting-hist';
import { vennDiagram } from './charting-venn';
import { timeScatter } from './charting-timeScatter';
import { horizStackedBars } from './charting-stackedBars';
import { writeObjDiff } from './fulfillmentObjectDiff';
import { writeCustomizationDetails } from './customizationDetails';
import jetpack from 'fs-jetpack';

var _ = require('lodash');
var json2csv = require('json2csv');


var storedData;
var storedProductData;
export const build = (jsonData, productData) => {

	// console.log('building report')
	
	//on initialization, this gets passed the json Data.
	//  but when the 'go' button is clicked this gets passed a MouseEvent
	//		I should just fix this, but hacking something together, so just storing the original json, then ignoring subsequent args
	if(!(jsonData instanceof MouseEvent)){
		storedData = jsonData;
		storedProductData = productData;
	}

	// console.log('stored, raw data' , storedData);

	//filter the results based on the UI
	var dtParts = document.querySelector('#dateSelectorFrom').value.split('/');
	var uiDateFrom = new Date(parseInt(dtParts[2]), parseInt(dtParts[0])-1, parseInt(dtParts[1]));
		dtParts = document.querySelector('#dateSelectorTo').value.split('/');
	var uiDateTo = new Date(parseInt(dtParts[2]), parseInt(dtParts[0])-1, parseInt(dtParts[1]));
	var tenant = document.querySelector('#tenantSelector')[document.querySelector('#tenantSelector').selectedIndex].value;
	var user = document.querySelector('#userSelector')[document.querySelector('#userSelector').selectedIndex].value;
	var exclPlcd = document.querySelector('#exclPlcdChk').checked;

	// console.log("getting data for tenant '" + tenant + "' between  "+ uiDateFrom+ " to " + uiDateTo);

	//filter the data based on UI choices
	var d = storedData.filter(function(i){
		return 	(i.email===user || user==='all') && 
				(i.tenant===tenant || tenant==='all') && 
				i.createdAt >= uiDateFrom && 
				i.createdAt <= uiDateTo
	});

	productData = storedProductData;

	if(exclPlcd){
		d = d.filter(function(i){
			return (i.email.indexOf('pellucid'))==-1
		})
	}

	// console.log('filtered data', d)

	//what do I want to do here...
	//  How many orders required customization of any kind?
	//		what were those customizations?
	//	How many orders have appearance optinos edited by the user?
	//	What is the turn-around time for orders?
	//	Is there a correlation between product and any of the above?
	// 	Show some stats about users?
	
	//ORDERS
	document.querySelector('#orders').innerHTML = d.length + ' orders placed';
	document.querySelector('#charts').innerHTML = d.filter(value => value.type === 'chart').length + ' charts'
	document.querySelector('#pages').innerHTML = d.filter(value => value.type === 'page').length + ' pages'
	document.querySelector('#books').innerHTML = d.filter(value => value.type === 'report').length + ' books'

	//compensate for cancelled to square later numbers
	var completedOrders = d.filter(function(i){return i.completedAt})
	var cancelledOrders = d.filter(function(i){return !i.completedAt})

	var completeSpan = document.createElement('span'); completeSpan.className = 'completeCount';
	var cancelSpan = document.createElement('span'); cancelSpan.className = 'cancelledCount';

	completeSpan.innerHTML = completedOrders.length + ' completed';
	cancelSpan.innerHTML = cancelledOrders.length + ' cancelled';
	document.querySelector('#orders').appendChild(completeSpan)
	document.querySelector('#orders').appendChild(cancelSpan)


	cancelSpan.addEventListener('click', function(){
		console.log('---relevant orders:');
		cancelledOrders.forEach(function(i){
			console.log('https://app.pellucid.com#/admin/orders/~'+i.orderId);
		})
	})


	//clear out some existing stuff
	document.querySelector('#fulfillerEditDetails').innerHTML = ''
	document.querySelector('#customizationDetails').innerHTML = ''
	document.querySelector('#editsByProductDetails').innerHTML = '';


	//ORDER TIME VS FULFILLMENT TIME
	document.querySelector('#orderFulScatter').innerHTML = '';
	var finshedOrders = d.filter(function(i){return i.fulfillmentTime!=null})
	var ts = timeScatter(finshedOrders, 'createdAt', 'fulfillmentTime')
		.width(600)
		.height(120)
		.vertAxisMax(120)
		.margin({top: 15, right: 15, bottom: 30, left: 50})
		.axisLabel('fulfillment time (min)')
	
	d3.select("#orderFulScatter")
		.call(ts);




	//FULFILLMENT TIME
	var meanFulfillment = d3.mean(
			completedOrders.filter(function(i){return (i.completedAt!=null && i.createdAt!=null)}), 
			function(i){return i.completedAt - i.createdAt}
		);

	var medianFulfillment = d3.median(
			completedOrders.filter(function(i){return (i.completedAt!=null && i.createdAt!=null)}), 
			function(i){return i.completedAt - i.createdAt}
		);

	meanFulfillment = Math.round(meanFulfillment / (1000 * 60))
	medianFulfillment = Math.round(medianFulfillment / (1000 * 60))

	document.querySelector('#avgFul').innerHTML = 'avg: ' + meanFulfillment + ' min'
	document.querySelector('#medianFul').innerHTML = 'median: ' + medianFulfillment + ' min'

	//build a fulfillment time histogram
	var histResults = histogram(completedOrders, 'fulfillmentTime', 300, 100, 'fulfillment time (min)', 0, 120, 20)
	document.querySelector('#histFul').innerHTML = '';
	document.querySelector('#histFul').appendChild(histResults.svg)




	//UNTOUCHED VS FULFILLER EDITS VS CUSTOMIZATION
	document.querySelector('#venn').innerHTML = '';

	var editedByFulfillment = completedOrders.filter(function(i){return i.editedByFulfillment});
	var customized = completedOrders.filter(function(i){return i.customized});
	var editedByFulfillmentAndCustomized = completedOrders.filter(function(i){return i.editedByFulfillment && i.customized});
	var uneditedAndNotCustomized = completedOrders.filter(function(i){return !i.editedByFulfillment && !i.customized});

	//create venn diagram
	var vennEdit = vennDiagram(uneditedAndNotCustomized.length, editedByFulfillment.length, customized.length, editedByFulfillmentAndCustomized.length,
								uneditedAndNotCustomized, editedByFulfillment, customized, editedByFulfillmentAndCustomized
							)
		.width(600)
		.height(120)
		.margin({top: 5, right: 10, bottom: 5, left: 10})
		.threshold(0.00001);
	
	d3.select("#venn")
		.call(vennEdit);



	




	//FULFILLER EDITS
	var dEditedByFulfillment = completedOrders.filter(function(i){return i.editedByFulfillment})

	document.querySelector('#totalEdits').innerHTML =  dEditedByFulfillment.length + ' orders edited';
	document.querySelector('#totalEdits').addEventListener('click', function(){
		dEditedByFulfillment.forEach(function(i){
			console.log('https://app.pellucid.com#/admin/orders/~'+i.orderId, i.fulfillmentValues);
		})
	})

	
	


	//build a fulfillment time histogram
	var histEditedResults = histogram(dEditedByFulfillment, 'fulfillmentTime', 300, 100, 'fulfillment time (min)', histResults.min, histResults.max, histResults.threshold, histResults.vertMax)
	document.querySelector('#fulfillerEditDetails').innerHTML = '';
	document.querySelector('#histEdit').innerHTML = '';
	document.querySelector('#histEdit').appendChild(histEditedResults.svg)


	var operEditData = dEditedByFulfillment.filter(function(i){return i.fulfillmentValues.operatorOptionsValues && objHasValues(i.fulfillmentValues.operatorOptionsValues)})
	var operOpt = document.createElement('p');
	operOpt.className = 'custText';
	operOpt.innerHTML = operEditData.length + ' operator options';
	operOpt.addEventListener('click', function(){
		document.querySelector('#fulfillerEditDetails').innerHTML = '';
		operEditData.forEach(function(i){
			writeObjDiff(i, 'operatorOptions', document.querySelector('#fulfillerEditDetails'), productData);
		})
	})


	var userEditData = dEditedByFulfillment.filter(function(i){return i.fulfillmentValues.userOptionsValues && objHasValues(i.fulfillmentValues.userOptionsValues)});
	var userOpt = document.createElement('p');
	userOpt.className = 'custText';
	userOpt.innerHTML = userEditData.length + ' user options';
	userOpt.addEventListener('click', function(){
		document.querySelector('#fulfillerEditDetails').innerHTML = '';
		userEditData.forEach(function(i){
			writeObjDiff(i, 'userOptions', document.querySelector('#fulfillerEditDetails'));
		})
	})
	

	var pageEditData = dEditedByFulfillment.filter(function(i){return i.fulfillmentValues.pageOptionsValues && objHasValues(i.fulfillmentValues.pageOptionsValues)})
	var apprOpt = document.createElement('p');
	apprOpt.className = 'custText';
	apprOpt.innerHTML = pageEditData.length + ' page options';
	apprOpt.addEventListener('click', function(){
		document.querySelector('#fulfillerEditDetails').innerHTML = '';
		pageEditData.forEach(function(i){
			writeObjDiff(i, 'pageOptions', document.querySelector('#fulfillerEditDetails'));
		})
	})

	
	var skinEditData = dEditedByFulfillment.filter(function(i){return i.fulfillmentValues.skinOptionsValues && objHasValues(i.fulfillmentValues.skinOptionsValues)})
	var skinOpt = document.createElement('p');
	skinOpt.className = 'custText';
	skinOpt.innerHTML = skinEditData.length + ' skin options';
	skinOpt.addEventListener('click', function(){
		document.querySelector('#fulfillerEditDetails').innerHTML = '';
		skinEditData.forEach(function(i){
			writeObjDiff(i, 'skinOptions', document.querySelector('#fulfillerEditDetails'));
		})
	})


	document.querySelector('#editsBreakdown').innerHTML = '';
	document.querySelector('#editsBreakdown').appendChild(operOpt)
	document.querySelector('#editsBreakdown').appendChild(userOpt)
	document.querySelector('#editsBreakdown').appendChild(apprOpt)
	document.querySelector('#editsBreakdown').appendChild(skinOpt)



	//USER CUSTOMIZATION
	var dCustomized = completedOrders.filter(function(i){return i.customized})

	document.querySelector('#totalCustomizations').innerHTML =  dCustomized.length + ' orders customized';
	document.querySelector('#totalCustomizations').addEventListener('click', function(){
		console.log('---relevant orders:');
		dCustomized.forEach(function(i){
			console.log('https://app.pellucid.com#/admin/orders/~'+i.orderId, i.fulfillmentValues);
		})
	})


	var custData = document.createElement('p');
	var custAppear = document.createElement('p');
	var custOther = document.createElement('p');

	custData.className = 'custText';
	custAppear.className = 'custText';
	custOther.className = 'custText';

	custData.innerHTML = dCustomized.filter(function(i){return i.userOptionsValues.customize.customizeReason=='data'}).length + ' data';
	custAppear.innerHTML = dCustomized.filter(function(i){return i.userOptionsValues.customize.customizeReason=='appearance'}).length + ' appearance';
	custOther.innerHTML = dCustomized.filter(function(i){return i.userOptionsValues.customize.customizeReason=='other'}).length + ' other';

	custData.addEventListener('click', function(){
		document.querySelector('#customizationDetails').innerHTML = '';
		(dCustomized.filter(function(i){return i.userOptionsValues.customize.customizeReason=='data'})).forEach(function(i){
			writeCustomizationDetails(i, document.querySelector('#customizationDetails'));
		})
	})

	custAppear.addEventListener('click', function(){
		document.querySelector('#customizationDetails').innerHTML = '';
		(dCustomized.filter(function(i){return i.userOptionsValues.customize.customizeReason=='appearance'})).forEach(function(i){
			writeCustomizationDetails(i, document.querySelector('#customizationDetails'));
		})
	})

	custOther.addEventListener('click', function(){
		document.querySelector('#customizationDetails').innerHTML = '';
		(dCustomized.filter(function(i){return i.userOptionsValues.customize.customizeReason=='other'})).forEach(function(i){
			writeCustomizationDetails(i, document.querySelector('#customizationDetails'));
		})
	})

	document.querySelector('#customizationBreakdown').innerHTML = '';
	document.querySelector('#customizationBreakdown').appendChild(custData);
	document.querySelector('#customizationBreakdown').appendChild(custAppear);
	document.querySelector('#customizationBreakdown').appendChild(custOther);

	//build a fulfillment time histogram
	var histEditedResults = histogram(dCustomized, 'fulfillmentTime', 300, 100, 'fulfillment time (min)', histResults.min, histResults.max, histResults.threshold, histResults.vertMax)
	document.querySelector('#histCust').innerHTML = '';
	document.querySelector('#histCust').appendChild(histEditedResults.svg)







	//FULFILLMENT EDITS AND CUSTOMIZATION BY PRODUCT
	//use the same arrays as above and aggregate them by product
	var byProd = [];
	byProd = appendEdits(byProd, dCustomized, 'customized');
	byProd = appendEdits(byProd, skinEditData, 'skinChanged');
	byProd = appendEdits(byProd, pageEditData, 'pageChanged');
	byProd = appendEdits(byProd, userEditData, 'userChanged');
	byProd = appendEdits(byProd, operEditData, 'operChanged');

	//tack on a total changed
	byProd = _.map(byProd, function(i){
		i.totalChanged =i.customized + i.skinChanged + i.pageChanged + i.userChanged + i.operChanged;
		return i;
	})


	//want to get the average/median fulfillment time by product
	//first group by name
	var byProdFulfillTime = _.groupBy(completedOrders, function(i){
		return i.name
	});

	//now, by name, collect fulfillment times
	var skuFulfillTime = new Array();
	for(var name in byProdFulfillTime){
		var o = {};
		o.name = name;
		o.fulfillTimes = new Array();
		var currFulfills = byProdFulfillTime[name];
		currFulfills.forEach(function(i2){
			o.fulfillTimes.push(i2.fulfillmentTime);			
		})
		skuFulfillTime.push(o);
	}

	//add a few simple metrics
	skuFulfillTime = _.map(skuFulfillTime,function(i){
		i.orderCount = i.fulfillTimes.length;
		i.maxFulfillTime = d3.max(i.fulfillTimes);
		i.minFulfillTime = d3.min(i.fulfillTimes);
		i.avgFulfillTime = d3.mean(i.fulfillTimes);
		i.medianFulfillTime = d3.median(i.fulfillTimes);
		i.totalFulfillmentTime = d3.sum(i.fulfillTimes);
		return i;
	})

	// console.log('want to do something with this',skuFulfillTime)
	// console.log('building stacked bars for this',byProd)

	document.querySelector('#editsByProduct').innerHTML = '';
	var stckBar = horizStackedBars(
									byProd, 
									'name', ['customized','operChanged','pageChanged','skinChanged','userChanged'], 
									skuFulfillTime, function(d){
														showEditsFromBarChart(d, completedOrders, productData)
													}
									)
		.width(300)
		.height(300)
		.vertAxisMax(120)
		.margin({top: 15, right: 150, bottom: 30, left: 400})
		// .axisLabel('fulfillment time (min)')
	
	d3.select("#editsByProduct")
		.call(stckBar);


	//testing objHasValues
	// console.log("t1", objHasValues({a:{b:{}}}))
	// console.log("t2", objHasValues({a:{b:'eh'}}))
	// console.log("t1", objHasValues({a:{b:{}}}))
	// console.log("t1", objHasValues({a:{b:{}}}))





	//messing around with some metrics on completed orders
	var orderMetrics = new Array();
	var foundMetricCount = 0
	completedOrders.forEach(function(c){
		var o = {}

		// Product ordered
		// Date of order (not analysis date)
		// Subject company
		// Comps
		// Metric(s)
		

		o.productSku = c.sku;
		o.userEmail = c.email;
		o.userName = c.firstName + ' ' + c.lastName;
		o.productName = c.name;
		o.orderDate = c.createdAt;
		o.orderNumber = c.orderId;
		o.productType = c.type;

		var subjElements = parseName(c.userOptionsValues.data.entities.subjectCompany);
		o.subjectCoName = subjElements.name;
		// o.subjectCoTicker = subjElements.ticker;
		// o.subjectCoId = subjElements.id;

		if(c.userOptionsValues.data.entities.compsGroups){
			c.userOptionsValues.data.entities.compsGroups.forEach(function(cmpG, iG){
				var cmpsNameStr = '';
				var cmpsTckrStr = '';
				var cmpsIdStr = '';
				cmpG.compsGroupItems.forEach(function(cmp,i){
					var cmpElements = parseName(cmp);
					cmpsNameStr += cmpElements.name + ' | '
					cmpsTckrStr += cmpElements.ticker + ' | '
					cmpsIdStr += cmpElements.id + ' | '

				});
				o['compGroup'+(iG+1)+'-names']=cmpsNameStr.substring(0,cmpsNameStr.length-2);
				// o['compGroup'+(iG+1)+'-tickers']=cmpsTckrStr.substring(0,cmpsTckrStr.length-2);
				// o['compGroup'+(iG+1)+'-ids']=cmpsIdStr.substring(0,cmpsIdStr.length-2);

			})
		}else{
			// console.log('no comps groups for ', c)
		}

		//need to uncomment this to do it on each obj.  But testing for now.
		o.metrics = findMetrics(c);
		if(o.metrics && o.metrics.length>0){
			foundMetricCount++;
			o.metrics = o.metrics.join(' | ');
		}else{
			console.log('didnt find metric for', c.name)
		}


		orderMetrics.push(o)
	});

	//write to csv
	var orderMetricsCSV = json2csv({data:orderMetrics});
	var orderMetricsCSVPath=__dirname+'/data/orderMetrics.csv';
	jetpack.write(orderMetricsCSVPath,orderMetricsCSV);

	// console.log('completedOrders', completedOrders)
	console.log('found ' + foundMetricCount + ' out of ' + orderMetrics.length)
	console.log('order metrics', orderMetrics)


	//just testing
	// findMetrics({})

	
};


const parseName = nameBlob =>{
	var s = {};


	if(nameBlob.indexOf('{')==-1){
		//this is a regular company
		var blobParts = nameBlob.split('(');

		s.name = blobParts[0].trim();

		s.ticker = blobParts[1].split(')')[0]
		if(s.ticker){
			s.ticker = s.ticker.split(':')[1]
		}else{
			console.log('didnt find a ticker for this: ' , nameBlob);
		}

		s.id = nameBlob.split('[')[1];
		if(s.id){
			s.id = s.id.split(']')[0];
		}else{
			console.log('didnt find an id for this: ' , nameBlob);
		}
	}else{
		//this is a custom entitye

		s.name = nameBlob.split('[')[0].trim();

		var custObjStr = nameBlob.split(']')[1].trim();
		var custObj = JSON.parse(custObjStr);

		s.ticker = custObj.ticker;
		s.id = nameBlob.split('[')[0].trim().split(']')[0].trim()

	}


	return s;
}



const showEditsFromBarChart = (d, completedOrders, productData) => {
	// console.log('clicked',d)
	// console.log('key',d.key)
	// console.log('dEditedByFulfillment',completedOrders)
	// console.log('productData',productData)

	document.querySelector('#editsByProductDetails').innerHTML = '';


	//loop through all the products, finding the ones that match the current order id
	completedOrders.forEach(function(i){
		if(i.sku == d.data.sku){
			// console.log('order object:', i)

			if(d.key=="customized"){
				if(i.customized){
					writeCustomizationDetails(i, document.querySelector('#editsByProductDetails'));
				}
			}else{

				if(d.key=='operChanged'){
					if(i.fulfillmentValues.operatorOptionsValues && objHasValues(i.fulfillmentValues.operatorOptionsValues)){
						writeObjDiff(i, 'operatorOptions', document.querySelector('#editsByProductDetails'), productData);	
					}
				
				}else if(d.key=='pageChanged'){
					if(i.fulfillmentValues.pageOptionsValues && objHasValues(i.fulfillmentValues.pageOptionsValues)){
						writeObjDiff(i, 'pageOptions', document.querySelector('#editsByProductDetails'), productData);	
					}
				
				}else if(d.key=='skinChanged'){
					if(i.fulfillmentValues.skinOptionsValues && objHasValues(i.fulfillmentValues.skinOptionsValues)){
						writeObjDiff(i, 'skinOptions', document.querySelector('#editsByProductDetails'), productData);	
					}
				
				}else if(d.key=='userChanged'){
					if(i.fulfillmentValues.userOptionsValues && objHasValues(i.fulfillmentValues.userOptionsValues)){
						writeObjDiff(i, 'userOptions', document.querySelector('#editsByProductDetails'), productData);		
					}
				
				}

				
			}


		}
	})



}





const appendEdits = (init, add, field) => {
	//update any existing & add any new
	add.forEach(function(i){
		var fi = _.findIndex(init, {sku:i.sku});
		// console.log(fi)
		if(fi==-1){
			//add it
			var o = {
				sku: i.sku,
				name: i.name,
				customized: 0,	//user customized
				skinChanged: 0,	//skin options
				pageChanged: 0,	//page options
				userChanged: 0,	//user options
				operChanged: 0	//operator options
			}
			o[field]+=1;
			init.push(o)
		}else{
			//update
			init[fi][field] += 1
		}
	});
	return init;

}


export const objHasValues = (o) => {
	//when I'm checking to see if operator options (e.g) have been overwritten, I check for the existince of <data>.fulfillmentValues.operatorOptionsValues
	//	however, sometimes that thing looks like {a:{b:{}}}
	//	meaning, there's *something* there, but there aren't actually any override values (so I don't want to count them)
	//	This function is to return true/false depending on whether there is some value *anywhere*
	var hasValue=false;

	var debug=false;

	for(var key in o){
		if(o[key]==undefined){
			if(debug){console.log('11111');}
			continue;
		}

		hasValue = chckKeyRecurs(o[key], debug);
	}
	return hasValue;
}

export const chckKeyRecurs = (k, debug) => {
	if(debug){console.log('recursing',JSON.stringify(k))}
	if(JSON.stringify(k)=='{}'){
		if(debug){console.log('22222',k);}
		return false;
	}
    for (var i in k){
        if (typeof k[i] == "object" && k[i] !== null){
        	if(debug){console.log('33333',k[i]);}
            return chckKeyRecurs(k[i], debug);
        }else{
			if(k[i]!=null && k[i]!=undefined){
				if(debug){console.log('44444',k[i]);}
				return true;
			}else{
				if(debug){console.log('5555',k[i]);}
				return false;
			}	
        }
    }
}




const findMetrics = c =>{

	var metricArray = [];

	//want to try iterating through stuff..
	metricArray = findMetricsIter(c.userOptionsValues.data, 'userOptionValues-data', []);
	if(metricArray.length==0){
		metricArray = findMetricsIter(c.userOptionsDefaults.data, 'userOptionsDefaults-data', []);
	}

	return metricArray
}




const findMetricsIter = (c, keyName, mtrA) => {
	if(!c){return mtrA;}

	// console.log('currently on: ' + keyName, c)

	if(typeof c == 'string'){return mtrA;}

	for(var itm in c){
		// console.log('iterating into:' + itm, c[itm])

		if(itm=='metrics' && Array.isArray(c[itm])){
			mtrA = mtrA.concat(c[itm])

		}else if(itm=='metric1' && typeof c[itm] == 'string'){
			mtrA.push(c[itm])

		}else if(itm=='metric2' && typeof c[itm] == 'string'){
			mtrA.push(c[itm])

		}else if(typeof c[itm] == 'string' && c[itm].indexOf('!')!=-1){	//going to assume this is metric
			mtrA.push(c[itm])


		}else{
			//didn't find anything, iterate
			mtrA = findMetricsIter(c[itm], itm, mtrA)
			
		}







	}

	return (mtrA);
	// return _.uniq(mtrA);

}





















