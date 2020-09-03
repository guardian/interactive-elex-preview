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

let trumpTotal = 218, bidenTotal = 218; // These are global references to the current vote totals currently used in the bar animation

const pulseBtn = document.querySelector(".pulse-btn");
const moodBtn = document.querySelector(".mood-btn");
const incrementBtn = document.querySelector(".increment-btn");
const winBtn = document.querySelector(".win-btn");
const bidenIncreaseBtn = document.querySelector(".biden-increase-btn");
const bidenWinBtn = document.querySelector(".biden-win-btn");
const bidenLoseBtn = document.querySelector(".biden-lose-btn");
const resetBtn = document.querySelector(".reset-btn");

pulseBtn.addEventListener("click", function(){ pulse("biden"); });
moodBtn.addEventListener("click", function(){ changePortrait("biden", null); });
incrementBtn.addEventListener("click", function(){ animateTotal("biden", (bidenTotal + 23), bidenTotal); });
winBtn.addEventListener("click", function(){ winFlash(); });
bidenIncreaseBtn.addEventListener("click", function(){ updateElexBarGraphic( (bidenTotal + 27), trumpTotal, bidenTotal, trumpTotal); });
bidenWinBtn.addEventListener("click", function(){ updateElexBarGraphic( 283, 200, bidenTotal, trumpTotal); });
bidenLoseBtn.addEventListener("click", function(){ updateElexBarGraphic( 210, 270, bidenTotal, trumpTotal); });
resetBtn.addEventListener("click", function(){ updateElexBarGraphic( 27, 21, bidenTotal, trumpTotal);  changePortrait("biden", "normal");
changePortrait("trump", "normal"); });


async function loadGroupData() {
    // fetch data from url, get state groupings
    const sheetData = await fetch('http://interactive.guim.co.uk/docsdata-test/1xxtoiJ5Rn1cVXwynMgJyGr4Cd40znZoI9RYiMj_rMe0.json')
        .then(res => res.json())
    const groups = sheetData.sheets.state_groups.filter(group => group.id);
    return groups
}



loadGroupData().then(groups => {
    const groupsInUse = groups.filter(group => group.states)
    const boxes = createBoxes(groupsInUse)
    const solids = groups.filter(group => group.solid)

    createInitialGraphics(solids)
    // boxes.onChange(data => {
    //     bars.update(data);
    // })

    console.log(groupsInUse)

})

const bidenCol = '#25428f'
const trumpCol = '#cc0a11'

function createBoxes(groups) {
    const groupsDiv = d3.select('.state-groups')

    const groupDivs = groupsDiv
        .selectAll('.state-group')
        .data(groups)
        .enter()
        .append('div')
        .classed('state-group', true)

    groupDivs
        .append('h2')
        .html(d => d.name)
        .classed('state-group__name', true)

    groupDivs
        .append('h3')
        .html(d => d.states)
        .classed("state-group__states", true)

    groupDivs
        .append('div')
        .html(d => d.ev_count)
        .classed("state-group__evcount", true)

    groupDivs
        .append('p')
        .html(d => d.storyText)
        .classed("state-group__context", true)

    const setToggle = (groupDiv, d) => {
        const options = groupDiv.selectAll('.state-group-toggle__option')
        const inner = groupDiv.select('.state-group-toggle__inner')

        const perc = d === 'biden' ? 0 : (d === 'unselected' ? 33.3333 : 66.6667)
        const backCol = d === 'biden' ? bidenCol : (d === 'unselected' ? "#dcdcdc" : trumpCol)

        inner.style('left', perc + '%')
        inner.style('background-color', backCol)

        options.classed('state-group-toggle__option--selected', d2 => {
            return d2 === d
        })
    }

    const toggleDiv = groupDivs
        .append('div')
        .classed("state-group__toggle", true)

    const inner = toggleDiv
        .append('div')
        .classed('state-group-toggle__inner', true)

    const options = toggleDiv
        .selectAll('blah')
        .data(['biden', 'unselected', 'trump'])
        .enter()
        .append('div')
        .attr('class', d => `state-group-toggle__option state-group-toggle__option--${d.toLowerCase()}`)
        .text(d => d.slice(0, 1).toUpperCase() + d.slice(1))

    groupDivs.each(function (d, i) {
        const groupDiv = d3.select(this)
        setToggle(groupDiv, d.candidate_select)
    })

}


function createInitialGraphics(solids) {

    // Bar setup
    const x = d3.scaleLinear().domain([0, 538]).range([0, 100])

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([0, 100])

    // 270 majority finish line
    const finish = d3.select('.elex-votes')
        .append('div')
        .attr("class", 'elex-votes-finishline')
        //.style('left', x(270) + '%');

    finish
        .append('div')
        .attr("class", "elex-votes-finish-label")
        .text("270 to win");

        finish
        .append('div')
        .attr("class", "elex-votes-finish-label elex-votes-finish-label-overlay")
        .text("270 to win");

    const solidData = {
        trump: solids[0].ev_count,
        biden: solids[1].ev_count
    }

    const trumpSolidStates = solids[0].solid_states.split(", ")

    const bidenSolidStates = solids[1].solid_states.split(", ")

    console.log(trumpSolidStates)
    console.log(bidenSolidStates)

    // Fill solid
    const trumpBar = d3.select('.bar-votes__trump')
        .style("width", x(solidData.trump) + '%')
        //.style("left", x(538) - x(solidData.trump) + '%')
    const bidenBar = d3.select('.bar-votes__biden')
        .style("width", x(solidData.biden) + '%')
    console.log(x(538) - x(solidData.trump) + '%')


    // Map setup
    const statesFc = topojson.feature(statesTopo, statesTopo.objects.states)

    // 'fc' is short for 'FeatureCollection', you can log it to look at the structure
    console.log(statesFc)

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

    portraits.forEach(function(portrait) {
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
    .tween('text', function() {
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

function updateElexBarGraphic( votesBiden, votesTrump, prevVotesBiden, prevVotesTrump) {


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
    }

    else if (votesTrump >=270 && prevVotesTrump < 270) {
        // TRUMP WIN
        changePortrait("trump", "happy");
        changePortrait("biden", "unhappy");
    }
    
    else if (votesBiden < prevVotesBiden && prevVotesBiden >= 270 && votesTrump < 270) {
        // NO VICTOR
        changePortrait("biden", "normal");
        changePortrait("trump", "normal");
    }

    else if (votesTrump < prevVotesTrump && prevVotesTrump >= 270 && votesBiden < 270) {
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


        bidenBar.style.width = (votesBiden/(270 / finishXPos)) * 100 + "%";
        trumpBar.style.width = (votesTrump/(270 / finishXPos)) * 100 + "%";

    } else {
        // desktop
        bidenBar.style.width = (votesBiden/540*100) + "%";
        trumpBar.style.width = (votesTrump/540*100) + "%";
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