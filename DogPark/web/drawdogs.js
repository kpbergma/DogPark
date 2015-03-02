/**
 * drawdogs.js
 * 
 * Uses javascript to draw on a canvas in index.html
 * Dog information is obtained from restful web service.
 * Users can hover over a dog icon to display vitals.  URL
 * query string can be used to specify which dog to monitor
 * with ?dogs=<dog id num>.  If no query string, or an invalid
 * id are presented, all dogs are monitored.
 * 
 * @author Karel Bergmann
 * @see index.html
 */
var dogarray;       //dogs at each refresh
var activedog;      //the last selected dog
var DOG_W = 30;     //dog icon dimensions
var DOG_H = 30;
var SCREEN_W = 800; //canvas dimensions
var SCREEN_H = 600;
var ARENA_W = 1500; //arena dimensions
var ARENA_H = 1000;
var MAX_DOGS = 100;
var CLUSTER_RANGE = 100;
var REFRESH_INTERVAL = 500;
var URL = "http://everest.homelinux.org:8080/DogPark/webresources/DogPark/query/";

/**
 * Draws the arena, along with the dogs in it.
 * @returns {undefined}
 */
function drawArena()
{
    //Use ajax to get current dog info
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange=function()
    {
        //once the query is complete
        if (xmlhttp.readyState===4 && xmlhttp.status===200)
        {
            //draw the background
            var c = document.getElementById("myCanvas");
            var ctx = c.getContext("2d");
            var img = document.getElementById("background_img");
            ctx.drawImage(img, 0, 0, SCREEN_W, SCREEN_H);
            
            //split the response string into lines
            //then parse out dog info.  Each returned line is a dog
            var json = xmlhttp.responseText;
            dogarray = json.split("\n");
            for (i = 0; i < dogarray.length; i++) {
                dogarray[i] = JSON.parse(dogarray[i]);
                drawDog(ctx, dogarray[i]);
            }
            
            //highlight and display selected dog info
            activateDog(ctx);
            
            //find the most dense concentration of dogs for monitoring
            findClusters(ctx);
            if (typeof activedog !== 'undefined') {
                var doginfo = "<font size = '2', face = 'arial', color = 'blue'>Dog: ID" + activedog.id;
                doginfo += " X-Coordinate: " + activedog.xcoord.toFixed(2);
                doginfo += " Y-Coordinate: " + activedog.ycoord.toFixed(2);
                doginfo += " Heart Rate: " + activedog.hr;
                doginfo += " Temperature: " + activedog.temp + "</font>";           
                document.getElementById("doginfo").innerHTML = doginfo;
            }
        }
    }
    
    //decide which query to use based on URL query string

    dognum = parseInt(dognum);
    //if query string is invalid, show all dogs
    if ((isNaN(dognum)) || 
            (typeof dognum === 'undefined') || 
            (dognum >= MAX_DOGS) || 
            (dognum < 0))
        useurl = URL;
    //otherwise (query string is ?dog=<dog num>), show just that dog
    else
        useurl = URL + dognum;
    xmlhttp.open("POST",useurl, true);
    xmlhttp.send();
};

/**
 * Draw a dog on the canvas
 * @param {type} context graphics context
 * @param {type} dog the dog to draw
 * @returns {undefined}
 */
function drawDog (context, dog) {
    var dog_image = document.getElementById("dog_img");
    context.drawImage(dog_image, 
        scaleX(dog.xcoord)-DOG_W/2, 
        scaleY(dog.ycoord)-DOG_H/2, 
        DOG_W, 
        DOG_H);
    context.font = "15px Arial";
    context.fillStyle  = "#FFFFFF";
    //scale coordinates from arena-space to canvas-space
    context.fillText(dog.id, scaleX(dog.xcoord)-8, scaleY(dog.ycoord)+5);
}

/**
 * Display info on last-selected dog
 * 
 * @param {type} context graphics context
 * @returns {undefined}
 */
function activateDog (context) {
    //if active dog exists, find in current dog array
    //(values may have changed since last update)
    if (typeof activedog !== 'undefined') {
        for (i = 0; i < dogarray.length; i++)
            //update info
            if (dogarray[i].id === activedog.id) {
                activedog = dogarray[i];
                break;
            }
        //draw box around dog (scale coordinates to canvas-space
        context.strokeStyle = "#0000FF";
        context.strokeRect(scaleX(activedog.xcoord)-DOG_W/2, 
            scaleY(activedog.ycoord)-DOG_H/2, 
            DOG_W, 
            DOG_H);
        
        //draw the pop-up with info
        context.fillStyle = "rgba(255, 255, 255, 0.5)";
        var xcorrect = 0;
        if (scaleX(activedog.xcoord)+DOG_W/2 < SCREEN_W-200) {
            xcorrect = 0;
        }
        else {
            xcorrect = -160
        }
        context.fillRect((scaleX(activedog.xcoord)+DOG_W/2)+5+xcorrect,
                scaleY(activedog.ycoord)-(DOG_H/2), 120, DOG_H);
            var heart = document.getElementById("heart_img");
            context.drawImage(heart,
                (scaleX(activedog.xcoord)+DOG_W/2)+8+xcorrect, 
                scaleY(activedog.ycoord)-(DOG_H/2)+8, 
                15, 
                15);
            var therm = document.getElementById("therm_img");
            context.drawImage(therm,
                (scaleX(activedog.xcoord)+DOG_W/2)+60+xcorrect, 
                scaleY(activedog.ycoord)-(DOG_H/2)+2, 
                25, 
                25);
            context.fillStyle = "#000000";
            context.fillText(activedog.hr, 
                scaleX(activedog.xcoord)+DOG_W/2+30+xcorrect,
                scaleY(activedog.ycoord)-DOG_H/2+20);
            context.fillText(activedog.temp, 
                scaleX(activedog.xcoord)+DOG_W/2+85+xcorrect,
                scaleY(activedog.ycoord)-DOG_H/2+20);
    }
}

/**
 * Finds the most dense cluster of dogs and
 * highlights them in red.  Adds their id
 * numbers to the watch list.
 * 
 * @param {type} context graphics context
 * @returns {undefined}
 */
function findClusters (context) {
    //Find and highlight the most dense dog cluster
    var root;		//centroid candidate
    var northest;	//highest most cluster member
    var westest;	//left most cluster member
    var southest;	//lowest most cluster member
    var eastest;	//right most cluster member
    var rootVector = [];//dogs in the cluster
        
    //Examine each dog as a centroid candidate
    for (i = 0; i < dogarray.length; i++) {
        var d1 = dogarray[i];
        var testVector = [];
        var south = d1;
        var east = d1;
        var north = d1;
        var west = d1;
        	
        //For every other dog in the arena
        for (j = 0; j < dogarray.length; j++) {
            var d2 = dogarray[j];
            //if it is in clustering range
            if ((d2.id !== d1.id) &&
        	(distance(d1.xcoord, d1.ycoord, d2.xcoord, d2.ycoord) < CLUSTER_RANGE)) {
        	//add the dog to the cluster
        	//expand the bounding box to the new dog, if necessary.
                testVector[testVector.length] = d2;
                if (d2.xcoord > east.xcoord)
                    east = d2;
        	if (d2.ycoord > south.ycoord)
                    south = d2;
        	if (d2.xcoord < west.xcoord)
                    west = d2;
        	if (d2.ycoord < north.ycoord)
                    north = d2;
            }
        }

        //check if this is the biggest cluster
        if (testVector.length > rootVector.length) {
            root = d1;
            rootVector = testVector;
            southest = south;
            eastest = east;
            northest = north;
            westest = west;
        }	
    }

    //If a largest cluster has been detected...
    if (typeof root !== 'undefined') {
        //find cluster boundaries on canvas.
        var pSouth = {x: scaleX(southest.xcoord), y: scaleY(southest.ycoord)};
        var pEast = {x: scaleX(eastest.xcoord), y: scaleY(eastest.ycoord)};
        var pNorth = {x: scaleX(northest.xcoord), y: scaleY(northest.ycoord)};
        var pWest = {x: scaleX(westest.xcoord), y: scaleY(westest.ycoord)};

        //draw a red, transparent boxover the cluster
        context.fillStyle = "rgba(255, 0, 0, 0.4)";
        context.fillRect (pWest.x-DOG_W/2, 
            pNorth.y-DOG_H/2, 
            pEast.x-pWest.x+DOG_W, 
            pSouth.y-pNorth.y+DOG_H);
        
        //draw a border around the box
        context.strokeStyle = "#FF0000";	
        context.strokeRect (pWest.x-DOG_W/2,
            pNorth.y-DOG_H/2,
            pEast.x-pWest.x+DOG_W, 
            pSouth.y-pNorth.y+DOG_H);
        
        //add numbers to watch list
        var watchlist = "<font size = '2' face = 'arial' color = 'red'>Watchlist: ";
        watchlist += root.id + "   ";
        for (i = 0; i < rootVector.length; i++) {
            watchlist += rootVector[i].id + "   ";
        }
        watchlist += "</font>";
        document.getElementById("watchlist").innerHTML = watchlist;
    }
}

/**
 * scale x-coordinate from arena-space
 * to canvas-space for drawing
 * @param {type} ax arena-space x-coordinate
 * @returns {Number} canvas-space x-coordinate
 */
function scaleX (ax) {
    return parseInt(ax) * SCREEN_W / ARENA_W;
}

/**
 * scale y-coordinate from arena-space
 * to canvas-space for drawing
 * @param {type} ay arena-space y-coordinate
 * @returns {Number} canvas-space y-coordinate
 */
function scaleY (ay) {
    return parseInt(ay) * SCREEN_H / ARENA_H;
}

/**
 * Calculate the distance between two points:
 * (x1, y1) and (x2, y2).
 * 
 * @param {type} x1
 * @param {type} y1
 * @param {type} x2
 * @param {type} y2
 * @returns {Number} distance between points.
 */
function distance (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2));
}

/**
 * Returns the value of the url query string
 * corresponding to the name provided.
 * 
 * @param {type} variable name of variable to extract
 * @returns {unresolved} value of variable
 */
function getQueryVariable (variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    var pair = vars[0].split('=');
    if (decodeURIComponent(pair[0]) === variable) {
        return decodeURIComponent(pair[1]);
    }
}
