/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package dogpark;

import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.PathParam;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import java.sql.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ws.rs.POST;
import javax.ws.rs.core.MediaType;
import us.monoid.json.JSONException;
import us.monoid.json.JSONObject;
import us.monoid.json.JSONStringer;

/**
 * REST Web Service
 * Allows dog simulator to update information
 * about individual dogs using /update.  Information
 * can be retrieved by javascript client using /query
 * for all dogs and /query/<dognum> for individual dogs.
 * 
 * @author Karel Bergmannergmann
 */
@Path("DogPark")
public class DogParkResource {

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of DogParkResource
     */
    public DogParkResource() {
    }
    
    /**
     * Retrieves representation of an instance of dogpark.DogParkResource
     * Allows javascript client to access information about dog identified
     * by id.  Accessed as /query/<dog id>.
     * 
     * @return String - JSON -encoded representation of dog.
     */
    @POST
    @Path("query/{id}")
    @Produces(MediaType.TEXT_HTML)
    public String getLocation(@PathParam("id") int id) {
        try {
            //connect to database
            Connection conn = DriverManager.getConnection("jdbc:derby://localhost:1527/DogPark", "bergmann", "Viridis8");
            Statement stmt = conn.createStatement(ResultSet.TYPE_SCROLL_INSENSITIVE, ResultSet.CONCUR_READ_ONLY);
            
            //query database
            ResultSet rs = stmt.executeQuery("SELECT * FROM DOGSTATUS WHERE ID=" + id);
            
            //return error if dog doesn't exist
            if (rs.first() == false) {
                return "<html><h1>Dog ID"+ id + " not in arena.</h1></html>";
            }
            
            //convert dog to JSON
            else if (rs.getBoolean("ACTIVE") == true) {
                String dogInfo = "";
                try {
			dogInfo = new JSONStringer()
				.object()
					.key("id")
					.value(id)
					.key("active")
					.value(true)
					.key("xcoord")
					.value(rs.getDouble("XCOORD"))
					.key("ycoord")
					.value(rs.getDouble("YCOORD"))
					.key("hr")
					.value(rs.getLong("HR"))
					.key("temp")
					.value(rs.getDouble("TEMP"))
				.endObject()
				.toString();
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
                //return JSON
                rs.close();
                return dogInfo;
            }
        } catch (SQLException ex) {
            Logger.getLogger(DogParkResource.class.getName()).log(Level.SEVERE, null, ex);
        }
        return "<html>Error</html>";
    }

    /**
     * Retrieves representation of an instance of dogpark.DogParkResource
     * Allows javascript client to query database on locations of all dogs.
     * Accessed as /query, returns string containing newline delimited json
     * representations of dogs present in the arena.
     * 
     * @return string - newline delimited json representations of dogs
     */
    @POST
    @Path("query")
    @Produces(MediaType.TEXT_HTML)
    public String getLocation() {
        String dogInfo = "";
        try {
            //connect to database
            Connection conn = DriverManager.getConnection("jdbc:derby://localhost:1527/DogPark", "bergmann", "Viridis8");
            Statement stmt = conn.createStatement(ResultSet.TYPE_SCROLL_INSENSITIVE, ResultSet.CONCUR_READ_ONLY);
            
            //get all dogs
            ResultSet rs = stmt.executeQuery("SELECT * FROM DOGSTATUS");
            
            //construct json from dogs which are present
            while ((rs.next()) && (rs.getBoolean("ACTIVE") == true)) {
                try {
			dogInfo = dogInfo + new JSONStringer()
				.object()
					.key("id")
					.value(rs.getInt("ID"))
					.key("active")
					.value(true)
					.key("xcoord")
					.value(rs.getDouble("XCOORD"))
					.key("ycoord")
					.value(rs.getDouble("YCOORD"))
					.key("hr")
					.value(rs.getLong("HR"))
					.key("temp")
					.value(rs.getDouble("TEMP"))
				.endObject()
				.toString() + "\n";
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
            }
            rs.close();
        } catch (SQLException ex) {
            Logger.getLogger(DogParkResource.class.getName()).log(Level.SEVERE, null, ex);
        }
        
        //return encoded dogs
        return dogInfo.trim();
    }
    
    /**
     * PUT method for updating or creating an instance of DogParkResource
     * Allows dog simulator to update dog information, one dog at a time.
     * Information is stored in Java DB.  Accessed as /update with JSON
     * representation of dog info.
     * 
     * @param content representation for the resource
     * @return an HTTP response with content of the updated or created resource.
     */
    @PUT
    @Path("update/")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN)
    public String putJson(String content) {
        String result = "initial"; //status for client
        
        //parse json representation of dog from string
        try {
            //parse json
            JSONObject obj = new JSONObject (content);
            
            //connect to database
            Connection conn = DriverManager.getConnection("jdbc:derby://localhost:1527/DogPark", "bergmann", "Viridis8");
            Statement stmt = conn.createStatement(ResultSet.TYPE_SCROLL_INSENSITIVE, ResultSet.CONCUR_READ_ONLY);
            
            //get dogs to see if supplied one already exists
            ResultSet rs = stmt.executeQuery("SELECT * FROM DOGSTATUS WHERE ID=" + obj.getInt("id"));
            
            //if matching for not present, do an insert.
            if (rs.first() == false) {
                result = "absent";
                 stmt.executeUpdate("INSERT INTO DOGSTATUS (ID, ACTIVE, XCOORD, YCOORD, HR, TEMP) " +
                        "VALUES (" + obj.getInt("id") + ", " + obj.getBoolean("active") +
                        ", " + obj.getDouble("xcoord") + ", " + obj.getDouble("ycoord") +
                        ", " + obj.getLong("hr") + ", " + obj.getDouble("temp") + ")");
                        
            } 
            //otherwise do an update.
            else {
                result = "present";
                stmt.executeUpdate("UPDATE DOGSTATUS SET ACTIVE=" + obj.getBoolean("active") +
                        ", XCOORD=" + obj.getDouble("xcoord") + ", YCOORD=" + obj.getDouble("ycoord") +
                        ", HR=" + obj.getLong("hr") + ", TEMP=" + obj.getDouble("temp") +
                        " WHERE ID=" + obj.getInt("id"));
               
            }
        } catch (SQLException|JSONException ex) {
            Logger.getLogger(DogParkResource.class.getName()).log(Level.SEVERE, null, ex);
        }
        //return status to client.
        return result;
    }
}
