FROM dadiorchen/tile2:first
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY . ./
RUN sudo apt install build-essential 
RUN sudo apt-get install zlib1g-dev
#TODO We should build the tile2 image from node 14 alpine
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
RUN sudo apt-get install -y nodejs
RUN make release_base
CMD [ "npm", "start" ]
