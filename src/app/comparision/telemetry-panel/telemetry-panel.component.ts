import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewInit,
  OnChanges,
} from '@angular/core';

import * as d3 from 'd3';

@Component({
  selector: 'app-telemetry-panel',
  standalone: true,
  templateUrl: './telemetry-panel.component.html',
  styleUrl: './telemetry-panel.component.scss',
})
export class TelemetryPanelComponent implements AfterViewInit, OnChanges {
  @Input({ required: true })
  driverA: any;

  @Input()
  driverB: any;

  @ViewChild('speedSvg')
  speedSvgRef!: ElementRef<SVGSVGElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    if (this.speedSvgRef) {
      this.render();
    }
  }

  private render(): void {
    if (!this.driverA?.telemetry?.length) {
      return;
    }

    const svg = d3.select(this.speedSvgRef.nativeElement);

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

    const x = d3.scaleLinear().domain([0, 1]).range([0, chartWidth]);

    const maxSpeedA =
      d3.max(this.driverA.telemetry, (d: any) => Number(d.speed)) ?? 0;

    const maxSpeedB =
      d3.max(this.driverB?.telemetry ?? [], (d: any) => Number(d.speed)) ?? 0;

    const maxSpeed = Math.max(maxSpeedA, maxSpeedB);

    const y = d3
      .scaleLinear()
      .domain([0, Math.ceil(maxSpeed / 25) * 25])
      .range([chartHeight, 0]);

    //
    // GRID LINES
    //

    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(8)
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // Y AXIS
    //

    g.append('g').attr('class', 'y-axis').call(d3.axisLeft(y).ticks(8));

    //
    // X AXIS
    //

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(x).ticks(10));

    //
    // SPEED LINE
    //

    const line = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => x(Number(d.rd)))
      .y((d) => y(Number(d.speed)));

    g.append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', '#00e5e5')
      .attr('stroke-width', 2)
      .attr('d', line);

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
