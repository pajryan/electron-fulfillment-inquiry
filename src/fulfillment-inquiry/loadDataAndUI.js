import jetpack from 'fs-jetpack';
const csv=require('csvtojson')
import { build } from './buildReport';



// var d;	//the json data representing order data

export const init = () => {
	// const csvFilePath='app/data/data.csv'
	const csvFilePath=__dirname+'/data/data.csv';	//use __dirname so it works in dev and prod


	//function to handle json blobs (return them as json, not a big string)
	var customParser = { 
		colParser:{
			'userOptionsValues':function(item, head, resultRow, row , colIdx){ return JSON.parse(item);},
			'userOptionsDefaults':function(item, head, resultRow, row , colIdx){ return JSON.parse(item); },
			'specifications':function(item, head, resultRow, row , colIdx){ return JSON.parse(item); },
			'fulfillmentValues':function(item, head, resultRow, row , colIdx){ return JSON.parse(item); },
			'createdAt':function(item, head, resultRow, row , colIdx){ return dbStringToDate(item); },
			'completedAt':function(item, head, resultRow, row , colIdx){ return dbStringToDate(item); }
		}
	}

	const csvStr = jetpack.read(csvFilePath);
	csv(customParser)
		// .fromFile(csvFilePath)
		.fromString(csvStr)
		.on("end_parsed",function(jsonArrayObj){ //when parse finished, result will be emitted here.
	     	// console.log(jsonArrayObj); 
	     	haveJson(jsonArrayObj)
		})
		.on('error',(err)=>{
			console.log('error loading CSV:', err)
		})
	
};



const haveJson = rawJson => {
	//store off the raw json
	var d = rawJson;


	//sort by created date (most recent first)
	d.sort(function(a, b) {
	    return b.createdAt - a.createdAt;
	});


	//add some values that'll be helpful later
	d.forEach(function(i){

		//isEdited and isCustomizied
		// i.editedByFulfillment = Object.keys(i.fulfillmentValues).length>0;
		i.editedByFulfillment = Object.keys(i.fulfillmentValues).length>0 && objHasValues(i.fulfillmentValues);
		i.customized = false;
		if(i.userOptionsValues.customize && i.userOptionsValues.customize.customizeReason != 'none'){
			i.customized=true;
		}

		//total fulfillment time
		if(i.completedAt==null || i.createdAt==null){
			i.fulfillmentTime = null;
		}else{
			i.fulfillmentTime = Math.round((i.completedAt - i.createdAt) / (1000*60));
		}
	})



	//build some UI to allow selecting tenant and date
	//get unique tenants & create selector

	//clear out the tenants
	document.querySelector('#tenantSelector').innerHTML = '<option value="all">all</option>'

	let unique = [...new Set(d.map(item => item.tenant))];
	unique.forEach(function(i){
		var o = document.createElement('option');
		o.value = i; o.innerHTML = i;
		document.querySelector('#tenantSelector').appendChild(o)
	})


	//get unique users & create selector
	document.querySelector('#userSelector').innerHTML = '<option value="all">all</option>'
	let uniqueUser = [...new Set(d.map(item => item.email))];
	uniqueUser.sort()
	uniqueUser.forEach(function(i){
		var o = document.createElement('option');
		o.value = i; o.innerHTML = i;
		document.querySelector('#userSelector').appendChild(o)
	})

	//add value to date selector
	var old = new Date(2017,7,1);	//date of CS trial start (first client)
	var dtStr = (old.getMonth()+1)+'/'+old.getDate()+'/'+old.getFullYear();
	document.querySelector('#dateSelectorFrom').value = dtStr;

	var now = new Date();
	dtStr = (now.getMonth()+1)+'/'+now.getDate()+'/'+now.getFullYear();
	document.querySelector('#dateSelectorTo').value = dtStr;

	//kickoff a build based on default values
	// build(d)



	//get product CSV
	const csvFilePath=__dirname+'/data/productData.csv';	//use __dirname so it works in dev and prod
	// const csvFilePath='data/productData.csv'
	var customParser = { 
		colParser:{
			'specifications':function(item, head, resultRow, row , colIdx){ return JSON.parse(item); }
		}
	}

	const csvStr = jetpack.read(csvFilePath);

	csv(customParser)
		// .fromFile(csvFilePath)
		.fromString(csvStr)
		.on("end_parsed",function(jsonArrayObj){ //when parse finished, result will be emitted here.
	     	haveProductJson(jsonArrayObj, d)
	   })

}


	const haveProductJson = (productJson, fulfillmentData) => {
		//finally kick off build, providing both fulfillment data and product data to the function
		build(fulfillmentData, productJson);
	}




/* HELPERS */
/* HELPERS */
/* HELPERS */

const dbStringToDate = dbstr => {
	if(dbstr==null || dbstr=='' || dbstr == undefined){return null}
	//from something like '2017-08-10 21:59:59.987+00' to a javascript date/time
	var dtTm = dbstr.split('.')[0];	//strip off decimals
	var dt = dtTm.split(' ')[0];
	var tm = dtTm.split(' ')[1];

	var dtParts = dt.split('-');
	var tmParts = tm.split(':');

	var converted = new Date(dtParts[0], parseInt(dtParts[1])-1, dtParts[2], tmParts[0], tmParts[1], tmParts[2]);
	
	//this is UTC, so back off 6 hrs (will just do this all NY time)
	converted.setHours(converted.getHours() - 6);

	return converted;
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
			if(debug){onsole.log('11111');}
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
