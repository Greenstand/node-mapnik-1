const SQLCase1 = require("./SQLCase1");
const log = require("loglevel");

class SQLCase1WithZoomTarget extends SQLCase1{

  getQuery(){
    //TODO check the conflict case, like: can not set userid and treeIds at the same time
    //add zoom target when zoom level <= 9
    let sql;
    if(this.getZoomLevel() <= parseInt(process.env.MAXIMUM_ZOOM_LEVEL_HANDLING_ZOOM_TARGET)){
      log.info("add zoom target");
      const sqlRaw = super.getQuery();
      sql =  `
        /* sql case1 */
  SELECT 
    'cluster' AS type,
    'case1 with zoom target tile' AS log,
    cluster_1.id,
    cluster_1.estimated_geometric_location,
    cluster_1.latlon,
    cluster_1.region_type,
    cluster_1.count,
    cluster_1.count_text,
    zoom_target.centroid zoom_to
  FROM (
    ${sqlRaw}
  ) cluster_1
  LEFT JOIN 
  (SELECT
    DISTINCT ON
    (region.id) region.id region_id,
    contained.region_id most_populated_subregion_id,
    contained.total,
    contained.zoom_level,
    ST_ASGeoJson(contained.centroid) centroid
  FROM
    (
    SELECT
      region_id,
      zoom_level
    FROM active_tree_region tree_region
    ${this.getJoin()}
    WHERE
      zoom_level = ${this.getZoomLevel()}
      ${this.getFilter()}
      ${this.getBoundingBoxQuery()}
    GROUP BY
      region_id,
      zoom_level ) populated_region
  JOIN region ON
    region.id = populated_region.region_id
  JOIN (
    SELECT
      region_id,
      zoom_level,
      count(tree_region.id) AS total,
      centroid
    FROM active_tree_region tree_region
    ${this.getJoin()}
    WHERE
      zoom_level = ${this.getZoomLevel() + 2}
      ${this.getFilter()}
      ${this.getBoundingBoxQuery()}
    GROUP BY
      region_id,
      zoom_level,
      centroid ) contained ON
    ST_CONTAINS(region.geom,
    contained.centroid)
  WHERE
    TRUE
  ORDER BY
    region.id,
    total DESC
  ) zoom_target
  ON cluster_1.id = zoom_target.region_id
      `;
    }else{
      sql = super.getQuery();
    }
    return sql;
  }
}

module.exports = SQLCase1WithZoomTarget;
