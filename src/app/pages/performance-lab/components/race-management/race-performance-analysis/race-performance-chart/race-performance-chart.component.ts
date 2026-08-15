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
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChartsOption, ECharts } from 'echarts';

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

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
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

  readonly showTrackStatus = signal(true);

  chartOptions: EChartsOption = {};
  private chart!: ECharts;
  private selectedSeriesIndex: number | null = null;
  private hoveredSeriesIndex: number | null = null;

  private buildChart(): void {
    const series = this.buildSeries();

    this.chartOptions = {
      backgroundColor: '#1a1a1a',

      animation: false,

      grid: {
        left: 70,
        right: 30,
        top: 30,
        bottom: 60,
      },

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

        name: 'Lap',

        nameLocation: 'middle',

        nameGap: 35,

        min: 1,

        max: this.analysis.race.totalLaps,

        splitLine: {
          show: true,
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

        name: 'Lap Time (s)',

        nameLocation: 'middle',

        nameGap: 55,

        scale: true,

        splitLine: {
          show: true,
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

      series: series.map((driver) => ({
        name: driver.driver,

        type: 'line',

        triggerLineEvent: true,

        symbol: 'circle',

        data: driver.points,

        showSymbol: true,

        symbolSize: this.getSymbolSize(),

        lineStyle: {
          width: 4,
          color: driver.color,
        },

        itemStyle: {
          borderWidth: 2,
        },
      })),
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

        return {
          lineStyle: {
            opacity: !hasActiveSelection ? 1 : selected ? 1 : 0.18,
            width: !hasActiveSelection ? 4 : selected ? 7 : 3,
          },

          itemStyle: {
            opacity: !hasActiveSelection ? 1 : selected ? 1 : 0.28,
          },

          symbolSize: !hasActiveSelection ? 12 : selected ? 16 : 12,
        };
      }),
    });
  }

  private buildSeries(): DriverChartSeries[] {
    const drivers = this.analysis.drivers;

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

  private getSymbolSize(): number {
    // Large enough for mobile tapping.
    return 12;
  }
}
