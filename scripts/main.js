// NOTE: REMOVE TOKEN BEFORE PUTTING ON PUBLIC REPO!!!
var apiToken = "pk.eyJ1IjoibXVyc3Rlcjk3MiIsImEiOiJjamxsNHA1MDcwcjNxM3BuZGkxb2pzYmxvIn0.ZQkVI5WPeqK4hLjtFrCBIQ";

var Worldmap, geojson

var countryNames = [];
var countryCodes = {};

// serial killer data
getSerialKillerData();
var countries = {};
var maxVictims = 0;

// required to use functions in p5.js
function setup(){}
function draw(){}

window.onload = function(){
    getCountryNames();
    countryKillers();
    createMap();
}

function createMap(){
    mapboxgl.accessToken = apiToken;

    var Worldmap = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/murster972/cjlnle0093vz82rmhw4f3e5gh',
        // style: "mapbox://styles/murster972/cjlnlg0cd6c332ro3vjk5v5t8",
        // style: "mapbox://styles/murster972/cjlnljjlf46lo2spj27s4z041",
        // style: "mapbox://styles/murster972/cjlnljnrb46cz2rmtgd787knq",
        center: [-65.017, -16.457],
        pitch: 30,
        zoom: 1,
        maxZoom: 5,
        minZoom: 1,
        attributionControl: false,
        // stops user being able to scroll map when at edge, also stops map from going of screen
        // and having white bar appear at top of screen
        maxBounds: [
            [-180, -90],
            [180, 80]
        ]
    });


    Worldmap.on("load", function(){
        // remove all default labels from map
        Worldmap.style.stylesheet.layers.forEach(function(layer) {
            if (layer.type === 'symbol') {
                Worldmap.removeLayer(layer.id);
            }
        });

        // polgon test
        // console.log(countryPolygons);
        for(let ind = 0; ind < 255; ind++){
            let cInfo = countryPolygons["features"][ind];
            let cName = cInfo["properties"]["ADMIN"];
            let polygon = cInfo["geometry"]["coordinates"];
            let type = cInfo["geometry"]["type"];

            if(!(cName in countries) || countries[cName]["victim count"] == 0) continue;

            // maps victim count to red value
            // from 10 and not 0 to prevent black bg on countries with killers
            let red_val = map(countries[cName]["victim count"], 0, maxVictims, 10, 255);

            Worldmap.addLayer({
                'id': cName,
                'type': 'fill',
                'source': {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': type,
                            'coordinates': polygon
                        }
                    }
                },
                'paint': {
                    // rgb(184,49,47)
                    'fill-color': 'rgb('+ red_val.toString() +', 0, 0)',
                    'fill-opacity': 1
                }
            });
        }
    })

    // https://www.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
    // adding customer markers, see link above for details
    geojson = {"type": "FeatureCollection", "features" :[]};

    for(let c of countryCentroids){
        let name = c["country"];
        let lat = parseInt(c["lat"]);
        let lng = parseInt(c["lng"]);

        // skip countries that have no killers or dont exsist in countries keys;
        if(!(name in countries) || countries[name]["victim count"] == 0) continue;

        geojson["features"].push({
           "countryName": name,
           "countryCode": countryCodes[name],
           "killers": countries[name]["killer names"],
           "victim count": countries[name]["victim count"],
           "killer count": countries[name]["killer count"],
           "type": "Feature",
           "properties": {
               "description": countries[name]["killer names"],
               "iconSize": [20, 20]
           },
           "geometry": {
               "type": "Point",
               "coordinates": [
                   lng,
                   lat
               ]
           }
       })
    }

    // add customer markers to map
    geojson.features.forEach(function(marker){
        let info = "";

        let flagUrl = "images/flags/" + marker["countryCode"].toLowerCase()  + ".svg";


        for(let killer of marker["killers"]){
            let i = killersInfo[killer]

            console.log(i["imageURL"])

            let d = "<div class='killerInfo'>\
                        <img class='img' src='" + i["imageURL"] +"'>\
                        <h2>" + killer + "</h2>\
                        <h3>Proven Victims: " + i["Proven Victims"].toString() + "</h3>\
                        <h3>Active: " + i["Years Active"]["start"].toString() + " to " + i["Years Active"]["end"].toString() + "</h3>\
                        <p>" + i["notes"] + "</p>\
                    </div>"
            info += d;
        }

        // info for on click
        let expandDiv = "<div class='popup'>\
            <h3>" + marker["countryName"] + " Victim Count: " + marker["victim count"] + "</h3>\
            <h3>" + marker["countryName"] +" Number of Killers: " + marker["killer count"] + "</h3>\
            " + info + "\
        </div>"

        // create div container for marker
        let div = document.createElement("div");
        div.className = "countryInfo";
        div.innerHTML = "<div class='countryTitle'>" + marker["countryName"] + "<img class='flag' src='" + flagUrl + "'></div>" + expandDiv

        // add div to map
        new mapboxgl.Marker(div).setLngLat(marker.geometry.coordinates).addTo(Worldmap);
    })

    // // pop ups on custom markers
    // for(let c of countryNames){
    //     map.on("click", c, function(e){
    //         console.log(e);
    //     })
    // }
}

/* extracts country names from country_info.js */
function getCountryNames(){
    for(let i = 0; i < country_info["ref_country_codes"].length; i++){
        let country = country_info["ref_country_codes"][i]["country"];
        countryNames.push(country);
        countryCodes[country] = country_info["ref_country_codes"][i]["alpha2"];
    }
}

// sorts killers into countries and gets max victims
function countryKillers(){
    // init country object with country names as jeys
    for(let i = 0; i < countryNames.length; i++){
        let name = countryNames[i];
        countries[name] = {"victim count": 0, "killer count": 0, "killer names": []};
    }

    for(let i = 0; i < killerNames.length; i++){
        let name = killerNames[i]
        let info = killersInfo[name];

        for(let c of info["countries"]){
            if(!(c in countries)) continue;
            countries[c]["victim count"] += info["Proven Victims"];
            countries[c]["killer count"] ++;
            countries[c]["killer names"].push(name);

        }
    }

    for(let c of countryNames){
        let v = countries[c]["victim count"];
        if(v > maxVictims) maxVictims = v;
    }
}
