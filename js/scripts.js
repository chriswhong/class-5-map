mapboxgl.accessToken = 'pk.eyJ1IjoiY3dob25nIiwiYSI6IjAyYzIwYTJjYTVhMzUxZTVkMzdmYTQ2YzBmMTM0ZDAyIn0.owNd_Qa7Sw2neNJbK6zc1A';

var map = new mapboxgl.Map({
  container: 'mapContainer', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [-73.992313,40.678211], // starting position [lng, lat]
  zoom: 9.3 // starting zoom
});


map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
  })
);


map.on('style.load', function () {

  // we need to load the data manually because our population properties are strings and not numbers!!!
  $.getJSON('data/districts-with-population.geojson', function(featureCollection) {

    // iterate over each feature in the FeatureCollection and convert the pop2010 property to a number
    featureCollection.features.forEach(function(feature) {
      feature.properties.pop2010 = parseInt(feature.properties.pop2010)
    })

    console.log(featureCollection)
    console.log('hello')

    console.log('style loaded')
    // override the fill color of the water layer
    map.setPaintProperty('water', 'fill-color', '#c9f4ff');

    // add a geojson source
    map.addSource('nyc-cd', {
      type: 'geojson',
      data: featureCollection
    });

    // add a layer to style and display the source
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

    // add an empty data source, which we will use to highlight the lot the user is hovering over
    map.addSource('highlight-feature', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    // add a layer for the highlighted lot
    map.addLayer({
      id: 'highlight-line',
      type: 'line',
      source: 'highlight-feature',
      paint: {
        'line-width': 2,
        'line-opacity': 0.9,
        'line-color': 'white',
      }
    });


    // listen for a click on the map and show info in the sidebar
    map.on('click', function(e) {
      // query for the features under the mouse, but only in the lots layer
      var features = map.queryRenderedFeatures(e.point, {
          layers: ['nyc-cd'],
      });

      if (features.length > 0 ) {
        var hoveredFeature = features[0]
        var cdName = hoveredFeature.properties.cd_name

        var population_2010 = hoveredFeature.properties.pop2010

        $('.cdname').text(cdName)
        $('.population').text(numeral(population_2010).format('0.00a'))

        // set this lot's polygon feature as the data for the highlight source
        map.getSource('highlight-feature').setData(hoveredFeature.geometry);

      }
    })

    // add a click listener for buttons in the sidebar.  On click, fly the map to a specific view
    $('.flyButton').on('click', function() {
      var cd = $(this).data('cd')

      switch(cd) {
        case 'bk-6':
          map.flyTo({
            center: [-73.979559, 40.676282],
            zoom: 12
          })

          map.setLayoutProperty('nyc-cd', 'visibility', 'none');
          break;
        case 'mn-1':
          // code block
          break;
        case 'bx-2':
          // code block
          break;
        case 'reset':
          map.flyTo({
            center: [-73.992313,40.678211],
            zoom: 9.3
          })

          map.setLayoutProperty('nyc-cd', 'visibility', 'visible');
          break;
        default:
          // code block
      }

    })
  })

})
