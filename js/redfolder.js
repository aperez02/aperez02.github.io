$.ui.useOSThemes = false;
$.ui.showBackButton=false;
var jsonFiles = ["CSU\ Campuses/CSUSB/CSUSB.json", "CSU\ Campuses/CSUSB\ Palm\ Desert/CSUSBPalmDesert.json"];
var CSUCampuses = new Array(); //array of campus objects
var currentCampus;

function loadCSUCampuses () {	
	for (var i = 0; i < jsonFiles.length; i++) {
		$.getJSON(jsonFiles[i], function(data) {
			CSUCampuses.push(data);

			// check if done loading campus objects
			if (CSUCampuses.length == jsonFiles.length) {
				alert("done!");
				navigator.splashscreen.hide();
				populateCampusSelectPage();
				navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onGeolocationError);
			};
		});
	};
}

$.ui.customClickHandler=appClickHandler;// handle clicks in app

//keep tabs selection consistent with page navigation
function appClickHandler(evt) {
	var currentTarget = evt.hash;
	var tabs = $("#tabMenu a");

	$.each(tabs,function(ind, tab){
		var tabTarget = tab.hash;
		if (tabTarget == currentTarget) {
			$(".current").removeClass("current");
			tab.className += " current";
		}
	});
}

function onLoad() {
	document.addEventListener("deviceready", onDeviceReady, false);
	
	/*$(".dropDown a").bind("click", function () {
		var content = $(this).siblings("section");
		content.toggleClass("showDetails");

		if (content.hasClass("showDetails")) {
			$(this).replaceClass("right", "down");
		} else {
			$(this).replaceClass("down", "right");
		}
	});*/
}
function onDeviceReady() {
	loadCSUCampuses();
	document.addEventListener("backbutton", backButtonPressed, false);
}
function backButtonPressed () {
	navigator.notification.confirm("Are you sure you want to exit app?", exitAppQuery, "Exit App", ["Yes", "No"])
}
function exitAppQuery (buttonIndex) {
	if (buttonIndex == 1) {
		navigator.app.exitApp();
	};
}
function onGeolocationSuccess(position) {
	var positionLongitude = position.coords.longitude;
	var positionLatitude = position.coords.latitude;

	var c = closestCampusIndex(positionLatitude, positionLongitude, CSUCampuses);
	setCurrentCampus(c);
	alert(currentCampus.name);
}
function onGeolocationError(error) {
	//can't use geolocation, navigate to campus select page
	$.ui.loadContent("#campusSelectPage",false,false,"up");
	alert("Unable to detect current campus");
}

function toRad(degrees) {
	return degrees * Math.PI/180;
}
function calculateGreatCircleDistance(lat1, long1, lat2, long2) {
	var rLat1 = toRad(lat1);
	var rLong1 = toRad(long1);
	var rLat2 = toRad(lat2);
	var rLong2 = toRad(long2);

	var dLat = rLat2 - rLat1;
	var dLong = rLong2 - rLong1;

	var r = 6378137; // radius of earth in meters
	// Haversine formula
	var distance = 2 * r * Math.asin(Math.sqrt(Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(rLat1)*Math.cos(rLat2)*Math.sin(dLong/2)*Math.sin(dLong/2)));

	return distance;
}
function closestCampusIndex (positionLatitude, positionLongitude, campuses) {
	if (campuses.length > 0) {
		//assume first campus is current campus
		var currentCampusIndex = 0;
		var shortestDistance = calculateGreatCircleDistance(positionLatitude, positionLongitude, campuses[currentCampusIndex].position.lat, campuses[currentCampusIndex].position.long);
	
		for (var i = 1; i < campuses.length; i++) {
			var cLat1 = campuses[i].position.lat;
			var cLong = campuses[i].position.long;
			
			var d = calculateGreatCircleDistance(positionLatitude, positionLongitude, cLat1, cLong);
			if (d < shortestDistance) {
				shortestDistance = d;
				currentCampusIndex = i;
			}
		};
		return currentCampusIndex;
	}
	else {
		return -1;
	}
}
function populateCampusSelectPage () {
	// load campuses into campus select page
	var campusSelector = $("#selectCampus");
	var campusOptions = "";

	for (var i = 0; i < CSUCampuses.length; i++) {
		campusOptions += "<option>" + CSUCampuses[i].shortName + "</option>";
	};
	campusSelector.html(campusOptions);
}
function campusManuallySelected() {
	var campusSelector = document.getElementById("selectCampus");
	setCurrentCampus(campusSelector.selectedIndex);

	$.ui.hideModal();
}
function setCurrentCampus(index) {
	currentCampus = CSUCampuses[index];

	// TODO: Need logos for campuses to place before campus name
	var campusIndicator = $("#campusIndicator");
	campusIndicator.html("<img src='Frog.jpg' alt='campus logo' class='campusLogo'><span>" + currentCampus.name + "</span><a href='#' class='icon close' onclick='hideCampusIndicator()'></a>");
	campusIndicator.addClass("showCampusIndicator");

	//update protocol
	var yProtocol = $("#yesProtocol");
	var nsProtocol = $("#notSureProtocol");
	var nProtocol = $("#noProtocol");

	var yesAction = currentCampus.protocolActions.yes;
	var notSureAction = currentCampus.protocolActions.notSure;
	var noAction = currentCampus.protocolActions.no;

	// add action to protocol optionsß
	setProtocolAction(yProtocol, yesAction);
	setProtocolAction(nsProtocol, notSureAction);
	setProtocolAction(nProtocol, noAction);

	//TODO: Are we using images for various resources? How much data do we want to store on each campus?
	// This is place holder with frog images
	var contactPage = $("#contactPage");
	var campusContacts = currentCampus.contactInfo;

	var contactContent = "<span class='title'>Contact Resources</span><p>Please contact the appropriate resources to assist any individual whom you believe to be at risk or may be concerned about.</p>";
	for (var i = 0; i < campusContacts.length; ++i) {
		var resource = campusContacts[i].resource;
		var phoneNumber = campusContacts[i].phoneNumber;

		contactContent += "<div class='infoCard'><img src='Frog.jpg' alt='resource image'><span class='title'>" + resource + "</span><a class='action' href='tel:" + phoneNumber + "'>Make Call</a></div>"
		contactPage.html(contactContent);
	}
}
function setProtocolAction (protocolElement, protocolAction) {
	switch (protocolAction.type) {
		case "phone":
			protocolElement.attr("href", "tel:" + protocolAction.phoneNumber);
			break;
		case "appPage":
			protocolElement.attr("href", protocolAction.page);
			protocolElement.attr("data-transition", "fade");
			break;
		case "email":
			protocolElement.attr("href", "mailto:" + protocolAction.emailAddress);
			break;
		case "text":
			protocolElement.attr("onclick", "navigator.notification.alert('" + protocolAction.content + "', function (){}, 'Protocol')");
			protocolElement.attr("href","#");
		default:
			protocolElement.attr("href", "#");
	}
}
function hideCampusIndicator() {
	$("#campusIndicator").removeClass("showCampusIndicator");
}
