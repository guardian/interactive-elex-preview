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

let trumpTotal = 125,
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


// Load data, return individual states, groups & initial bar counts
async function loadData() {
    // fetch data from url, get state groupings
    const sheetData = await fetch('http://interactive.guim.co.uk/docsdata-test/1xxtoiJ5Rn1cVXwynMgJyGr4Cd40znZoI9RYiMj_rMe0.json')
        .then(res => res.json())
    const groups = sheetData.sheets.state_cards.filter(group => group.type);
    return groups
}


// Plot intial bar & map, create state groups & cards, on button clicks update bar & map
loadData().then(groups => {

    const cards = new stateCards(groups)
    const barAndMap = new initialGraphics(groups);
    console.log(cards)

    cards.onChange((data, oldData) => {
        barAndMap.update(data, oldData)
    })

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


// Change style of buttons when clicked
const setButtons = (stateDiv, d) => {
    const options = stateDiv.selectAll('.state-card-buttons__option')
        .style('background-color', null)
        .style('color', null);

    const backCol = d === 'biden' ? bidenCol : (d === 'trump' ? trumpCol : "#dcdcdc")

    options.classed('state-card-buttons__option--selected', d2 => {
        return d2 === d
    })
    const selected = stateDiv.selectAll('.state-card-buttons__option--selected')
        .style('background-color', backCol)
        .style('color', '#ffffff')
}


// Create state groups & cards
class stateCards {

    constructor(groups) {

        const statesInUse = groups.filter(group => group.groups_in_use)
        const stateGroups = groups.filter(group => group.type == "group")
        const allStates = groups.filter(group => group.type == "individual")

        this.allStates = allStates;

        const groupIds = stateGroups.map(function (el) {
            return el.group_id;
        })

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

            const groupButtonsDiv = groupDivs
                .append('div')
                .classed("group-buttons", true)

            const groupOptions = groupButtonsDiv
                .selectAll('choices')
                .data(['AllBiden', 'AllTrump'])
                .enter()
                .append('div')
                .attr('class', d => `group-buttons__option group-buttons__option--${d.toLowerCase()}`)
                .text(d => d.slice(0, 3) + " to " + d.slice(3))

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
                .data(['biden', 'trump'])
                .enter()
                .append('div')
                .attr('class', d => `state-card-buttons__option state-card-buttons__option--${d.toLowerCase()}`)
                .text(d => d.slice(0, 1).toUpperCase() + d.slice(1))

            stateDivs.each(function (d, i) {
                const stateDiv = d3.select(this)
                setButtons(stateDiv, d.candidate_select)
            })
        })

        const stateDivs = d3.selectAll('.state-card')
        this.stateDivs = stateDivs
    }


    onChange(callback) {

        const that = this

        this.stateDivs.each(function (td) {
            const stateDiv = d3.select(this)
            const options = stateDiv.selectAll('.state-card-buttons__option')

            options.on('click', function (d, i) {
                const candidate_select = d.toLowerCase();


                const oldStates = that.allStates

                that.allStates = that.allStates.map(t => {
                    return t.state === td.state ? Object.assign({}, t, {
                            candidate_select
                        }) :
                        t
                })

                setButtons(stateDiv, d)
                callback(that.allStates, oldStates)
            })

        })
    }
}



// Build initial bar & map (showing solid + likely states from Trump & Biden)
class initialGraphics {
    constructor(data) {

        this.bars = {
            biden: true,
            trump: true
        }

        Object.keys(this.bars).forEach(pos => {
            this.bars[pos] = d3.select(`.bar-votes__${pos}`)
        })

        const barTotals = data.filter(data => data.type == "bar_total")

        const barTotalData = {
            trump: barTotals[0].group_ecvs,
            biden: barTotals[1].group_ecvs
        }

        this.barTotalData = barTotalData

        const sum = (a, b) => a + b

        const TrumpTotal = data.filter(d => d.candidate_select === "trump")
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        const BidenTotal = data.filter(d => d.candidate_select === "biden")
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        updateElexBarGraphic(BidenTotal, TrumpTotal, 0, 0)

        const trumpSolidStates = barTotals[0].group_states.split(", ")

        const bidenSolidStates = barTotals[1].group_states.split(", ")

        // Make bar sticky
        this.stickyContainer = $('.sticky-container-height')
        this.stickyElement = d3.select('.sticky-container').node()
        this.isApp = d3.select('body').classed('ios')

        // select sticky div and style height
        d3.select('.sticky-container-height')
            .style('height', (this.stickyElement.getBoundingClientRect().height) + 'px')


        // get scroll point (+ app scroll point extra?)
        const getScrollPoint = () => this.stickyContainer.getBoundingClientRect().top + window.scrollY + (this.isApp ? 45 : 0);
        // listen for scrolling and call scrollpoint function?
        this.stickyListener = this.makeStickyListenerAt(getScrollPoint)
        this.sticky = window.scrollY >= getScrollPoint();

        // event listener on scroll
        d3.select(this.stickyElement).classed('sticky', this.sticky);
        window.addEventListener('scroll', this.stickyListener, false);
        // }



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

            // Circles for Maine & Nebraska congressional disctrict votes
            // Change fill: if statewide and district vote differently...show circle and fill X?
            const maineCoords = proj([-69.009649, 45.403030])

            const maineCD = svg
                .append("circle")
                .attr("cx", maineCoords[0])
                .attr("cy", maineCoords[1])
                .attr("r", 10)
                .style("fill", '#dcdcdc')
                .style("display", "none")

            const nebrasCoords = proj([-97.203378, 40.713956])

            const nebrasCD = svg
                .append("circle")
                .attr("cx", nebrasCoords[0])
                .attr("cy", nebrasCoords[1])
                .attr("r", 10)
                .style("fill", "#dcdcdc")
                .style("display", "none")

        }
        // call the draw function
        draw()

        // if (data) {
        //     this.update(data)
        // }
    }

    update(data, oldData) {

        const sum = (a, b) => a + b

        console.log(data, oldData)

        const oldTrumpTotal = oldData.filter(d => d.candidate_select === "trump")
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        const oldBidenTotal = oldData.filter(d => d.candidate_select === "biden")
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        const newTrumpTotal = data.filter(d => d.candidate_select === "trump")
            .map(d => Number(d.ecvs)).reduce(sum, 0)

        const newBidenTotal = data.filter(d => d.candidate_select === "biden")
            .map(d => Number(d.ecvs)).reduce(sum, 0)


        updateElexBarGraphic(newBidenTotal, newTrumpTotal, oldBidenTotal, oldTrumpTotal)
    }

    makeStickyListenerAt(getYPos) {

        var yPos = getYPos();
        setInterval(() =>
            requestAnimationFrame(() =>
                yPos = getYPos()
            ), 1000)

        const toggleSticky = (e) => {
            if (this.sticky && window.scrollY < yPos) {
                // console.log('Unstick header')
                this.sticky = false;
            } else if (!this.sticky && window.scrollY >= yPos) {
                // console.log('Stick header')
                this.sticky = true;

                if (this.isApp) {
                    appBar = false;
                    this.stickyElement.style.transform = 'translateY(-45px)'
                }
            }
            d3.select(this.stickyElement).classed('sticky', this.sticky)
        }

        var lastY = 0,
            appBar = true;
        const adjustBarTop = (e) => {
            if (window.scrollY > 0) {
                if (this.sticky && appBar && window.scrollY > lastY) {
                    if (window.scrollY - lastY >= 45) {
                        this.stickyElement.style.transform = 'translateY(-45px)'
                        lastY = window.scrollY;
                        appBar = false;
                    } else {
                        this.stickyElement.style.transform = `translateY(${lastY - window.scrollY}px)`
                    }
                } else if (this.sticky && !appBar && window.scrollY < lastY) {
                    // console.log(`Showing the app bar... ${window.scrollY - lastY}`);
                    if (lastY - window.scrollY >= 45) {
                        this.stickyElement.style.transform = 'translateY(0)'
                        lastY = window.scrollY;
                        appBar = true;
                    } else {
                        this.stickyElement.style.transform = `translateY(-${45 - (lastY - window.scrollY)}px)`
                    }
                } else {
                    lastY = window.scrollY;
                }
            } else {
                this.stickyElement.style.transform = 'translateY(0)'
            }
        }

        if (this.isApp) {
            return (e) => {
                toggleSticky(e);
                adjustBarTop(e);
            }
        } else {
            return toggleSticky;
        }
    }
}

// FINISH CARD
d3.select('.finish-card')
    .style('display', bidenTotal >= 270 ? "block" : (trumpTotal >= 270 ? "block" : ((trumpTotal == 269 && trumpTotal == bidenTotal) ? "block" : "none")))
// Winner headline
d3.select('.finish-headline-win')
    .style('display', bidenTotal == trumpTotal ? "none" : "block")
    .style('opacity', 1)
    .select('.finish-headline__status')
    .style('color', bidenTotal > trumpTotal ? bidenCol : trumpCol)
    .transition()
    .text(bidenTotal > trumpTotal ? 'Joe Biden' : 'Donald Trump')

// % Guardian readers who agree

// Custom copy
d3.select('.finish-winner-name')
    .text(bidenTotal > trumpTotal ? 'Biden' : 'Trump')

// Tie scenario
d3.select('.finish-win-text')
    .style("display", bidenTotal == trumpTotal ? "none" : "block")

d3.select('.finish-headline-tie')
    .style("display", bidenTotal == trumpTotal ? "block" : "none")

d3.select('.finish-tie-text')
    .style("display", bidenTotal == trumpTotal ? "block" : "none")


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

    console.log(candidate, newTotal, currentTotal)

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