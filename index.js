import { device } from "aws-iot-device-sdk";
import { getDeviceList } from "usb";

const ML_DOWN = 0x01;
const ML_UP = 0x02;
const ML_LEFT = 0x04;
const ML_RIGHT = 0x08;
const ML_FIRE = 0x10;
const ML_STOP = 0x20;

const ML_UP_LEFT = ML_UP | ML_LEFT;
const ML_DOWN_LEFT = ML_DOWN | ML_LEFT;
const ML_UP_RIGHT = ML_UP | ML_RIGHT;
const ML_DOWN_RIGHT = ML_DOWN | ML_RIGHT;

const MISSILE_LAUNCHER_VENDOR_ID = 0x2123;
const MISSILE_LAUNCHER_ID = 0x1010;

const IOT_KEY_PATH = process.env.IOT_KEY_PATH;
const IOT_CERT_PATH = process.env.IOT_CERT_PATH;
const IOT_CLIENT_ID = process.env.MISSILE_LAUNCHER_IOT_CLIENT_ID;
const IOT_HOST = process.env.MISSILE_LAUNCHER_IOT_HOST;

const IOT_CA_PATH = "root-CA.crt";

const devices = getDeviceList().filter(
  d =>
    d.deviceDescriptor.idVendor == MISSILE_LAUNCHER_VENDOR_ID &&
    d.deviceDescriptor.idProduct == MISSILE_LAUNCHER_ID
);

devices.forEach(d => {
  console.log("Opening", d.deviceAddress);
  d.open();
  const interface = d.interfaces[0];
  if (interface.isKernelDriverActive()) {
    console.log("Detaching kernel driver", interface.descriptor.iInterface);
    interface.detachKernelDriver();
  }
});

const iotDevice = device({
  keyPath: IOT_KEY_PATH,
  certPath: IOT_CERT_PATH,
  caPath: IOT_CA_PATH,
  clientId: IOT_CLIENT_ID,
  host: IOT_HOST
});

iotDevice.on("connect", function() {
  iotDevice.subscribe("topic_1");
});

iotDevice.on("message", function(topic, payload) {
  const action = payload.toString();

  switch (action) {
    case "left":
      transfer(ML_LEFT);
      break;
    case "up":
      transfer(ML_UP);
      break;
    case "right":
      transfer(ML_RIGHT);
      break;
    case "down":
      transfer(ML_DOWN);
      break;
    case "upLeft":
      transfer(ML_UP_LEFT);
      break;
    case "downLeft":
      transfer(ML_DOWN_LEFT);
      break;
    case "upRight":
      transfer(ML_UP_RIGHT);
      break;
    case "downRight":
      transfer(ML_DOWN_RIGHT);
      break;
    case "stop":
      transfer(ML_STOP);
      break;
    case "fire":
      transfer(ML_FIRE);
      break;
  }

  console.log(topic, payload.toString());
});

function transfer(command) {
  const devicePromises = devices.map(
    d =>
      new Promise((resolve, reject) => {
        d.controlTransfer(
          0x21,
          0x09,
          0,
          0,
          Buffer.from([0x02, command, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
          (err, data) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }
        );
      })
  );

  Promise.all(devicePromises);
}

process.on("exit", _ => {
  devices.forEach(d => {
    console.log(
      "Releaseing and resetting device",
      d.busNumber,
      d.deviceAddress
    );
    d.interfaces[0].release();
    d.reset();
  });
});
