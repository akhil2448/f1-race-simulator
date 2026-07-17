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
import { DriverTheme } from '../../models/comparison-theme.model';
import { SectorMarker } from '../../models/qualifying-comparison.model';
import { CommonModule } from '@angular/common';
import { TelemetryHoverService } from '../../services/telemetry-hover.service';

interface DeltaPoint {
  d: number;
  delta: number;
}

@Component({
  selector: 'app-telemetry-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './telemetry-canvas.component.html',
  styleUrl: './telemetry-canvas.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TelemetryCanvasComponent implements AfterViewInit, OnChanges {
  private playbackService = inject(LapPlaybackService);
  private hoverService = inject(TelemetryHoverService);

  @Input({ required: true })
  driverA: any;

  @Input()
  driverB: any;

  @Input({ required: true })
  driverATheme!: DriverTheme;

  @Input()
  driverBTheme: DriverTheme | null = null;

  @Input({ required: true })
  sectorMarkers: SectorMarker[] = [];

  private readonly SPEED_HEIGHT_RATIO = 0.44;
  private readonly DELTA_HEIGHT_RATIO = 0.1;
  private readonly RPM_HEIGHT_RATIO = 0.14;
  private readonly THROTTLE_HEIGHT_RATIO = 0.18;
  private readonly BRAKE_HEIGHT_RATIO = 0.12;

  @ViewChild('chartSvg')
  chartSvgRef!: ElementRef<SVGSVGElement>;

  tooltipVisible = false;

  tooltipX = 0;
  tooltipOnLeft = false;

  tooltip = {
    distance: 0,

    speed: {
      a: 0,
      b: 0,
    },

    delta: {
      value: 0,
      leader: '',
    },

    rpm: {
      a: 0,
      b: 0,
    },

    throttle: {
      a: 0,
      b: 0,
    },

    brake: {
      a: false,
      b: false,
    },
  };

  private speedGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private rpmGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private throttleGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private brakeGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private deltaGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

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

  private deltaMarkerA!: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private deltaMarkerB?: d3.Selection<
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

  private hoverCursor!: d3.Selection<SVGLineElement, unknown, null, undefined>;

  private hoverSpeedMarkerA!: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private hoverSpeedMarkerB?: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private hoverDeltaMarkerA!: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private hoverDeltaMarkerB?: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private hoverRpmMarkerA!: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private hoverRpmMarkerB?: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private hoverThrottleMarkerA!: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private hoverThrottleMarkerB?: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private hoverBrakeMarkerA!: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private hoverBrakeMarkerB?: d3.Selection<
    SVGCircleElement,
    unknown,
    null,
    undefined
  >;

  private xScale!: d3.ScaleLinear<number, number>;
  private speedYScale!: d3.ScaleLinear<number, number>;
  private deltaYScale!: d3.ScaleLinear<number, number>;
  private rpmYScale!: d3.ScaleLinear<number, number>;
  private throttleYScale!: d3.ScaleLinear<number, number>;
  private brakeYScale!: d3.ScaleLinear<number, number>;

  private deltaSeries: DeltaPoint[] = [];

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

    const driverAColor = this.driverATheme.color;
    const driverBColor = this.driverBTheme?.color ?? '#FFFFFF';

    this.deltaSeries = this.buildDeltaSeries();

    const deltaSeries = this.deltaSeries;
    // console.log(deltaSeries);

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

    const cursorLayer = root.append('g');

    svg
      .on('mousemove', (event: MouseEvent) => {
        const [mouseX, mouseY] = d3.pointer(event);

        const chartX = mouseX - margin.left;

        if (chartX < 0 || chartX > chartWidth) {
          this.tooltipVisible = false;

          this.hoverCursor.attr('opacity', 0);

          this.hoverSpeedMarkerA.attr('opacity', 0);
          this.hoverDeltaMarkerA.attr('opacity', 0);
          this.hoverRpmMarkerA.attr('opacity', 0);
          this.hoverThrottleMarkerA.attr('opacity', 0);
          this.hoverBrakeMarkerA.attr('opacity', 0);

          this.hoverSpeedMarkerB?.attr('opacity', 0);
          this.hoverDeltaMarkerB?.attr('opacity', 0);
          this.hoverRpmMarkerB?.attr('opacity', 0);
          this.hoverThrottleMarkerB?.attr('opacity', 0);
          this.hoverBrakeMarkerB?.attr('opacity', 0);

          return;
        }

        const distance = this.xScale.invert(chartX);
        const hoverX = this.xScale(distance);

        this.hoverCursor
          .attr('x1', hoverX)
          .attr('x2', hoverX)
          .attr('opacity', 1);

        const frameA = this.playbackService.interpolateTelemetryByDistance(
          this.driverA.telemetry,
          distance,
        );

        if (!frameA) {
          return;
        }

        const sampleA = frameA.sample;

        const frameB = this.driverB
          ? this.playbackService.interpolateTelemetryByDistance(
              this.driverB.telemetry,
              distance,
            )
          : null;

        const sampleB = frameB?.sample ?? null;

        this.hoverService.setHoverProgress(sampleA.rd);

        const deltaPoint = this.interpolateDelta(distance);

        this.hoverSpeedMarkerA
          .attr('cx', this.xScale(sampleA.d))
          .attr('cy', this.speedYScale(sampleA.speed))
          .attr('opacity', 1);

        this.hoverRpmMarkerA
          .attr('cx', this.xScale(sampleA.d))
          .attr('cy', this.rpmYScale(sampleA.rpm))
          .attr('opacity', 1);

        this.hoverThrottleMarkerA
          .attr('cx', this.xScale(sampleA.d))
          .attr('cy', this.throttleYScale(sampleA.throttle))
          .attr('opacity', 1);

        this.hoverBrakeMarkerA
          .attr('cx', this.xScale(sampleA.d))
          .attr('cy', this.brakeYScale(sampleA.brake))
          .attr('opacity', 1);

        this.hoverDeltaMarkerA
          .attr('cx', this.xScale(deltaPoint.d))
          .attr('cy', this.deltaYScale(deltaPoint.delta))
          .attr('opacity', 1);

        if (sampleB) {
          this.hoverSpeedMarkerB
            ?.attr('cx', this.xScale(sampleB.d))
            .attr('cy', this.speedYScale(sampleB.speed))
            .attr('opacity', 1);

          this.hoverRpmMarkerB
            ?.attr('cx', this.xScale(sampleB.d))
            .attr('cy', this.rpmYScale(sampleB.rpm))
            .attr('opacity', 1);

          this.hoverThrottleMarkerB
            ?.attr('cx', this.xScale(sampleB.d))
            .attr('cy', this.throttleYScale(sampleB.throttle))
            .attr('opacity', 1);

          this.hoverBrakeMarkerB
            ?.attr('cx', this.xScale(sampleB.d))
            .attr('cy', this.brakeYScale(sampleB.brake))
            .attr('opacity', 1);

          this.hoverDeltaMarkerB
            ?.attr('cx', this.xScale(deltaPoint.d))
            .attr('cy', this.deltaYScale(0))
            .attr('opacity', 1);
        }

        this.tooltipVisible = true;

        const TOOLTIP_OFFSET = 26;
        const TOOLTIP_WIDTH = 165; // approximate width of the metrics box

        this.tooltipOnLeft =
          mouseX + TOOLTIP_OFFSET + TOOLTIP_WIDTH >
          this.chartSvgRef.nativeElement.clientWidth;

        const EXTRA_GAP = 18;

        this.tooltipX = this.tooltipOnLeft
          ? mouseX - TOOLTIP_WIDTH - TOOLTIP_OFFSET - EXTRA_GAP
          : mouseX + TOOLTIP_OFFSET + EXTRA_GAP;

        this.tooltip.distance = Math.round(sampleA.d);

        this.tooltip.distance = Math.round(sampleA.d);

        this.tooltip.speed.a = Math.round(sampleA.speed);
        this.tooltip.rpm.a = Math.round(sampleA.rpm);
        this.tooltip.throttle.a = Math.round(sampleA.throttle);
        this.tooltip.brake.a = sampleA.brake > 0;

        if (sampleB) {
          this.tooltip.speed.b = Math.round(sampleB.speed);
          this.tooltip.rpm.b = Math.round(sampleB.rpm);
          this.tooltip.throttle.b = Math.round(sampleB.throttle);
          this.tooltip.brake.b = sampleB.brake > 0;

          const delta = deltaPoint.delta;

          this.tooltip.delta.value = delta;

          this.tooltip.delta.leader =
            delta > 0
              ? this.driverA.driver
              : delta < 0
                ? this.driverB.driver
                : '';
        }
      })
      .on('mouseleave', () => {
        this.tooltipVisible = false;
        this.hoverService.setHoverProgress(null);
        this.hoverCursor.attr('opacity', 0);
        this.hoverSpeedMarkerA.attr('opacity', 0);
        this.hoverDeltaMarkerA.attr('opacity', 0);
        this.hoverRpmMarkerA.attr('opacity', 0);
        this.hoverThrottleMarkerA.attr('opacity', 0);
        this.hoverBrakeMarkerA.attr('opacity', 0);

        this.hoverSpeedMarkerB?.attr('opacity', 0);
        this.hoverDeltaMarkerB?.attr('opacity', 0);
        this.hoverRpmMarkerB?.attr('opacity', 0);
        this.hoverThrottleMarkerB?.attr('opacity', 0);
        this.hoverBrakeMarkerB?.attr('opacity', 0);
      });

    //
    // Section heights
    //

    const speedHeight = chartHeight * this.SPEED_HEIGHT_RATIO;
    const deltaHeight = chartHeight * this.DELTA_HEIGHT_RATIO;
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
      deltaHeight +
      rpmHeight +
      throttleSectionHeight +
      GRAPH_GAP +
      brakeSectionHeight;
    //
    // Drawing groups
    //

    this.speedGroup = root.append('g');

    this.deltaGroup = root
      .append('g')
      .attr('transform', `translate(0, ${speedHeight})`);

    this.rpmGroup = root
      .append('g')
      .attr('transform', `translate(0, ${speedHeight + deltaHeight})`);

    this.throttleGroup = root
      .append('g')
      .attr(
        'transform',
        `translate(0, ${speedHeight + deltaHeight + rpmHeight})`,
      );

    const throttlePlot = this.throttleGroup.append('g');

    this.brakeGroup = root.append('g').attr(
      'transform',
      `translate(
      0,
      ${speedHeight + deltaHeight + rpmHeight + throttleSectionHeight + GRAPH_GAP}
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
    // Delta plot background
    //
    this.deltaGroup
      .append('rect')
      .attr('class', 'plot-background')
      .attr('width', chartWidth)
      .attr('height', deltaHeight);

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
      .attr('y', speedHeight + deltaHeight + rpmHeight + throttleSectionHeight)
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

    //
    // Speed Y scale
    //
    this.speedYScale = d3
      .scaleLinear()
      .domain([minSpeed, maxSpeed])
      .range([speedHeight - PLOT_PADDING, PLOT_PADDING]);

    //
    // Delta Y scale
    //

    const maxAbsDelta = d3.max(deltaSeries, (d) => Math.abs(d.delta)) ?? 0.01;

    this.deltaYScale = d3
      .scaleLinear()
      .domain([-maxAbsDelta, maxAbsDelta])
      .range([deltaHeight - PLOT_PADDING, PLOT_PADDING]);

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

    const deltaAxis = this.deltaGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(
        d3
          .axisRight(this.deltaYScale)
          .tickValues([-maxAbsDelta, 0, maxAbsDelta])
          .tickFormat((d) => Number(d).toFixed(3)),
      );

    deltaAxis.attr('transform', `translate(${chartWidth},0)`);

    this.deltaGroup
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(90)')
      .attr('x', deltaHeight / 2)
      .attr('y', -(chartWidth + 50))
      .attr('text-anchor', 'middle')
      .text('Delta (s)');

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

    this.deltaGroup
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', this.deltaYScale(0))
      .attr('y2', this.deltaYScale(0))
      .attr('stroke', '#00e5d4')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', 0.8);

    //
    // RPM Axis
    //

    this.rpmGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(
        d3
          .axisLeft(this.rpmYScale)
          .tickValues(rpmTicks)
          .tickFormat((d) => `${Number(d) / 1000}`),
      );

    this.rpmGroup
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(-90)')
      .attr('x', -rpmHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text('RPM (×1000)');

    //
    // Throttle Axis
    //

    const throttleAxis = this.throttleGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisRight(this.throttleYScale).ticks(5));

    throttleAxis.attr('transform', `translate(${chartWidth},0)`);

    this.throttleGroup
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(90)')
      .attr('x', throttleSectionHeight / 2)
      .attr('y', -(chartWidth + 50))
      .attr('text-anchor', 'middle')
      .text('Throttle');
    //
    // Brake Axis
    //

    this.brakeGroup
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.brakeYScale).tickValues([0, 50, 100]));

    this.brakeGroup
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(-90)')
      .attr('x', -brakeSectionHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text('Brake');

    root.append('g').attr('class', 'vertical-grid').call(xGrid);

    // SECTOR MARKINGS
    this.drawSectorMarkers(root, graphBottom);

    //
    // Speed line
    //

    const speedLine = d3
      .line<any>()
      .curve(d3.curveLinear)
      .x((d) => this.xScale(Number(d.d)))
      .y((d) => this.speedYScale(Number(d.speed)));

    //
    // Delta line
    //

    const deltaLine = d3
      .line<{ d: number; delta: number }>()
      .defined((d) => d.delta != null)
      .x((d) => this.xScale(d.d))
      .y((d) => this.deltaYScale(d.delta))
      .curve(d3.curveLinear);

    const deltaArea = d3
      .area<{ d: number; delta: number }>()
      .defined((d) => d.delta != null)
      .x((d) => this.xScale(d.d))
      .y0(() => this.deltaYScale(0))
      .y1((d) => this.deltaYScale(d.delta))
      .curve(d3.curveLinear);

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
    // Delta legend
    //

    const legend = this.deltaGroup
      .append('g')
      .attr('transform', `translate(-70, ${deltaHeight * 0.5 - 22})`);

    // legend
    //   .append('rect')
    //   .attr('width', 70)
    //   .attr('height', 42)
    //   .attr('rx', 6)
    //   .attr('fill', '#000000')
    //   .attr('stroke', '#5c5c5c')
    //   .attr('stroke-width', 0.6)
    //   .attr('opacity', 0.75);

    legend
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -21) // vertical center of the box
      .attr('y', 10) // distance from the box
      .attr('text-anchor', 'middle')
      .attr('fill', '#bdbdbd')
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .attr('font-family', 'Formula1Bold')
      .text('Ahead');

    this.deltaGroup
      .append('line')
      .attr('x1', -45)
      .attr('x2', chartWidth)
      .attr('y1', this.deltaYScale(0))
      .attr('y2', this.deltaYScale(0))
      .attr('stroke', '#00e5d4')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', 0.8);

    legend
      .append('text')
      .attr('x', 18)
      .attr('y', 14)
      .attr('fill', this.driverATheme.color)
      .attr('font-size', 13)
      .attr('font-family', 'Formula1Bold')
      .text(`▲  ${this.driverA.driver}`);

    legend
      .append('text')
      .attr('x', 18)
      .attr('y', 39)
      .attr('fill', this.driverBTheme?.color ?? '#fff')
      .attr('font-size', 13)
      .attr('font-family', 'Formula1Bold')
      .text(`▼  ${this.driverB?.driver ?? ''}`);

    //
    // Delta graph
    //

    this.deltaGroup
      .append('path')
      .datum(deltaSeries)
      .attr('fill', '#00e5d4')
      .attr('fill-opacity', 0.25)
      .attr('stroke', 'none')
      .attr('d', deltaArea);

    this.deltaGroup
      .append('path')
      .datum(deltaSeries)
      .attr('fill', 'none')
      .attr('stroke', '#00e5d4')
      .attr('stroke-width', 2)
      .attr('d', deltaLine);

    //
    // Delta playback markers
    //

    this.deltaMarkerA = this.deltaGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', this.driverATheme.color)
      .attr('stroke', '#111')
      .attr('stroke-width', 1.5);

    if (this.driverB?.telemetry?.length) {
      this.deltaMarkerB = this.deltaGroup
        .append('circle')
        .attr('r', 4)
        .attr('fill', this.driverBTheme?.color ?? '#fff')
        .attr('stroke', '#111')
        .attr('stroke-width', 1.5);
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
    // Hover cursor
    //

    this.hoverCursor = root
      .append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', graphBottom)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .attr('opacity', 0)
      .style('pointer-events', 'none');

    this.hoverSpeedMarkerA = this.speedGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', driverAColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    if (this.driverB?.telemetry?.length) {
      this.hoverSpeedMarkerB = this.speedGroup
        .append('circle')
        .attr('r', 5)
        .attr('fill', driverBColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', 0);
    }

    //
    // Hover Delta markers
    //

    this.hoverDeltaMarkerA = this.createHoverMarker(
      this.deltaGroup,
      this.driverATheme.color,
    );

    if (this.driverB?.telemetry?.length) {
      this.hoverDeltaMarkerB = this.createHoverMarker(
        this.deltaGroup,
        this.driverBTheme?.color ?? '#fff',
      );
    }

    //
    // Hover RPM markers
    //

    this.hoverRpmMarkerA = this.createHoverMarker(this.rpmGroup, driverAColor);

    if (this.driverB?.telemetry?.length) {
      this.hoverRpmMarkerB = this.createHoverMarker(
        this.rpmGroup,
        driverBColor,
      );
    }

    //
    // Hover Throttle markers
    //

    this.hoverThrottleMarkerA = this.createHoverMarker(
      throttlePlot,
      driverAColor,
    );

    if (this.driverB?.telemetry?.length) {
      this.hoverThrottleMarkerB = this.createHoverMarker(
        throttlePlot,
        driverBColor,
      );
    }

    //
    // Hover Brake markers
    //

    this.hoverBrakeMarkerA = this.createHoverMarker(
      this.brakeGroup,
      driverAColor,
    );

    if (this.driverB?.telemetry?.length) {
      this.hoverBrakeMarkerB = this.createHoverMarker(
        this.brakeGroup,
        driverBColor,
      );
    }

    //
    // Bring markers above playback/hover cursors
    //

    // this.speedMarkerA.raise();
    // this.speedMarkerB?.raise();

    // this.deltaMarkerA.raise();
    // this.deltaMarkerB?.raise();

    // this.rpmMarkerA.raise();
    // this.rpmMarkerB?.raise();

    // this.throttleMarkerA.raise();
    // this.throttleMarkerB?.raise();

    // this.brakeMarkerA.raise();
    // this.brakeMarkerB?.raise();

    // this.hoverSpeedMarkerA.raise();
    // this.hoverSpeedMarkerB?.raise();

    // this.hoverDeltaMarkerA.raise();
    // this.hoverDeltaMarkerB?.raise();

    // this.hoverRpmMarkerA.raise();
    // this.hoverRpmMarkerB?.raise();

    // this.hoverThrottleMarkerA.raise();
    // this.hoverThrottleMarkerB?.raise();

    // this.hoverBrakeMarkerA.raise();
    // this.hoverBrakeMarkerB?.raise();

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

  private buildDeltaSeries(): DeltaPoint[] {
    if (!this.driverB?.telemetry?.length) {
      return [];
    }

    const result: DeltaPoint[] = [];

    for (const pointA of this.driverA.telemetry) {
      const frameB = this.playbackService.interpolateTelemetryByDistance(
        this.driverB.telemetry,
        pointA.d,
      );

      if (!frameB) {
        continue;
      }

      result.push({
        d: pointA.d,
        delta: frameB.sample.t - pointA.t,
      });
    }

    return result;
  }

  private updateMarkers(progress: number): void {
    const playbackFrame = this.playbackService.currentFrame;

    if (!playbackFrame) {
      return;
    }

    const frameA = playbackFrame.driverA;

    if (!frameA) {
      return;
    }

    const diff = frameA.elapsedTime - this.driverA.sector1;

    // if (Math.abs(diff) < 0.1) {
    //   console.log({
    //     elapsedTime: frameA.elapsedTime,
    //     distance: frameA.sample.d,
    //     sector1Time: this.driverA.sector1,
    //     sector1Distance: this.sectorMarkers[0].d,
    //     diff,
    //   });
    // }

    // console.log('UPDATE', frameA.elapsedTime);

    const frameB = playbackFrame.driverB;

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

    //
    // Delta playback marker
    //

    const deltaPoint = this.interpolateDelta(frameA.sample.d);

    this.deltaMarkerA
      .attr('cx', this.xScale(deltaPoint.d))
      .attr('cy', this.deltaYScale(deltaPoint.delta));

    this.deltaMarkerB
      ?.attr('cx', this.xScale(deltaPoint.d))
      .attr('cy', this.deltaYScale(0));

    if (this.driverB?.telemetry?.length && this.speedMarkerB) {
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

  private drawSectorMarkers(
    root: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartHeight: number,
  ): void {
    const boundaries = [
      0,
      ...this.sectorMarkers.map((marker) => marker.d),
      this.driverA.maxDistance,
    ];

    const labels = ['S1', 'S2', 'S3'];

    //
    // Vertical divider lines
    //
    boundaries.slice(1, -1).forEach((distance) => {
      const x = this.xScale(distance);

      root
        .append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#7b7b7b')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '6 4')
        .attr('opacity', 0.65);
    });

    //
    // Sector labels
    //
    for (let i = 0; i < 3; i++) {
      const start = this.xScale(boundaries[i]);
      const end = this.xScale(boundaries[i + 1]);

      const center = (start + end) / 2;

      root
        .append('text')
        .attr('x', center)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#bdbdbd')
        .attr('font-size', 13)
        .attr('font-family', 'Formula1')
        .attr('font-weight', 600)
        .text(labels[i]);
    }
  }

  private findClosestSample(data: any[], distance: number) {
    let best = data[0];

    let bestDiff = Math.abs(best.d - distance);

    for (const sample of data) {
      const diff = Math.abs(sample.d - distance);

      if (diff < bestDiff) {
        best = sample;

        bestDiff = diff;
      }
    }

    return best;
  }

  private interpolateDelta(distance: number): DeltaPoint {
    const data = this.deltaSeries;

    let index = 0;

    while (index < data.length - 2 && data[index + 1].d < distance) {
      index++;
    }

    const before = data[index];
    const after = data[index + 1];

    if (!before || !after) {
      return before ?? data[data.length - 1];
    }

    const span = after.d - before.d;

    if (span <= 0) {
      return before;
    }

    const ratio = (distance - before.d) / span;

    return {
      d: distance,
      delta: before.delta + ratio * (after.delta - before.delta),
    };
  }

  private createHoverMarker(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    color: string,
  ) {
    return group
      .append('circle')
      .attr('r', 5)
      .attr('fill', color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0);
  }
}
