const express = require("express");
const mapnik = require("../lib/mapnik");
const path = require("path");
const log = require("loglevel");
const cors = require("cors");
const { Pool} = require('pg');
const {Config} = require("./config");

const connectionString = process.env.DB_URL;
const max = process.env.PG_POOL_SIZE && parseInt(process.env.PG_POOL_SIZE) || 10;
log.info("pool settings:db:%s; pool size: %d", connectionString, max);
const pool = new Pool({ 
  connectionString,
  max,
});

const config = new Config(pool);


//font
mapnik.register_default_fonts();
mapnik.register_default_input_plugins();
log.info("fonts:", mapnik.fonts());
const mapInstance = new mapnik.Map(256, 256);
mapInstance.registerFonts(path.join(__dirname, '../test/data/map-a/'), {recurse:true});
log.info("font instance:", mapInstance.fonts());
mapnik.Logger.setSeverity(mapnik.Logger.DEBUG);
log.info("log level of mapnik:", mapnik.Logger.getSeverity());
const mercator = require('./sphericalmercator')

const app = express();
app.use(cors());

//viewer
const viewer = path.join(__dirname, './examples/viewer');
//app.get('/viewer', function(req, res) {
//    res.sendFile(path.join(viewer, 'index.html'));
//});
app.use('/viewer', express.static(viewer));
const images = path.join(__dirname, './examples/viewer/images');
app.use('/viewer/images', express.static(images));


async function buildMapInstance(x, y, z, params){
  const map = await new Promise(async (res, rej) => {
    const mapInstance = new mapnik.Map(256, 256);
    mapInstance.registerFonts(path.join(__dirname, '../test/data/map-a/'), {recurse:true});

    const bboxDb = mercator.xyz_to_envelope_db_buffer(//x, y, z, false);
      parseInt(x),
      parseInt(y),
      parseInt(z), 
      false,
      100,
    );
    const bounds = bboxDb.join(",");
    log.debug("bounds:", bounds);
    const xmlString = await config.getXMLString({
      zoomLevel: z,
      bounds,
      ...params,
    });

    mapInstance.fromString(xmlString, {
      strict: true,
      base: __dirname,
    },function(err,_map) {
      if(err){
        log.error("e when fromString:", err);
        throw "failed";
      }
      //      if (options.bufferSize) {
      //        obj.bufferSize = options.bufferSize;
      //      }
      res(_map);
    });
  });
  log.debug("map:", map);
  log.debug("x,y,z:", x,y,z);
  // bbox for x,y,z
  const bbox = mercator.xyz_to_envelope(//x, y, z, false);
    parseInt(x),
    parseInt(y),
    parseInt(z), false);
  log.debug("bbox:", bbox);
  //map.zoomAll();
  map.extent = bbox;
  log.debug("map:", map);
  log.debug("map extent:", map.extent);
  log.debug("map.zoomAll:", map.zoomAll);
  log.debug("map.zoomToBox:", map.zoomToBox);
  log.debug("map.load:", map.load);
  log.debug("map.scale:", map.scale());
  log.debug("map.scaleDenominator:", map.scaleDenominator());
  return map;
}

app.get("/:z/:x/:y.png", async (req, res) => {
try{
  const {x,y,z} = req.params;
  const begin = Date.now();
  const map = await buildMapInstance(x, y, z, req.query);
  log.info("Build map took:", Date.now() - begin, x,y,z,".png");
  const begin2 = Date.now();
  const im = new mapnik.Image(256, 256);
  const buffer = await new Promise((res, rej) => {
    map.render(im, function(err, im) {
      if(err) throw err;
      im.encode('png', function(err,buffer) {
        if (err) throw err;
        res(buffer);
      });
    });
  });
  log.info("Render map took:", Date.now() - begin2, x,y,z,".png");
  res.set({'Content-Type': 'image/png'});
  res.end(buffer);
}catch(e){
  log.error("got error in handler:", e);
  res.status(500).json({message:"something wrong:" + error});
}
});

app.get("/:z/:x/:y.grid.json", async (req, res) => {
try{
  const {x,y,z} = req.params;
  const begin = Date.now();
  const map = await buildMapInstance(x, y, z, req.query);
  log.info("Build map took:", Date.now() - begin, x,y,z,".grid");
  const begin2 = Date.now();
  var grid = new mapnik.Grid(256, 256);
  const fields = ["id", "latlon", "count", "type"];
  if(parseInt(z) <= 9){
    fields.push("zoom_to");
  }
  const json = await new Promise((res, _rej) => {
    map.render(
      grid, {
        layer:"l1", 
        fields,
      }, function(err, grid) {
      if (err) throw err;
      log.debug("grid:",grid);
      const json = grid.encodeSync({resolution: 4, features: true});
      res(json);
    });
  });
  log.info("Render map took:", Date.now() - begin2, x,y,z,".grid");
  res.set({'Content-Type': 'application/json'});
  res.json(json);
}catch(e){
  log.error("got error in handler:", e);
  res.status(500).json({message:"something wrong:" + error});
}
});

app.get("/new/:z/:x/:y.png", async (req, res) => {
  try{
    const {x,y,z} = req.params;
    const begin = Date.now();
    config.setNewIconXML(true)
    const map = await buildMapInstance(x, y, z, req.query);
    log.info("Build map took:", Date.now() - begin, x,y,z,".png");
    const begin2 = Date.now();
    const im = new mapnik.Image(256, 256);
    const buffer = await new Promise((res, rej) => {
      map.render(im, function(err, im) {
        if(err) throw err;
        im.encode('png', function(err,buffer) {
          if (err) throw err;
          res(buffer);
        });
      });
    });
    log.info("Render map took:", Date.now() - begin2, x,y,z,".png");
    res.set({'Content-Type': 'image/png'});
    res.end(buffer);
  }catch(e){
    log.error("got error in handler:", e);
    res.status(500).json({message:"something wrong:" + error});
  }
  });
  
  app.get("/new/:z/:x/:y.grid.json", async (req, res) => {
  try{
    const {x,y,z} = req.params;
    const begin = Date.now();
    config.setNewIconXML(true)
    const map = await buildMapInstance(x, y, z, req.query);
    log.info("Build map took:", Date.now() - begin, x,y,z,".grid");
    const begin2 = Date.now();
    var grid = new mapnik.Grid(256, 256);
    const fields = ["id", "latlon", "count", "type"];
    if(parseInt(z) <= 9){
      fields.push("zoom_to");
    }
    const json = await new Promise((res, _rej) => {
      map.render(
        grid, {
          layer:"l1", 
          fields,
        }, function(err, grid) {
        if (err) throw err;
        log.debug("grid:",grid);
        const json = grid.encodeSync({resolution: 4, features: true});
        res(json);
      });
    });
    log.info("Render map took:", Date.now() - begin2, x,y,z,".grid");
    res.set({'Content-Type': 'application/json'});
    res.json(json);
  }catch(e){
    log.error("got error in handler:", e);
    res.status(500).json({message:"something wrong:" + error});
  }
  });

app.use("*", (_, res) => {
  var pjson = require('../package.json');
  res.status(200).send(`Welcome to Greenstand tile server, version:${pjson.version}`);
});

module.exports = app;
