import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  MarkAreaComponent,
  GraphicComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChartsOption, ECharts, LineSeriesOption } from 'echarts';

import {
  RaceAnalyzerResponse,
  RaceAnalyzerLap,
} from '../../../../models/race-performance-analysis.model';
import { SelectedLap } from '../../../../models/lap-details.model';

interface ChartLapPoint {
  value: [number, number];

  lap: RaceAnalyzerLap;

  driver: string;

  driverIndex: number;

  stint: number;

  compound: string;

  itemStyle: {
    color: string;
    borderColor: string;
    borderWidth: number;
    shadowColor?: string;
    shadowBlur?: number;
  };

  lineColor: string;
}

interface DriverChartSeries {
  driver: string;
  color: string;
  points: ChartLapPoint[];
}

interface ResponsiveChartSettings {
  legendLineWidth: number;
  legendLineLength: number;

  symbolSize: number;

  lineWidths: {
    normal: number;
    selected: number;
    faded: number;
  };

  trackStatusLabelFontSize: number;
  trackStatusLabelRows: number[];

  // NEW
  grid: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };

  legend: {
    top: number;
    right: number;
    spacing: number;
    textGap: number;
  };

  rainTimeline: {
    labelBottom: number;
    stripBottom: number;
    stripHeight: number;
    fontSize: number;
    leftPadding: number;
  };
}

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkAreaComponent,
  GraphicComponent,
  CanvasRenderer,
]);

@Component({
  selector: 'app-race-performance-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './race-performance-chart.component.html',
  styleUrl: './race-performance-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacePerformanceChartComponent {
  private analysis!: RaceAnalyzerResponse;

  @Output()
  lapSelected = new EventEmitter<SelectedLap>();

  @Input({ required: true })
  set analysisData(value: RaceAnalyzerResponse) {
    this.analysis = value;

    this.buildChart();
  }

  readonly hideOutliers = signal(true);

  readonly smoothChart = signal(true);

  readonly showTrackStatus = signal(false);
  readonly showRainLaps = signal(true);

  get hasTrackStatus(): boolean {
    return this.analysis?.trackMetadata?.statusRanges?.length > 0;
  }

  get hasRainRanges(): boolean {
    return this.analysis?.trackMetadata?.rainRanges?.length > 0;
  }

  chartOptions: EChartsOption = {};
  private chart!: ECharts;
  private selectedSeriesIndex: number | null = null;
  private hoveredSeriesIndex: number | null = null;

  private driverLapLookup = new Map<string, Map<number, ChartLapPoint>>();

  private buildChart(): void {
    const series = this.buildSeries();

    const responsive = this.getResponsiveChartSettings();

    const grid = {
      ...responsive.grid,
    };

    if (
      this.showRainLaps() &&
      this.analysis.trackMetadata.rainRanges.length > 0
    ) {
      grid.bottom += responsive.rainTimeline.labelBottom + 10;
    }

    this.chartOptions = {
      backgroundColor: '#1a1a1a',
      animation: false,
      grid,
      graphic: [],
      tooltip: {
        trigger: 'item',
        renderMode: 'html',
        className: 'pitwall-tooltip-wrapper',
        enterable: false,
        confine: true,
        borderWidth: 0,
        backgroundColor: 'transparent',
        extraCssText:
          'box-shadow:none;padding:0;border:none;background:transparent;',
        formatter: (params: any) => this.buildTooltip(params),
      },

      xAxis: {
        type: 'value',
        maxInterval: 5,
        name: 'Lap Number',
        nameLocation: 'middle',
        nameGap: 24,
        min: 1,
        max: this.analysis.race.totalLaps,
        splitLine: {
          show: true,

          lineStyle: {
            color: '#2c2c2c',
            width: 1,
          },
        },
        axisLine: {
          lineStyle: {
            color: '#9ca3af',
          },
        },
        axisLabel: {
          color: '#d1d5db',
        },
        nameTextStyle: {
          color: '#d1d5db',
        },
      },

      yAxis: {
        type: 'value',
        name: 'Lap Time (seconds)',
        nameLocation: 'middle',
        nameGap: 24,
        scale: true,
        splitLine: {
          show: true,

          lineStyle: {
            color: '#2c2c2c',
            width: 1,
          },
        },
        axisLine: {
          lineStyle: {
            color: '#9ca3af',
          },
        },
        axisLabel: {
          color: '#d1d5db',
        },
        nameTextStyle: {
          color: '#d1d5db',
        },
      },

      series: series.map(
        (driver, index): LineSeriesOption => ({
          name: driver.driver,
          type: 'line',
          triggerEvent: true,
          smooth: this.smoothChart(),
          symbol: 'circle',
          data: driver.points,
          showSymbol: true,
          symbolSize: responsive.symbolSize,
          lineStyle: {
            width: responsive.lineWidths.normal,
            color: driver.color,
          },
          itemStyle: {
            borderWidth: 2,
          },
          markArea:
            index === 0
              ? {
                  silent: true,
                  data: this.buildTrackStatusMarkAreas(),
                }
              : undefined,
        }),
      ),
    };
  }

  onChartInit(chart: ECharts): void {
    this.chart = chart;

    chart.on('click', this.onSeriesClick.bind(this));

    chart.on('mouseover', (params: any) => {
      if (this.selectedSeriesIndex !== null) {
        return;
      }

      if (params.componentType !== 'series') {
        return;
      }

      this.hoveredSeriesIndex = params.seriesIndex;
      this.updateSeriesStyles();
    });

    chart.on('mousemove', (params: any) => {
      if (this.selectedSeriesIndex !== null) {
        return;
      }

      if (params.componentType !== 'series') {
        if (this.hoveredSeriesIndex !== null) {
          this.hoveredSeriesIndex = null;
          this.updateSeriesStyles();
        }
      }
    });

    chart.on('globalout', () => {
      if (this.selectedSeriesIndex !== null) {
        return;
      }

      this.hoveredSeriesIndex = null;
      this.updateSeriesStyles();
    });

    chart.on('mouseout', () => {
      if (this.selectedSeriesIndex !== null) {
        return;
      }

      this.hoveredSeriesIndex = null;
      this.updateSeriesStyles();
    });

    // Fires after the chart has finished rendering.
    // This guarantees convertToPixel() returns correct values.
    chart.on('finished', () => {
      requestAnimationFrame(() => {
        this.refreshRainTimeline();
      });
    });

    chart.getZr().on('click', this.onCanvasClick.bind(this));
  }

  hideTooltip(): void {
    this.chart?.dispatchAction({
      type: 'hideTip',
    });
  }

  private onSeriesClick(params: any): void {
    //
    // Ignore clicks on symbols.
    //
    if (params.componentType !== 'series') {
      return;
    }

    if (params.componentSubType !== 'line') {
      return;
    }

    //
    // Every click on a line series gives us a ChartLapPoint.
    // Emit the selected lap.
    //
    if (params.data) {
      this.emitSelectedLap(params);
    }

    this.selectedSeriesIndex = params.seriesIndex;

    this.updateSeriesStyles();
  }

  private emitSelectedLap(params: any): void {
    const point = params.data as ChartLapPoint;

    const driver = this.analysis.drivers[point.driverIndex];

    const stint = driver.stints.find((s) => s.stint === point.stint);

    if (!stint) {
      return;
    }

    this.lapSelected.emit({
      id: `${driver.driver}-${point.lap.lapNumber}`,
      driver,
      stint,
      lap: point.lap,
      pinned: false,
      lineColor: point.lineColor,
    });
  }

  private onCanvasClick(event: any): void {
    //
    // Ignore clicks that already hit a series.
    //
    if (event.target) {
      return;
    }

    this.selectedSeriesIndex = null;
    this.hoveredSeriesIndex = null;

    this.updateSeriesStyles();
  }

  private updateSeriesStyles(): void {
    if (!this.chart) {
      return;
    }

    this.chart.setOption({
      series: this.analysis.drivers.map((_, index) => {
        const activeIndex = this.selectedSeriesIndex ?? this.hoveredSeriesIndex;
        const hasActiveSelection = activeIndex !== null;

        const selected = hasActiveSelection && activeIndex === index;

        const responsive = this.getResponsiveChartSettings();

        const normalSize = responsive.symbolSize;
        const lineWidths = responsive.lineWidths;

        return {
          lineStyle: {
            opacity: !hasActiveSelection ? 1 : selected ? 1 : 0.18,
            width: !hasActiveSelection
              ? lineWidths.normal
              : selected
                ? lineWidths.selected
                : lineWidths.faded,
          },

          itemStyle: {
            opacity: !hasActiveSelection ? 1 : selected ? 1 : 0.28,
          },

          symbolSize: !hasActiveSelection
            ? normalSize
            : selected
              ? normalSize + 3
              : normalSize,
        };
      }),
    });
  }

  toggleHideOutliers(): void {
    this.hideOutliers.update((value) => !value);

    this.buildChart();
  }

  toggleSmoothChart(): void {
    this.smoothChart.update((value) => !value);

    this.buildChart();
  }

  toggleTrackStatus(): void {
    this.showTrackStatus.update((value) => !value);

    this.buildChart();
  }

  toggleRainLaps(): void {
    this.showRainLaps.update((v) => !v);

    if (this.chart) {
      this.refreshRainTimeline();
    }

    this.buildChart();
  }

  private getOutlierThreshold(): number {
    const lapTimes = this.analysis.drivers
      .flatMap((driver) => driver.stints.flatMap((stint) => stint.laps))
      .filter((lap) => lap.lapTime !== null)
      .map((lap) => lap.lapTime!);

    if (lapTimes.length === 0) {
      return Number.MAX_VALUE;
    }

    const fastestLap = lapTimes.reduce(
      (fastest, current) => Math.min(fastest, current),
      Number.MAX_VALUE,
    );

    return fastestLap * 1.07;
  }

  private buildSeries(): DriverChartSeries[] {
    const drivers = this.analysis.drivers;

    const outlierThreshold = this.getOutlierThreshold();

    this.driverLapLookup.clear();

    return drivers.map((driver, index) => {
      //
      // Flatten all laps across every stint.
      //
      const points: ChartLapPoint[] = [];

      const lapLookup = new Map<number, ChartLapPoint>();

      for (const stint of driver.stints) {
        for (const lap of stint.laps) {
          if (lap.lapTime === null) {
            continue;
          }

          if (this.hideOutliers() && lap.lapTime > outlierThreshold) {
            continue;
          }

          const highlightColor = this.getLapHighlightColor(lap, driver.driver);
          const driverColor = this.getDriverColor(index);

          const point: ChartLapPoint = {
            value: [lap.lapNumber, lap.lapTime],

            lap,

            driver: driver.driver,
            driverIndex: index,
            stint: stint.stint,
            compound: stint.compound,
            lineColor: driverColor,

            itemStyle: highlightColor
              ? {
                  // PB / SB dot
                  color: highlightColor,
                  borderColor: highlightColor,
                  borderWidth: 3,

                  // Special glow for PB / SB
                  shadowColor: highlightColor,
                  shadowBlur: 14,
                }
              : {
                  // Normal tyre dot
                  color: this.getTyreColor(stint.compound),
                  borderColor: driverColor,
                  borderWidth: 2,
                },
          };

          points.push(point);

          lapLookup.set(lap.lapNumber, point);
        }
      }

      this.driverLapLookup.set(driver.driver, lapLookup);

      return {
        driver: driver.driver,
        color: this.getDriverColor(index),
        points,
      };
    });
  }

  private getDriverColor(driverIndex: number): string {
    const drivers = this.analysis.drivers;

    const driver = drivers[driverIndex];

    //
    // Primary driver always uses the team color.
    //
    if (driverIndex === 0) {
      return `#${driver.teamColor}`;
    }

    //
    // If both drivers are on the same team,
    // use white for the second driver.
    //
    if (drivers.length > 1 && driver.teamColor === drivers[0].teamColor) {
      return '#FFFFFF';
    }

    return `#${driver.teamColor}`;
  }

  private getLapHighlightColor(
    lap: RaceAnalyzerLap,
    driver: string,
  ): string | null {
    /*
     * SB always takes priority over PB.
     *
     * This is important because the session-best driver may not
     * currently be selected on the chart.
     *
     * We therefore compare against the GLOBAL session-best
     * driver + lap stored in race metadata.
     */
    if (this.isSessionBestLap(lap, driver)) {
      return '#d77cff';
    }

    /*
     * If this lap is a personal best, use PB green.
     */
    if (lap.personalBest) {
      return '#35d07f';
    }

    /*
     * Normal lap -> use tyre compound color.
     */
    return null;
  }

  private isSessionBestLap(lap: RaceAnalyzerLap, driver: string): boolean {
    return (
      driver === this.analysis.race.sessionFastestDriver &&
      lap.lapNumber === this.analysis.race.sessionFastestLap
    );
  }

  private getTyreColor(compound: string): string {
    switch (compound.toUpperCase()) {
      case 'SOFT':
        return '#ff2b2b';

      case 'MEDIUM':
        return '#ffd400';

      case 'HARD':
        return '#dfdfdf';

      case 'INTERMEDIATE':
        return '#3cff00';

      case 'WET':
        return '#0066ff';

      default:
        return '#ffffff';
    }
  }

  private getTrackStatusColor(status: string): string {
    switch (status) {
      case 'RED_FLAG':
        return 'rgba(220, 38, 38, 0.18)';

      case 'SAFETY_CAR':
        return 'rgba(255, 214, 10, 0.18)';

      case 'YELLOW':
        return 'rgba(255, 245, 80, 0.12)';

      case 'VSC':
        return 'rgba(155, 89, 255, 0.18)';

      default:
        return 'transparent';
    }
  }

  private buildTrackStatusMarkAreas(): Array<[any, any]> {
    if (!this.showTrackStatus()) {
      return [];
    }

    const responsive = this.getResponsiveChartSettings();

    const labelRows = responsive.trackStatusLabelRows;

    return this.analysis.trackMetadata.statusRanges.map((range, index) => [
      {
        xAxis: range.startLap,

        itemStyle: {
          color: this.getTrackStatusColor(range.status),
        },

        label: {
          show: true,

          position:
            range.startLap <= 2
              ? 'insideTopLeft'
              : range.endLap >= this.analysis.race.totalLaps - 1
                ? 'insideTopRight'
                : 'insideTop',

          align: 'center',
          verticalAlign: 'top',
          padding: [2, 4],

          distance: labelRows[index % labelRows.length],

          formatter: this.getTrackStatusLabel(range),

          color: '#f5f5f5',

          fontFamily: 'Formula1',

          fontWeight: 'bold',

          fontSize: responsive.trackStatusLabelFontSize,
        },
      },
      {
        xAxis: range.endLap + 1,
      },
    ]);
  }

  private buildDriverLegend(): any[] {
    const responsive = this.getResponsiveChartSettings();

    const fontSize = responsive.trackStatusLabelFontSize + 1;

    const lineLength = responsive.legendLineLength;

    const lineWidth = responsive.legendLineWidth;

    const spacing = responsive.legend.spacing;
    const startRight = responsive.legend.right;

    return this.analysis.drivers.map((driver, index) => {
      const right =
        startRight + (this.analysis.drivers.length - 1 - index) * spacing;

      return {
        type: 'group',

        right,

        top: responsive.legend.top,

        z: 100,
        zlevel: 10,

        children: [
          {
            type: 'line',

            shape: {
              x1: 0,
              y1: 8,
              x2: lineLength,
              y2: 8,
            },

            style: {
              stroke: this.getDriverColor(index),
              lineWidth,
              lineCap: 'round',
            },
          },

          {
            type: 'circle',

            shape: {
              cx: lineLength / 2,
              cy: 8,
              r: lineWidth + 1,
            },

            style: {
              fill: this.getDriverColor(index),
              stroke: '#1a1a1a',
              lineWidth: 2,
            },
          },

          {
            type: 'text',

            left: lineLength + responsive.legend.textGap,

            top: 0,

            style: {
              text: driver.driver,
              fill: '#e5e7eb',
              font: `${fontSize}px Formula1Bold`,
              textVerticalAlign: 'middle',
            },
          },
        ],
      };
    });
  }

  private buildRainTimeline(): any[] {
    if (
      !this.showRainLaps() ||
      this.analysis.trackMetadata.rainRanges.length === 0
    ) {
      return [];
    }

    const responsive = this.getResponsiveChartSettings();

    return this.analysis.trackMetadata.rainRanges.flatMap((range) => {
      const startX = this.chart.convertToPixel(
        { xAxisIndex: 0 },
        range.startLap,
      );

      const endLapPixel = Math.min(
        range.endLap + 1,
        this.analysis.race.totalLaps,
      );

      const endX = this.chart.convertToPixel({ xAxisIndex: 0 }, endLapPixel);

      const label =
        range.startLap === range.endLap
          ? `🌧 Rain • ${range.startLap} Lap`
          : `🌧 Rain • ${range.startLap} - ${range.endLap} Laps`;

      const labelWidth = echarts.format.getTextRect(
        label,
        `${responsive.rainTimeline.fontSize}px Formula1Bold`,
      ).width;

      const chartLeft = this.chart.convertToPixel({ xAxisIndex: 0 }, 1);

      const chartRight = this.chart.convertToPixel(
        { xAxisIndex: 0 },
        this.analysis.race.totalLaps,
      );

      let labelLeft = (startX + endX) / 2 - labelWidth / 2;

      const margin = 6;

      // Prevent clipping on the left edge
      if (labelLeft < chartLeft + margin) {
        labelLeft = chartLeft + margin;
      }

      // Prevent clipping on the right edge
      if (labelLeft + labelWidth > chartRight - margin) {
        labelLeft = chartRight - labelWidth - margin;
      }

      const width = Math.max(1, endX - startX);

      return [
        {
          type: 'rect',

          left: startX,

          bottom: responsive.rainTimeline.stripBottom,

          shape: {
            width,
            height: responsive.rainTimeline.stripHeight,
            r: 4,
          },

          style: {
            fill: {
              image:
                'data:image/svg+xml;utf8,' +
                encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
                    <rect width="12" height="12" fill="#2b78ff"/>
                    <path d="M-2 12 L12 -2 M2 14 L16 0"
                          stroke="rgba(255,255,255,0.30)"
                          stroke-width="3"/>
                </svg>`),
              repeat: 'repeat',
            },
          },

          silent: true,
        },

        {
          type: 'text',

          left: labelLeft,

          bottom:
            responsive.rainTimeline.stripBottom +
            responsive.rainTimeline.stripHeight +
            4,

          style: {
            text: label,

            width: labelWidth,

            textAlign: 'center',

            fill: '#ffffff',

            font: `${responsive.rainTimeline.fontSize}px Formula1Bold`,

            textShadowColor: 'rgba(0,0,0,.8)',

            textShadowBlur: 4,
          },

          silent: true,
        },
      ];
    });
  }

  private refreshRainTimeline(): void {
    if (!this.chart) {
      return;
    }

    this.chart.setOption({
      graphic: [...this.buildDriverLegend(), ...this.buildRainTimeline()],
    });
  }

  private getTrackStatusLabel(range: any): string {
    const lapText =
      range.startLap === range.endLap
        ? `${range.startLap}`
        : `${range.startLap} - ${range.endLap}`;

    switch (range.status) {
      case 'RED_FLAG':
        return `🟥 - ${lapText}`;

      case 'SAFETY_CAR':
        return `🟨 SC • ${lapText}`;

      case 'VSC':
        return `🟪 VSC • ${lapText}`;

      case 'YELLOW':
        return `🟨 - ${lapText}`;

      default:
        return lapText;
    }
  }

  private buildTooltip(param: any): string {
    const hovered = param;

    if (!hovered) {
      return '';
    }

    const lap = hovered.data.lap as RaceAnalyzerLap;

    const hoveredDriver = hovered.seriesName as string;

    const otherDriver = this.analysis.drivers.find(
      (driver) => driver.driver !== hoveredDriver,
    );

    const otherPoint = otherDriver
      ? this.driverLapLookup.get(otherDriver.driver)?.get(lap.lapNumber)
      : undefined;

    const otherLap = otherPoint?.lap;
    const otherCompound = otherPoint?.compound;

    const hoveredTime = lap.lapTime ?? 0;

    let comparisonHtml = '';

    let delta = 0;

    let hoveredSlower = false;

    let otherSlower = false;

    if (otherLap?.lapTime != null) {
      const otherTime = otherLap.lapTime;

      delta = Math.abs(otherTime - hoveredTime);

      hoveredSlower = hoveredTime > otherTime;

      otherSlower = otherTime > hoveredTime;

      comparisonHtml = `
      <div class="tooltip-driver secondary">

        <span class="tooltip-driver-code">
          ${otherDriver?.driver ?? ''}
        </span>

        <span>

          ${this.formatLapTime(otherTime)}

          ${
            otherSlower
              ? `<span class="delta">(+${delta.toFixed(3)})</span>`
              : ''
          }

        </span>

      </div>
    `;
    }

    return `
      <div class="pitwall-tooltip">

        <div class="tooltip-header">

          <span class="tooltip-lap">
              Lap ${lap.lapNumber}
          </span>

          <span class="tooltip-position">
              P${lap.position}
          </span>

        </div>

        <div class="tooltip-divider"></div>

        <div class="tooltip-driver primary">

            <span class="tooltip-driver-code">

              <span class="tooltip-driver-legend">

                  <span
                      class="tooltip-driver-line"
                      style="background:${this.getDriverColor(hovered.seriesIndex)}"
                  ></span>

                  <span
                      class="tooltip-driver-dot"
                      style="background:${this.getDriverColor(hovered.seriesIndex)}"
                  ></span>

              </span>

              ${hovered.seriesName}

            </span>

            <span>

                ${this.formatLapTime(hoveredTime)}

                ${hoveredSlower ? `<span class="delta">(+${delta.toFixed(3)})</span>` : ''}

            </span>

        </div>

        ${comparisonHtml}

        <div class="tooltip-sectors">

            <span class="sector sector1">
                S1 ${this.formatSector(lap.sector1)}
            </span>

            <span class="sector sector2">
                S2 ${this.formatSector(lap.sector2)}
            </span>

            <span class="sector sector3">
                S3 ${this.formatSector(lap.sector3)}
            </span>

        </div>

        <div class="tooltip-tyre">

          <span class="tooltip-stint">

              Stint ${hovered.data.stint} • 

          </span>

          <span
              class="tooltip-compound"
              style="color:${this.getTyreColor(hovered.data.compound)}"
          >
              ${hovered.data.compound}
          </span>

          <span class="tooltip-age">

              • Age ${lap.tyreLife}

          </span>

        </div>

      </div>
    `;
  }

  private formatLapTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);

    const remaining = seconds % 60;

    return `${minutes}:${remaining.toFixed(3).padStart(6, '0')}`;
  }

  private formatSector(seconds: number | null): string {
    if (seconds == null) {
      return '--.---';
    }

    return seconds.toFixed(3);
  }

  private getResponsiveChartSettings(): ResponsiveChartSettings {
    const width = window.innerWidth;

    if (width <= 700) {
      return {
        legendLineWidth: 3,
        legendLineLength: 26,
        symbolSize: 8,

        lineWidths: {
          normal: 3,
          selected: 5,
          faded: 2,
        },

        trackStatusLabelFontSize: 8,

        trackStatusLabelRows: [8, 22],

        grid: {
          left: 36,
          right: 12,
          top: 28,
          bottom: 34,
        },

        legend: {
          top: 6,
          right: 12,
          spacing: 72,
          textGap: 6,
        },

        rainTimeline: {
          labelBottom: 24,
          stripBottom: 14,
          stripHeight: 8,
          fontSize: 8,
          leftPadding: 4,
        },
      };
    }

    if (width <= 900) {
      return {
        legendLineWidth: 4,
        legendLineLength: 34,

        symbolSize: 9,

        lineWidths: {
          normal: 3,
          selected: 6,
          faded: 2,
        },

        trackStatusLabelFontSize: 9,

        trackStatusLabelRows: [8, 24],

        grid: {
          left: 42,
          right: 18,
          top: 34,
          bottom: 42,
        },

        legend: {
          top: 8,
          right: 18,
          spacing: 92,
          textGap: 8,
        },

        rainTimeline: {
          labelBottom: 28,
          stripBottom: 16,
          stripHeight: 9,
          fontSize: 9,
          leftPadding: 5,
        },
      };
    }

    return {
      legendLineWidth: 5,
      legendLineLength: 42,

      symbolSize: 12,

      lineWidths: {
        normal: 4,
        selected: 7,
        faded: 3,
      },

      trackStatusLabelFontSize: 10,

      trackStatusLabelRows: [8, 26],

      grid: {
        left: 50,
        right: 24,
        top: 42,
        bottom: 50,
      },

      legend: {
        top: 11,
        right: 28,
        spacing: 114,
        textGap: 10,
      },

      rainTimeline: {
        labelBottom: 31,
        stripBottom: 18,
        stripHeight: 10,
        fontSize: 10,
        leftPadding: 6,
      },
    };
  }
}
