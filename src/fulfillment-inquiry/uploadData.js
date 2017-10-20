
const {dialog} = require('electron').remote
import jetpack from 'fs-jetpack';
import { init } from './loadDataAndUI';


export const uploadFulfillmentData = () => {
	var res = getData();
	if(res){
		jetpack.copy(res, __dirname+'/data/data.csv', { overwrite: true });
		init();
	}


}	


export const uploadProductData = () => {
	var res = getData();
	if(res){
		jetpack.copy(res, __dirname+'/data/productData.csv', { overwrite: true });
		init();
	}
}	


const getData = () => {
	var opts = {
				  filters: [{ name: 'CSVs', extensions: ['csv'] }],
				  properties: ['openFile']
				}


 	var file = dialog.showOpenDialog(opts)

 	if(file==undefined){
 		return undefined
 	}else{
	 	return file[0];
 	}
}