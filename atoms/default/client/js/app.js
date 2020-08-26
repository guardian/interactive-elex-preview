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
    const groups = sheetData.sheets.state_groups.filter(group => group.id);
    return groups
}

loadGroupData().then(groups => {
    const groupsInUse = groups.filter(group => group.states)
    const boxes = createBoxes(groupsInUse)
    console.log(groupsInUse)
    const solids = groups.filter(group => group.solid)
    const solidData = {
        trump: solids[0].ev_count,
        biden: solids[1].ev_count
    }
    // createInitialBars(solidData)

    // boxes.onChange(data => {
    //     bars.update(data);
    // }

    // console.log(solidData)
})


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

    const buttonDiv = groupDivs
        .append('div')
        .classed("state-group__buttondiv", true)
}


// function createInitialBars(solidData) {

//     // Bar setup
//     const x = d3.scaleLinear().domain([0, 538]).range([0, 100])

//     const y = d3.scaleLinear()
//         .domain([0, 1])
//         .range([0, 100])

//     // 270 majority finish line
//     const finish = d3.select('.elex-votes')
//         .append('div')
//         .attr("class", 'elex-votes-finishline')
//         .style('left', x(270) + '%');

//     finish
//         .append('div')
//         .attr("class", "elex-votes-finish-label")
//         .text("270 to win");

//     // Fill solid
//     const trumpBar = d3.select('.bar_container__trump')
//     const bidenBar = d3.select('.bar_container__biden')
//         .style("width", x(solidData.biden) + '%')
//     console.log(x(solidData.biden) + '%')
// }


// Filled status headline
// d3.select('.elex-votes-filled')
//     .style('opacity', 1)
//     .select('.elex-votes-filled__status')
//     .style('color', votesFor > votesAgainst ? statusHex.succeed : statusHex.fail)
//     .transition()
//     .text(votesFor > votesAgainst ? 'pass' : 'reject')



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
        .attr('d', path)
        .attr('class', 'elex-state')

}
// call the draw function
draw()