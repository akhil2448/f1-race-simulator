import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  ViewEncapsulation,
  inject,
} from '@angular/core';

import * as d3 from 'd3';

import { LapPlaybackService } from '../../services/lap-playback.service';

@Component({
  selector: 'app-telemetry-canvas',
  standalone: true,
  templateUrl: './telemetry-canvas.component.html',
  styleUrl: './telemetry-canvas.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TelemetryCanvasComponent implements AfterViewInit, OnChanges {
  private playbackService = inject(LapPlaybackService);

  @Input({ required: true })
  driverA: any;

  @Input()
  driverB: any;

  private readonly SPEED_HEIGHT_RATIO = 0.54;
  private readonly RPM_HEIGHT_RATIO = 0.15;
  private readonly THROTTLE_HEIGHT_RATIO = 0.18;
  private readonly BRAKE_HEIGHT_RATIO = 0.12;

  @ViewChild('chartSvg')
  chartSvgRef!: ElementRef<SVGSVGElement>;

  private speedGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private rpmGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private throttleGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private brakeGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  private speedMarkerA!: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;
  private speedMarkerB?: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private rpmMarkerA!: d3.Selection<SVGCircleElement, unknown, null, undefined>;
  private rpmMarkerB?: d3.Selection<SVGCircleElement, unknown, null, undefined>;

  private throttleMarkerA!: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;
  private throttleMarkerB?: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private brakeMarkerA!: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;
  private brakeMarkerB?: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private playbackCursor!: d3.Selection<
    SVGLineElement,
    unknown,
    null,
    undefined
  >;

  private xScale!: d3.ScaleLinear<number, number>;
  private speedYScale!: d3.ScaleLinear<number, number>;
  private rpmYScale!: d3.ScaleLinear<number, number>;
  private throttleYScale!: d3.ScaleLinear<number, number>;
  private brakeYScale!: d3.ScaleLinear<number, number>;

  ngAfterViewInit(): void {
    this.render();

    this.playbackService.currentFrame$.subscribe((frame) => {
      if (!frame) {
        return;
      }

      this.updateMarkers(frame.progress);
    });
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
      right: 40,
      bottom: 20,
      left: 50,
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

    const GRAPH_GAP = 4;
    const PLOT_PADDING = 2;

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

    this.speedGroup = root.append('g');

    this.rpmGroup = root
      .append('g')
      .attr('transform', `translate(0, ${speedHeight})`);

    this.throttleGroup = root
      .append('g')
      .attr('transform', `translate(0, ${speedHeight + rpmHeight})`);

    const throttlePlot = this.throttleGroup.append('g');

    this.brakeGroup = root.append('g').attr(
      'transform',
      `translate(
      0,
      ${speedHeight + rpmHeight + throttleSectionHeight + GRAPH_GAP}
    )`,
    );

    //
    // Speed plot background
    //

    this.speedGroup
      .append('rect')
      .attr('class', 'plot-background')
      .attr('width', chartWidth)
      .attr('height', speedHeight);

    //
    // RPM plot background
    //

    this.rpmGroup
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

    this.brakeGroup
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

    this.xScale = d3
      .scaleLinear()
      .domain([0, maxDistance])
      .range([0, chartWidth]);

    const xGrid = d3
      .axisBottom(this.xScale)
      .tickValues(d3.range(0, maxDistance + 1, 500))
      .tickSize(chartHeight)
      .tickFormat(() => '');

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

    this.speedYScale = d3
      .scaleLinear()
      .domain([minSpeed, maxSpeed])
      .range([speedHeight - PLOT_PADDING, PLOT_PADDING]);

    //
    // RPM Y scale
    //

    const maxRpmA =
      d3.max(this.driverA.telemetry, (d: any) => Number(d.rpm)) ?? 0;

    const maxRpmB =
      d3.max(this.driverB?.telemetry ?? [], (d: any) => Number(d.rpm)) ?? 0;

    const minRpmA =
      d3.min(this.driverA.telemetry, (d: any) => Number(d.rpm)) ?? 0;

    const minRpmB =
      d3.min(this.driverB?.telemetry ?? [], (d: any) => Number(d.rpm)) ??
      minRpmA;

    const minRpm = Math.floor(Math.min(minRpmA, minRpmB) / 1000) * 1000;

    const maxRpm = Math.ceil(Math.max(maxRpmA, maxRpmB) / 1000) * 1000;

    const rpmTick = 2000;

    const rpmTicks = d3.range(minRpm, maxRpm + rpmTick, rpmTick);

    this.rpmYScale = d3
      .scaleLinear()
      .domain([minRpm, maxRpm])
      .range([rpmHeight - PLOT_PADDING, PLOT_PADDING]);

    //
    // Throttle Y scale
    //

    this.throttleYScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([throttleSectionHeight - PLOT_PADDING, PLOT_PADDING]);

    this.brakeYScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([brakeSectionHeight - PLOT_PADDING, PLOT_PADDING]);

    //
    // Grid
    //

    this.speedGroup
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(this.speedYScale)
          .ticks(6)
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // Y axis
    //

    this.speedGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.speedYScale).ticks(6));

    this.speedGroup
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(-90)')
      .attr('x', -speedHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text('Speed (km/h)');

    //
    // RPM Grid
    //

    this.rpmGroup
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(this.rpmYScale)
          .tickValues(rpmTicks)
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // Throttle Grid
    //

    this.throttleGroup
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(this.throttleYScale)
          .ticks(5)
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // Brake Grid
    //

    this.brakeGroup
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(this.brakeYScale)
          .tickValues([0, 50, 100])
          .tickSize(-chartWidth)
          .tickFormat(() => ''),
      );

    //
    // RPM Axis
    //

    this.rpmGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(
        d3
          .axisRight(this.rpmYScale)
          .tickValues(rpmTicks)
          .tickFormat((d) => `${Number(d) / 1000}`),
      );

    this.rpmGroup
      .select('.y-axis')
      .attr('transform', `translate(${chartWidth},0)`);

    this.rpmGroup
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(90)')
      .attr('x', rpmHeight / 2)
      .attr('y', -(chartWidth + 30))
      .attr('text-anchor', 'middle')
      .text('RPM (×1000)');

    //
    // Throttle Axis
    //

    this.throttleGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.throttleYScale).ticks(5));

    throttlePlot
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(-90)')
      .attr('x', -throttleSectionHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text('Throttle');

    //
    // Brake Axis
    //

    this.brakeGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisRight(this.brakeYScale).tickValues([0, 50, 100]));

    this.brakeGroup
      .select('.y-axis')
      .attr('transform', `translate(${chartWidth},0)`);

    this.brakeGroup
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(90)')
      .attr('x', brakeSectionHeight / 2)
      .attr('y', -(chartWidth + 30))
      .attr('text-anchor', 'middle')
      .text('Brake');

    root.append('g').attr('class', 'vertical-grid').call(xGrid);

    //
    // Speed line
    //

    const speedLine = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => this.xScale(Number(d.d)))
      .y((d) => this.speedYScale(Number(d.speed)));

    //
    // RPM line
    //

    const rpmLine = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => this.xScale(Number(d.d)))
      .y((d) => this.rpmYScale(Number(d.rpm)));

    //
    // Throttle line
    //

    const throttleLine = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => this.xScale(Number(d.d)))
      .y((d) => this.throttleYScale(Number(d.throttle)));

    const brakeLine = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => this.xScale(Number(d.d)))
      .y((d) => this.brakeYScale(Number(d.brake)));

    this.speedGroup
      .append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', driverAColor)
      .attr('stroke-width', 1.5)
      .attr('d', speedLine);

    this.speedMarkerA = this.speedGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', driverAColor)
      .attr('stroke', '#111')
      .attr('stroke-width', 1.5)
      .attr('cx', this.xScale(Number(this.driverA.telemetry[0].d)))
      .attr('cy', this.speedYScale(Number(this.driverA.telemetry[0].speed)));

    if (this.driverB?.telemetry?.length) {
      this.speedGroup
        .append('path')
        .datum(this.driverB.telemetry)
        .attr('fill', 'none')
        .attr('stroke', driverBColor)
        .attr('stroke-width', 1.5)
        .attr('d', speedLine);

      this.speedMarkerB = this.speedGroup
        .append('circle')
        .attr('r', 4)
        .attr('fill', driverBColor)
        .attr('stroke', '#111')
        .attr('stroke-width', 1.5)
        .attr('cx', this.xScale(Number(this.driverB.telemetry[0].d)))
        .attr('cy', this.speedYScale(Number(this.driverB.telemetry[0].speed)));
    }

    //
    // RPM Driver A
    //

    this.rpmGroup
      .append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', driverAColor)
      .attr('stroke-width', 1.5)
      .attr('d', rpmLine);

    this.rpmMarkerA = this.rpmGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', driverAColor)
      .attr('stroke', '#111')
      .attr('stroke-width', 1.5)
      .attr('cx', this.xScale(Number(this.driverA.telemetry[0].d)))
      .attr('cy', this.rpmYScale(Number(this.driverA.telemetry[0].rpm)));

    throttlePlot
      .append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', driverAColor)
      .attr('stroke-width', 1.5)
      .attr('d', throttleLine);

    this.throttleMarkerA = throttlePlot
      .append('circle')
      .attr('r', 4)
      .attr('fill', driverAColor)
      .attr('stroke', '#111')
      .attr('stroke-width', 1.5)
      .attr('cx', this.xScale(Number(this.driverA.telemetry[0].d)))
      .attr(
        'cy',
        this.throttleYScale(Number(this.driverA.telemetry[0].throttle)),
      );

    this.brakeGroup
      .append('path')
      .datum(this.driverA.telemetry)
      .attr('fill', 'none')
      .attr('stroke', driverAColor)
      .attr('stroke-width', 1.5)
      .attr('d', brakeLine);

    this.brakeMarkerA = this.brakeGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', driverAColor)
      .attr('stroke', '#111')
      .attr('stroke-width', 1.5)
      .attr('cx', this.xScale(Number(this.driverA.telemetry[0].d)))
      .attr('cy', this.brakeYScale(Number(this.driverA.telemetry[0].brake)));

    //
    // RPM Driver B
    //

    if (this.driverB?.telemetry?.length) {
      this.rpmGroup
        .append('path')
        .datum(this.driverB.telemetry)
        .attr('fill', 'none')
        .attr('stroke', driverBColor)
        .attr('stroke-width', 1.5)
        .attr('d', rpmLine);

      this.rpmMarkerB = this.rpmGroup
        .append('circle')
        .attr('r', 4)
        .attr('fill', driverBColor)
        .attr('stroke', '#111')
        .attr('stroke-width', 1.5)
        .attr('cx', this.xScale(Number(this.driverB.telemetry[0].d)))
        .attr('cy', this.rpmYScale(Number(this.driverB.telemetry[0].rpm)));
    }

    if (this.driverB?.telemetry?.length) {
      throttlePlot
        .append('path')
        .datum(this.driverB.telemetry)
        .attr('fill', 'none')
        .attr('stroke', driverBColor)
        .attr('stroke-width', 1.5)
        .attr('d', throttleLine);

      this.throttleMarkerB = throttlePlot
        .append('circle')
        .attr('r', 4)
        .attr('fill', driverBColor)
        .attr('stroke', '#111')
        .attr('stroke-width', 1.5)
        .attr('cx', this.xScale(Number(this.driverB.telemetry[0].d)))
        .attr(
          'cy',
          this.throttleYScale(Number(this.driverB.telemetry[0].throttle)),
        );

      this.brakeGroup
        .append('path')
        .datum(this.driverB.telemetry)
        .attr('fill', 'none')
        .attr('stroke', driverBColor)
        .attr('stroke-width', 1.5)
        .attr('d', brakeLine);

      this.brakeMarkerB = this.brakeGroup
        .append('circle')
        .attr('r', 4)
        .attr('fill', driverBColor)
        .attr('stroke', '#111')
        .attr('stroke-width', 1.5)
        .attr('cx', this.xScale(Number(this.driverB.telemetry[0].d)))
        .attr('cy', this.brakeYScale(Number(this.driverB.telemetry[0].brake)));
    }

    //
    // Playback cursor
    //

    this.playbackCursor = root
      .append('line')
      .attr('class', 'playback-cursor')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', graphBottom)
      .attr('stroke', '#d9d9d9')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.75)
      .style('pointer-events', 'none');

    //
    // Shared bottom X axis
    //

    root
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${graphBottom})`)
      .call(
        d3
          .axisBottom(this.xScale)
          .tickValues(d3.range(0, maxDistance + 1, 500))
          .tickFormat((d) => `${d}`),
      );
  }
  private updateMarkers(progress: number): void {
    const frameA = this.playbackService.interpolateTelemetry(
      this.driverA.telemetry,
      progress,
    );

    if (!frameA) {
      return;
    }

    const cursorX = this.xScale(frameA.sample.d);

    this.playbackCursor.attr('x1', cursorX).attr('x2', cursorX);

    this.speedMarkerA
      .attr('cx', this.xScale(frameA.sample.d))
      .attr('cy', this.speedYScale(frameA.sample.speed));

    this.rpmMarkerA
      .attr('cx', this.xScale(frameA.sample.d))
      .attr('cy', this.rpmYScale(frameA.sample.rpm));

    this.throttleMarkerA
      .attr('cx', this.xScale(frameA.sample.d))
      .attr('cy', this.throttleYScale(frameA.sample.throttle));

    this.brakeMarkerA
      .attr('cx', this.xScale(frameA.sample.d))
      .attr('cy', this.brakeYScale(frameA.sample.brake));

    if (this.driverB?.telemetry?.length && this.speedMarkerB) {
      const frameB = this.playbackService.interpolateTelemetry(
        this.driverB.telemetry,
        progress,
      );

      if (frameB) {
        this.speedMarkerB
          .attr('cx', this.xScale(frameB.sample.d))
          .attr('cy', this.speedYScale(frameB.sample.speed));

        this.rpmMarkerB
          ?.attr('cx', this.xScale(frameB.sample.d))
          .attr('cy', this.rpmYScale(frameB.sample.rpm));

        this.throttleMarkerB
          ?.attr('cx', this.xScale(frameB.sample.d))
          .attr('cy', this.throttleYScale(frameB.sample.throttle));

        this.brakeMarkerB
          ?.attr('cx', this.xScale(frameB.sample.d))
          .attr('cy', this.brakeYScale(frameB.sample.brake));
      }
    }
  }
}
