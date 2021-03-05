// set my mapboxgl access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY3dob25nIiwiYSI6IjAyYzIwYTJjYTVhMzUxZTVkMzdmYTQ2YzBmMTM0ZDAyIn0.owNd_Qa7Sw2neNJbK6zc1A';

// set some static variables that will be used in multiple places
var INITIAL_CENTER = [-73.882646,40.810616]
var INITIAL_ZOOM = 9.3

// initialize the mapboxGL map in the div with id 'mapContainer'
var map = new mapboxgl.Map({
  container: 'mapContainer',
  style: 'mapbox://styles/mapbox/light-v10',
  center: INITIAL_CENTER,
  zoom: INITIAL_ZOOM
});

// add the mapbox geocoder control
map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
  })
);

// wait for the initial mapbox style to load before loading our own data
map.on('style.load', function () {

  // we need to load the data manually because our population properties are strings and not numbers!!!
  $.getJSON('data/districts-with-population.geojson', function(featureCollection) {

    // iterate over each feature in the FeatureCollection and convert the pop2010 property to a number
    featureCollection.features.forEach(function(feature) {
      feature.properties.pop2010 = parseInt(feature.properties.pop2010)
    })

    // given a boro_cd string, find the matching feature in the data and return its geometry
    var getGeometry = function(boro_cd) {
      var matchingFeature = featureCollection.features.find(d => d.properties.boro_cd === boro_cd)
      return matchingFeature.geometry
    }

    // hide the layer nyc-cd on demand
    var hideChoroplethLayer = function() {
      map.setLayoutProperty('nyc-cd', 'visibility', 'none');
    }

    // override the fill color of the water layer
    // this is just an example of overriding the base style
    map.setPaintProperty('water', 'fill-color', '#c9f4ff');

    // add a geojson source for nyc community districts with population data
    map.addSource('nyc-cd', {
      type: 'geojson',
      data: featureCollection
    });

    // add a choropleth layer to style and display the source
    // colors are from colorbrewer
    map.addLayer({
      'id': 'nyc-cd',
      'type': 'fill',
      'source': 'nyc-cd',
      'layout': {},
      'paint': {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'pop2010'],
          0,
          '#f1eef6',
          50000,
          '#bdc9e1',
          100000,
          '#74a9cf',
          250000,
          '#2b8cbe',
          500000,
          '#045a8d'
        ],
        'fill-outline-color': '#ccc',
        'fill-opacity': 0.8
      }
    }, 'waterway-label');

    // add an empty data source, which we will use to highlight the geometry the user has selected
    map.addSource('highlight-feature', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    // add a layer for the highlighted feature
    map.addLayer({
      id: 'highlight-line',
      type: 'line',
      source: 'highlight-feature',
      paint: {
        'line-width': 2,
        'line-opacity': 0.9,
        'line-color': 'orange',
      }
    });


    // listen for a click on the map and show info in the sidebar
    map.on('click', function(e) {
      // query for the features under the mouse, but only in our custom layer
      var features = map.queryRenderedFeatures(e.point, {
          layers: ['nyc-cd'],
      });

      if (features.length > 0 ) {
        // get the feature under the mouse pointer
        var hoveredFeature = features[0]

        // pull out the cd_name and pop2010 properties
        var cdName = hoveredFeature.properties.cd_name
        var population_2010 = hoveredFeature.properties.pop2010

        // inject these values into the sidebar
        $('.cdname').text(cdName)
        $('.population').text(`2010 Population: ${numeral(population_2010).format('0.00a')}`)

        // set this lot's polygon feature as the data for the highlight source
        map.getSource('highlight-feature').setData(hoveredFeature.geometry);
      }
    })

    // when the user hovers over our nyc-cd layer make the mouse cursor a pointer
    map.on('mouseenter', 'nyc-cd', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'nyc-cd', () => {
      map.getCanvas().style.cursor = ''
    })

    // add a click listener for buttons in the sidebar.  On click, fly the map to a specific view
    $('.fly-button').on('click', function() {
      // get the 'cd' from the data-cd
      var cd = $(this).data('cd').toString()


      if (cd === 'reset') {
        // fly to the initial center and zoom
        map.flyTo({
          center: INITIAL_CENTER,
          zoom: INITIAL_ZOOM
        })

        // disable the reset button
        $('.reset-button').prop("disabled", true)

        // reset the info container to its default values and show it
        $('.cdname').text('Click a district for more information')
        $('.population').text('')
        $('.info-container').show()

        // show the choropleth layer
        map.setLayoutProperty('nyc-cd', 'visibility', 'visible')
      } else {

        // get the geometry for the specified district, set the hightlight source
        var geom = getGeometry(cd)
        map.getSource('highlight-feature').setData(geom);

        // enable the reset button
        $('.reset-button').removeAttr("disabled")
        // hide the info container
        $('.info-container').hide()

        // hide the chorpleth layer
        hideChoroplethLayer()

        // fly the map to the correct location
        switch(cd) {
          case '306':
            map.flyTo({
              center: [-73.991631, 40.677715],
              zoom: 13
            })

            break;
          case '101':
            map.flyTo({
              center: [-74.005854,40.712484],
              zoom: 13
            })

            break;
          case '202':
            map.flyTo({
              center: [-73.882646,40.810616],
              zoom: 13
            })

            break;
        }
      }
    })
  })
})
