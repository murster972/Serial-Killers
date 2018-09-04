/* uses wiki api to fetch stats about serial killers */

const numberOfSections = 4;

var killerNames = [];
var killersInfo = {};

function getSerialKillerData(){
    url = "https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=List_of_serial_killers_by_number_of_victims&callback=?&section=";

    // gets each section from wiki page https://en.wikipedia.org/wiki/List_of_serial_killers_by_number_of_victims#Serial_killers_with_the_highest_known_victim_count
    for(let section = 1; section <= numberOfSections; section++){
        let d = getWikiData(url + section);
    }
}

function getImage(){

    //BUG: the SHITE fucking code below is unable to send and recv a response to/from wiki api
    //     to get the json data.
    // $.ajax({
    //     type: "GET",
    //     url: "http://en.wikipedia.org/w/api.php?action=query&titles=Ted Bundy&prop=pageimages&format=json",
    //     contentType: "application/json; charset=utf-8",
    //     async: true,
    //     dataType: "json",
    //     success: function(d, textStatus, jqXHR){
    //         console.log(d);
    //     },
    //     error: function(err){
    //         console.log("error", err);
    //     }
    // })
}

function getWikiData(url){
    $.ajax({
        type: "GET",
        url: url,
        contentType: "application/json; charset=utf-8",
        async: false,
        dataType: "json",
        success: function(d, textStatus, jqXHR){
            let data = d.parse.text["*"];
            parseWikiResults(data);
            // return parsed;
        },
        error: function(err){
            console.log("error", err);
        }
    })
}

/* get data from tables in data */
function parseWikiResults(data){
    let lines = data.split("\n");

    let tableRows = [];
    let tableData = [];

    let isTr = false;

    // gets table rows from html
    for(let i = 0; i < lines.length; i++){
        if(lines[i].includes("<tr>")){
            isTr = true;
        } else if(lines[i].includes("</tr>")){
            isTr = false;
        } else if(isTr){
            tableRows.push(lines[i]);
        }
    }

    // var killersInfo = {};
    // var killerNames = [];
    let cols = [];

    let colCount = 0;

    count = 0;

    // gets data (td) from table rows (tr)
    // for each serial killer
    // 6 cols per row
    for(let i = 0; i < tableRows.length; i++){
        // if(lines[i] == undefined) continue;

        if(colCount == 6){
            // COLUMN: name
            let nameTD = cols[0]

            // get name from within anchor tag in format <td><a...></a></td>.
            // find closing anchor tag
            let anchorClosingInd = nameTD.indexOf("</a>");

            // work backwards from closing anchor closing arrow of opening anchor tag, e.g. the > of <a..>
            let name = [];

            for(let i = anchorClosingInd - 1; nameTD[i] != ">"; i--){
                name.push(nameTD[i]);
            }

            // reverse name and convert to string
            name = name.reverse().join("");

            killerNames.push(name);
            killersInfo[name] = {};

            // COLUMN: country
            let countryTD = cols[1].split(">");
            let countries = [];

            // get countries from title attributes
            inTitle = 0;

            for(let i = 0; i < countryTD.length; i++){
                let item = countryTD[i];

                if(item.includes("title=")){
                    let tmp = item.split('"');
                    let country = tmp[tmp.length - 2].replace("Soviet Union", "Russia");
                    countries.push(country);
                }
            }

            killersInfo[name]["countries"] = countries


            // COLUMN: years active
            let yearsActiveTD = cols[2];
            let yearsActiveTxt = "";

            // get text from within td tag - i = 4 to skip opening <td>
            for(let i = 4; yearsActiveTD[i] != "<"; i++){
                yearsActiveTxt += yearsActiveTD[i];
            }

            let tmp = yearsActiveTxt.replace("?", "").split(" to ");
            let yearsActive = {"start": parseInt(tmp[0]), "end": parseInt(tmp[1])};

            killersInfo[name]["Years Active"] = yearsActive;

            // COLUMN: proven victims
            let provenVictsTD = cols[3];
            let provenVicts = provenVictsTD.substring(4, provenVictsTD.length - 5);

            killersInfo[name]["Proven Victims"] = parseInt(provenVicts);

            // COLUMN: possible victims
            let possibleVictsTD = cols[4];

            // COLUMN: notes
            let notesTD = cols[5].substring(4, cols[5].length);

            killersInfo[name]["notes"] = notesTD;

            colCount = 0;
            cols = [];
        }

        if(lines[i].includes("<td>")){
            cols.push(lines[i])
            colCount++;
            count++;
        }
    }
}
