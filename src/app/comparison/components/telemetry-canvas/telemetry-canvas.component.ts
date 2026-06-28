import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
} from '@angular/core';

import * as d3 from 'd3';

@Component({
  selector: 'app-telemetry-canvas',
  standalone: true,
  templateUrl: './telemetry-canvas.component.html',
  styleUrl: './telemetry-canvas.component.scss',
})
export class TelemetryCanvasComponent implements AfterViewInit, OnChanges {
  @Input({ required: true })
  driverA: any;

  @Input()
  driverB: any;

  private readonly SPEED_HEIGHT_RATIO = 0.54;
  private readonly RPM_HEIGHT_RATIO = 0.17;
  private readonly THROTTLE_HEIGHT_RATIO = 0.17;
  private readonly BRAKE_HEIGHT_RATIO = 0.12;

  @ViewChild('chartSvg')
  chartSvgRef!: ElementRef<SVGSVGElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    if (this.chartSvgRef) {
      this.render();
    }
  }

  private render(): void {
    if (!this.driverA?.telemetry?.length) {
      return;
    }

    const driverAColor = '#00e5e5';
    const driverBColor = '#ffffff';

    const SPEED_TICK = 25;

    const svg = d3.select(this.chartSvgRef.nativeElement);

    svg.selectAll('*').remove();

    const SVG_WIDTH = 1400;
    const SVG_HEIGHT = 580;

    const margin = {
      top: 15,
      right: 20,
      bottom: 35,
      left: 55,
    };

    const chartWidth = SVG_WIDTH - margin.left - margin.right;
    const chartHeight = SVG_HEIGHT - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);

    //
    // Root
    //

    const root = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    //
    // Section heights
    //

    const speedHeight = chartHeight * this.SPEED_HEIGHT_RATIO;
    const rpmHeight = chartHeight * this.RPM_HEIGHT_RATIO;
    const throttleHeight = chartHeight * this.THROTTLE_HEIGHT_RATIO;

    //
    // Bottom section layout
    //

    const GRAPH_GAP = 8;

    // const totalBottomHeight =
    //   chartHeight * (this.THROTTLE_HEIGHT_RATIO + this.BRAKE_HEIGHT_RATIO);

    const throttleSectionHeight = chartHeight * this.THROTTLE_HEIGHT_RATIO;

    const brakeSectionHeight = chartHeight * this.BRAKE_HEIGHT_RATIO;

    const graphBottom =
      speedHeight +
      rpmHeight +
      throttleSectionHeight +
      GRAPH_GAP +
      brakeSectionHeight;

    //
    // Drawing groups
    //

    const speedGroup = root.append('g');

    const rpmGroup = root
      .append('g')
      .attr('transform', `translate(0, ${speedHeight})`);

    const throttleGroup = root
      .append('g')
      .attr('transform', `translate(0, ${speedHeight + rpmHeight})`);

    const throttlePlot = throttleGroup.append('g');

    const brakePlot = root.append('g').attr(
      'transform',
      `translate(
      0,
      ${speedHeight + rpmHeight + throttleSectionHeight + GRAPH_GAP}
    )`,
    );

    //
    // Speed plot background
    //

    speedGroup
      .append('rect')
      .attr('class', 'plot-background')
      .attr('width', chartWidth)
      .attr('height', speedHeight);

    //
    // RPM plot background
    //

    rpmGroup
      .append('rect')
      .attr('class', 'plot-background')
      .attr('width', chartWidth)
      .attr('height', rpmHeight);

    //
    // Throttle plot background
    //

    throttlePlot
      .append('rect')
      .attr('class', 'plot-background')
      .attr('width', chartWidth)
      .attr('height', throttleSectionHeight);

    brakePlot
      .append('rect')
      .attr('class', 'plot-background')
      .attr('width', chartWidth)
      .attr('height', brakeSectionHeight);

    root
      .append('rect')
      .attr('class', 'plot-background')
      .attr('x', 0)
      .attr('y', speedHeight + rpmHeight + throttleSectionHeight)
      .attr('width', chartWidth)
      .attr('height', GRAPH_GAP);
    //
    // Shared X scale (distance in metres)
    //

    const maxDistanceA =
      d3.max(this.driverA.telemetry, (d: any) => Number(d.d)) ?? 0;

    const maxDistanceB =
      d3.max(this.driverB?.telemetry ?? [], (d: any) => Number(d.d)) ?? 0;

    const maxDistance = Math.max(maxDistanceA, maxDistanceB);

    const x = d3.scaleLinear().domain([0, maxDistance]).range([0, chartWidth]);

    //
    // Speed Y scale
    //

    const minSpeedA =
      d3.min(this.driverA.telemetry, (d: any) => Number(d.speed)) ?? 0;

    const minSpeedB =
      d3.min(this.driverB?.telemetry ?? [], (d: any) => Number(d.speed)) ??
      minSpeedA;

    const maxSpeedA =
      d3.max(this.driverA.telemetry, (d: any) => Number(d.speed)) ?? 0;

    const maxSpeedB =
      d3.max(this.driverB?.telemetry ?? [], (d: any) => Number(d.speed)) ??
      maxSpeedA;

    const minSpeed =
      Math.floor(Math.min(minSpeedA, minSpeedB) / SPEED_TICK) * SPEED_TICK;

    const maxSpeed =
      Math.ceil(Math.max(maxSpeedA, maxSpeedB) / SPEED_TICK) * SPEED_TICK;

    const y = d3
      .scaleLinear()
      .domain([minSpeed, maxSpeed])
      .range([speedHeight, 0]);

    //
    // RPM Y scale
    //

    const maxRpmA =
      d3.max(this.driverA.telemetry, (d: any) => Number(d.rpm)) ?? 0;

    const maxRpmB =
      d3.max(this.driverB?.telemetry ?? [], (d: any) => Number(d.rpm)) ?? 0;

    const maxRpm = Math.ceil(Math.max(maxRpmA, maxRpmB) / 1000) * 1000;

    const rpmY = d3.scaleLinear().domain([0, maxRpm]).range([rpmHeight, 0]);

    //
    // Throttle Y scale
    //

    const throttleY = d3
      .scaleLinear()
      .domain([0, 100])
      .range([throttleSectionHeight, 0]);

    const brakeY = d3
      .scaleLinear()
      .domain([0, 100])
      .range([brakeSectionHeight, 0]);

    //
    // Grid
    //

    speedGroup
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(6)
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // Y axis
    //

    speedGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).ticks(6));

    //
    // RPM Grid
    //

    rpmGroup
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(rpmY)
          .ticks(4)
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // Throttle Grid
    //

    throttleGroup
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(throttleY)
          .ticks(5)
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // Brake Grid
    //

    brakePlot
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(brakeY)
          .tickValues([0, 50, 100])
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // RPM Axis
    //

    rpmGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(rpmY).ticks(4));

    //
    // Throttle Axis
    //

    throttleGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(throttleY).ticks(5));

    //
    // Brake Axis
    //

    brakePlot
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(brakeY).tickValues([0, 50, 100]));

    //
    // Speed line
    //

    const speedLine = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => x(Number(d.d)))
      .y((d) => y(Number(d.speed)));

    //
    // RPM line
    //

    const rpmLine = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => x(Number(d.d)))
      .y((d) => rpmY(Number(d.rpm)));

    //
    // Throttle line
    //

    const throttleLine = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => x(Number(d.d)))
      .y((d) => throttleY(Number(d.throttle)));

    const brakeLine = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => x(Number(d.d)))
      .y((d) => brakeY(Number(d.brake)));

    speedGroup
      .append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', driverAColor)
      .attr('stroke-width', 1.5)
      .attr('d', speedLine);

    if (this.driverB?.telemetry?.length) {
      speedGroup
        .append('path')
        .datum(this.driverB.telemetry)
        .attr('fill', 'none')
        .attr('stroke', driverBColor)
        .attr('stroke-width', 1.5)
        .attr('d', speedLine);
    }

    //
    // RPM Driver A
    //

    rpmGroup
      .append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', driverAColor)
      .attr('stroke-width', 1.5)
      .attr('d', rpmLine);

    throttlePlot
      .append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', driverAColor)
      .attr('stroke-width', 1.5)
      .attr('d', throttleLine);

    brakePlot
      .append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', driverAColor)
      .attr('stroke-width', 1.5)
      .attr('d', brakeLine);

    //
    // RPM Driver B
    //

    if (this.driverB?.telemetry?.length) {
      rpmGroup
        .append('path')
        .datum(this.driverB.telemetry)
        .attr('fill', 'none')
        .attr('stroke', driverBColor)
        .attr('stroke-width', 1.5)
        .attr('d', rpmLine);
    }

    if (this.driverB?.telemetry?.length) {
      throttlePlot
        .append('path')
        .datum(this.driverB.telemetry)
        .attr('fill', 'none')
        .attr('stroke', driverBColor)
        .attr('stroke-width', 1.5)
        .attr('d', throttleLine);

      brakePlot
        .append('path')
        .datum(this.driverB.telemetry)
        .attr('fill', 'none')
        .attr('stroke', driverBColor)
        .attr('stroke-width', 1.5)
        .attr('d', brakeLine);
    }

    //
    // Shared bottom X axis
    //

    root
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${graphBottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(d3.range(0, maxDistance + 1, 500))
          .tickFormat((d) => `${d}`),
      );
  }
}
