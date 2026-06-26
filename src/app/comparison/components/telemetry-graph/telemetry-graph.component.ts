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
  selector: 'app-telemetry-graph',
  standalone: true,
  templateUrl: './telemetry-graph.component.html',
  styleUrl: './telemetry-graph.component.scss',
})
export class TelemetryGraphComponent implements AfterViewInit, OnChanges {
  @Input({ required: true })
  driverA: any;

  @Input()
  driverB: any;

  /**
   * speed
   * rpm
   * throttle
   * brake
   */
  @Input({ required: true })
  metric!: string;

  @Input()
  minY = 0;

  @Input()
  maxY?: number;

  @Input()
  tickStep = 50;

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

    const svg = d3.select(this.chartSvgRef.nativeElement);

    svg.selectAll('*').remove();

    const width = 1400;
    const height = 500;

    const margin = {
      top: 15,
      right: 20,
      bottom: 35,
      left: 55,
    };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('rect')
      .attr('class', 'plot-background')
      .attr('width', chartWidth)
      .attr('height', chartHeight);

    //
    // X SCALE
    //

    const x = d3.scaleLinear().domain([0, 1]).range([0, chartWidth]);

    //
    // AUTO MAX VALUE
    //

    let maxValue = this.maxY;

    if (maxValue == null) {
      const maxA =
        d3.max(this.driverA.telemetry, (d: any) => Number(d[this.metric])) ?? 0;

      const maxB =
        d3.max(this.driverB?.telemetry ?? [], (d: any) =>
          Number(d[this.metric]),
        ) ?? 0;

      maxValue =
        Math.ceil(Math.max(maxA, maxB) / this.tickStep) * this.tickStep;
    }

    //
    // Y SCALE
    //

    const y = d3
      .scaleLinear()
      .domain([this.minY, maxValue])
      .range([chartHeight, 0]);

    //
    // GRID
    //

    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // Y AXIS
    //

    g.append('g').attr('class', 'y-axis').call(d3.axisLeft(y));

    //
    // X AXIS
    //

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(10));

    //
    // LINE GENERATOR
    //

    const line = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => x(Number(d.rd)))
      .y((d) => y(Number(d[this.metric])));

    //
    // DRIVER A
    //

    g.append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', '#00e5e5')
      .attr('stroke-width', 2)
      .attr('d', line);

    //
    // DRIVER B
    //

    if (this.driverB?.telemetry?.length) {
      g.append('path')
        .datum(this.driverB.telemetry)
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('d', line);
    }
  }
}
