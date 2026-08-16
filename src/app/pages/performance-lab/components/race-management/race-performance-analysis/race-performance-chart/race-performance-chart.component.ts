import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
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

interface ChartLapPoint {
  value: [number, number];

  lap: RaceAnalyzerLap;

  itemStyle: {
    color: string;
    borderColor: string;
    borderWidth: number;
  };
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

  @Input({ required: true })
  set analysisData(value: RaceAnalyzerResponse) {
    this.analysis = value;

    this.buildChart();
  }

  readonly hideOutliers = signal(true);

  readonly smoothChart = signal(true);

  readonly showTrackStatus = signal(false);

  chartOptions: EChartsOption = {};
  private chart!: ECharts;
  private selectedSeriesIndex: number | null = null;
  private hoveredSeriesIndex: number | null = null;

  private buildChart(): void {
    const series = this.buildSeries();

    const responsive = this.getResponsiveChartSettings();

    this.chartOptions = {
      backgroundColor: '#1a1a1a',

      animation: false,

      grid: responsive.grid,

      graphic: this.buildDriverLegend(),

      tooltip: {
        trigger: 'axis',

        axisPointer: {
          type: 'line',

          snap: true,

          lineStyle: {
            color: '#9ca3af',
            width: 1,
            type: 'dashed',
          },

          label: {
            show: false,
          },
        },
      },

      axisPointer: {
        show: true,

        triggerTooltip: true,
      },

      xAxis: {
        type: 'value',

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

    chart.getZr().on('click', this.onCanvasClick.bind(this));
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
    // Only accept clicks on the actual line.
    //
    if (params.dataType === 'node') {
      return;
    }

    this.selectedSeriesIndex = params.seriesIndex;

    this.updateSeriesStyles();
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

    return drivers.map((driver, index) => {
      //
      // Flatten all laps across every stint.
      //
      const points: ChartLapPoint[] = [];

      for (const stint of driver.stints) {
        for (const lap of stint.laps) {
          if (lap.lapTime === null) {
            continue;
          }

          if (this.hideOutliers() && lap.lapTime > outlierThreshold) {
            continue;
          }

          points.push({
            value: [lap.lapNumber, lap.lapTime],

            lap,

            itemStyle: {
              color: this.getTyreColor(stint.compound),

              borderColor: this.getDriverColor(index),

              borderWidth: 2,
            },
          });
        }
      }

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
              font: `bold ${fontSize}px Formula1`,
              textVerticalAlign: 'middle',
            },
          },
        ],
      };
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
    };
  }
}
