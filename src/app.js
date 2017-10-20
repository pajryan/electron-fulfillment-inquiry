// Here is the starting point for your application code.

// Small helpers you might want to keep
import './helpers/context_menu.js';
import './helpers/external_links.js';

// All stuff below is just to show you how it works. You can delete all of it.
import { remote } from 'electron';
import jetpack from 'fs-jetpack';
import { init } from './fulfillment-inquiry/loadDataAndUI';
import { build } from './fulfillment-inquiry/buildReport';
import { uploadFulfillmentData } from './fulfillment-inquiry/uploadData';
import { uploadProductData } from './fulfillment-inquiry/uploadData';
import env from './env';


//get the data and build some initial UI
init();
document.querySelector('#buildButton').addEventListener('click', build);


document.querySelector('#btnGetFulfillmentData').addEventListener('click', uploadFulfillmentData);
document.querySelector('#btnGetProductData').addEventListener('click', uploadProductData);


