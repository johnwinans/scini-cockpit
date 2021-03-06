FROM ubuntu:18.04
LABEL maintainer="david@linkconsultinginc.com"
SHELL ["/bin/bash", "-c"]

## Install dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash-completion \
        ca-certificates \
        curl \
        lsof \
        net-tools \
        socat \
        udev \
        vim \
    && curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash \
    && rm -rf /var/lib/apt/lists/*

## Install node+nvm
ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 8.12.0
ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN source /root/.nvm/nvm.sh \
    && nvm install v$NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && echo It should end saying something like "Now using node $LATEST (npm v3.10.10)"

COPY serial-tester.js pro4.js package.json /srv/
COPY start.sh /usr/local/bin

# Install dependencies from package.json
RUN cd /srv \
    && npm install

RUN chmod 755 /srv/serial-tester.js /usr/local/bin/start.sh

EXPOSE 50000
EXPOSE 50001

## Start the mock server platform (no external camera)
WORKDIR /srv/
ENTRYPOINT ["/usr/local/bin/start.sh"]
