// if you want to import a module from shared/js then you can
// just do e.g. import Scatter from "shared/js/scatter.js"
import * as d3 from 'd3'
import {
    $,
    $$
} from 'shared/js/util'

import * as topojson from 'topojson'
import statesTopo from 'us-atlas/counties-10m.json'
import bubbleData from 'shared/server/data_joined.json'


let moodIndex = 0;
var bidenTotal = 218;
var trumpTotal = 125;


// Load data, return individual states, groups & initial bar counts
async function loadData() {
    // fetch data from url, get state groupings
    const sheetData = await fetch('https://interactive.guim.co.uk/docsdata-test/1xxtoiJ5Rn1cVXwynMgJyGr4Cd40znZoI9RYiMj_rMe0.json')
        .then(res => res.json())
    const data = sheetData.sheets.state_cards.filter(data => data.type);
    return data
}


// Plot intial bar & map, create state groups & cards, on button clicks update bar & map
loadData().then(data => {
    createCards(data)
})



const bidenCol = '#25428f'
const trumpCol = '#cc0a11'

// Bar setup

// 270 majority finish line
const finish = d3.select('.elex-votes')
    .append('div')
    .attr("class", 'elex-votes-finishline')
    .attr('width', (270 / 540 * 100) + "%");

finish
    .append('div')
    .attr("class", "elex-votes-finish-label")
    .text("270 to win");

finish
    .append('div')
    .attr("class", "elex-votes-finish-label elex-votes-finish-label-overlay")
    .text("270 to win");



// Create state groups & cards
function createCards(data) {

    var statesInUse = data.filter(d => d.groups_in_use)
    const stateGroups = data.filter(d => d.type == "group")
    var allStates = data.filter(d => d.type == "individual")

    const trumpTotal = allStates.filter(d => d.candidate_select === 'trump')
        .map(d => Number(d.ecvs)).reduce(sum, 0)

    const bidenTotal = allStates.filter(d => d.candidate_select === 'biden')
        .map(d => Number(d.ecvs)).reduce(sum, 0)

    // update the elements on the page
    const bidenEcvElement = $(".biden-title-count")
    const trumpEcvElement = $(".trump-title-count")

    bidenEcvElement.innerHTML = bidenTotal;
    trumpEcvElement.innerHTML = trumpTotal;

    // update graphic
    const bidenBar = $(".bar-votes__biden");
    const trumpBar = $(".bar-votes__trump");

    trumpBar.style.width = (trumpTotal / 538 * 100) + "%";
    bidenBar.style.width = (bidenTotal / 538 * 100) + "%";

    const groupIds = stateGroups.map(function (el) {
        return el.group_id;
    })

    function sum(a, b) {
        return a + b;
    }

    // Get previous totals
    function getPreviousTotals() {
        const prevTrumpTotal = allStates.filter(d => d.candidate_select === 'trump')
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        const prevBidenTotal = allStates.filter(d => d.candidate_select === 'biden')
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        console.log(prevTrumpTotal, prevBidenTotal)

        return [prevTrumpTotal, prevBidenTotal]
    }


    function updateTotals(prevTotals) {

        const newTrumpTotal = allStates.filter(d => d.candidate_select === 'trump')
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        const newBidenTotal = allStates.filter(d => d.candidate_select === 'biden')
            .map(d => Number(d.ecvs)).reduce(sum, 0)


        const finishCard = d3.select('.finish-card')

        updateElexBarGraphic(newBidenTotal, newTrumpTotal, prevTotals[1], prevTotals[0])

        if ((newBidenTotal >= 270) || (newTrumpTotal >= 270) || (newBidenTotal == newTrumpTotal && newBidenTotal == 269)) {
            showFinishCard(newBidenTotal, newTrumpTotal, allStates)
        } else {
            finishCard.style("display", "none")
        }
    }


    function showFinishCard(votesBiden, votesTrump, allStates) {
        // remove old reset button
        const oldResetButton = $('.reset-button-div')
        if (oldResetButton != null) {
            oldResetButton.innerHTML = ""
        }
        // Get arrays of state selections
        const trumpStates = allStates.filter(d => d.candidate_select === 'trump').map(function (el) {
            return el.state;
        })

        const bidenStates = allStates.filter(d => d.candidate_select === 'biden').map(function (el) {
            return el.state;
        })


        const blueWall = ['Michigan', 'Pennsylvania', 'Wisconsin']
        const swings = ['Ohio', 'Iowa', 'Florida', 'North Carolina']
        const formerGOP = ['Arizona', 'Georgia', 'Texas']

        const bidenBlueWall = allStates.filter(d => blueWall.includes(d.state) && d.candidate_select === 'biden').map(function (el) {
            return el.state
        })

        const bidenSwings = allStates.filter(d => swings.includes(d.state) && d.candidate_select === 'biden').map(function (el) {
            return el.state
        })

        const bidenGOP = allStates.filter(d => formerGOP.includes(d.state) && d.candidate_select === 'biden').map(function (el) {
            return el.state
        })

        const trumpBlueWall = allStates.filter(d => blueWall.includes(d.state) && d.candidate_select === 'trump').map(function (el) {
            return el.state
        })

        const trumpSwings = allStates.filter(d => swings.includes(d.state) && d.candidate_select === 'trump').map(function (el) {
            return el.state
        })

        // Custom copy
        d3.select('.finish-winner-name')
            .text(votesBiden > votesTrump ? 'Biden' : 'Trump')


        d3.select('.finish-biden-win')
            .style('display', votesBiden > votesTrump ? 'block' : 'none')
            .html(bidenBlueWall.length == 3 && bidenSwings.length < 2 && bidenGOP.length == 0 ? "You said Biden would win back the blue wall of <b>Michigan</b>, <b>Wisconsin</b> and <b>Pennsylvania</b>, taking him over the majority to victory." : (
                bidenBlueWall.length == 3 && bidenSwings.length >= 2 && bidenGOP.length == 0 ? "You said Biden would win back the blue wall of <b>Michigan</b>, <b>Wisconsin</b> and <b>Pennsylvania</b>, as well as the key swing states of <b>" + (bidenSwings.slice(0, -1).join(', ') + '</b> and <b>' + bidenSwings.slice(-1)) + "</b> to take him over the majority to victory." : (
                    bidenBlueWall.length == 3 && bidenGOP.length == 1 ? "You said Biden would win back the blue wall of <b>Michigan</b>, <b>Wisconsin</b> and <b>Pennsylvania</b> and take the former Republican stronghold of <b>" + bidenGOP + "</b> to win the presidency." : (
                        bidenBlueWall.length == 3 && bidenGOP.length > 1 ? "You said Biden would win back the blue wall of <b>Michigan</b>, <b>Wisconsin</b> and <b>Pennsylvania</b> and take the former Republican strongholds of <b>" + (bidenGOP.slice(0, -1).join(', ') + '</b> and <b>' + bidenGOP.slice(-1)) + "</b> to win the presidency." : (
                            bidenBlueWall.length == 2 && bidenSwings.length <= 1 && bidenGOP.length == 0 ? "You said Biden would win back <b>" + (bidenBlueWall.slice(0, -1).join(', ') + '</b> and <b>' + bidenBlueWall.slice(-1)) + "</b> to take him over the majority to victory." : (
                                bidenBlueWall.length == 2 && bidenSwings.length > 1 && bidenGOP.length == 0 ? "You said Biden would win back <b>" + (bidenBlueWall.slice(0, -1).join(', ') + '</b> and <b>' + bidenBlueWall.slice(-1)) + "</b> as well as winning the swing states of <b> " + (bidenSwings.slice(0, -1).join(', ') + '</b> and <b>' + bidenSwings.slice(-1)) + "</b> to take him over the majority to victory." : (
                                    bidenBlueWall.length == 2 && bidenGOP.length == 1 ? "You said Biden would win back <b>" + (bidenBlueWall.slice(0, -1).join(', ') + '</b> and <b>' + bidenBlueWall.slice(-1)) + "</b> and would take the former Republican stronghold of <b> " + bidenGOP + "</b> to take him over the majority to victory." : (
                                        bidenBlueWall.length == 2 && bidenGOP.length > 1 ? "You said Biden would win back <b>" + (bidenBlueWall.slice(0, -1).join(', ') + '</b> and <b>' + bidenBlueWall.slice(-1)) + "</b> and would take the former Republican strongholds of <b> " + (bidenGOP.slice(0, -1).join(', ') + '</b> and <b>' + bidenGOP.slice(-1)) + "</b> to win the presidency." : ""))))))))

        d3.select('.finish-trump-win')
            .style('display', votesBiden < votesTrump ? 'block' : 'none')
            .html(trumpBlueWall.length == 3 && trumpSwings.length < 2 ? 'You said Trump would retain the now truly broken "blue wall" of <b>Michigan</b>, <b>Wisconsin</b> and <b>Pennsylvania</b>, taking him over the majority to victory.' : (
                trumpBlueWall.length == 3 && trumpSwings.length >= 2 ? 'You said Trump would retain the now truly broken "blue wall" of <b>Michigan</b>, <b>Wisconsin</b> and <b>Pennsylvania</b>, as well as the key swing states of <b>' + (trumpSwings.slice(0, -1).join(', ') + '</b> and <b>' + trumpSwings.slice(-1)) + "</b> to win the presidency." : (
                    trumpBlueWall.length < 3 && trumpBlueWall.length > 1 ? 'You said Trump would retain <b>' + (trumpBlueWall.slice(0, -1).join(', ') + '</b> and <b>' + trumpBlueWall.slice(-1)) + "</b> and win the swing states of <b> " + (trumpSwings.slice(0, -1).join(', ') + '</b> and <b>' + trumpSwings.slice(-1)) + "</b> to take him over the majority to victory." : "")))


        // Win scenarios
        d3.select('.finish-card')
            .style('display', "block")


        d3.select('.finish-headline-win')
            .style('display', votesBiden == votesTrump ? "none" : "block")
            .style('opacity', 1)
            .select('.finish-headline__status')
            .style('color', votesBiden > votesTrump ? bidenCol : trumpCol)
            .transition()
            .text(votesBiden > votesTrump ? 'Joe Biden' : 'Donald Trump')

        // Tie scenario
        d3.select('.finish-headline-tie')
            .style("display", votesBiden == votesTrump ? "block" : "none")

        d3.select('.finish-tie-text')
            .style("display", votesBiden == votesTrump ? "inline" : "none")

        // Portraits
        d3.select('.biden-win-portrait')
            .style("display", isMobile() ? "none" : (votesBiden > votesTrump ? 'block' : 'none'));
        d3.select('.trump-win-portrait')
            .style("display", isMobile() ? "none" : (votesTrump > votesBiden ? 'block' : 'none'))
        // d3.select('.biden-win-portrait')
        //     .style("display", votesBiden > votesTrump ? 'block' : 'none');
        // d3.select('.trump-win-portrait')
        //     .style("display", votesTrump > votesBiden ? 'block' : 'none')

        // Reset button
        const resetButton = d3.select('.reset-button-div')
            .append('button')
            .text('Try again')
            .attr('id', 'reset-button')

        resetButton
            .on('click', function () {

                // get previous totals
                var prevTotals = getPreviousTotals()

                // select group & state buttons
                const groupButtons = $$('.group-candidate-button')
                const stateButtons = $$('.candidate-button')

                // remove 'selected' classes from buttons
                groupButtons.forEach(function (d) {
                    d.classList.remove("group-candidate-button--selected")
                })

                stateButtons.forEach(function (d) {
                    d.classList.remove("candidate-button--selected")
                })

                // reset 'candidate_select' for statesInUse
                statesInUse.forEach(function (d) {
                    allStates = allStates.map(s => {
                        if (d.state === s.state) {
                            return Object.assign({}, s, {
                                candidate_select: ""
                            })
                        } else {
                            return s
                        }
                    })
                })

                console.log(allStates)

                var originalBidenTotal = allStates.filter(d => d.candidate_select === 'biden')
                    .map(d => Number(d.ecvs)).reduce(sum, 0)

                var originalTrumpTotal = allStates.filter(d => d.candidate_select === 'trump')
                    .map(d => Number(d.ecvs)).reduce(sum, 0)

                // run update elex bar graphic
                updateElexBarGraphic(originalBidenTotal, originalTrumpTotal, prevTotals[1], prevTotals[0])

                // reset prevtotals 
                prevTotals = getPreviousTotals()

                // scroll to top - what about app? mobile different position?
                function topFunction() {
                    document.body.scrollTop = 450;
                    document.documentElement.scrollTop = 450;
                }

                topFunction()

                var trackingobject = {
                    component: "elex-preview-08-2020",
                    value: "reset-button-clicked"
                }

                if (window.guardian.ophan && window.guardian.ophan != undefined) {
                    window.guardian.ophan.record(trackingobject);
                } else {
                    console.log("can't find ophan")
                }
            })

        // Filled map

        const ME2 = allStates.filter(d => d.state === 'Maine 2nd congressional district').map(function (el) {
            return el.candidate_select;
        })

        const NE2 = allStates.filter(d => d.state === 'Nebraska 2nd congressional district').map(function (el) {
            return el.candidate_select;
        })

        // Map setup
        const statesFc = topojson.feature(statesTopo, statesTopo.objects.states)

        // 'fc' is short for 'FeatureCollection', you can log it to look at the structure
        const draw = () => {

            // $ is shorthand for document.querySelector
            // selects the SVG element
            const svgEl = $('.elex-map')

            svgEl.innerHTML = "";

            // get the SVG's width as set in CSS
            const width = svgEl.getBoundingClientRect().width
            const height = width * 0.66

            const svg = d3.select(svgEl)
                .attr('width', width)
                .attr('height', height)

            // set up a map projection that fits our GeoJSON into the SVG

            const proj = d3.geoAlbersUsa()
                .fitExtent([
                    [-55, 0],
                    [width, height]
                ], statesFc)

            const path = d3.geoPath().projection(proj)

            // Draw states

            const stateShapes = svg
                .selectAll('blah')
                .data(statesFc.features)
                .enter()
                .append('path')
                .style("fill", function (d) {
                    if (trumpStates.includes(d.properties.name) == true) {
                        return trumpCol
                    } else if (bidenStates.includes(d.properties.name) == true) {
                        return bidenCol
                    } else {
                        return "#f6f6f6"
                    }
                })
                .attr('d', path)
                .attr('class', 'elex-state')

            // Circles for Maine & Nebraska congressional disctrict votes
            const maineCoords = proj([-69.009649, 45.403030])

            svg
                .append("circle")
                .attr("cx", maineCoords[0])
                .attr("cy", maineCoords[1])
                .attr("r", isMobile() ? 4 : 8)
                .style("fill", ME2 == "biden" ? bidenCol : (ME2 == 'trump' ? trumpCol : '#dcdcdc'))

            const nebrasCoords = proj([-97.203378, 40.713956])

            svg
                .append("circle")
                .attr("cx", nebrasCoords[0])
                .attr("cy", nebrasCoords[1])
                .attr("r", isMobile() ? 4 : 8)
                .style("fill", NE2 == "biden" ? bidenCol : (NE2 == 'trump' ? trumpCol : '#dcdcdc'))


        }
        // call the draw function
        draw()

        var trackingobject = {
            component: "elex-preview-08-2020",
            value: "finish-card-shown"
        }

        if (window.guardian.ophan && window.guardian.ophan != undefined) {
            window.guardian.ophan.record(trackingobject);
        } else {
            console.log("can't find ophan")
        }

    }

    groupIds.forEach(function (groupName) {
        const stateGroup = stateGroups.filter(d => d.group_id == groupName)
        const statesInGroup = statesInUse.filter(d => d.groups_in_use == groupName)

        const allGroups = d3.select(`.state-groups`)

        const groupDivs = allGroups
            .selectAll(`.state-group ${groupName}`)
            .data(stateGroup)
            .enter()
            .append('div')
            .classed(`state-group ${groupName}`, true)

        groupDivs
            .append('h2')
            .html(d => d.group_name)
            .classed('state-group__name', true)

        groupDivs
            .append('p')
            .html(d => d.groupText)
            .classed('state-group__text', true)

        groupDivs.each(function (d, i) {
            const groupDiv = d3.select(this)
            const groupButtons = groupDiv
                .selectAll('button')
                .data(['Biden', 'Trump'])
                .enter()
                .append('button')
                .text(name => "All to " + name)
                .attr('class', d => `group-candidate-button group-button--${groupName} group-candidate-button--` + d.toLowerCase())

            groupButtons
                .on('click', canName => {

                    const stateButtons = stateDivs.selectAll('button')

                    var prevTotals = getPreviousTotals()

                    const statesToChange = d.group_states.split(', ')
                    statesToChange.forEach(function () {
                        allStates = allStates.map(s => {
                            if (statesToChange.includes(s.state)) {
                                return Object.assign({}, s, {
                                    candidate_select: canName.toLowerCase()
                                })
                            } else {
                                return s
                            }
                        })
                    })

                    updateTotals(prevTotals)
                    groupButtons
                        .classed('group-candidate-button--selected', n => n === canName)

                    stateButtons
                        .classed('candidate-button--selected', n => n === canName)

                    var trackingobject = {
                        component: "elex-preview-08-2020",
                        value: "group-button-clicked"
                    }

                    if (window.guardian.ophan && window.guardian.ophan != undefined) {
                        window.guardian.ophan.record(trackingobject);
                    } else {
                        console.log("can't find ophan")
                    }

                })
        })

        const statesDiv = groupDivs
            .append('div')
            .classed('state-cards', true)

        const stateDivs = statesDiv
            .selectAll('.state-card')
            .data(statesInGroup)
            .enter()
            .append('div')
            .classed('state-card', true)

        stateDivs
            .append('h2')
            .html(d => d.state)
            .classed('state-card__name', true)

        stateDivs
            .append('h2')
            .html(d => d.ecvs + " electoral vote" + (d.ecvs == 1 ? "" : "s"))
            .classed("state-card__ecvs", true)

        const indicatorDiv = stateDivs
            .append('div')
            .classed("state-card__indicator", true)


        const votingHistory = indicatorDiv
            .append('div')
            .classed('state-card__voting-history', true)

        votingHistory
            .append('div')
            .classed('state-card__label label-2000', true)
            .text('2000')

        for (var i = 0; i < 4; i++) {
            votingHistory
                .append('div')
                .style('background-color', function (d) {
                    if (d.voting_history[i] == "R") {
                        return trumpCol;
                    } else {
                        return bidenCol;
                    }
                })
                .classed('state-card__history-block', true)
        }

        const margin2016 = indicatorDiv
            .append('div')
            .classed('state-card__2016-margin', true)


        margin2016
            .append('div')
            .classed('state-card__label label-2016', true)
            .text('2016 margin')

        margin2016
            .append('div')
            .html(d => "+ " + parseFloat(Math.abs(d.margin2016)).toFixed(1))
            .style('background-color', function (d) {
                if (d.margin2016 > 0) {
                    return bidenCol
                } else {
                    return trumpCol
                }
            })
            .classed('state-card__2016-margin-block', true)

        const polling2020 = indicatorDiv
            .append('div')
            .classed('state-card__2020-polling', true)

        polling2020
            .append('div')
            .classed('state-card__label label-2020', true)
            .text('2020 polling')

        polling2020
            .append('div')
            .html(d => "+ " + parseFloat(Math.abs(d.polling2020)).toFixed(1))
            .style('background-color', function (d) {
                if (d.polling2020 > 0) {
                    return '#93a9e1'
                } else {
                    return '#ea8386'
                }
            })
            .classed('state-card__2020-polling-block', true)

        stateDivs
            .append('p')
            .html(d => d.stateText)
            .classed("state-card__text", true)

        stateDivs.each(function (d, i) {
            const stateDiv = d3.select(this)
            const buttons = stateDiv
                .selectAll('button')
                .data(['Biden', 'Trump'])
                .enter()
                .append('button')
                .text(name => name)
                .attr('class', d => 'candidate-button candidate-button--' + d.toLowerCase())

            buttons
                .on('click', canName => {

                    var prevTotals = getPreviousTotals()

                    allStates = allStates.map(s => {

                        if (s.state === d.state) {
                            return Object.assign({}, s, {
                                candidate_select: canName.toLowerCase()
                            })
                        } else {
                            return s
                        }
                    })

                    updateTotals(prevTotals)
                    buttons
                        .classed('candidate-button--selected', n => n === canName)

                    const selectedGroupButton = $(`.group-candidate-button--selected.group-button--${d.groups_in_use}`)

                    if (selectedGroupButton != null && selectedGroupButton.innerHTML != "All to " + canName) {
                        selectedGroupButton.classList.remove("group-candidate-button--selected")
                    }

                    var trackingobject = {
                        component: "elex-preview-08-2020",
                        value: "state-button-clicked"
                    }

                    if (window.guardian.ophan && window.guardian.ophan != undefined) {
                        window.guardian.ophan.record(trackingobject);
                    } else {
                        console.log("can't find ophan")
                    }

                })
        })

    })


}

// Make bar sticky
const stickyContainer = $('.sticky-container-height')
const stickyElement = d3.select('.sticky-container').node()
const isApp = d3.select('body').classed('ios')

// select sticky div and style height
d3.select('.sticky-container-height')
    .style('height', (stickyElement.getBoundingClientRect().height) + 'px')


// get scroll point (+ app scroll point extra?)
const getScrollPoint = () => stickyContainer.getBoundingClientRect().top + window.scrollY + (isApp ? 45 : 0);
// listen for scrolling and call scrollpoint function?
const stickyListener = makeStickyListenerAt(getScrollPoint)
var sticky = window.scrollY >= getScrollPoint();

// event listener on scroll
d3.select(stickyElement).classed('sticky', sticky);
window.addEventListener('scroll', stickyListener, false);
// }


function makeStickyListenerAt(getYPos) {

    var yPos = getYPos();
    setInterval(() =>
        requestAnimationFrame(() =>
            yPos = getYPos()
        ), 1000)

    const toggleSticky = (e) => {
        if (sticky && window.scrollY < yPos) {
            sticky = false;
        } else if (!sticky && window.scrollY >= yPos) {
            sticky = true;

            if (isApp) {
                appBar = false;
                stickyElement.style.transform = 'translateY(-45px)'
            }
        }
        d3.select(stickyElement).classed('sticky', sticky)
    }

    var lastY = 0,
        appBar = true;
    const adjustBarTop = (e) => {
        if (window.scrollY > 0) {
            if (sticky && appBar && window.scrollY > lastY) {
                if (window.scrollY - lastY >= 45) {
                    stickyElement.style.transform = 'translateY(-45px)'
                    lastY = window.scrollY;
                    appBar = false;
                } else {
                    stickyElement.style.transform = `translateY(${lastY - window.scrollY}px)`
                }
            } else if (sticky && !appBar && window.scrollY < lastY) {
                if (lastY - window.scrollY >= 45) {
                    stickyElement.style.transform = 'translateY(0)'
                    lastY = window.scrollY;
                    appBar = true;
                } else {
                    stickyElement.style.transform = `translateY(-${45 - (lastY - window.scrollY)}px)`
                }
            } else {
                lastY = window.scrollY;
            }
        } else {
            stickyElement.style.transform = 'translateY(0)'
        }
    }

    if (isApp) {
        return (e) => {
            toggleSticky(e);
            adjustBarTop(e);
        }
    } else {
        return toggleSticky;
    }
}


// ANIMATION FUNCTIONS



// ROUNDEL PULSE

function pulse(candidate) {
    const pulseEl = document.querySelector(".bar-portrait__" + candidate + " .bar-portrait-roundel");
    pulseEl.classList.remove("pulse-roundel");
    void pulseEl.offsetWidth;
    pulseEl.classList.add("pulse-roundel");
}

// PORTRAIT MOOD CHANGE

function changePortrait(candidate, mood) {
    if (mood == null) {
        const moods = ["unhappy", "happy", "normal"];
        mood = moods[moodIndex];
        moodIndex++;
        if (moodIndex >= moods.length) {
            moodIndex = 0;
        }
    }

    const portraits = document.querySelectorAll("." + candidate + "-portrait");

    portraits.forEach(function (portrait) {
        portrait.classList.remove("show-portrait");
    });

    const portraitEl = document.querySelector("." + candidate + "-portrait-" + mood);
    portraitEl.classList.add("show-portrait");

}

// ANIMATE VOTES TOTAL

function animateTotal(candidate, newTotal, currentTotal) {

    const total = d3.select('.' + candidate + "-title-count");
    let flashWin = false;
    total.attr("data-val", currentTotal);

    if (candidate == "biden") {
        bidenTotal = newTotal;
    } else {
        trumpTotal = newTotal;
    }

    if (currentTotal < 270 && newTotal >= 270) {
        flashWin = true;
    }

    total
        .transition()
        .duration(500)
        .tween('text', function () {
            const currentVal = d3.select(this).attr("data-val");
            const i = d3.interpolate(currentVal, newTotal)
            return (t) => {
                // .text("$" + Math.round(data[slide].rev / 1000000) + "bn");
                total.text(parseInt(i(t))).attr("data-val", newTotal);
                if (i(t) >= 270 && flashWin) {
                    winFlash();
                    flashWin = false;
                }
            }
        });
}

// FLASH FINISH LINE TEXT

function winFlash() {
    const finishLabelEl = document.querySelector(".elex-votes-finish-label-overlay");
    finishLabelEl.classList.remove("finish-label-flash");
    void finishLabelEl.offsetWidth;
    finishLabelEl.classList.add("finish-label-flash");
}

// MAIN FUNCTION TO UPDATE BAR GRAPHIC AND TRIGGER ANIMATIONS

function updateElexBarGraphic(votesBiden, votesTrump, prevVotesBiden, prevVotesTrump) {

    if (votesBiden > prevVotesBiden) {
        pulse("biden");
    } else if (votesTrump > prevVotesTrump) {
        pulse("trump");
    }

    if (votesBiden != prevVotesBiden) {
        animateTotal("biden", votesBiden, prevVotesBiden);
    }
    if (votesTrump != prevVotesTrump) {
        animateTotal("trump", votesTrump, prevVotesTrump);
    }

    if (votesBiden >= 270 && prevVotesBiden < 270) {
        // BIDEN WIN
        changePortrait("trump", "unhappy");
        changePortrait("biden", "happy");
    } else if (votesTrump >= 270 && prevVotesTrump < 270) {
        // TRUMP WIN
        changePortrait("trump", "happy");
        changePortrait("biden", "unhappy");
    } else if (votesBiden < prevVotesBiden && prevVotesBiden >= 270 && votesTrump < 270) {
        // NO VICTOR
        changePortrait("biden", "normal");
        changePortrait("trump", "normal");
    } else if (votesTrump < prevVotesTrump && prevVotesTrump >= 270 && votesBiden < 270) {
        // NO VICTOR
        changePortrait("biden", "normal");
        changePortrait("trump", "normal");
    }

    trumpTotal = votesTrump; // Update global votes totals
    bidenTotal = votesBiden;

    // BELOW RESIZES THE BAR MAY NOT BE CORRECTLY SIZED?? MIGHT WANT TO PLUG INTO A CUSTOM D3 RESIZE FUNCTION

    // DESKTOP SIZES TO VOTES AS A PROPORTION OF TOTAL VOTES POSSIBLE (540) AS A PERCENTAGE WIDTH

    // MOBILE DESIGN HAS 270 FINISH LINE TO RIGHT, POSITIONED AT 90% INITIALLY
    // SO BAR WIDTH SHOULD BE (VOTES/(270 / 0.9)) * 100%

    // TO DO: IF VOTES INCREASE ABOVE THEN THAT 0.9 figure will have to dynamically change to 0.8 or less with finish line at 80% or less;

    const bidenBar = $(".bar-votes__biden");
    const trumpBar = $(".bar-votes__trump");



    if (isMobile()) {
        // mobile

        let finishXPos = 0.9; // 90%;

        if (votesBiden > 300 || votesTrump > 300) {

            let maxXVotes = Math.max(votesBiden, votesTrump); // + 30 to give space to grow into???
            // if (maxXVotes > 540) {
            //     maxXVotes == 540;
            // }
            finishXPos = 270 / maxXVotes;
            document.querySelector(".elex-votes-finishline").style.left = (finishXPos * 100) + "%";
        }


        bidenBar.style.width = (votesBiden / (270 / finishXPos)) * 100 + "%";
        trumpBar.style.width = (votesTrump / (270 / finishXPos)) * 100 + "%";

    } else {
        // desktop
        bidenBar.style.width = (votesBiden / 538 * 100) + "%";
        trumpBar.style.width = (votesTrump / 538 * 100) + "%";
    }


}



// MOBILE DETECT

function isMobile() {
    var dummy = document.querySelector("#gv-mobile-dummy");
    if (getStyle(dummy) == 'block') {
        return true;
    } else {
        return false;
    }
}


function getStyle(element) {
    return element.currentStyle ? element.currentStyle.display :
        getComputedStyle(element, null).display;
}