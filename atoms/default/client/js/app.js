// if you want to import a module from shared/js then you can
// just do e.g. import Scatter from "shared/js/scatter.js"
import * as d3 from 'd3'
import {
    $
} from 'shared/js/util'

import * as topojson from 'topojson'
import statesTopo from 'us-atlas/counties-10m.json'
import bubbleData from 'shared/server/data_joined.json'

async function loadGroupData() {
    // fetch data from url, get state groupings
    const sheetData = await fetch('http://interactive.guim.co.uk/docsdata-test/1xxtoiJ5Rn1cVXwynMgJyGr4Cd40znZoI9RYiMj_rMe0.json')
        .then(res => res.json())
    const groups = sheetData.sheets.state_cards.filter(group => group.type);
    return groups
}



loadGroupData().then(groups => {
    const statesInUse = groups.filter(group => group.groups_in_use)
    const boxes = createBoxes(statesInUse)
    const sections = groups.filter(group => group.type == "group")
    const initialBar = groups.filter(group => group.type == "initial_bar")

    createInitialGraphics(initialBar)
    // boxes.onChange(data => {
    //     bars.update(data);
    // })

})

const bidenCol = '#25428f'
const trumpCol = '#cc0a11'

function createBoxes(statesInUse) {
    const statesDiv = d3.select('.state-cards')

    const stateDivs = statesDiv
        .selectAll('.state-card')
        .data(statesInUse)
        .enter()
        .append('div')
        .classed('state-card', true)

    stateDivs
        .append('h2')
        .html(d => d.state)
        .classed('state-card__name', true)

    stateDivs
        .append('h2')
        .html(d => d.ecvs + " electoral votes")
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
        .html(d => Math.abs(d.margin2016))
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
        .html(d => Math.abs(d.polling2020))
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

    const setToggle = (stateDiv, d) => {
        const options = stateDiv.selectAll('.state-card-toggle__option')
        const inner = stateDiv.select('.state-card-toggle__inner')

        const perc = d === 'biden' ? 0 : (d === 'unselected' ? 33.3333 : 66.6667)
        const backCol = d === 'biden' ? bidenCol : (d === 'unselected' ? "#dcdcdc" : trumpCol)

        inner.style('left', perc + '%')
        inner.style('background-color', backCol)

        options.classed('state-card-toggle__option--selected', d2 => {
            return d2 === d
        })
    }

    const toggleDiv = stateDivs
        .append('div')
        .classed("state-card__toggle", true)

    const inner = toggleDiv
        .append('div')
        .classed('state-card-toggle__inner', true)

    const options = toggleDiv
        .selectAll('blah')
        .data(['biden', 'unselected', 'trump'])
        .enter()
        .append('div')
        .attr('class', d => `state-card-toggle__option state-card-toggle__option--${d.toLowerCase()}`)
        .text(d => d.slice(0, 1).toUpperCase() + d.slice(1))

    stateDivs.each(function (d, i) {
        const stateDiv = d3.select(this)
        setToggle(stateDiv, d.candidate_select)
    })

}


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

    const solidData = {
        trump: initialBar[0].group_ecvs,
        biden: initialBar[1].group_ecvs
    }

    const trumpSolidStates = initialBar[0].group_states.split(", ")

    const bidenSolidStates = initialBar[1].group_states.split(", ")


    // Fill solid
    const trumpBar = d3.select('.bar-container__trump')
        .style("width", x(solidData.trump) + '%')
        .style("left", x(538) - x(solidData.trump) + '%')
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