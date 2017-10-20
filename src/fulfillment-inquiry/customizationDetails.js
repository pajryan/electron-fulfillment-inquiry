

export const writeCustomizationDetails = (rawJson, writeToTarget) => {

	writeToTarget.innerHTML += '<p class="diffHeader">'+rawJson.type+' <a href="https://app.pellucid.com#/admin/orders/~'+rawJson.orderId+'" class="js-external-link">'+rawJson.orderId+'</a> ('+rawJson.firstName+' '+rawJson.lastName+')</p>'

	writeToTarget.innerHTML += '<span class="customizationText">'+rawJson.userOptionsValues.customize.customizeText+'</span>';

}