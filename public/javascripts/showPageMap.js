//this js file is called in show.ejs. In HTML files we put JS code between the script tags.

//mapbox JS script associated with the map div in beggining of show.ejs file code to use mapbox to display the map of campground
//mapToken and campground variables are passed through from the show.ejs file, see script there for more comments on process
mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/streets-v12", // style URL
  center: campground.geometry.coordinates, // starting position [lng, lat]
  zoom: 9, // starting zoom
});

// adds the + and - buttons on the map to zoom in and zoom out as required
map.addControl(new mapboxgl.NavigationControl());

//used to set a visual marker on the current campground location and if you click the marker then popup will display with the campground title
//and campground location
new mapboxgl.Marker()
  .setLngLat(campground.geometry.coordinates)
  .addTo(map)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<h3>${campground.title}</h3><p>${campground.location}</p>`
    )
  );
