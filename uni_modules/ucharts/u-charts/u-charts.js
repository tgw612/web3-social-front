/*
 * uCharts®
 * 高性能跨平台图表库，支持H5、APP、小程序
 * Copyright (c) 2021 QIUN®秋云 https://www.ucharts.cn All rights reserved.
 * Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
 * 复制使用请保留本段注释，感谢支持开源！
 * 
 * uCharts® 商标和著作权所有权归属于秋云著作权人
 * 开源图表库并不意味着完全免费
 * 为了防止图表库被滥用，未经授权的商业使用需支付使用费
 * 正版商业授权及技术支持联系：https://www.ucharts.cn
 */

class uCharts {
  constructor(opts) {
    this.opts = opts;
    this.config = {
      yAxisWidth: 15,
      yAxisSplit: 5,
      xAxisHeight: 15,
      xAxisLineHeight: 15,
      legendHeight: 15,
      yAxisTitleWidth: 15,
      padding: [10, 10, 10, 10],
      pixelRatio: 1,
      rotate: false,
      columePadding: 3,
      fontSize: 13,
      dataPointShape: ['circle', 'circle', 'circle', 'circle'],
      colors: ['#1890ff', '#91cb74', '#fac858', '#ee6666', '#73c0de', '#3ca272', '#fc8452', '#9a60b4', '#ea7ccc'],
      pieChartLinePadding: 15,
      pieChartTextPadding: 5,
      xAxisTextPadding: 3,
      titleColor: '#333333',
      titleFontSize: 20,
      subtitleColor: '#999999',
      subtitleFontSize: 15,
      toolTipPadding: 3,
      toolTipBackground: '#000000',
      toolTipOpacity: 0.7,
      toolTipLineHeight: 20,
      radarLabelTextMargin: 15,
      gaugeLabelTextMargin: 15
    };
    this.context = uni.createCanvasContext(this.opts.canvasId, this.opts.context);
    this.chartData = {};
    this.event = {};
    this.scrollOption = {
      currentOffset: 0,
      startTouchX: 0,
      distance: 0
    };
    
    // 默认配置项
    this.pixelRatio = this.opts.pixelRatio || 1;
    this.padding = this.opts.padding || this.config.padding;
    this.rotate = this.opts.rotate || this.config.rotate;
    this.fontSize = this.opts.fontSize || this.config.fontSize;
    this.dataPointShape = this.opts.dataPointShape || this.config.dataPointShape;
    this.colors = this.opts.colors || this.config.colors;
    this.title = this.opts.title || '';
    this.subtitle = this.opts.subtitle || '';
    this.titleColor = this.opts.titleColor || this.config.titleColor;
    this.subtitleColor = this.opts.subtitleColor || this.config.subtitleColor;
    this.titleFontSize = this.opts.titleFontSize || this.config.titleFontSize;
    this.subtitleFontSize = this.opts.subtitleFontSize || this.config.subtitleFontSize;
    this.animation = this.opts.animation !== false;
    this.rotate = this.opts.rotate || false;
    this.enableScroll = this.opts.enableScroll || false;
    this.background = this.opts.background || '#ffffff';
    this.width = this.opts.width || 375;
    this.height = this.opts.height || 250;
    this.extra = this.opts.extra || {};
    this.legendHeight = this.opts.legendHeight || this.config.legendHeight;
    
    // 初始化图表数据
    this.initChartData();
  }
  
  initChartData() {
    const types = ['pie', 'ring', 'column'];
    if (types.indexOf(this.opts.type) > -1) {
      this.chartData = this.getChartDataTemplate();
      this.drawCharts();
    }
  }
  
  getChartDataTemplate() {
    const chartData = {
      type: this.opts.type,
      canvasId: this.opts.canvasId,
      canvas2d: this.opts.canvas2d,
      background: this.background,
      animation: this.animation,
      timing: 'easeOut',
      duration: 1000,
      color: this.colors,
      rotate: this.rotate,
      rotateLock: this.opts.rotateLock,
      enableScroll: this.enableScroll,
      enableMarkLine: this.opts.enableMarkLine,
      dataLabel: this.opts.dataLabel !== false,
      dataPointShape: this.dataPointShape,
      disablePieStroke: this.opts.disablePieStroke,
      pieChartLinePadding: this.opts.pieChartLinePadding || this.config.pieChartLinePadding,
      pieChartTextPadding: this.opts.pieChartTextPadding || this.config.pieChartTextPadding,
      padding: this.padding,
      fontSize: this.fontSize,
      pixelRatio: this.pixelRatio,
      width: this.width,
      height: this.height,
      extra: this.extra,
      legendHeight: this.legendHeight,
      legend: {
        show: this.opts.legend !== false,
        position: this.opts.legend ? this.opts.legend.position : 'bottom',
        float: this.opts.legend ? this.opts.legend.float || false : false,
        backgroundColor: this.opts.legend ? this.opts.legend.backgroundColor : 'rgba(0,0,0,0)',
        borderColor: this.opts.legend ? this.opts.legend.borderColor : 'rgba(0,0,0,0)',
        borderWidth: this.opts.legend ? this.opts.legend.borderWidth : 0,
        padding: this.opts.legend ? this.opts.legend.padding : 5,
        margin: this.opts.legend ? this.opts.legend.margin : 5,
        itemGap: this.opts.legend ? this.opts.legend.itemGap : 10,
        fontSize: this.opts.legend ? this.opts.legend.fontSize : this.fontSize,
        lineHeight: this.opts.legend ? this.opts.legend.lineHeight : this.fontSize,
        fontColor: this.opts.legend ? this.opts.legend.fontColor : '#333333',
        format: this.opts.legend ? this.opts.legend.format : null
      }
    };
    
    // 根据图表类型设置特定属性
    if (this.opts.type === 'pie' || this.opts.type === 'ring') {
      chartData.series = this.opts.series;
      chartData.radius = this.opts.radius || 100;
      chartData.centerPosition = this.opts.centerPosition || {x: this.width / 2, y: this.height / 2};
    } else if (this.opts.type === 'column') {
      chartData.categories = this.opts.categories;
      chartData.series = this.opts.series;
      chartData.xAxis = this.opts.xAxis || {
        disabled: false,
        disableGrid: false,
        type: 'category',
        gridType: 'solid',
        itemCount: 5,
        scrollShow: false,
        axisLine: true
      };
      chartData.yAxis = this.opts.yAxis || {
        disabled: false,
        disableGrid: false,
        gridType: 'solid',
        splitNumber: 5,
        axisLine: true,
        axisLineColor: '#cccccc'
      };
    }
    
    return chartData;
  }
  
  drawCharts() {
    const types = {
      pie: this.drawPieChart,
      ring: this.drawRingChart,
      column: this.drawColumnChart
    };
    
    if (types[this.opts.type]) {
      types[this.opts.type].call(this);
    }
  }
  
  drawPieChart() {
    const series = this.opts.series;
    const centerPosition = this.chartData.centerPosition;
    const radius = this.chartData.radius;
    const context = this.context;
    
    // 清空画布
    context.clearRect(0, 0, this.width, this.height);
    
    // 设置背景色
    if (this.background) {
      context.setFillStyle(this.background);
      context.fillRect(0, 0, this.width, this.height);
    }
    
    // 计算总值
    let total = 0;
    series.forEach(item => {
      total += item.data;
    });
    
    // 绘制饼图
    let startAngle = 0;
    series.forEach((item, index) => {
      const percent = item.data / total;
      const endAngle = startAngle + 2 * Math.PI * percent;
      
      context.beginPath();
      context.moveTo(centerPosition.x, centerPosition.y);
      context.arc(centerPosition.x, centerPosition.y, radius, startAngle, endAngle);
      context.closePath();
      context.setFillStyle(item.color || this.colors[index % this.colors.length]);
      context.fill();
      
      // 绘制文本标签
      if (this.chartData.dataLabel) {
        const textAngle = startAngle + (endAngle - startAngle) / 2;
        const textX = centerPosition.x + (radius + this.chartData.pieChartLinePadding) * Math.cos(textAngle);
        const textY = centerPosition.y + (radius + this.chartData.pieChartLinePadding) * Math.sin(textAngle);
        
        context.setFontSize(this.fontSize);
        context.setFillStyle('#333333');
        context.fillText(item.name + ': ' + (percent * 100).toFixed(2) + '%', textX, textY);
      }
      
      startAngle = endAngle;
    });
    
    context.draw();
  }
  
  drawRingChart() {
    const series = this.opts.series;
    const centerPosition = this.chartData.centerPosition;
    const radius = this.chartData.radius;
    const innerRadius = radius * 0.6; // 内环半径
    const context = this.context;
    
    // 清空画布
    context.clearRect(0, 0, this.width, this.height);
    
    // 设置背景色
    if (this.background) {
      context.setFillStyle(this.background);
      context.fillRect(0, 0, this.width, this.height);
    }
    
    // 计算总值
    let total = 0;
    series.forEach(item => {
      total += item.data;
    });
    
    // 绘制环形图
    let startAngle = 0;
    series.forEach((item, index) => {
      const percent = item.data / total;
      const endAngle = startAngle + 2 * Math.PI * percent;
      
      context.beginPath();
      context.arc(centerPosition.x, centerPosition.y, radius, startAngle, endAngle);
      context.arc(centerPosition.x, centerPosition.y, innerRadius, endAngle, startAngle, true);
      context.closePath();
      context.setFillStyle(item.color || this.colors[index % this.colors.length]);
      context.fill();
      
      // 绘制文本标签
      if (this.chartData.dataLabel) {
        const textAngle = startAngle + (endAngle - startAngle) / 2;
        const textX = centerPosition.x + (radius + this.chartData.pieChartLinePadding) * Math.cos(textAngle);
        const textY = centerPosition.y + (radius + this.chartData.pieChartLinePadding) * Math.sin(textAngle);
        
        context.setFontSize(this.fontSize);
        context.setFillStyle('#333333');
        context.fillText(item.name + ': ' + (percent * 100).toFixed(2) + '%', textX, textY);
      }
      
      startAngle = endAngle;
    });
    
    context.draw();
  }
  
  drawColumnChart() {
    const series = this.opts.series;
    const categories = this.opts.categories;
    const context = this.context;
    
    // 清空画布
    context.clearRect(0, 0, this.width, this.height);
    
    // 设置背景色
    if (this.background) {
      context.setFillStyle(this.background);
      context.fillRect(0, 0, this.width, this.height);
    }
    
    // 计算坐标轴位置
    const padding = this.padding;
    const xAxisHeight = this.config.xAxisHeight;
    const yAxisWidth = this.config.yAxisWidth;
    
    const chartWidth = this.width - padding[1] - padding[3] - yAxisWidth;
    const chartHeight = this.height - padding[0] - padding[2] - xAxisHeight;
    const chartStartX = padding[3] + yAxisWidth;
    const chartStartY = padding[0];
    
    // 计算最大值
    let maxValue = 0;
    series.forEach(serie => {
      serie.data.forEach(value => {
        maxValue = Math.max(maxValue, value);
      });
    });
    
    // Y轴刻度
    const yStep = chartHeight / 5;
    const valueStep = maxValue / 5;
    
    // 绘制Y轴
    context.setFontSize(this.fontSize);
    context.setFillStyle('#666666');
    for (let i = 0; i <= 5; i++) {
      const y = chartStartY + chartHeight - i * yStep;
      const value = i * valueStep;
      
      context.fillText(value.toFixed(0), padding[3], y + 3);
      
      // 绘制网格线
      if (i > 0 && this.opts.yAxis && !this.opts.yAxis.disableGrid) {
        context.beginPath();
        context.setStrokeStyle('#eeeeee');
        context.moveTo(chartStartX, y);
        context.lineTo(chartStartX + chartWidth, y);
        context.stroke();
      }
    }
    
    // 绘制X轴
    const columnWidth = chartWidth / categories.length / series.length;
    const columnGap = columnWidth * 0.2;
    
    categories.forEach((category, index) => {
      const x = chartStartX + index * (columnWidth * series.length + columnGap) + columnWidth * series.length / 2;
      const y = chartStartY + chartHeight + 15;
      
      context.fillText(category, x - context.measureText(category).width / 2, y);
    });
    
    // 绘制柱状图
    series.forEach((serie, serieIndex) => {
      serie.data.forEach((value, dataIndex) => {
        const height = (value / maxValue) * chartHeight;
        const x = chartStartX + dataIndex * (columnWidth * series.length + columnGap) + serieIndex * columnWidth;
        const y = chartStartY + chartHeight - height;
        
        context.beginPath();
        context.setFillStyle(this.colors[serieIndex % this.colors.length]);
        context.rect(x, y, columnWidth - columnGap, height);
        context.fill();
        
        // 绘制数值标签
        if (this.chartData.dataLabel) {
          context.setFillStyle('#333333');
          context.fillText(value.toString(), x + (columnWidth - columnGap) / 2 - context.measureText(value.toString()).width / 2, y - 5);
        }
      });
    });
    
    context.draw();
  }
}

export default uCharts;