// Maps chart timeSeries() objects to telemetry properties
var dataMap = {};

// Array length must match highest initChart() numLines parameter
var seriesOptions = [{
    strokeStyle: 'rgba(255, 0, 0, 1)',
    fillStyle: 'rgba(255, 0, 0, 0.1)',
    lineWidth: 3
  },
  {
    strokeStyle: 'rgba(0, 255, 0, 1)',
    fillStyle: 'rgba(0, 255, 0, 0.1)',
    lineWidth: 3
  },
  {
    strokeStyle: 'rgba(0, 0, 255, 1)',
    fillStyle: 'rgba(0, 0, 255, 0.1)',
    lineWidth: 3
  },
  {
    strokeStyle: 'rgba(255, 255, 0, 1)',
    fillStyle: 'rgba(255, 255, 0, 0.1)',
    lineWidth: 3
  },
  {
    strokeStyle: 'rgba(128, 128, 128, 1)',
    fillStyle: 'rgba(128, 128, 128, 0.1)',
    lineWidth: 3
  },
  {
    strokeStyle: 'rgba(0, 255, 255, 1)',
    fillStyle: 'rgba(0, 255, 255, 0.1)',
    lineWidth: 3
  },
  {
    strokeStyle: 'rgba(255, 0, 255, 1)',
    fillStyle: 'rgba(255, 0, 255, 0.1)',
    lineWidth: 3
  },
  {
    strokeStyle: 'rgba(64, 128, 128, 1)',
    fillStyle: 'rgba(64, 128, 128, 0.1)',
    lineWidth: 3
  }
];

function init() {
  initChart('cpu', ['cpu']);
  initChart('depth_p', ['depth_p', 'board44.pressure.81']);
  initChart('depth_d', ['depth_d', 'board44.depth.81']);
  initChart('depth_t', ['depth_t', 'board44.temp.81']);
  initChart('imu_p', ['imu_p']);
  initChart('imu_r', ['imu_r']);
  initChart('sensors.imuPressure', ['sensors.imuPressure.51', 'pilot.imuPressure.52', 'sensors.imuPressure.57', 'sensors.imuPressure.58', 'sensors.imuPressure.67']);
  initChart('sensors.imuTemp', ['sensors.imuTemp.51', 'pilot.imuTemp.52', 'sensors.imuTemp.57', 'sensors.imuTemp.58', 'sensors.imuTemp.67']);
  initChart('light.bus_i', ['light.bus_i.61', 'light.bus_i.62', 'light.bus_i.63', 'light.bus_i.65', 'light.bus_i.66']);
  initChart('light.bus_v', ['light.bus_v.61', 'light.bus_v.62', 'light.bus_v.63', 'light.bus_v.65', 'light.bus_v.66']);
  initChart('light.temp', ['light.temp.61', 'light.temp.62', 'light.temp.63', 'light.temp.65', 'light.temp.66']);
  initChart('motors.bus_i', ['motors.bus_i.12', 'motors.bus_i.13', 'motors.bus_i.14', 'motors.bus_i.15', 'motors.bus_i.16']);
  initChart('motors.bus_v', ['motors.bus_v.12', 'motors.bus_v.13', 'motors.bus_v.14', 'motors.bus_v.15', 'motors.bus_v.16']);
  initChart('motors.temp', ['motors.temp.12', 'motors.temp.13', 'motors.temp.14', 'motors.temp.15', 'motors.temp.16']);
  initChart('motors.rpm', ['motors.rpm.12', 'motors.rpm.13', 'motors.rpm.14', 'motors.rpm.15', 'motors.rpm.16']);
  initChart('motors.lift', ['motors.lift']);
  initChart('motors.pitch', ['motors.pitch']);
  initChart('motors.strafe', ['motors.strafe']);
  initChart('motors.throttle', ['motors.throttle']);
  initChart('motors.yaw', ['motors.yaw']);
  initChart('ctsensor.temp', ['board44.temp.85']);
  initChart('ctsensor.conductivity', ['board44.conductivity.85']);
  initChart('grippers.temp', ['gripper.temp.24', 'waterSampler.temp.24', 'trim.temp.21']);
  initChart('grippers.current', ['gripper.current.24', 'waterSampler.current.24', 'trim.current.21']);
  initChart('powerSupply1.current', ['board44.acs764n1.83', 'board44.acs764n2.83', 'board44.acs764n3.83', 'board44.acs764n4.83']);
  initChart('powerSupply1.voltage', ['board44.adc0.83', 'board44.adc1.83', 'board44.adc2.83', 'board44.adc3.83', 'board44.adc4.83', 'board44.adc5.83', 'board44.adc6.83', 'board44.adc7.83']);
  initChart('powerSupply2.current', ['board44.acs764n1.87', 'board44.acs764n2.87', 'board44.acs764n3.87', 'board44.acs764n4.87']);
  initChart('powerSupply2.voltage', ['board44.adc0.87', 'board44.adc1.87', 'board44.adc2.87', 'board44.adc3.87', 'board44.adc4.87', 'board44.adc5.87', 'board44.adc6.87', 'board44.adc7.87']);

  initMqtt();
  initGrid('telemetryLayout');
}

function initMqtt() {
  var client = mqtt.connect('ws://' + window.location.hostname + ':3000');
  client.on('connect', function (connack) {
    client.subscribe('telemetry/update', function (e) {
      if (!e) {
        console.log('Subscribed to MQTT telemetry/update');
      }
    });
  });
  client.on('offline', function () {
    console.log('MQTT client offline');
  });
  client.on('reconnect', function (topic, payload) {
    console.log('MQTT client reconnected');
  });
  client.on('error', function (error) {
    console.error('MQTT client error: ', error);
  });
  client.on('message', (topic, payload) => {
    let obj = JSON.parse(payload);
    if (topic === 'telemetry/update') {
      let ts = new Date().getTime();
      for (let prop in obj) {
        let elem = document.getElementById(`${prop}-values`);
        if (elem) {
          elem.innerHTML = parseFloat(obj[prop]).toFixed(2);
        }
        if (dataMap.hasOwnProperty(prop)) {
          dataMap[prop].append(ts, obj[prop]);
        }
      }
    }
  });
}

function initChart(chartName, properties) {

  let numLines = 1;
  if (Array.isArray(properties)) {
    numLines = properties.length;
  }
  // Build the chart object
  var timeline = new SmoothieChart({
    millisPerPixel: 500, // 5 min per chart
    responsive: true,
    tooltip: true,
    grid: {
      strokeStyle: '#555555',
      lineWidth: 1,
      millisPerLine: 20000,
      verticalSections: 4,
    }
  });

  // Add each TimeSeries to the chart
  // Bind MQTT telemetry update values to timeSeries
  for (var i = 0; i < numLines; i++) {
    let series = new TimeSeries();
    let options = seriesOptions[i];
    if (chartName.match(/powerSupply.*/) !== null) {
      let labels = properties[i].split(/\./);
      options.tooltipLabel = labels[labels.length-2];
    }
    else if (properties[i].match(/\.[0-9]+$/) !== null) {
      let labels = properties[i].split(/\./);
      options.tooltipLabel = labels[labels.length-1];
    }
    dataMap[properties[i]] = series;
    timeline.addTimeSeries(series, options);
  }
  timeline.streamTo(document.getElementById(chartName), 1000);
}
