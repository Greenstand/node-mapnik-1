const path = require("path");
const fs = require("fs");
const {xml, xmlTree, xmlJson, xmlJsonForTree} = require("./xml");
const {xml2, xmlTree2, xmlJson2, xmlJsonForTree2} = require("./xml2");
const Map = require("./Map");
const log = require("loglevel");
const PGPool = require("./PGPool");


//bigger than this value, dispaly tree points, rather than, clusters
const ZOOM_LEVEL_THRETHOLD_OF_CLUSTER = 15;

/*
 * setup the DB connection
 */
function replace(content){
  //       <Parameter name="user"><![CDATA[postgres]]></Parameter>
  //       <Parameter name="host"><![CDATA[172.17.0.2]]></Parameter>
  //       <Parameter name="port"><![CDATA[5432]]></Parameter>
  //       <Parameter name="password"><![CDATA[greenstand]]></Parameter>
  //       <Parameter name="type"><![CDATA[postgis]]></Parameter>
  //       <Parameter name="extent"><![CDATA[-20037508.3,-20037508.3,20037508.3,20037508.3]]></Parameter>
  //       <Parameter name="max_size"><![CDATA[10]]></Parameter>
  //       <Parameter name="table"><![CDATA[(SELECT * FROM trees) as cdbq]]></Parameter>
  //       <Parameter name="dbname"><![CDATA[treetracker_dev]]></Parameter>
  const db_url = process.env.DB_URL;
  const match = db_url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/);
  const db_user = match[1];
  const db_port = match[4];
  const db_password = match[2];
  const db_database = match[5];
  const db_host = match[3];
  function config(str){
    str = str.replace(/postgres/, db_user);
    str = str.replace(/172.17.0.2/, db_host);
    str = str.replace(/5432/, db_port);
    str = str.replace(/\[greenstand\]/, `[${db_password}]`);
    str = str.replace(/treetracker_dev/, db_database);
    return str;
  }
  const contentConfig = config(content);
  return contentConfig;
}

function config(){
  const define = path.join(__dirname, './layers/postgis.xml');
  const content = fs.readFileSync(define).toString();
  const newDefine = path.join(__dirname, './layers/postgis.prod.xml');

  const contentConfig = replace(content);
  fs.writeFileSync(newDefine,contentConfig);
}

function configFreetown(){
  const define = path.join(__dirname, './layers/postgis.xml');
  const content = fs.readFileSync(define).toString();
  const newDefine = path.join(__dirname, './layers/postgis.freetown.prod.xml');

  let contentConfig = replace(content);
  contentConfig = contentConfig.replace("(SELECT * FROM trees) as cdbq", 
    `
    (
    /* sql case2 */
    SELECT /* DISTINCT ON(trees.id) */
    'point' AS type,
    trees.id, trees.lat, trees.lon, trees.estimated_geometric_location
    FROM trees
    WHERE active = true
    AND trees.id IN(
    select distinct * from (
    SELECT trees.id as id from trees
    INNER JOIN (
    SELECT id FROM planter
    JOIN (
    SELECT entity_id FROM getEntityRelationshipChildren(
    (SELECT id FROM entity WHERE map_name = 'freetown')
    )
    ) org ON planter.organization_id = org.entity_id
    ) planter_ids
    ON trees.planter_id = planter_ids.id
    union all
    SELECT trees.id as id from trees
    INNER JOIN (
    SELECT id FROM planter
    JOIN (
    SELECT entity_id FROM getEntityRelationshipChildren(
    (SELECT id FROM entity WHERE map_name = 'freetown')
    )
    ) org ON planter.organization_id = org.entity_id
    ) planter_ids
    ON trees.planter_id = planter_ids.id
    ) t1
    )
    ) as cdbq
    `);
  fs.writeFileSync(newDefine,contentConfig);
}


class Config {
  constructor(pool, newIcons = false){
    this.pool = pool;
    this.newIcons = newIcons;
    const pgPool = new PGPool({
      cacheSize: parseInt(process.env.CACHE_SIZE),
      cacheExpire: parseInt(process.env.CACHE_EXPIRE),
      pool,
    });
    this.pgPool = pgPool;
  }

  setNewIconXML(showIcons){
    this.newIcons = showIcons;
  }

  async getXMLString(options){
    const {
      zoomLevel,
      userid,
      wallet,
      timeline,
      map_name,
      bounds,
    } = options;
    const zoomLevelInt = parseInt(zoomLevel);
    const useGeoJson = (
      //just tree level don't use geojson, cuz it's possible the tree points
      //are too many, making the geojson too big
      zoomLevelInt >= 1 && zoomLevelInt <= ZOOM_LEVEL_THRETHOLD_OF_CLUSTER
    ) ? true: false;
    function checkUseBounds(){
      if(zoomLevelInt > ZOOM_LEVEL_THRETHOLD_OF_CLUSTER){
				//mapnik would add the bounds automatically
        log.info("zoom level for trees should not use bounds anyway");
        return false;
      }
      if(map_name){
        log.info("org map always use global data set");
        return false;
      }else if(wallet){
        log.info("wallet map always use global data set");
        return false;
      }else if(userid){
        log.info("userid map always use global data set");
        return false;
      }else if(zoomLevelInt > parseInt(process.env.MAXIMUM_ZOOM_LEVEL_USING_GLOBAL_DATASET)){
        log.info(`zoom level > ${process.env.MAXIMUM_ZOOM_LEVEL_USING_GLOBAL_DATASET} use bounds`);
        return true;
      }else{
        log.info("use global data set");
        return false;
      }
    }
    const useBounds = checkUseBounds();
    const map = new Map(this.pool);
    await map.init({
      zoom_level: zoomLevelInt,
      userid,
      wallet,
      timeline,
      map_name,
      bounds: useBounds? bounds: undefined,//json mode do not need bounds
    });
    const sql = await map.getQuery();
    log.info("sql:", sql);

    let result;

    //handle geojson case
    if(useGeoJson){
      log.info("handle geojson...");
      const xmlJsonTemplate = zoomLevelInt > 15?
        (this.newIcons ? xmlJsonForTree2 : xmlJsonForTree)
        :
        (this.newIcons ? xmlJson2 : xmlJson);

      result = await this.pgPool.getQuery(sql, (result) => {
        log.debug("result:", result);
        const points = result.rows.map(row => {
          const coord = JSON.parse(row.latlon).coordinates;
          const count = parseInt(row.count);
          const {count_text, id, latlon, type, zoom_to} = row;
          return `{"type":"Feature","geometry":{"type":"Point","coordinates": [${coord.join(",")}]},"properties":{"count":${count}, "count_text": "${count_text}", "id": ${id}, "latlon": ${latlon}, "type": "${type}", "zoom_to": ${zoom_to}}}`;
        });
        const json = points.length > 0? 
          `{"type":"FeatureCollection","features":[${points.join(",")}]}`
        :
          `{"type":"FeatureCollection","features":[{"type":"Feature","geometry":
  {"type":"Point","coordinates": [85,0]},"properties":{"count":1, "count_text": "1", "id": 99999, "latlon": {"type":"Point","coordinates":[85,0]}, "type": "cluster", "zoom_to": null}}]}`;
        log.debug("json:", json);
        const resultHandled = xmlJsonTemplate.replace("json_data", json);
        return resultHandled;
      });
      log.info("xml length:", result.length);
      if(result.length > 1024*1024*5){
        log.warn("the geojons is kind of too big!");
        throw new Error("The data is too big");
      }
      log.debug("xml:", result);
    }else{
      const xmlTemplate = zoomLevelInt > 15?
        (this.newIcons ? xmlTree2: xmlTree)
        :
        (this.newIcons ? xml2 : xml);
      const xmlStringWithDB = replace(xmlTemplate);
      result = xmlStringWithDB.replace(
        "select * from trees",
        sql,
      );
    }
    return result;
  }


}

module.exports = {
  config, 
  configFreetown, 
  replace,
  Config,
};
