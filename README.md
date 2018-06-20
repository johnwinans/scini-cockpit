# Overview

This repository contains that allow for developing the Dockerfiles necessary to build a test SCINI ROV
for development.

# Prerequisites

Ensure the following software is installed on the host:

* Docker or docker-ce
* docker-compose - https://docs.docker.com/compose/install/

Clients wishing to access the system need Chrome or Chromium installed at a minimum.  A USB game joystick is optional as all of the cockpit controls can be accessed by keyboard.

# Running In Production

If you want to run a production system for field work or a tank test, use the `docker-compose.yml` file.  This file only starts an OpenROV container with the default Docker network, so the container network address space will not conflict with the actual SCINI LAN.

0. Edit `docker-compose.yml` and set the IP address on `command:` to match the IP address of the forward camera
1. Run `docker-compose up`
2. Use Chrome to access the cockpit software at http://<ip_of_host>

# Developing SCINI Software

## Get Started Developing

The default docker-compose-dev.yml file assumes you want to match the network IP space used in production.  Ensure your existing local interface IP addresses are not using the same subnet.  Create the docker network as decribed next.  By default, on Linux, this will use the Docker libnetwork bridge driver.  For more info see https://github.com/docker/libnetwork/blob/master/docs/bridge.md.

0. Create a "user-defined" scini network to match the compose file with
  `docker network create --gateway 192.168.2.1 --subnet 192.168.2.0/24 scini`
1. Run `docker-compose -f docker-compose-dev.yml up`
2. Open a browser and visit http://localhost to reach the forward camera and cockpit
3. Visit URL paths /rov/up-camera, /rov/down-camera, and /rov/forward-camera to see the other video streams (multi-camera feature still under development)
4. Open a new terminal and get a shell in the container you want to change, for example:

`docker exec -it $(docker ps |grep openrov | awk '{print $1}') /bin/bash`

5. The container uses a docker named volume created by the compose file.  You can see it with `docker volume ls`.  The named volume allows changes made in the container to persist beyond its lifetime.
6. To test your changes, hit <CTRL-C> in the docker-compose session, or in the second terminal execute `docker-compose -f docker-compose-dev.yml down` and then return to Step 1.

** NOTE: the named volume is only loaded into the openrov container to work in this environment. If you want to make changes to repositories other than openrov-cockpit, be careful not to lose changes made inside the writeable, non-persistent layer of a container without a named volume. **

## Debugging with Chrome DevTools

** Still under development **

The openrov entrypoint `start-dev.sh` starts node with the `--inspect` flag to enable remote debugging.  Port 9229 is exposed from the OpenROV container so that Chrome DevTools can find the instance.

* Open chrome and visit chrome://inspect
* Look for src/cockpit.js and click **Inspect**


## Imgsrv-mock Container

These containers are meant to simulate the MJPEG video functionality of the Elphel cameras.  They run a simple MJPEG HTTP server on port 8081 to simulate the Elphel imgsrv process.  OpenROV uses the mjpg_streamer input_http.so plugin.  The containers also run the same MQTT client software deployed on the Elphels.  The MQTT containers automatically discover the OpenROV MQTT broker and subscribe to messages sent to the toScini/* channels they need.  MQTT payloads received by the clients are immediately sent to the device specified by the USBDEVICE environment variable when the process starts.

These containers can also receive and generate fake PRO4 telemetry data, such as responses sent from thrusters, lights, or other sensors.

*** NOTE the fake telemetry and MQTT features are still under development ***

## Rebuilding Cached Services

If you've built the stack at least once, the cloned git repositories will be cached in that RUN layer of its container.  If you need to force Docker to pull down changes from the remote repository, rebuild that one service like this:

`docker-compose -f docker-compose-dev.yml build SERVICE_NAME --no-cache`

After it's been built you can `up` the stack as normal.

In this context, SERVICE_NAME is the name given to the service in the docker-compose YAML file you're using.  For dev, those names are 'openrov', 'fwdcam-mock', etc.

