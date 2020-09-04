// if you want to import a module from shared/js then you can
// just do e.g. import Scatter from "shared/js/scatter.js"
import * as d3 from 'd3'
import {
    $
} from 'shared/js/util'

import * as topojson from 'topojson'
import statesTopo from 'us-atlas/counties-10m.json'
import bubbleData from 'shared/server/data_joined.json'

// FOR TESTING PURPOSES

let moodIndex = 0;

let trumpTotal = 218,
    bidenTotal = 218; // These are global references to the current vote totals currently used in the bar animation

const pulseBtn = document.querySelector(".pulse-btn");
const moodBtn = document.querySelector(".mood-btn");
const incrementBtn = document.querySelector(".increment-btn");
const winBtn = document.querySelector(".win-btn");
const bidenIncreaseBtn = document.querySelector(".biden-increase-btn");
const bidenWinBtn = document.querySelector(".biden-win-btn");
const bidenLoseBtn = document.querySelector(".biden-lose-btn");
const resetBtn = document.querySelector(".reset-btn");

pulseBtn.addEventListener("click", function () {
    pulse("biden");
});
moodBtn.addEventListener("click", function () {
    changePortrait("biden", null);
});
incrementBtn.addEventListener("click", function () {
    animateTotal("biden", (bidenTotal + 23), bidenTotal);
});
winBtn.addEventListener("click", function () {
    winFlash();
});
bidenIncreaseBtn.addEventListener("click", function () {
    updateElexBarGraphic((bidenTotal + 27), trumpTotal, bidenTotal, trumpTotal);
});
bidenWinBtn.addEventListener("click", function () {
    updateElexBarGraphic(283, 200, bidenTotal, trumpTotal);
});
bidenLoseBtn.addEventListener("click", function () {
    updateElexBarGraphic(210, 270, bidenTotal, trumpTotal);
});
resetBtn.addEventListener("click", function () {
    updateElexBarGraphic(27, 21, bidenTotal, trumpTotal);
    changePortrait("biden", "normal");
    changePortrait("trump", "normal");
});


async function loadData() {
    // fetch data from url, get state groupings
    const sheetData = await fetch('http://interactive.guim.co.uk/docsdata-test/1xxtoiJ5Rn1cVXwynMgJyGr4Cd40znZoI9RYiMj_rMe0.json')
        .then(res => res.json())
    const groups = sheetData.sheets.state_cards.filter(group => group.type);
    return groups
}


loadData().then(groups => {

    const statesInUse = groups.filter(group => group.groups_in_use)
    const stateGroups = groups.filter(group => group.type == "group")
    const initialBar = groups.filter(group => group.type == "initial_bar")

    const groupIds = stateGroups.map(function (el) {
        return el.group_id;
    })

    const cards = groupIds.forEach(function (e) {
        createGroupsAndCards(statesInUse, stateGroups, e)
    })

    const bar = createInitialGraphics(initialBar)
    // boxes.onChange(statesInUse)
})

const bidenCol = '#25428f'
const trumpCol = '#cc0a11'

const setButtons = (stateDiv, d) => {
    const options = stateDiv.selectAll('.state-card-buttons__option')
    const backCol = d === 'Biden' ? bidenCol : (d === 'Trump' ? trumpCol : "#dcdcdc")

    options.classed('state-card-buttons__option--selected', d2 => {
        return d2 === d
    })

    const selected = stateDiv.selectAll('.state-card-buttons__option--selected')
        .style('background-color', backCol)
        .style('color', '#ffffff')
}


function createGroupsAndCards(statesInUse, stateGroups, groupName) {

    const stateGroup = stateGroups.filter(d => d.group_id == groupName)
    const statesInGroup = statesInUse.filter(d => d.groups_in_use == groupName)

    const groupsDiv = d3.select(`.state-groups--${groupName}`)

    const groupDivs = groupsDiv
        .selectAll('.state-group')
        .data(stateGroup)
        .enter()
        .append('div')
        .classed('state-group', true)

    groupDivs
        .append('h2')
        .html(d => d.group_name)
        .classed('state-group__name', true)

    groupDivs
        .append('p')
        .html(d => d.groupText)
        .classed('state-group__text', true)

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

    const buttonsDiv = stateDivs
        .append('div')
        .classed("state-card-buttons", true)

    const options = buttonsDiv
        .selectAll('choices')
        .data(['Biden', 'Trump'])
        .enter()
        .append('div')
        .attr('class', d => `state-card-buttons__option state-card-buttons__option--${d}`)
        .text(d => d)

    stateDivs.each(function (d, i) {
        const stateDiv = d3.select(this)
        setButtons(stateDiv, d.candidate_select)
    })
}
// function onChange(callback) {
//     stateDivs.each(function (d) {
//         const stateDiv = d3.select(this)
//         const options = stateDiv.selectAll('.state-card-buttons__option')

//         // options.on('click', function (d) {
//         //         const position = d;


//         //     }
//     })
// }


function createInitialGraphics(initialBar) {
    // Bar setup
    const x = d3.scaleLinear().domain([0, 538]).range([0, 100])

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([0, 100])

    // 270 majority finish line
    const finish = d3.select('.elex-votes')
        .append('div')
        .attr("class", 'elex-votes-finishline')
        .style('left', x(270) + '%');

    finish
        .append('div')
        .attr("class", "elex-votes-finish-label")
        .text("270 to win");

    finish
        .append('div')
        .attr("class", "elex-votes-finish-label elex-votes-finish-label-overlay")
        .text("270 to win");

    const solidData = {
        trump: initialBar[0].group_ecvs,
        biden: initialBar[1].group_ecvs
    }

    const trumpSolidStates = initialBar[0].group_states.split(", ")

    const bidenSolidStates = initialBar[1].group_states.split(", ")


    // Fill solid
    const trumpBar = d3.select('.bar-container__trump')
        .style("width", x(solidData.trump) + '%')
    //.style("left", x(538) - x(solidData.trump) + '%')
    const bidenBar = d3.select('.bar-container__biden')
        .style("width", x(solidData.biden) + '%')


    // Map setup
    const statesFc = topojson.feature(statesTopo, statesTopo.objects.states)

    // 'fc' is short for 'FeatureCollection', you can log it to look at the structure

    const draw = () => {

        // $ is shorthand for document.querySelector
        // selects the SVG element
        const svgEl = $('.elex-map')

        // get the SVG's width as set in CSS
        const width = svgEl.getBoundingClientRect().width
        const height = width * 0.66

        const svg = d3.select(svgEl)
            .attr('width', width)
            .attr('height', height)

        // set up a map projection that fits our GeoJSON into the SVG

        const proj = d3.geoAlbersUsa()
            .fitExtent([
                [-69, 0],
                [width, height]
            ], statesFc)

        const path = d3.geoPath().projection(proj)

        // Draw states

        const stateShapes = svg
            .selectAll('blah')
            // do something for each feature ( = area ) in the GeoJSON
            .data(statesFc.features)
            .enter()
            .append('path')
            .style("fill", function (d) {
                if (trumpSolidStates.includes(d.properties.name) == true) {
                    return trumpCol
                } else if (bidenSolidStates.includes(d.properties.name) == true) {
                    return bidenCol
                } else {
                    return "#f6f6f6"
                }
            })
            .attr('d', path)
            .attr('class', 'elex-state')

    }
    // call the draw function
    draw()
}


// Filled status headline
// d3.select('.elex-votes-filled')
//     .style('opacity', 1)
//     .select('.elex-votes-filled__status')
//     .style('color', votesFor > votesAgainst ? statusHex.succeed : statusHex.fail)
//     .transition()
//     .text(votesFor > votesAgainst ? 'pass' : 'reject')

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

    const bidenBar = $(".bar-container__biden");
    const trumpBar = $(".bar-container__trump");
    bidenBar.style.width = (votesBiden / 540 * 100) + "%";
    trumpBar.style.width = (votesTrump / 540 * 100) + "%";
}