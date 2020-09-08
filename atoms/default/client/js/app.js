// if you want to import a module from shared/js then you can
// just do e.g. import Scatter from "shared/js/scatter.js"
import * as d3 from 'd3'
import {
    $
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
    const sheetData = await fetch('http://interactive.guim.co.uk/docsdata-test/1xxtoiJ5Rn1cVXwynMgJyGr4Cd40znZoI9RYiMj_rMe0.json')
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

    const statesInUse = data.filter(d => d.groups_in_use)
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
        return a + b
    }

    // Get previous totals
    function getPreviousTotals() {
        const prevTrumpTotal = allStates.filter(d => d.candidate_select === 'trump')
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        const prevBidenTotal = allStates.filter(d => d.candidate_select === 'biden')
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        return [prevTrumpTotal, prevBidenTotal]
    }


    function updateTotals(prevTotals) {

        const newTrumpTotal = allStates.filter(d => d.candidate_select === 'trump')
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        const newBidenTotal = allStates.filter(d => d.candidate_select === 'biden')
            .map(d => Number(d.ecvs)).reduce(sum, 0)


        updateElexBarGraphic(newBidenTotal, newTrumpTotal, prevTotals[1], prevTotals[0])
    }

    groupIds.forEach(function (groupName) {
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

// // FINISH CARD
// d3.select('.finish-card')
//     .style('display', bidenTotal >= 270 ? "block" : (trumpTotal >= 270 ? "block" : ((trumpTotal == 269 && trumpTotal == bidenTotal) ? "block" : "none")))
// // Winner headline
// d3.select('.finish-headline-win')
//     .style('display', bidenTotal == trumpTotal ? "none" : "block")
//     .style('opacity', 1)
//     .select('.finish-headline__status')
//     .style('color', bidenTotal > trumpTotal ? bidenCol : trumpCol)
//     .transition()
//     .text(bidenTotal > trumpTotal ? 'Joe Biden' : 'Donald Trump')

// // % Guardian readers who agree

// // Custom copy
// d3.select('.finish-winner-name')
//     .text(bidenTotal > trumpTotal ? 'Biden' : 'Trump')

// // Tie scenario
// d3.select('.finish-win-text')
//     .style("display", bidenTotal == trumpTotal ? "none" : "block")

// d3.select('.finish-headline-tie')
//     .style("display", bidenTotal == trumpTotal ? "block" : "none")

// d3.select('.finish-tie-text')
//     .style("display", bidenTotal == trumpTotal ? "block" : "none")


// Key win custom text: 
// if all blue wall goes to Biden, "the "blue wall" of Michigan, Pennsylvania and Wisconsin"
// other scenarios? 
// d3.select('.finish-key-win')
//     .text(bidenTotal > trumpTotal ? 'Biden' : 'Trump')


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

    console.log(votesBiden, prevVotesBiden)
    console.log(votesTrump, prevVotesTrump)
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