let loadMap = countryDetails => {

    const countryData = JSON.parse(countryDetails);
    let svg = loadSvg();
    let path = d3.geoPath().projection(d3.geoMercator());
    let tooltip = loadTooltip();
    let gElement = svg.append("g").attr("id", "g-element").selectAll("path").data(topojson.feature(countryData, countryData.objects.countries1).features).enter().append("path").attr("name", (d, i) => countryData.objects.countries1.geometries[i].properties.name).attr("class", "pathWithBorder").attr("fill", d => getRandomFillColor()).attr("d", path);

    let pElement = svg.append("g");
    let zoomed = () => {
        gElement.attr("transform", d3.event.transform);
        pElement.attr("transform", d3.event.transform);
    };
    let screenWidth = Math.max(1080 || document.documentElement.clientWidth, window.innerWidth);
    let screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    loadNewCountry(countryData, svg, gElement, pElement, 0, 1, []);

};

let loadSvg = () => {
    return d3.select("#svg-holder").append("svg").attr("class", "game-area-svg");
};
/** Return tooltip that will show information about a rectangle when it is hovered.*/
let loadTooltip = () => {
    return d3.select("body").append("div").style("visibility", "hidden").attr("id", "tooltip");
};
let loadNewCountry = (countryData, svg, gElement, pElement, points, questionNo, alreadyDisplayedCountry) => {
    if (questionNo > getTotalQuestions()) {

        Swal.fire({
            icon: 'success',
            title: 'Would you like to<br/><a href="https://tapmap.simpledzn.com/africa"><button class="sweet2">PLAY AGAIN</button></a><br/>' +
                '<a href="https://tapmap.simpledzn.com"><button class="sweet2">STUDY OTHER CONTINENTS</button></a>',
        })
        return;
    }


    updateQuestionsLeft(questionNo);
    resetAttemptsLeft();
    updateCompletionIndicator(questionNo);
    alterBackgroundGradient(questionNo);
    let noOfAttempts = 0;
    let countryName = getUniqueRandomCountryName(countryData, alreadyDisplayedCountry);
    alreadyDisplayedCountry.push(countryName);
    hideCountryRegionArc();
    showCountryName(countryName);
    d3.select("#tooltip").style("visibility", "hidden");

    let timeForQuestion = 10;
    var timeCounterInterval = setTimeCounterInterval(timeForQuestion);
    setTimeout(() => {
        if (noOfAttempts < 2) {
            stopInterval(timeCounterInterval, noOfAttempts);
            // playWrongAnswerAudio();
            showXMark();
            showCorrectAnswerAndLoadNewCountry(countryData, svg, gElement, pElement, points, questionNo + 1, alreadyDisplayedCountry, countryName);
        }
    }, timeForQuestion * 1000);

    let userSelectedLastChoice;
    let userHoveredLastChoice;
    gElement.on("click", (d, i, nodes) => {
        noOfAttempts++;
        updateAttemptsLeft(noOfAttempts);
        let userSelectedCountry = nodes[i]; // nodes[i] refer to the clicked element
        removeOldColorOnUserSelectedCountry(userSelectedLastChoice);
        removeOldColorOnUserHoverCountry(userHoveredLastChoice);

        userSelectedLastChoice = userSelectedCountry;
        if (noOfAttempts === 1)
            showCountryRegionArc(countryData, countryName, pElement, noOfAttempts); else if (noOfAttempts === 2) {
            hideCountryRegionArc();
            showCountryRegionArc(countryData, countryName, pElement, noOfAttempts);
        }
        addColorOnUserSelectedCountry(userSelectedCountry);
        showTooltip(d3.select(userSelectedCountry).attr("name"));
        let screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        if (screenWidth <= 980) {
            setTimeout(() => {
                hideTooltip();
            }, 800);
        }
        if (d3.select(userSelectedCountry).attr("name") === countryName) {
            stopInterval(timeCounterInterval, noOfAttempts);
            points = points + 30 - 20 * (noOfAttempts - 1);
            updatePoints(points);
            removeOldColorOnUserSelectedCountry(userSelectedCountry); // removing present choice
            noOfAttempts = 2;
            showCorrectAnswerAndLoadNewCountry(countryData, svg, gElement, pElement, points, questionNo + 1, alreadyDisplayedCountry, countryName);

            return;
        }

        if (areAllAttemptsExhausted(noOfAttempts)) {
            stopInterval(timeCounterInterval, noOfAttempts);
            removeOldColorOnUserSelectedCountry(userSelectedCountry);
            noOfAttempts = 2;
            showXMark();
            showCorrectAnswerAndLoadNewCountry(countryData, svg, gElement, pElement, points, questionNo + 1, alreadyDisplayedCountry, countryName);
        }

    });
    gElement.on("mouseover", (d, i, nodes) => {
        let userHoverCountry = nodes[i]; // nodes[i] refer to the clicked element
        addColorOnUserHoverCountry(userHoverCountry);
        if (noOfAttempts === 1) {
            let userHoverCountryName = d3.select(userHoverCountry).attr("name");
            showTooltip(userHoverCountryName);
        }
        userHoveredLastChoice = userHoverCountry;
    });
    gElement.on("mouseout", d => {
        hideTooltip();
        removeOldColorOnUserHoverCountry(userHoveredLastChoice);
    });
};


let showCorrectAnswerAndLoadNewCountry = (countryData, svg, gElement, pElement, points, questionNo, alreadyDisplayedCountry, countryName) => {
    stopAllMousePointerEvents();
    highlightCorrectAnswer(countryName, countryData);
    setTimeout(() => {
        hideXMark();
        resumeAllMousePointerEvents();
        loadNewCountry(countryData, svg, gElement, pElement, points, questionNo, alreadyDisplayedCountry);
    }, 500);
};

let highlightCorrectAnswer = (countryName, countryData) => {
    for (let i = 0; i < 12; i++) {
        if (countryData.objects.countries1.geometries[i].properties.name === countryName) {
            let correctAnswerElement = d3.select("#g-element").selectAll("path").filter(d => d.properties.name === countryName);
            correctAnswerElement.classed('blinking-effect', true);
            let darkColorInterval = setInterval(() => {
                correctAnswerElement.attr("fill", "#fff1a0");
            }, 250);
            let lightColorInterval = setInterval(() => {
                correctAnswerElement.attr("fill", "#ffffff");
            }, 500);
            setTimeout(() => {
                clearInterval(darkColorInterval);
                clearInterval(lightColorInterval);
                correctAnswerElement.classed('blinking-effect', false);
                addColorOnCorrectCountry(correctAnswerElement);
            }, 1000);

            break;
        }
    }
};

let getUniqueRandomCountryName = (countryData, alreadyDisplayedCountry) => {
    let noOfCountries = countryData.objects.countries1.geometries.length;
    let randomCountrySNo = getRandomInteger(noOfCountries);
    // let knownCountryBuffer = [1, 3, 5, 8, 10, 15, 18, 23, 25, 28, 31, 35, 38, 40, 42, 45, 48, 50];
    let knownCountryBuffer = [1, 3, 5, 8, 10, 12];
    if (getRandomInteger(20) % 2 === 0)
        randomCountrySNo = knownCountryBuffer[getRandomInteger(knownCountryBuffer.length)];
    let countryName = countryData.objects.countries1.geometries[randomCountrySNo].properties.name;
    if (alreadyDisplayedCountry.includes(countryName))
        return getUniqueRandomCountryName(countryData, alreadyDisplayedCountry);

    return countryName;
};
let getRandomInteger = maxOfRange => {
    return Math.floor(Math.random() * Math.floor(maxOfRange));
};
let showCountryName = countryName => {
    d3.select("#country-name").text(countryName);
};
let hideCountryRegionArc = () => {
    d3.select(".country-region").remove();
};
let showCountryRegionArc = (countryData, countryName, pElement, noOfAttempts) => {
    for (let i = 0; i < 54; i++) {
        if (countryData.objects.countries1.geometries[i].properties.name === countryName) {
            let arcData = countryData.objects.countries1.geometries[i].arcs;
            let arcDataTemplate = JSON.parse(`{"type":"GeometryCollection","geometries":[{"arcs":[[${arcData}]],"type":"Polygon"}]}`);
            let path = d3.geoPath().projection(d3.geoMercator());
            let centroids = topojson.feature(countryData, arcDataTemplate).features.map(feature => {
                return path.centroid(feature);
            });

            // Smaller arc
            let arcInnerRadius = 50;
            let arcOuterRadius = 52;
            let errorRange = 30;
            let screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            if (noOfAttempts === 1 && screenWidth >= 720) {
                arcInnerRadius = 40;
                arcOuterRadius = 42;
            } else if (noOfAttempts === 1 && screenWidth < 720) {
                arcInnerRadius = 30;
                arcOuterRadius = 32;
                errorRange = 25;
            }

            let arc = d3.arc().innerRadius(arcInnerRadius).outerRadius(arcOuterRadius);
            let errorX = getRandomInteger(errorRange);
            let errorY = getRandomInteger(errorRange);
            errorX *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
            errorY *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;

            let sector = pElement.append("path").attr("fill", "white").attr("class", "country-region").attr("stroke-width", 1).attr("stroke", "darkslategray").attr("d", arc({
                startAngle: 0,
                endAngle: 2 * Math.PI
            })).attr("transform", `translate(${centroids[0][0] + errorX},${centroids[0][1] + errorY})`);

            break;
        }
    }

};
let addColorOnUserSelectedCountry = userSelectedCountry => {
    d3.select(userSelectedCountry).classed('wrong-choice-effects', true);
};
let removeOldColorOnUserSelectedCountry = userSelectedLastChoice => {
    d3.select(userSelectedLastChoice).classed('wrong-choice-effects', false);
};
let addColorOnUserHoverCountry = userHoverCountry => {
    d3.select(userHoverCountry).classed('choice-hover-effects', true);
};
let removeOldColorOnUserHoverCountry = userHoverLastChoice => {
    d3.select(userHoverLastChoice).classed('choice-hover-effects', false);
};
let addColorOnCorrectCountry = userSelectedCountry => {
    userSelectedCountry.classed('correct-choice-effects', true);
};
let updatePoints = points => {
    d3.select("#points").text(points);
};
let updateQuestionsLeft = qno => {
    d3.select("#questions").text(10 - qno);
};
let updateAttemptsLeft = attemptNo => {
    d3.select("#attmepts").text(2 - attemptNo);
};
let resetAttemptsLeft = () => {
    d3.select("#attmepts").text(2);
};
let updateTimeLeft = timeLeft => {
    d3.select("#time").text(timeLeft);
};
let areAllAttemptsExhausted = noOfAttempts => {
    if (noOfAttempts === 2)
        return true;

    return false;
};
let showTooltip = userHoverCountryName => {
    d3.select("#tooltip").style("visibility", "visible").style("left", `${d3.event.pageX + 10}px`).style("top", `${d3.event.pageY - 25}px`).html(userHoverCountryName);
};
let hideTooltip = () => {
    d3.select("#tooltip").style("visibility", "hidden");
};

let getRandomFillColor = () => {
    // let earthFillColor = ["#ffffffdb", "#ffffffde", "#ffffffe3", "#ffffffe6", "#ffffffe8", "#ffffffeb", "#ffffffed", "#ffffffdb", "#ffffffde", "#ffffff0" ];
    let earthFillColor = ["#ffffff38", "#ffffff38", "#ffffff38", "#ffffff38", "#ffffff38", "#ffffff38", "#ffffff38", "#ffffff38", "#ffffff38", "#ffffff38" ];
    return earthFillColor[getRandomInteger(8)];
};

let setTimeCounterInterval = timeForQuestion => {
    let timeLeft = timeForQuestion - 1;
    let timeCounter = setInterval(() => {
        updateTimeLeft(timeLeft);
        timeLeft--;
    }, 800);

    return timeCounter;
};
let stopInterval = async (timeCounter, noOfAttempts) => {
    clearInterval(timeCounter);
};
let updateCompletionIndicator = questionNo => {
    let totalQuestions = getTotalQuestions();
    d3.select("#completion-indicator").style("width", `${questionNo / totalQuestions * 100}%`);
};
let getTotalQuestions = () => {
    return 10;
};
let alterBackgroundGradient = questionNo => {
    if (questionNo % 2 == 0) {
        d3.select("body").classed('addLightGradient', false);
        d3.select("body").classed('addDarkGradient', true);
    } else {
        d3.select("body").classed('addDarkGradient', false);
        d3.select("body").classed('addLightGradient', true);
    }
};

let stopAllMousePointerEvents = () => {
    d3.select("#svg-holder").classed('stop-pointer-events', true);
};

let resumeAllMousePointerEvents = () => {
    d3.select("#svg-holder").classed('stop-pointer-events', false);
};

let showXMark = () => {
    d3.selectAll("#x-mark-holder").classed('show-display', true);
    d3.selectAll("#x-mark-holder").classed('hide-display', false);
};
let hideXMark = () => {
    d3.selectAll("#x-mark-holder").classed('show-display', false);
    d3.selectAll("#x-mark-holder").classed('hide-display', true);
};
