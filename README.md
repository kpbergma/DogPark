# DogPark
Web service and page for dog park monitoring for SensorUp<BR>
Author: Karel Bergmann<BR>
The main class is DogManager.<P>

SUMMARY:<BR>
This is server code which accepts dog position updates from the dog simulator project found at github.com/kpbergma/DogSim.  Interfaces to DogSim via a RESTful web service.  Also allows querys through RESTful web services, which are utilized by a Javascript enhanced webpage which is included in the repository.  Data sharing between the web services is handled by Java DB.<P>

INTERFACES:<BR>
/web/index.html - Html client to show current and on-going dog status within the dogpark.  Shows all of the dogs currently in the park.  If a user wants to monitor only a single dog, this can be accomplished by navigating to /web/index.html?dog=<dog id>, where dog id is an integer value of a dog's ID.<BR>
/src/java/dogpark/DogParkResource.java - Allows the dog simulator to keep the system updated and the web client fetch information about dogs through the following urls:
  /webresources/DogPark/update - Accepts a string of newline-delimited JSON representations of dogs and their vital signs and position.<BR>
  /webresources/DogPark/query - Returns a string of newline-delimited JSON representations of dogs to the client, for all dogs in the park.<BR>
  /webresources/DogPark/query/<id> - Returns the JSON representation of the dog specified by <id>.<P>

REQUIREMENTS:<BR>
This a NetBeans project, and can be deployed on Glassfish server platform.  In addition to the included resources needs a Java DB database to store dog information so that it may be shared between the web services.<BR>
This database includes a single table:<BR>
DOGSTATUS:<BR>
  ID - int, PK, dog id<BR>
  ACTIVE - boolean, dog status (in sim or not)<BR>
  XCOORD - double, x-coordinate<BR>
  YCOORD - double, y-coordinate<BR>
  HR - int - heart rate<BR>
  TEMP - double, internal temperature<P>
  
IMPORTANT FILES:<BR>
DogPark/DogPark/src/java/dogpark/DogParkResource.java - Restful web services defined here.<BR>
DogPark/DogPark/web/index.html - Main client webpage defined here.<BR>
DogPark/DogPark/web/drawdogs.js - Additional Javascript methods for page rendering.<BR>

RUNNING:<BR>
Needs to be deployed on Glassfish server.  A sample deployment may be running at:
http://everest.homelinux.org:8080/DogPark/index.html<P>

The web GUI shows what is going on in the interaction space:<BR>
-Shows the arena floor as a soccer field<BR>
-Each dog is represented by a dog icon with its ID number shown<BR>
-When the user hovers the mouse over a dog, the dog’s vital signs are shown<BR>
-The vitals of the previously selected dog are shown below the interaction space so the user
	doesn’t have to follow the dog around to see its vital signs.<BR>
-The largest, most dense cluster of dogs is highlighted in red, and their ID numbers
	are added to a watch list for monitoring.<P>
