#!/usr/bin/python

# Adapted from https://gist.githubusercontent.com/nairteashop/7407932/raw/6aa4d62561e3f759fcdcd8f5ad2b617d2bc0b3fb/mjpeg-server.py
#
# A simple Motion JPEG server in python for creating "virtual cameras" from video sequences.
# 
# The cameras will support MJPEG streaming over HTTP. The MJPEG streams are formed from static JPEG images.
# If you wish to stream a video file, use a tool like VirtualDub to break the video into a sequence of JPEGs.
# 
# Specify port to listen on as only argument
# Script will read sequential image names in default directory ./images/
# Framerate is set to 20fps
# Access the stream from any MJPEG client (such as your browser) at: http://<server ip>:8081
# 
# Copyright (c) 2013 Arun Nair (http://nairteashop.org).
# Licensed under the MIT license.
#

from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler
from SocketServer import ThreadingMixIn
from threading import Thread
import logging
import signal
import time
import sys
import os

SERVERS = {}

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Get client info
        client = self.client_address

        # Get the port the client connected to
        port = self.server.server_port

        # Get the image files corresponding to this port
        imageDir = SERVERS[port]["images"]
        imageFiles = os.listdir( imageDir )
        imageFiles.sort()

        # Get the min intra frame delay
        maxFPS = SERVERS[port]["maxfps"]
        if maxFPS == 0:
            minDelay = 0
        else:
            minDelay = 1.0 / maxFPS

        logging.info( "Serving client %s:%s from port %s at %s fps", client[0], client[1], port, maxFPS )

        # Send headers
        self.send_response( 200 )
        self.send_header( "Cache-Control", "no-cache" )
        self.send_header( "Pragma", "no-cache" )
        self.send_header( "Connection", "close" )
        self.send_header( "Content-Type", "multipart/x-mixed-replace; boundary=--myboundary" )
        self.end_headers()

        o = self.wfile

        # Send image files in a loop
        lastFrameTime = 0
        while True:
            for imageFile in imageFiles:
                f = open( os.path.join(imageDir, imageFile) )
                contents = f.read()
                f.close()

                # Wait if required so we stay under the max FPS
                if lastFrameTime != 0:
                    now = time.time()
                    delay = now - lastFrameTime
                    if delay < minDelay:
                        logging.debug( "Waiting for ", (minDelay - delay) )
                        time.sleep( minDelay - delay )

                try:
                    logging.debug( "Serving frame %s", imageFile )
                    o.write( "--myboundary\r\n" )
                    o.write( "Content-Type: image/jpeg\r\n" )
                    o.write( "Content-Length: %s\r\n" % len(contents) )
                    o.write( "\r\n" )
                    o.write( contents )
                    o.write( "\r\n" )
                except:
                    logging.info( "Done serving client %s:%s from port %s", client[0], client[1], port )
                    return

                lastFrameTime = time.time()

            logging.info( "Re-looping for client %s:%s from port %s", client[0], client[1], port )

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    pass

def catchSignal (signum, frame):
    print 'Signal handler called with signal', signum
    sys.exit()

def startServer(port):
    def target(port):
        server = ThreadingHTTPServer( ("0.0.0.0",port), RequestHandler )
        server.serve_forever()

    t = Thread(target=target, args=[port])
    t.start()

if __name__ == "__main__":
    signal.signal(signal.SIGINT, catchSignal)
    signal.signal(signal.SIGTERM, catchSignal)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")

    images = "./images/"
    port   = int(sys.argv[1]) or 8081
    maxfps = 20

    SERVERS[port] = {"images": images, "maxfps": maxfps}
    startServer(port)
    logging.info("Serving MJPEG stream on port %s" % (port))

